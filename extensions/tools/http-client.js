// HTTP Client: write requests in a .http file and send them from the editor. Needs the network permission.
//
//   @host = https://api.example.com
//   ### Get the user
//   GET {{host}}/users/1
//   Accept: application/json
//
//   ### Create a user
//   POST {{host}}/users
//   Content-Type: application/json
//
//   { "name": "Ada" }

function variables(text) {
  const vars = {};
  for (const m of text.matchAll(/^@([A-Za-z_][\w.-]*)\s*=\s*(.*)$/gm)) vars[m[1]] = m[2].trim();
  return vars;
}

function substitute(s, vars) {
  return s.replace(/\{\{\s*([\w.$-]+)\s*\}\}/g, (m, name) => {
    if (name === '$timestamp') return String(Math.floor(Date.now() / 1000));
    if (name === '$guid' || name === '$uuid') return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000000';
    if (name === '$randomInt') return String(Math.floor(Math.random() * 1000));
    return name in vars ? substitute(vars[name], vars) : m;
  });
}

/** The request around line `line` of a document (requests are separated by ### lines). */
function requestAt(text, line) {
  const lines = text.split('\n');
  let a = line;
  while (a > 0 && !/^###/.test(lines[a])) a--;
  if (/^###/.test(lines[a])) a++;
  let b = line + 1;
  while (b < lines.length && !/^###/.test(lines[b])) b++;
  const block = lines.slice(a, b);
  const vars = variables(text);
  // Skip comments, blank lines and variable definitions before the request line.
  let i = 0;
  while (i < block.length && (/^\s*$/.test(block[i]) || /^\s*(#|\/\/)/.test(block[i]) || /^@/.test(block[i]))) i++;
  if (i >= block.length) throw new Error('There is no request here. Write a line like GET https://example.com');
  const first = substitute(block[i], vars).trim();
  const m = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)(?:\s+HTTP\/[\d.]+)?$/i.exec(first);
  if (!m) throw new Error('Could not read "' + first + '". Use: METHOD URL');
  const headers = {};
  let j = i + 1;
  for (; j < block.length && block[j].trim() !== ''; j++) {
    if (/^\s*(#|\/\/)/.test(block[j])) continue;
    const h = /^([^:\s]+)\s*:\s*(.*)$/.exec(substitute(block[j], vars));
    if (h) headers[h[1]] = h[2].trim();
  }
  let body = block.slice(j + 1).filter((l) => !/^\s*(#|\/\/)/.test(l)).join('\n').trim();
  body = substitute(body, vars);
  return { method: m[1].toUpperCase(), url: m[2], headers, body: body || undefined };
}

function pretty(text, type) {
  if (/json/i.test(type || '') || /^\s*[{[]/.test(text)) {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON after all */ }
  }
  return text;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function responsePage(req, res, body, ms) {
  const ok = res.status >= 200 && res.status < 300;
  const rows = [...res.headers].map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  return `<style>
  body { font-family: var(--ui); } h3 { margin: 14px 0 6px; }
  .st { display: inline-block; padding: 2px 10px; border-radius: 4px; font-weight: 600; color: #fff; background: ${ok ? '#2e8b57' : res.status >= 400 ? '#c0392b' : '#b8860b'}; }
  pre { background: var(--raised, transparent); border: 1px solid var(--border); border-radius: 6px; padding: 10px; overflow: auto; font: 12px/1.5 var(--mono, monospace); white-space: pre-wrap; word-break: break-word; }
  table { border-collapse: collapse; font-size: 12px; width: 100%; } td { border-bottom: 1px solid var(--border); padding: 3px 8px; vertical-align: top; } td:first-child { color: var(--fg-dim); white-space: nowrap; }
</style>
<div><span class="st">${res.status} ${esc(res.statusText)}</span> <b>${esc(req.method)}</b> ${esc(req.url)} <span style="color:var(--fg-dim)">${ms} ms, ${body.length} characters</span></div>
<h3>Body</h3><pre>${esc(body) || '(empty)'}</pre>
<h3>Headers</h3><table>${rows}</table>`;
}

exports._test = { variables, substitute, requestAt, pretty };

exports.activate = function (context) {
  let panel = null;

  async function send(req) {
    const t0 = Date.now();
    const timeout = Number(ferrum.settings.get('httpClient.timeoutSeconds')) || 30;
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeout * 1000) : null;
    try {
      const res = await ferrum.network.fetch(req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body, signal: ctl ? ctl.signal : undefined, redirect: 'follow' });
      const text = await res.text();
      return { res, text: pretty(text, res.headers.get('content-type')), ms: Date.now() - t0 };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  context.subscriptions.push(
    ferrum.commands.register('httpClient.send', async () => {
      const doc = await ferrum.editor.active();
      if (!doc) return ferrum.window.showMessage('Open a .http file with a request in it.', 'warn');
      let req;
      try {
        req = requestAt(doc.text, doc.selection.start.line);
      } catch (e) {
        return ferrum.window.showMessage(e.message, 'warn');
      }
      try {
        const out = await ferrum.window.withProgress('Sending ' + req.method + ' ' + req.url, () => send(req));
        const html = responsePage(req, out.res, out.text, out.ms);
        if (panel) { panel.setHtml(html); panel.setTitle(out.res.status + ' ' + req.method); }
        else {
          panel = await ferrum.window.showPanel({ title: out.res.status + ' ' + req.method, html });
          panel.onDidClose(() => (panel = null));
        }
      } catch (e) {
        ferrum.window.showMessage('The request failed: ' + (e && e.message ? e.message : e), 'error');
      }
    }),
    ferrum.commands.register('httpClient.newFile', async () => {
      const doc = await ferrum.editor.active();
      const sample = '@host = https://httpbin.org\n\n### A GET request\nGET {{host}}/get\nAccept: application/json\n\n### A POST with JSON\nPOST {{host}}/post\nContent-Type: application/json\n\n{ "hello": "world" }\n';
      if (doc) await ferrum.editor.insert(sample);
      else ferrum.window.showMessage('Open or create a file named something.http first, then run this again.', 'warn');
    }),
  );
};

exports.deactivate = function () {};
