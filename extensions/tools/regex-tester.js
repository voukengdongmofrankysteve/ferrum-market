// Regex Tester: try a regular expression on sample text and see every match and group. Everything runs in the panel.

function page(pattern, flags, text) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<style>
  body { font-family: var(--ui); } label { display: block; color: var(--fg-dim); font-size: 12px; margin: 10px 0 4px; }
  input, textarea { width: 100%; box-sizing: border-box; background: var(--raised, transparent); color: var(--fg); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font: 13px var(--mono, monospace); outline: none; } input:focus, textarea:focus { border-color: var(--accent); }
  .row { display: flex; gap: 10px; } .row > div:first-child { flex: 1; } .row > div:last-child { width: 110px; }
  textarea { height: 130px; resize: vertical; } #hl { white-space: pre-wrap; word-break: break-word; border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font: 13px/1.5 var(--mono, monospace); min-height: 40px; }
  mark { background: var(--accent); color: #fff; border-radius: 2px; } mark.b { opacity: .65; } #err { color: #e5534b; margin-top: 6px; min-height: 18px; }
  table { width: 100%; border-collapse: collapse; font: 12px var(--mono, monospace); margin-top: 6px; } td, th { text-align: left; border-bottom: 1px solid var(--border); padding: 3px 8px; vertical-align: top; } th { color: var(--fg-dim); font-weight: 400; }
  .dim { color: var(--fg-dim); font-size: 12px; } button { background: var(--raised, transparent); color: var(--fg); border: 1px solid var(--border); border-radius: 5px; padding: 4px 10px; cursor: pointer; }
</style>
<div class="row"><div><label>Pattern</label><input id="p" value="${esc(pattern)}" spellcheck="false"></div><div><label>Flags</label><input id="f" value="${esc(flags)}" spellcheck="false"></div></div>
<div id="err"></div>
<label>Test text</label><textarea id="t" spellcheck="false">${esc(text)}</textarea>
<label>Matches <span id="n" class="dim"></span></label><div id="hl"></div>
<label>Groups</label><table id="tb"></table>
<div style="margin-top:12px"><button id="use">Insert /pattern/flags into the file</button></div>
<script>
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function run() {
    const p = $('p').value, f = $('f').value, t = $('t').value;
    $('err').textContent = ''; $('tb').innerHTML = ''; $('n').textContent = '';
    if (!p) { $('hl').innerHTML = esc(t); return; }
    let re;
    try { re = new RegExp(p, f.includes('g') ? f : f + 'g'); } catch (e) { $('err').textContent = e.message; $('hl').innerHTML = esc(t); return; }
    let out = '', last = 0, n = 0, i = 0, rows = '';
    for (const m of t.matchAll(re)) {
      if (n++ > 2000) break;
      out += esc(t.slice(last, m.index)) + '<mark class="' + (i++ % 2 ? 'b' : '') + '">' + esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
      const groups = m.slice(1).map((g, gi) => (gi + 1) + ': ' + esc(g === undefined ? '(none)' : g)).concat(Object.entries(m.groups || {}).map(([k, v]) => k + ': ' + esc(v))).join('<br>');
      rows += '<tr><td>' + n + '</td><td>' + m.index + '</td><td>' + esc(m[0]) + '</td><td>' + groups + '</td></tr>';
      if (m[0] === '') re.lastIndex++;
    }
    $('hl').innerHTML = out + esc(t.slice(last));
    $('n').textContent = '(' + Math.min(n, 2000) + ')';
    if (rows) $('tb').innerHTML = '<tr><th>#</th><th>At</th><th>Match</th><th>Groups</th></tr>' + rows;
  }
  ['p', 'f', 't'].forEach((id) => $(id).addEventListener('input', run));
  $('use').onclick = () => ferrumPanel.postMessage({ type: 'insert', text: '/' + $('p').value + '/' + $('f').value.replace(/g/g, '') + ($('f').value.includes('g') ? 'g' : '') });
  run();
</script>`;
}

exports._test = { page };

exports.activate = function (context) {
  context.subscriptions.push(
    ferrum.commands.register('regexTester.open', async () => {
      const doc = await ferrum.editor.active();
      const text = (doc && doc.selectedText) || 'Hello 123, World 4567!\nemail: ada@example.com';
      const panel = await ferrum.window.showPanel({ title: 'Regex Tester', html: page('\\d+', 'g', text) });
      panel.onMessage(async (m) => {
        if (m.type !== 'insert') return;
        const d = await ferrum.editor.active();
        if (!d) return ferrum.window.showMessage('Open a file to insert into.', 'warn');
        await ferrum.editor.insert(String(m.text).slice(0, 4000));
      });
    }),
  );
};

exports.deactivate = function () {};
