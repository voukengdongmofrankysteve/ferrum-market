// NPM Scripts: see and run the scripts of package.json in the terminal, with the package manager your project uses.

function pickManager(files) {
  const has = (f) => files.some((x) => x === f || x.endsWith('/' + f));
  if (has('pnpm-lock.yaml')) return 'pnpm';
  if (has('yarn.lock')) return 'yarn';
  if (has('bun.lockb') || has('bun.lock')) return 'bun';
  return 'npm';
}

function runCommand(manager, script, extra) {
  const rest = extra ? ' ' + extra : '';
  if (manager === 'yarn') return 'yarn ' + script + rest;
  if (manager === 'npm' && /^(start|test|stop|restart)$/.test(script)) return 'npm ' + script + (extra ? ' -- ' + extra : '');
  if (manager === 'npm') return 'npm run ' + script + (extra ? ' -- ' + extra : '');
  return manager + ' run ' + script + rest;
}

function parseScripts(text) {
  const j = JSON.parse(text);
  return Object.entries(j.scripts || {}).map(([name, cmd]) => ({ name, cmd: String(cmd) }));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function page(scripts, manager, project) {
  const rows = scripts.map((s) => `<div class="row"><div><b>${esc(s.name)}</b><div class="cmd">${esc(s.cmd)}</div></div><button data-n="${esc(s.name)}">Run</button></div>`).join('');
  return `<style>
  body { font-family: var(--ui); }
  h2 { margin: 0 0 4px; } .dim { color: var(--fg-dim); font-size: 12px; margin-bottom: 12px; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px; background: var(--raised, transparent); }
  .cmd { font: 12px var(--mono, monospace); color: var(--fg-dim); margin-top: 2px; word-break: break-all; }
  button { background: var(--accent); color: #fff; border: 0; border-radius: 5px; padding: 5px 14px; cursor: pointer; }
</style>
<h2>${esc(project)}</h2><div class="dim">${scripts.length} scripts, run with ${manager}</div>${rows || '<p>No scripts found in package.json.</p>'}
<script>document.querySelectorAll('button[data-n]').forEach((b) => b.onclick = () => ferrumPanel.postMessage({ type: 'run', name: b.dataset.n }));</script>`;
}

exports._test = { pickManager, runCommand, parseScripts };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  async function load() {
    if (!ferrum.workspace.root) throw new Error('Open a folder first.');
    const files = await ferrum.workspace.listFiles('*package.json');
    const pkg = files.find((f) => f === 'package.json') || files.sort((a, b) => a.length - b.length)[0];
    if (!pkg) throw new Error('No package.json found in this folder.');
    const scripts = parseScripts(await ferrum.workspace.readFile(pkg));
    const lock = await ferrum.workspace.listFiles('*lock*');
    const configured = ferrum.settings.get('npmScripts.packageManager');
    const manager = configured && configured !== 'auto' ? configured : pickManager(lock);
    const dir = pkg.includes('/') ? pkg.slice(0, pkg.lastIndexOf('/')) : '';
    return { scripts, manager, dir, pkg };
  }

  const exec = async (info, name, extra) => {
    const cd = info.dir ? 'cd ' + JSON.stringify(info.dir) + ' && ' : '';
    await ferrum.terminal.run(cd + runCommand(info.manager, name, extra));
  };

  // The sidebar: every script, a click runs it.
  const view = ferrum.window.registerTreeView('npmScripts.list', {
    getChildren: async (element) => {
      if (element) return [];
      try {
        const info = await load();
        view.setBadge(info.scripts.length);
        return info.scripts.map((s) => ({ id: s.name, label: s.name, description: s.cmd, icon: 'play', color: '#3fb950', tooltip: info.manager + ' run ' + s.name + '   (' + s.cmd + ')', command: 'npmScripts.runScript', args: [s.name] }));
      } catch (e) {
        return [{ id: 'none', label: e.message, icon: 'info' }];
      }
    },
  });
  context.subscriptions.push(
    view,
    ferrum.commands.register('npmScripts.runScript', async (name) => {
      try { await exec(await load(), String(name)); } catch (e) { ferrum.window.showMessage(e.message, 'warn'); }
    }),
    ferrum.commands.register('npmScripts.refresh', () => view.refresh()),
    ferrum.events.on('save', (info) => { if (info && /package\.json$/.test(info.name || '')) view.refresh(); }),
  );

  reg('npmScripts.run', async () => {
    try {
      const info = await load();
      const pick = await ferrum.window.showQuickPick(info.scripts.map((s) => ({ label: s.name, detail: s.cmd })), { placeholder: 'Run a script with ' + info.manager });
      if (pick) await exec(info, pick.label);
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });
  reg('npmScripts.runWithArgs', async () => {
    try {
      const info = await load();
      const pick = await ferrum.window.showQuickPick(info.scripts.map((s) => ({ label: s.name, detail: s.cmd })), { placeholder: 'Which script?' });
      if (!pick) return;
      const extra = await ferrum.window.showInputBox({ prompt: 'Arguments for ' + pick.label, placeholder: '--watch' });
      if (extra !== undefined) await exec(info, pick.label, extra);
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });
  reg('npmScripts.install', async () => {
    try {
      const info = await load();
      await ferrum.terminal.run((info.dir ? 'cd ' + JSON.stringify(info.dir) + ' && ' : '') + info.manager + ' install');
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });
  reg('npmScripts.show', async () => {
    try {
      const info = await load();
      const panel = await ferrum.window.showPanel({ title: 'NPM Scripts', html: page(info.scripts, info.manager, ferrum.workspace.root.split(/[\\/]/).filter(Boolean).pop()) });
      panel.onMessage((m) => m.type === 'run' && exec(info, String(m.name)));
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });
};

exports.deactivate = function () {};
