// Bookmarks: mark lines, jump between them and list them. They are remembered for each file.

const KEY = 'bookmarks.v1';

function toggle(list, line) {
  return list.includes(line) ? list.filter((l) => l !== line) : [...list, line].sort((a, b) => a - b);
}
function next(list, line, dir) {
  if (!list.length) return null;
  if (dir > 0) return list.find((l) => l > line) ?? list[0];
  return [...list].reverse().find((l) => l < line) ?? list[list.length - 1];
}
/** Bookmarks follow their line when text is inserted or removed above them, as far as we can tell. */
function shiftAfterEdit(list, oldLines, newLines, at) {
  const d = newLines - oldLines;
  if (!d) return list;
  return list.map((l) => (l > at ? l + d : l)).filter((l) => l >= 0);
}

exports._test = { toggle, next, shiftAfterEdit };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));
  const all = () => ferrum.storage.get(KEY, {});
  const save = (v) => ferrum.storage.set(KEY, v);
  const key = (doc) => doc.path || '(unsaved) ' + doc.name;
  const star = ferrum.editor.createDecorationType({ gutterText: '\u2605', gutterColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', isWholeLine: true });
  context.subscriptions.push(star);

  // The sidebar: files with bookmarks, and their lines under each.
  const view = ferrum.window.registerTreeView('bookmarks.list', {
    getChildren: async (element) => {
      const data = await all();
      if (!element) {
        return Object.entries(data)
          .filter(([, lines]) => lines.length)
          .map(([file, lines]) => ({ id: 'f:' + file, label: file.split(/[\\/]/).pop(), description: lines.length + (lines.length === 1 ? ' bookmark' : ' bookmarks'), icon: 'file', tooltip: file, collapsible: 'expanded' }));
      }
      const file = String(element.id).slice(2);
      return (data[file] || []).map((l) => ({ id: 'l:' + file + ':' + l, label: 'Line ' + (l + 1), icon: 'bookmark', color: '#f59e0b', command: 'bookmarks.goto', args: [file, l] }));
    },
  });
  context.subscriptions.push(view);

  async function status() {
    const doc = await ferrum.editor.active();
    const data = await all();
    view.setBadge(Object.values(data).reduce((n, l) => n + l.length, 0));
    view.refresh();
    if (!doc) return ferrum.window.setStatusBar('bookmarks.status', { text: '' });
    const lines = data[key(doc)] || [];
    await ferrum.editor.setDecorations(star, lines.map((l) => ({ start: { line: l, col: 0 }, end: { line: l, col: 0 } })));
    const n = lines.length;
    ferrum.window.setStatusBar('bookmarks.status', n ? { text: 'Bookmarks: ' + n, tooltip: n + ' bookmarks in this file. Click to list them.', command: 'bookmarks.list' } : { text: '' });
  }

  reg('bookmarks.toggle', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
    const data = await all();
    const line = doc.selection.start.line;
    data[key(doc)] = toggle(data[key(doc)] || [], line);
    if (!data[key(doc)].length) delete data[key(doc)];
    await save(data);
    ferrum.window.showMessage(((data[key(doc)] || []).includes(line) ? 'Bookmark added on line ' : 'Bookmark removed from line ') + (line + 1) + '.');
    status();
  });

  const jump = (dir) => async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    const list = (await all())[key(doc)] || [];
    const l = next(list, doc.selection.start.line, dir);
    if (l === null) return ferrum.window.showMessage('No bookmarks in this file.', 'warn');
    await ferrum.editor.setSelection({ line: l, col: 0 });
  };
  reg('bookmarks.next', jump(1));
  reg('bookmarks.previous', jump(-1));

  reg('bookmarks.list', async () => {
    const data = await all();
    const items = [];
    for (const [file, lines] of Object.entries(data)) for (const l of lines) items.push({ label: file.split(/[\\/]/).pop() + ':' + (l + 1), detail: file, file, line: l });
    if (!items.length) return ferrum.window.showMessage('No bookmarks yet. Use "Bookmarks: Toggle" on a line.');
    const pick = await ferrum.window.showQuickPick(items, { placeholder: 'Jump to a bookmark' });
    if (!pick) return;
    if (pick.file.startsWith('(unsaved)')) return ferrum.window.showMessage('That file is not saved.', 'warn');
    await ferrum.editor.openFile(pick.file, { line: pick.line, col: 0 });
  });

  reg('bookmarks.goto', async (file, line) => {
    if (typeof file !== 'string' || file.startsWith('(unsaved)')) return;
    await ferrum.editor.openFile(file, { line: Number(line) || 0, col: 0 });
  });
  reg('bookmarks.clearFile', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    const data = await all();
    delete data[key(doc)];
    await save(data);
    status();
  });
  reg('bookmarks.clearAll', async () => {
    if (await ferrum.window.confirm('Remove every bookmark in every file?', 'Remove all')) {
      await save({});
      status();
    }
  });

  context.subscriptions.push(ferrum.events.on('activeChanged', status), ferrum.events.on('open', status), ferrum.events.on('change', status), ferrum.events.on('save', status));
  status();
};

exports.deactivate = function () {};
