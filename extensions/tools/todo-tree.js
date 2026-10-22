// TODO Tree: finds TODO, FIXME and other tags in your project and lists them in a panel. Click one to jump to it.

const DEFAULT_TAGS = ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX', 'NOTE'];
const SKIP = /\.(png|jpe?g|gif|ico|svg|webp|pdf|zip|gz|tar|exe|dll|so|dylib|woff2?|ttf|otf|mp[34]|mov|wasm|lock|min\.js|map)$/i;

/** Finds tags in comments. A tag must be a whole word, optionally followed by (name) and a colon or space. */
function scan(text, tags) {
  const re = new RegExp('(?:^|[^A-Za-z0-9_])(' + tags.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b(?:\\(([^)]*)\\))?[:\\s-]*(.*)$');
  const found = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only look at comment text: after //, #, --, ;, %, /*, <!-- or * at the start of a line.
    const c = /(?:\/\/|#|--|;|%|\/\*|<!--|^\s*\*)/.exec(line);
    if (!c) continue;
    const m = re.exec(line.slice(c.index));
    if (!m) continue;
    found.push({ line: i, tag: m[1], who: m[2] || '', text: m[3].replace(/\*\/|-->/g, '').trim() });
  }
  return found;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const COLORS = { TODO: '#3b82f6', FIXME: '#ef4444', BUG: '#ef4444', HACK: '#f59e0b', XXX: '#f59e0b', NOTE: '#10b981' };

function page(groups, total, tags, truncated) {
  const body = groups
    .map((g) => `<details open><summary><b>${esc(g.file)}</b> <span class="n">${g.items.length}</span></summary>${g.items
      .map((it) => `<div class="it" data-f="${esc(g.file)}" data-l="${it.line}"><span class="tag" style="background:${COLORS[it.tag] || '#888'}">${esc(it.tag)}</span><span class="ln">${it.line + 1}</span>${it.who ? '<i>' + esc(it.who) + '</i> ' : ''}${esc(it.text)}</div>`)
      .join('')}</details>`)
    .join('');
  return `<style>
  body { font-family: var(--ui); } .top { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; } .top b { flex: 1; }
  button { background: var(--raised, transparent); color: var(--fg); border: 1px solid var(--border); border-radius: 5px; padding: 4px 10px; cursor: pointer; }
  summary { cursor: pointer; padding: 4px 0; } .n { color: var(--fg-dim); font-size: 12px; }
  .it { padding: 3px 8px 3px 14px; cursor: pointer; border-radius: 4px; display: flex; gap: 8px; align-items: baseline; } .it:hover { background: var(--raised, rgba(128,128,128,.15)); }
  .tag { color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 600; } .ln { color: var(--fg-dim); font: 11px var(--mono, monospace); min-width: 32px; }
</style>
<div class="top"><b>${total} item${total === 1 ? '' : 's'} (${esc(tags.join(', '))})${truncated ? ', first files only' : ''}</b><button id="r">Scan again</button></div>
${body || '<p>Nothing found. Add a comment like // TODO: write the tests</p>'}
<script>
  document.getElementById('r').onclick = () => ferrumPanel.postMessage({ type: 'scan' });
  document.querySelectorAll('.it').forEach((e) => e.onclick = () => ferrumPanel.postMessage({ type: 'open', file: e.dataset.f, line: Number(e.dataset.l) }));
</script>`;
}

exports._test = { scan };

exports.activate = function (context) {
  let panel = null;
  const tags = () => {
    const t = ferrum.settings.get('todoTree.tags');
    return (String(t || DEFAULT_TAGS.join(',')).split(/[,\s]+/).filter(Boolean)).slice(0, 20);
  };

  async function collect() {
    if (!ferrum.workspace.root) throw new Error('Open a folder first.');
    const wanted = tags();
    const max = Number(ferrum.settings.get('todoTree.maxFiles')) || 800;
    const files = (await ferrum.workspace.listFiles()).filter((f) => !SKIP.test(f));
    const groups = [];
    let total = 0;
    for (const f of files.slice(0, max)) {
      let text;
      try { text = await ferrum.workspace.readFile(f); } catch { continue; }
      if (text.length > 600000 || text.includes('\u0000')) continue;
      const items = scan(text, wanted);
      if (items.length) { groups.push({ file: f, items }); total += items.length; }
    }
    return { groups, total, wanted, truncated: files.length > max };
  }

  async function show() {
    try {
      const r = await ferrum.window.withProgress('Scanning for TODOs', collect);
      const html = page(r.groups, r.total, r.wanted, r.truncated);
      ferrum.window.setStatusBar('todoTree.status', r.total ? { text: 'TODO: ' + r.total, tooltip: 'Open the TODO Tree', command: 'todoTree.show' } : { text: '' });
      if (panel) { panel.setHtml(html); return; }
      panel = await ferrum.window.showPanel({ title: 'TODO Tree', html });
      panel.onDidClose(() => (panel = null));
      panel.onMessage(async (m) => {
        if (m.type === 'scan') show();
        else if (m.type === 'open') await ferrum.editor.openFile(String(m.file), { line: Number(m.line) || 0, col: 0 });
      });
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  }

  // The sidebar: files as top items, TODOs under them. The scan is kept until Refresh or a save.
  let cache = null;
  const view = ferrum.window.registerTreeView('todoTree.items', {
    getChildren: async (element) => {
      if (!cache) {
        try { cache = await collect(); } catch (e) { cache = { groups: [], total: 0, error: e.message }; }
        view.setBadge(cache.total);
      }
      if (cache.error) return [{ id: 'err', label: cache.error, icon: 'info' }];
      if (!element) {
        return cache.groups.map((g) => ({ id: 'f:' + g.file, label: g.file.split('/').pop(), description: g.items.length + '  ' + g.file.replace(/[^/]*$/, '').replace(/\/$/, ''), icon: 'file', collapsible: 'expanded', tooltip: g.file }));
      }
      const g = cache.groups.find((x) => 'f:' + x.file === element.id);
      return g ? g.items.map((it) => ({ id: g.file + ':' + it.line, label: (it.text || '(no text)'), description: it.tag + (it.who ? ' (' + it.who + ')' : '') + '  line ' + (it.line + 1), icon: 'circle-filled', color: COLORS[it.tag] || '#888888', command: 'todoTree.openAt', args: [g.file, it.line] })) : [];
    },
  });

  context.subscriptions.push(
    view,
    ferrum.commands.register('todoTree.refresh', () => { cache = null; view.refresh(); }),
    ferrum.commands.register('todoTree.openAt', async (file, line) => { if (file) await ferrum.editor.openFile(String(file), { line: Number(line) || 0, col: 0 }); }),
    ferrum.events.on('save', () => { cache = null; view.refresh(); }),
    ferrum.commands.register('todoTree.show', show),
    ferrum.commands.register('todoTree.list', async () => {
      try {
        const r = await ferrum.window.withProgress('Scanning for TODOs', collect);
        const items = r.groups.flatMap((g) => g.items.map((it) => ({ label: it.tag + ': ' + (it.text || '(no text)'), detail: g.file + ':' + (it.line + 1), file: g.file, line: it.line })));
        if (!items.length) return ferrum.window.showMessage('No TODO items found.');
        const pick = await ferrum.window.showQuickPick(items, { placeholder: items.length + ' items' });
        if (pick) await ferrum.editor.openFile(pick.file, { line: pick.line, col: 0 });
      } catch (e) {
        ferrum.window.showMessage(e.message, 'warn');
      }
    }),
  );
};

exports.deactivate = function () {};
