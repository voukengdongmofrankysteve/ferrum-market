// Tests for the decorations and sidebar views APIs: the editor-side registries (the real TypeScript, bundled) and the
// extensions that use them, driven through a fake `ferrum` object.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = join(here, '.tmp');
mkdirSync(tmp, { recursive: true });
const esbuild = join(here, '..', '..', 'rustcode', 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
const bundle = async (name) => {
  const out = join(tmp, name + '.mjs');
  execFileSync(esbuild, [join(here, '..', '..', 'rustcode', 'src', 'ext', name + '.ts'), '--bundle', '--format=esm', '--outfile=' + out, '--log-level=error'], { shell: true });
  return import(pathToFileURL(out).href + '?' + Date.now());
};
const deco = await bundle('decorations');
const views = await bundle('views');

// ---- decorations ---------------------------------------------------------------------------------------------------

test('decoration types keep only safe, known values', () => {
  const t = deco.cleanType({ color: '#ff0000', backgroundColor: 'url(http://evil)', border: '1px solid red', fontWeight: 600, textDecoration: 'underline wavy', opacity: 5, gutterText: 'ABC', borderRadius: 99, evil: 'x', outline: 'expression(1)', after: { contentText: 'hi\nthere', color: 'rgb(1,2,3)' } });
  assert.equal(t.color, '#ff0000');
  assert.equal(t.backgroundColor, undefined);
  assert.equal(t.border, '1px solid red');
  assert.equal(t.fontWeight, '600');
  assert.equal(t.textDecoration, 'underline wavy');
  assert.equal(t.opacity, 1);
  assert.equal(t.gutterText, 'AB');
  assert.equal(t.borderRadius, 20);
  assert.equal(t.outline, undefined);
  assert.equal(t.evil, undefined);
  assert.deepEqual(t.after, { contentText: 'hi there', color: 'rgb(1,2,3)', backgroundColor: undefined, fontStyle: undefined, fontWeight: undefined });
  assert.equal(deco.cleanType({ color: 'var(--accent)' }).color, 'var(--accent)');
  assert.equal(deco.cleanType({ color: 'red; background: url(x)' }).color, undefined);
});

test('decorations are indexed by line for a document', () => {
  deco.createDecoType('a.b', 1, { backgroundColor: '#112233', gutterText: '*', after: { contentText: 'note' } });
  deco.createDecoType('a.b', 2, { backgroundColor: '#445566', isWholeLine: true });
  deco.setDecoRanges('a.b', 1, '/f.txt', [{ start: { line: 1, col: 2 }, end: { line: 1, col: 5 }, hoverMessage: 'hi' }, { start: { line: 99, col: 0 }, end: { line: 99, col: 1 } }, { start: { line: -1, col: 0 }, end: { line: 0, col: 1 } }]);
  deco.setDecoRanges('a.b', 2, '/f.txt', [{ start: { line: 0, col: 0 }, end: { line: 0, col: 0 } }]);
  const len = () => 10;
  const d = deco.decorationsFor('/f.txt', 3, len);
  assert.deepEqual(d.inline.get(1).map((x) => [x.s, x.e, x.title]), [[2, 5, 'hi']]);
  assert.equal(d.inline.get(1)[0].style.backgroundColor, '#112233');
  assert.equal(d.whole.get(0), '#445566');
  assert.equal(d.gutter.get(1).text, '*');
  assert.equal(d.after.get(1)[0].contentText, 'note');
  assert.equal(d.inline.has(99), false);
  // Another document has none.
  assert.equal(deco.decorationsFor('/other.txt', 3, len).empty, true);
  // A range of its own style overrides the type.
  deco.setDecoRanges('a.b', 1, '/f.txt', [{ start: { line: 0, col: 0 }, end: { line: 0, col: 3 }, style: { backgroundColor: '#abcdef', color: '#000000' } }]);
  const s = deco.decorationsFor('/f.txt', 3, len).inline.get(0)[0].style;
  assert.deepEqual([s.backgroundColor, s.color], ['#abcdef', '#000000']);
  // A multi line range covers each line.
  deco.setDecoRanges('a.b', 1, '/m.txt', [{ start: { line: 0, col: 4 }, end: { line: 2, col: 3 } }]);
  const m = deco.decorationsFor('/m.txt', 3, () => 8);
  assert.deepEqual([0, 1, 2].map((l) => m.inline.get(l).map((x) => [x.s, x.e])[0]), [[4, 8], [0, 8], [0, 3]]);
});

test('decorations can be removed and an extension is limited', () => {
  deco.setDecoRanges('a.b', 1, '/m.txt', []);
  assert.equal(deco.decorationsFor('/m.txt', 3, () => 8).empty, true);
  deco.disposeDecoType('a.b', 1);
  assert.throws(() => deco.setDecoRanges('a.b', 1, '/f.txt', []), /does not exist/);
  for (let i = 100; i < 130; i++) deco.createDecoType('many.ext', i, {});
  assert.throws(() => deco.createDecoType('many.ext', 999, {}), /30 decoration types/);
  deco.clearExtensionDecorations('many.ext');
  deco.createDecoType('many.ext', 999, {});
  deco.clearExtensionDecorations('a.b');
  deco.clearExtensionDecorations('many.ext');
});

// ---- views ------------------------------------------------------------------------------------------------------------

test('tree items from an extension are cleaned', () => {
  const items = views.cleanItems([
    { id: 'a', label: 'A', icon: 'file', color: '#fff', collapsible: 'expanded', command: 'x.y', args: [1, 'two'], description: 'd'.repeat(500) },
    { id: 'a', label: 'duplicate' },
    { label: 'no id' },
    { id: 'b', label: 'B', icon: 'Bad Icon!', color: 'url(x)', command: 'bad command', collapsible: 'weird', args: ['x'.repeat(3000)] },
    null,
    { id: 'c', label: '' },
  ]);
  assert.deepEqual(items.map((i) => i.id), ['a', 'b', 'c']);
  assert.equal(items[0].description.length, 200);
  assert.deepEqual(items[0].args, [1, 'two']);
  assert.equal(items[0].collapsible, 'expanded');
  assert.equal(items[1].icon, undefined);
  assert.equal(items[1].color, undefined);
  assert.equal(items[1].command, undefined);
  assert.equal(items[1].collapsible, 'none');
  assert.equal(items[1].args, undefined);
  assert.equal(views.cleanItems('nope').length, 0);
  assert.equal(views.cleanItems(Array.from({ length: 3000 }, (_, i) => ({ id: 'i' + i, label: 'x' }))).length, 2000);
});

test('containers and view state', () => {
  views.setContainers([{ extId: 'a.b', id: 'a.b:box', title: 'Box', icon: 'x', views: [{ extId: 'a.b', id: 'a.b.v', name: 'V', type: 'tree', container: 'a.b:box' }] }]);
  assert.equal(views.findContainer('a.b:box').title, 'Box');
  assert.equal(views.findView('a.b', 'a.b.v').type, 'tree');
  assert.equal(views.findView('a.b', 'nope'), undefined);
  views.setBadge('a.b', 'a.b.v', 7);
  assert.equal(views.viewState('a.b', 'a.b.v').badge, '7');
  views.setBadge('a.b', 'a.b.v', 5000);
  assert.equal(views.viewState('a.b', 'a.b.v').badge, '999');
  views.setBadge('a.b', 'a.b.v', 0);
  assert.equal(views.viewState('a.b', 'a.b.v').badge, undefined);
  const before = views.viewState('a.b', 'a.b.v').version;
  views.bumpView('a.b', 'a.b.v');
  assert.equal(views.viewState('a.b', 'a.b.v').version, before + 1);
  const got = [];
  const rec = views.setHtmlView('a.b', 'a.b.v', '<p>hi</p>', () => undefined);
  rec.deliver = (d) => got.push(d);
  views.postToView('a.b', 'a.b.v', { x: 1 });
  assert.deepEqual(got, [{ x: 1 }]);
  views.updateHtml('a.b', 'a.b.v', '<p>new</p>');
  assert.equal(views.viewState('a.b', 'a.b.v').html.html, '<p>new</p>');
  // Replacing the containers forgets views that are gone.
  views.setContainers([]);
  assert.equal(views.viewState('a.b', 'a.b.v').html, undefined);
});

// ---- the extensions ------------------------------------------------------------------------------------------------

function load(id, settings = {}) {
  const code = readFileSync(join(here, '..', 'tools', id + '.js'), 'utf8');
  const commands = new Map();
  const log = { decorations: [], types: [], trees: new Map(), pages: new Map(), messages: [], opened: [], selections: [], edits: [], badge: {} };
  const doc = { path: '/p/file.txt', name: 'file.txt', language: 'Plain Text', text: '', selectedText: '', selection: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } } };
  const store = {};
  const handlers = new Map();
  let nextType = 1;
  const ferrum = {
    commands: { register: (cid, fn) => (commands.set(cid, fn), { dispose() {} }), execute: async (cid, ...a) => commands.get(cid)?.(...a) },
    window: {
      showMessage: (t, k) => log.messages.push([t, k]),
      setStatusBar: () => ({ dispose() {} }),
      registerTreeView: (vid, provider) => {
        const h = { refresh: () => (h.refreshes = (h.refreshes || 0) + 1), setBadge: (n) => (log.badge[vid] = n), dispose() {}, provider };
        log.trees.set(vid, h);
        return h;
      },
      registerHtmlView: (vid, o) => {
        const h = { setHtml() {}, postMessage() {}, onMessage: (f) => (h.handler = f), dispose() {}, html: o.html };
        log.pages.set(vid, h);
        return h;
      },
      withProgress: (t, fn) => fn(),
    },
    editor: {
      createDecorationType: (o) => {
        const t = { id: nextType++, options: o, dispose() {} };
        log.types.push(t);
        return t;
      },
      setDecorations: async (t, r) => log.decorations.push([t.id, r]),
      active: async () => ({ ...doc }),
      edit: async (e) => log.edits.push(e),
      setSelection: async (a, b) => log.selections.push([a, b]),
      openFile: async (p, pos) => log.opened.push([p, pos]),
      getLine: async (n) => doc.text.split('\n')[n] ?? '',
    },
    workspace: { root: '/p', listFiles: async () => [], readFile: async () => '' },
    settings: { get: (k) => settings[k] },
    storage: { get: async (k, d) => (k in store ? store[k] : d), set: async (k, v) => (store[k] = v) },
    events: { on: (n, fn) => (handlers.set(n, fn), { dispose() {} }) },
    terminal: { run: async () => {} },
  };
  const exports = {};
  new Function('exports', 'ferrum', code)(exports, ferrum);
  const context = { subscriptions: [], extensionId: 'vyloxi.' + id };
  return { exports, ferrum, doc, commands, log, context, handlers, store, activate: () => exports.activate(context) };
}
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

