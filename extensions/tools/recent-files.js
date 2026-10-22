// Recent Files: a sidebar list of the files you opened lately, newest first. It remembers them between sessions.

const KEY = 'recent.v1';

/** Puts a file first, removes duplicates and keeps `max` entries. */
function remember(list, entry, max) {
  return [entry, ...list.filter((x) => x.path !== entry.path)].slice(0, max);
}

function ago(ms, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  return Math.floor(s / 86400) + ' d ago';
}

function relative(path, root) {
  const p = String(path).replace(/\\/g, '/');
  const r = String(root || '').replace(/\\/g, '/').replace(/\/+$/, '');
  return r && p.toLowerCase().startsWith(r.toLowerCase() + '/') ? p.slice(r.length + 1) : p;
}

exports._test = { remember, ago, relative };

exports.activate = function (context) {
  const max = () => Math.max(5, Math.min(100, Number(ferrum.settings.get('recentFiles.max')) || 30));
  const read = async () => (await ferrum.storage.get(KEY, {}))[ferrum.workspace.root || ''] || [];
  const write = async (list) => {
    const all = await ferrum.storage.get(KEY, {});
    all[ferrum.workspace.root || ''] = list;
    await ferrum.storage.set(KEY, all);
  };

  const view = ferrum.window.registerTreeView('recentFiles.list', {
    getChildren: async (element) => {
      if (element) return [];
      const list = await read();
      return list.map((f) => ({ id: f.path, label: f.name, description: relative(f.path, ferrum.workspace.root).replace(/[^/]*$/, '').replace(/\/$/, '') + (f.at ? '  ' + ago(f.at) : ''), icon: 'file', tooltip: f.path, command: 'recentFiles.open', args: [f.path] }));
    },
  });

  context.subscriptions.push(
    view,
    ferrum.events.on('open', async (info) => {
      if (!info || !info.path) return;
      await write(remember(await read(), { path: info.path, name: info.name, at: Date.now() }, max()));
      view.refresh();
    }),
    ferrum.commands.register('recentFiles.open', async (path) => {
      if (path) await ferrum.editor.openFile(String(path));
    }),
    ferrum.commands.register('recentFiles.clear', async () => {
      await write([]);
      view.refresh();
    }),
  );
};

exports.deactivate = function () {};