test('color swatches finds real colors and gives each its own look', async () => {
  const t = load('color-swatches', {});
  const { parse, find, readable } = t.exports._test;
  assert.deepEqual(parse('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.equal(parse('#12'), null);
  assert.equal(parse('rgb(10, 20, 30)').g, 20);
  assert.equal(parse('rgba(10 20 30 / 50%)').a, 0.5);
  assert.equal(parse('hsl(0, 100%, 50%)').r, 255);
  assert.equal(readable({ r: 255, g: 255, b: 0, a: 1 }), '#000000');
  assert.equal(readable({ r: 0, g: 0, b: 80, a: 1 }), '#ffffff');
  const r = find('a { color: #ff8800; b: rgb(0,0,255); c: #zzz; d: hsl(120, 50%, 50%) }\nno colors here\nx: #12345678', 100);
  assert.equal(r.length, 4);
  assert.deepEqual([r[0].start, r[0].end], [{ line: 0, col: 11 }, { line: 0, col: 18 }]);
  assert.equal(r[0].style.backgroundColor, 'rgb(255,136,0)');
  assert.equal(r[3].start.line, 2);
  assert.equal(find('#ff0000 #00ff00 #0000ff', 2).length, 2);
  t.activate();
  t.doc.text = 'color: #ff0000;';
  t.handlers.get('change')();
  await wait();
  const last = t.log.decorations.at(-1);
  assert.equal(last[1].length, 1);
  assert.equal(last[1][0].style.backgroundColor, 'rgb(255,0,0)');
});

test('todo highlight marks tags in comments only', async () => {
  const t = load('todo-highlight', {});
  const { scan } = t.exports._test;
  const found = scan('x = 1 // TODO: later\nTODO_LIST = []\n# FIXME now\n/* BUG */\nconst s = "TODO"', { TODO: '', FIXME: '', BUG: '' });
  assert.deepEqual(found.map((f) => [f.line, f.tag, f.col]), [[0, 'TODO', 9], [2, 'FIXME', 2], [3, 'BUG', 3]]);
  t.activate();
  t.doc.text = '// TODO a\n// FIXME b';
  t.handlers.get('open')();
  await wait(250);
  assert.equal(t.log.types.length, 8);
  const withRanges = t.log.decorations.filter(([, r]) => r.length);
  assert.equal(withRanges.length, 2);
});

test('trailing whitespace', async () => {
  const t = load('trailing-whitespace', {});
  const { find } = t.exports._test;
  assert.deepEqual(find('a  \nb\n  \nc\t', false), [{ line: 0, col: 1, len: 2 }, { line: 2, col: 0, len: 2 }, { line: 3, col: 1, len: 1 }]);
  assert.equal(find('a  \n   \nb ', true).length, 2);
  t.activate();
  t.doc.text = 'one \ntwo  \nthree';
  t.doc.selection = { start: { line: 0, col: 4 }, end: { line: 0, col: 4 } };
  t.handlers.get('open')();
  await wait(300);
  // The cursor's own line is skipped.
  assert.deepEqual(t.log.decorations.at(-1)[1].map((r) => r.start.line), [1]);
  await t.commands.get('trailingWhitespace.trim')();
  assert.equal(t.log.edits.at(-1).length, 2);
  assert.deepEqual(t.log.edits.at(-1)[0], { range: { start: { line: 0, col: 3 }, end: { line: 0, col: 4 } }, text: '' });
});

test('indent rainbow', () => {
  const { levels } = load('indent-rainbow').exports._test;
  const r = levels('a\n    b\n        c\n      d\n\tx\n\t \ty', 4, 100);
  assert.deepEqual(r.per[0].filter((x) => x.line === 2), [{ line: 2, s: 0, e: 4 }]);
  assert.deepEqual(r.per[1].filter((x) => x.line === 2), [{ line: 2, s: 4, e: 8 }]);
  assert.deepEqual(r.odd.map((x) => [x.line, x.s, x.e]), [[3, 4, 6], [5, 0, 3]]);
  assert.equal(levels('   \n', 4, 100).per.every((p) => p.length === 0), true);
});

test('long lines', async () => {
  const t = load('long-lines', { 'longLines.maxColumns': 20, 'longLines.showLength': true });
  const { find } = t.exports._test;
  const f = find('short\n' + 'x'.repeat(25) + '\n\t' + 'y'.repeat(20), 20, true);
  assert.deepEqual(f.map((x) => [x.line, x.col, x.len]), [[1, 20, 25], [2, 17, 24]]);
  assert.equal(f[0].note, '25 characters (limit 20)');
  t.activate();
  t.doc.text = 'z'.repeat(30);
  t.handlers.get('open')();
  await wait(300);
  const r = t.log.decorations.at(-1)[1];
  assert.equal(r.length, 1);
  assert.equal(r[0].after.contentText, '30 characters (limit 20)');
});

test('outline lite builds a nested tree', async () => {
  const t = load('outline-lite');
  const { symbols, nest, familyOf } = t.exports._test;
  assert.equal(familyOf('TypeScript', 'a.ts'), 'js');
  assert.equal(familyOf('Plain Text', 'x.rs'), 'rust');
  assert.equal(familyOf('Plain Text', 'x.zzz'), null);
  const js = symbols('export class A {\n  run() {\n  }\n}\nfunction f() {}\nconst g = async (x) => x;\nexport interface I {}', 'js');
  assert.deepEqual(js.map((s) => [s.name, s.kind]), [['A', 'class'], ['run', 'method'], ['f', 'function'], ['g', 'function'], ['I', 'interface']]);
  const tree = nest(js);
  assert.equal(tree[0].name, 'A');
  assert.deepEqual(tree[0].children.map((c) => c.name), ['run']);
  const md = symbols('# One\ntext\n## Two\n```\n# not\n```\n### Three', 'markdown');
  assert.deepEqual(md.map((s) => [s.name, s.depth]), [['One', 0], ['Two', 1], ['Three', 2]]);
  const py = symbols('class A:\n    def m(self):\n        pass\ndef f():\n    pass', 'python');
  assert.deepEqual(nest(py).map((n) => [n.name, n.children.length]), [['A', 1], ['f', 0]]);
  assert.deepEqual(symbols('fn main() {}\npub struct S;\nimpl S {}\n', 'rust').map((s) => s.name), ['main', 'S', 'S']);
  t.activate();
  t.doc.language = 'Python';
  t.doc.name = 'x.py';
  t.doc.text = 'class A:\n    def m(self):\n        pass';
  t.handlers.get('open')();
  await wait(400);
  const view = t.log.trees.get('outlineLite.symbols');
  assert.ok(view.refreshes >= 1);
  const root = await view.provider.getChildren(undefined);
  assert.deepEqual(root.map((i) => [i.label, i.collapsible, i.command, i.args]), [['A', 'expanded', 'outlineLite.goto', [0, 6]]]);
  const kids = await view.provider.getChildren({ id: root[0].id });
  assert.equal(kids[0].label, 'm');
  await t.commands.get('outlineLite.goto')(1, 8);
  assert.deepEqual(t.log.selections.at(-1)[0], { line: 1, col: 8 });
});

test('recent files', async () => {
  const t = load('recent-files');
  const { remember, ago, relative } = t.exports._test;
  const list = remember(remember([], { path: '/a', name: 'a' }, 2), { path: '/b', name: 'b' }, 2);
  assert.deepEqual(remember(list, { path: '/a', name: 'a' }, 2).map((x) => x.path), ['/a', '/b']);
  assert.equal(remember(list, { path: '/c', name: 'c' }, 2).length, 2);
  assert.equal(ago(Date.now() - 5000), 'just now');
  assert.equal(ago(Date.now() - 2 * 3600 * 1000), '2 h ago');
  assert.equal(relative('C:\\proj\\src\\a.js', 'C:\\proj'), 'src/a.js');
  t.activate();
  await t.handlers.get('open')({ path: '/p/x.js', name: 'x.js' });
  await t.handlers.get('open')({ path: '/p/src/y.js', name: 'y.js' });
  const view = t.log.trees.get('recentFiles.list');
  const items = await view.provider.getChildren(undefined);
  assert.deepEqual(items.map((i) => i.label), ['y.js', 'x.js']);
  assert.equal(items[0].command, 'recentFiles.open');
  await t.commands.get('recentFiles.open')('/p/x.js');
  assert.deepEqual(t.log.opened.at(-1), ['/p/x.js', undefined]);
  await t.commands.get('recentFiles.clear')();
  assert.equal((await view.provider.getChildren(undefined)).length, 0);
});

test('sidebar views of the updated extensions', async () => {
  const b = load('bookmarks');
  b.activate();
  b.doc.text = 'a\nb\nc';
  b.doc.selection = { start: { line: 1, col: 0 }, end: { line: 1, col: 0 } };
  await b.commands.get('bookmarks.toggle')();
  await wait(50);
  const tree = b.log.trees.get('bookmarks.list');
  const files = await tree.provider.getChildren(undefined);
  assert.deepEqual(files.map((f) => [f.label, f.collapsible]), [['file.txt', 'expanded']]);
  const lines = await tree.provider.getChildren({ id: files[0].id });
  assert.deepEqual(lines.map((l) => [l.label, l.command, l.args]), [['Line 2', 'bookmarks.goto', ['/p/file.txt', 1]]]);
  assert.deepEqual(b.log.decorations.at(-1)[1], [{ start: { line: 1, col: 0 }, end: { line: 1, col: 0 } }]);
  assert.equal(b.log.badge['bookmarks.list'], 1);
  await b.commands.get('bookmarks.goto')('/p/file.txt', 1);
  assert.deepEqual(b.log.opened.at(-1), ['/p/file.txt', { line: 1, col: 0 }]);

  const g = load('git-quick');
  g.activate();
  const page = g.log.pages.get('gitQuick.actions');
  assert.match(page.html, /data-c="gitQuick.pull"/);
  assert.match(page.html, /Stage all and commit/);
  let ran = null;
  g.commands.set('gitQuick.pull', () => (ran = 'pull'));
  page.handler({ type: 'run', id: 'gitQuick.pull' });
  await wait(20);
  assert.equal(ran, 'pull');
  // The page can only run the buttons it shows.
  g.commands.set('evil.cmd', () => (ran = 'evil'));
  page.handler({ type: 'run', id: 'evil.cmd' });
  await wait(20);
  assert.equal(ran, 'pull');

  const n = load('quick-notes');
  n.activate();
  await wait(50);
  const notes = n.log.pages.get('quickNotes.page');
  assert.match(notes.html, /<textarea/);

  const s = load('npm-scripts');
  s.ferrum.workspace.listFiles = async (p) => (p === '*package.json' ? ['package.json'] : ['pnpm-lock.yaml']);
  s.ferrum.workspace.readFile = async () => '{"scripts":{"dev":"vite","build":"tsc"}}';
  s.activate();
  const items = await s.log.trees.get('npmScripts.list').provider.getChildren(undefined);
  assert.deepEqual(items.map((i) => [i.label, i.command, i.args]), [['dev', 'npmScripts.runScript', ['dev']], ['build', 'npmScripts.runScript', ['build']]]);

  const d = load('todo-tree');
  d.ferrum.workspace.listFiles = async () => ['a.js', 'b.png'];
  d.ferrum.workspace.readFile = async () => 'x();\n// TODO(ada): fix this\n';
  d.ferrum.window.withProgress = (t, fn) => fn();
  d.activate();
  const top = await d.log.trees.get('todoTree.items').provider.getChildren(undefined);
  assert.deepEqual(top.map((i) => i.label), ['a.js']);
  const kids = await d.log.trees.get('todoTree.items').provider.getChildren({ id: top[0].id });
  assert.deepEqual(kids.map((k) => [k.label, k.command, k.args]), [['fix this', 'todoTree.openAt', ['a.js', 1]]]);
});
