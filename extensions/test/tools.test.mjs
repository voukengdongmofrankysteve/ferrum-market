// Tests the pure logic of the tool extensions and drives their commands through a fake `ferrum` object.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function load(id, settings = {}) {
  const code = readFileSync(join(here, '..', 'tools', id + '.js'), 'utf8');
  const commands = new Map();
  const log = { messages: [], status: {}, inserted: [], replaced: [], terminal: [], panels: [], opened: [] };
  const doc = { path: '/p/file.txt', name: 'file.txt', text: '', selectedText: '', selection: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } }, lineCount: 1 };
  const store = {};
  const ferrum = {
    commands: { register: (cid, fn) => (commands.set(cid, fn), { dispose() {} }) },
    window: {
      showMessage: (t, k) => log.messages.push([t, k]),
      showInputBox: async () => ferrum._input,
      showQuickPick: async (items) => (typeof ferrum._pick === 'function' ? ferrum._pick(items) : items[ferrum._pick ?? 0]),
      confirm: async () => true,
      setStatusBar: (k, v) => (log.status[k] = v),
      withProgress: (t, fn) => fn(),
      showPanel: async (p) => {
        const panel = { html: p.html, title: p.title, handlers: [], setHtml(h) { this.html = h; }, setTitle() {}, onMessage(f) { this.handlers.push(f); }, onDidClose() {}, postMessage() {} };
        log.panels.push(panel);
        return panel;
      },
    },
    editor: {
      active: async () => ({ ...doc, lineCount: doc.text.split('\n').length }),
      insert: async (t) => { log.inserted.push(t); if (doc.selectedText) { doc.text = doc.text.replace(doc.selectedText, t); doc.selectedText = ''; } else doc.text = t; },
      replace: async (r, t) => { log.replaced.push([r, t]); doc.text = t; },
      edit: async (e) => log.replaced.push(['edit', e]),
      getLine: async (n) => doc.text.split('\n')[n] ?? '',
      getText: async () => doc.text,
      setSelection: async () => {},
      openFile: async (p, pos) => log.opened.push([p, pos]),
    },
    workspace: { root: '/p', readFile: async () => '', writeFile: async () => {}, listFiles: async () => [] },
    terminal: { run: async (c) => log.terminal.push(c) },
    settings: { get: (k) => settings[k] },
    storage: { get: async (k, d) => (k in store ? store[k] : d), set: async (k, v) => (store[k] = v) },
    events: { on: () => ({ dispose() {} }) },
    network: { fetch: async () => { throw new Error('no network in tests'); } },
  };
  const exports = {};
  new Function('exports', 'ferrum', 'crypto', code)(exports, ferrum, globalThis.crypto);
  const context = { subscriptions: [], extensionId: 'vyloxi.' + id, version: '1.0.0' };
  return { exports, ferrum, doc, commands, log, context, activate: () => exports.activate(context), store };
}

test('text tools: case conversion', () => {
  const { caseOps } = load('text-tools').exports._test;
  assert.equal(caseOps.camel('hello big_world-ok'), 'helloBigWorldOk');
  assert.equal(caseOps.pascal('hello big_world'), 'HelloBigWorld');
  assert.equal(caseOps.snake('HelloBigWorld'), 'hello_big_world');
  assert.equal(caseOps.kebab('XMLHttpRequest'), 'xml-http-request');
  assert.equal(caseOps.constant('fooBar baz'), 'FOO_BAR_BAZ');
  assert.equal(caseOps.title('the quick brown fox'), 'The Quick Brown Fox');
  assert.equal(caseOps.sentence('HELLO there. HOW are you? fine'), 'Hello there. How are you? Fine');
});

test('text tools: line operations', () => {
  const { lineOps } = load('text-tools').exports._test;
  assert.equal(lineOps.sortAsc('b\na\nc'), 'a\nb\nc');
  assert.equal(lineOps.sortDesc('b\na\nc'), 'c\nb\na');
  assert.equal(lineOps.sortNum('item10\nitem2\nitem1'), 'item1\nitem2\nitem10');
  assert.equal(lineOps.unique('a\nb\na\nc\nb'), 'a\nb\nc');
  assert.equal(lineOps.reverse('1\n2\n3'), '3\n2\n1');
  assert.equal(lineOps.trim('a  \nb\t'), 'a\nb');
  assert.equal(lineOps.blank('a\n\n  \nb'), 'a\nb');
  assert.equal(lineOps.collapseBlank('a\n\n\n\nb'), 'a\n\nb');
  assert.equal(lineOps.number('x\ny'), '1  x\n2  y');
  assert.equal(lineOps.wrap('aaa bbb ccc ddd', 7), 'aaa bbb\nccc ddd');
  assert.equal(lineOps.tabsToSpaces('\tx', 2), '  x');
  assert.equal(lineOps.spacesToTabs('    x', 4), '\tx');
  assert.equal(lineOps.quote('a\nb"c'), '"a",\n"b\\"c"');
  assert.equal(lineOps.join('a\n  b \n\nc'), 'a b c');
  assert.equal(lineOps.shuffle('a\nb\nc').split('\n').sort().join(''), 'abc');
});

test('text tools: encoders round trip, including non ASCII', () => {
  const { codecOps } = load('text-tools').exports._test;
  const s = 'Héllo wörld ✓ <a href="x">&</a>';
  assert.equal(codecOps.b64d(codecOps.b64e(s)), s);
  assert.equal(codecOps.urlD(codecOps.urlE(s)), s);
  assert.equal(codecOps.htmlD(codecOps.htmlE(s)), s);
  assert.equal(codecOps.hexD(codecOps.hexE(s)), s);
  assert.equal(codecOps.jsonD(codecOps.jsonE('a"b\nc')), 'a"b\nc');
  assert.equal(codecOps.b64e('hi'), 'aGk=');
  assert.equal(codecOps.rot13('Hello'), 'Uryyb');
  assert.equal(codecOps.rot13(codecOps.rot13('Mixed Case 123')), 'Mixed Case 123');
  assert.equal(codecOps.slug('Crème Brûlée & Co!'), 'creme-brulee-co');
  assert.equal(codecOps.htmlD('&#65;&#x42;&amp;lt;'), 'AB&lt;');
});

test('text tools: uuid, dates, lorem', () => {
  const { uuid, stamp, lorem } = load('text-tools').exports._test;
  assert.match(uuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const d = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
  assert.equal(stamp('iso', d), '2026-01-02T03:04:05.000Z');
  assert.equal(stamp('epoch', d), '1767323045');
  assert.equal(stamp('utc', d), 'Fri, 02 Jan 2026 03:04:05 GMT');
  const l = lorem(3);
  assert.equal(l.split('\n\n').length, 3);
  assert.match(l, /^Lorem/i);
});

test('text tools: commands edit the selection, or the whole file', async () => {
  const t = load('text-tools', { 'textTools.tabSize': 4, 'textTools.wrapColumn': 80 });
  t.activate();
  assert.ok(t.commands.size > 40);
  t.doc.text = 'c\nb\na';
  await t.commands.get('textTools.sortAsc')();
  assert.equal(t.log.replaced.at(-1)[1], 'a\nb\nc');
  assert.deepEqual(t.log.replaced.at(-1)[0], { start: { line: 0, col: 0 }, end: { line: 2, col: 1 } });
  t.doc.text = 'hello world';
  t.doc.selectedText = 'world';
  await t.commands.get('textTools.upper')();
  assert.equal(t.log.inserted.at(-1), 'WORLD');
  // A failing encoder reports instead of throwing.
  t.doc.selectedText = '%E0%A4%A';
  await t.commands.get('textTools.urlDecode')();
  assert.equal(t.log.messages.at(-1)[1], 'error');
});

test('json tools', async () => {
  const j = load('json-tools', { 'jsonTools.indent': '2' });
  const { sortKeys, parse, toCsv, toTypes, flatten, locate } = j.exports._test;
  assert.deepEqual(Object.keys(sortKeys({ b: 1, a: { d: 1, c: 2 } }, true).a), ['c', 'd']);
  assert.deepEqual(parse('{ // note\n "a": 1, /* x */ "b": [1,2,], }'), { a: 1, b: [1, 2] });
  assert.throws(() => parse('{"a": }'));
  assert.equal(toCsv([{ a: 1, b: 'x,y' }, { a: 2, c: '"q"' }]), 'a,b,c\n1,"x,y",\n2,,"""q"""');
  assert.match(toTypes({ id: 1, tags: ['a'], owner: { name: 'x' } }), /interface Root \{[\s\S]*id: number;[\s\S]*tags: string\[\];[\s\S]*owner: RootOwner;/);
  assert.deepEqual(flatten({ a: { b: [1, { c: 2 }] } }), { 'a.b[0]': 1, 'a.b[1].c': 2 });
  assert.deepEqual(locate('{\n  "a": }', { message: 'Unexpected token } in JSON at position 9' }), { line: 2, col: 8 });
  j.activate();
  j.doc.text = '{"b":1,"a":[1,2]}';
  await j.commands.get('jsonTools.format')();
  assert.equal(j.log.replaced.at(-1)[1], '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}');
  await j.commands.get('jsonTools.sortKeys')();
  assert.ok(j.log.replaced.at(-1)[1].indexOf('"a"') < j.log.replaced.at(-1)[1].indexOf('"b"'));
  j.doc.text = '{"a": }';
  await j.commands.get('jsonTools.validate')();
  assert.equal(j.log.messages.at(-1)[1], 'error');
});

test('color tools', () => {
  const { parseColor, fmt, shift, contrast, rgbToHsl } = load('color-tools').exports._test;
  assert.deepEqual(parseColor('#f80'), { r: 255, g: 136, b: 0, a: 1 });
  assert.equal(fmt.rgb(parseColor('#ff8800')), 'rgb(255, 136, 0)');
  assert.equal(fmt.hex(parseColor('rgb(255, 136, 0)')), '#ff8800');
  assert.equal(fmt.hsl(parseColor('#ff8800')), 'hsl(32, 100%, 50%)');
  assert.equal(fmt.hex(parseColor('hsl(120, 100%, 25%)')), '#008000');
  assert.equal(fmt.hex(parseColor('#00000080')), '#00000080');
  assert.equal(fmt.rgb(parseColor('#00000080')), 'rgba(0, 0, 0, 0.502)');
  assert.equal(parseColor('red').r, 255);
  assert.equal(parseColor('nonsense'), null);
  assert.ok(rgbToHsl(255, 255, 255).l === 100);
  assert.ok(shift(parseColor('#808080'), 10).r > 128);
  assert.ok(Math.abs(contrast(parseColor('#fff'), parseColor('#000')) - 21) < 0.01);
});

test('color tools: converting colors on a line', async () => {
  const c = load('color-tools', { 'colorTools.step': 10 });
  c.activate();
  c.doc.text = 'a { color: #ff8800; background: rgb(0, 0, 255); }';
  await c.commands.get('colorTools.toHsl')();
  assert.equal(c.log.replaced.at(-1)[1], 'a { color: hsl(32, 100%, 50%); background: hsl(240, 100%, 50%); }');
});

test('timestamp tools', () => {
  const { parseWhen, ago, describe } = load('timestamp-tools').exports._test;
  assert.equal(parseWhen('1767225600').toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(parseWhen('1767225600000').toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(parseWhen('2026-01-01T00:00:00Z').getTime(), 1767225600000);
  assert.equal(parseWhen('banana'), null);
  const now = new Date('2026-01-10T00:00:00Z');
  assert.equal(ago(new Date('2026-01-07T00:00:00Z'), now), '3 days ago');
  assert.equal(ago(new Date('2026-01-10T00:00:30Z'), now), 'in 30 seconds');
  assert.equal(describe(new Date(0))[0][1], '0');
});

test('markdown tools', () => {
  const { formatTable, toc, toggleTask, shiftHeading, sortList } = load('markdown-tools').exports._test;
  assert.equal(formatTable('a|bb|c\n-|:-:|--:\n1|2|3'), '| a   | bb  |   c |\n| --- | :-: | --: |\n| 1   |  2  |   3 |');
  assert.throws(() => formatTable('just one line'));
  assert.equal(toc('# Title\n\n## Part A\n\n```\n# not a heading\n```\n\n### Deep\n## Part A\n', 1, 3), '- [Title](#title)\n  - [Part A](#part-a)\n    - [Deep](#deep)\n  - [Part A](#part-a-1)');
  assert.equal(toggleTask('- [ ] x'), '- [x] x');
  assert.equal(toggleTask('- [X] x'), '- [ ] x');
  assert.equal(toggleTask('- plain'), '- [ ] plain');
  assert.equal(toggleTask('text'), '- [ ] text');
  assert.equal(shiftHeading('## Hi', 1), '### Hi');
  assert.equal(shiftHeading('# Hi', -1), '# Hi');
  assert.equal(shiftHeading('###### Hi', 1), '###### Hi');
  assert.equal(sortList('- b\n- a\n- [ ] c', false), '- a\n- b\n- [ ] c');
});

test('word count', () => {
  const { count, reading } = load('word-count').exports._test;
  const c = count("Hello, world! It's a l'été. Émile arrive.\n\nSecond paragraph here.");
  assert.equal(c.words, 10);
  assert.equal(c.paragraphs, 2);
  assert.equal(c.lines, 3);
  assert.equal(count('').words, 0);
  assert.equal(reading(440, 220), '2 min');
  assert.equal(reading(10, 220), '3 s');
});

test('bookmarks', async () => {
  const { toggle, next } = load('bookmarks').exports._test;
  assert.deepEqual(toggle([1, 5], 3), [1, 3, 5]);
  assert.deepEqual(toggle([1, 3], 3), [1]);
  assert.equal(next([2, 8], 3, 1), 8);
  assert.equal(next([2, 8], 9, 1), 2);
  assert.equal(next([2, 8], 3, -1), 2);
  assert.equal(next([2, 8], 1, -1), 8);
  assert.equal(next([], 1, 1), null);
  const b = load('bookmarks');
  b.activate();
  b.doc.text = 'a\nb\nc';
  b.doc.selection = { start: { line: 2, col: 0 }, end: { line: 2, col: 0 } };
  await b.commands.get('bookmarks.toggle')();
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(b.store['bookmarks.v1'], { '/p/file.txt': [2] });
  assert.equal(b.log.status['bookmarks.status'].text, 'Bookmarks: 1');
});

test('quick notes', async () => {
  const n = load('quick-notes');
  n.activate();
  await n.commands.get('quickNotes.open')();
  const panel = n.log.panels[0];
  assert.match(panel.html, /<textarea/);
  await panel.handlers[0]({ type: 'save', text: 'remember <this>' });
  assert.equal(n.store['notes.v1']['/p'], 'remember <this>');
  panel.setHtml('x');
  await n.commands.get('quickNotes.open')();
  n.doc.text = 'word';
  n.doc.selectedText = 'word';
  await n.commands.get('quickNotes.addSelection')();
  assert.match(n.store['notes.v1']['/p'], /--- file\.txt:1\nword$/);
});

test('npm scripts', async () => {
  const s = load('npm-scripts');
  const { pickManager, runCommand, parseScripts } = s.exports._test;
  assert.equal(pickManager(['pnpm-lock.yaml']), 'pnpm');
  assert.equal(pickManager(['web/yarn.lock']), 'yarn');
  assert.equal(pickManager(['package-lock.json']), 'npm');
  assert.equal(runCommand('npm', 'build'), 'npm run build');
  assert.equal(runCommand('npm', 'test', '--watch'), 'npm test -- --watch');
  assert.equal(runCommand('pnpm', 'dev'), 'pnpm run dev');
  assert.equal(runCommand('yarn', 'dev'), 'yarn dev');
  assert.deepEqual(parseScripts('{"scripts":{"a":"b"}}'), [{ name: 'a', cmd: 'b' }]);
  s.ferrum.workspace.listFiles = async (p) => (p === '*package.json' ? ['package.json'] : ['yarn.lock']);
  s.ferrum.workspace.readFile = async () => '{"scripts":{"dev":"vite","build":"tsc"}}';
  s.activate();
  s.ferrum._pick = 1;
  await s.commands.get('npmScripts.run')();
  assert.deepEqual(s.log.terminal, ['yarn build']);
  await s.commands.get('npmScripts.show')();
  assert.match(s.log.panels[0].html, /data-n="dev"/);
});

test('git quick actions refuse unsafe text', async () => {
  const g = load('git-quick');
  const { commitCommand, branchName, qpath } = g.exports._test;
  assert.equal(commitCommand('Fix bug', true), 'git add -A && git commit -m "Fix bug"');
  assert.throws(() => commitCommand('rm -rf $(x)'));
  assert.throws(() => commitCommand('a"b'));
  assert.throws(() => commitCommand('  '));
  assert.throws(() => commitCommand('two\nlines'));
  assert.equal(branchName('feature my-change'), 'feature-my-change');
  assert.throws(() => branchName('bad;name'));
  assert.throws(() => branchName('--force'));
  assert.throws(() => branchName('a..b'));
  assert.equal(qpath('C:\\Users\\me\\a b.txt'), '"C:/Users/me/a b.txt"');
  g.activate();
  await g.commands.get('gitQuick.pull')();
  assert.deepEqual(g.log.terminal, ['git pull --ff-only']);
  g.ferrum._input = 'Add feature';
  await g.commands.get('gitQuick.commitAll')();
  assert.equal(g.log.terminal.at(-1), 'git add -A && git commit -m "Add feature"');
  g.ferrum._input = 'x; rm -rf /';
  await g.commands.get('gitQuick.newBranch')();
  assert.equal(g.log.terminal.length, 2);
  assert.equal(g.log.messages.at(-1)[1], 'warn');
});

test('http client parsing', () => {
  const { requestAt, variables, substitute, pretty } = load('http-client').exports._test;
  const doc = '@host = https://api.test\n@id = 7\n\n### One\nGET {{host}}/u/{{id}} HTTP/1.1\nAccept: application/json\n\n### Two\n# a comment\nPOST {{host}}/u\nContent-Type: application/json\nX-Id: {{id}}\n\n{ "a": 1 }\n';
  const lines = doc.split('\n');
  const one = requestAt(doc, lines.indexOf('GET {{host}}/u/{{id}} HTTP/1.1'));
  assert.deepEqual(one, { method: 'GET', url: 'https://api.test/u/7', headers: { Accept: 'application/json' }, body: undefined });
  const two = requestAt(doc, lines.indexOf('{ "a": 1 }'));
  assert.equal(two.method, 'POST');
  assert.equal(two.headers['X-Id'], '7');
  assert.equal(two.body, '{ "a": 1 }');
  assert.throws(() => requestAt('### x\n\nnot a request', 2));
  assert.deepEqual(variables('@a = 1\n@b=2'), { a: '1', b: '2' });
  assert.equal(substitute('{{a}}-{{missing}}', { a: 'x' }), 'x-{{missing}}');
  assert.equal(pretty('{"a":1}', 'application/json'), '{\n  "a": 1\n}');
  assert.equal(pretty('plain', 'text/plain'), 'plain');
});

test('todo tree scanning', () => {
  const { scan } = load('todo-tree').exports._test;
  const tags = ['TODO', 'FIXME', 'NOTE'];
  const found = scan('let a = 1; // TODO: write tests\n# FIXME(ada) handle errors\n<!-- NOTE: see docs -->\nconst TODO_LIST = [];\n/* TODOS later */\n * TODO plain star\nvar s = "TODO in string";', tags);
  assert.deepEqual(found.map((f) => [f.line, f.tag, f.who, f.text]), [[0, 'TODO', '', 'write tests'], [1, 'FIXME', 'ada', 'handle errors'], [2, 'NOTE', '', 'see docs'], [5, 'TODO', '', 'plain star']]);
});

test('emoji search', () => {
  const { search, entries } = load('emoji-picker').exports._test;
  assert.ok(entries.length > 180);
  assert.ok(search('rock').some((e) => e.emoji === '🚀'));
  assert.ok(search('fire').some((e) => e.emoji === '🔥'));
  assert.equal(search('zzzzqq').length, 0);
  assert.equal(search('').length, entries.length);
});

test('pomodoro state machine', () => {
  const { fmt, step } = load('pomodoro').exports._test;
  const cfg = { work: 25, shortBreak: 5, longBreak: 15, longEvery: 4 };
  assert.equal(fmt(1500), '25:00');
  assert.equal(fmt(61), '01:01');
  let s = { phase: 'work', left: 2, done: 0, running: true };
  let r = step(s, cfg);
  assert.equal(r.state.left, 1);
  assert.equal(r.event, null);
  r = step(r.state, cfg);
  assert.deepEqual([r.state.phase, r.state.left, r.state.done, r.event], ['break', 300, 1, 'break']);
  r = step({ ...r.state, left: 1 }, cfg);
  assert.deepEqual([r.state.phase, r.state.left, r.event], ['work', 1500, 'work']);
  r = step({ phase: 'work', left: 1, done: 3, running: true }, cfg);
  assert.deepEqual([r.state.phase, r.state.left, r.event], ['long', 900, 'long']);
});

test('file templates', async () => {
  const f = load('file-templates', { 'fileTemplates.author': 'Ada' });
  const { LICENSES, TEMPLATES, safeRel } = f.exports._test;
  assert.match(LICENSES.MIT('Ada'), /^MIT License\n\nCopyright \(c\) \d{4} Ada/);
  assert.equal(safeRel('src\\a.js'), 'src/a.js');
  for (const bad of ['../x', '/etc/passwd', 'C:\\x', 'a/../../b', '']) assert.throws(() => safeRel(bad), undefined, bad);
  assert.match(TEMPLATES['package.json'].body('My App!'), /"name": "my-app-"/);
  const written = [];
  f.ferrum.workspace.writeFile = async (p, t) => written.push([p, t]);
  f.activate();
  await f.commands.get('fileTemplates.addReadme')();
  assert.equal(written[0][0], '/p/README.md');
  assert.match(written[0][1], /^# p\n/);
  assert.deepEqual(f.log.opened[0], ['/p/README.md', undefined]);
  f.ferrum._pick = (items) => items.find((i) => i.label === 'MIT');
  f.ferrum._input = 'Ada';
  await f.commands.get('fileTemplates.addLicense')();
  assert.equal(written.at(-1)[0], '/p/LICENSE');
});

test('regex tester page is built', async () => {
  const r = load('regex-tester');
  r.activate();
  r.doc.text = 'abc';
  await r.commands.get('regexTester.open')();
  assert.match(r.log.panels[0].html, /id="p" value="\\d\+"/);
  await r.log.panels[0].handlers[0]({ type: 'insert', text: '/a/g' });
  assert.equal(r.log.inserted.at(-1), '/a/g');
});

test('hash tools', async () => {
  const { digest, hmac, md5 } = load('hash-tools').exports._test;
  assert.equal(await digest('MD5', ''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(await digest('MD5', 'The quick brown fox jumps over the lazy dog'), '9e107d9d372bb6826bd81d3542a419d6');
  const m5 = (t) => md5(new TextEncoder().encode(t));
  assert.equal(m5('message digest'), 'f96b697d7cb7938d525a2f31aaf161d0');
  assert.equal(m5('abcdefghijklmnopqrstuvwxyz'), 'c3fcd3d76192e4007dfb496cca67e13b');
  assert.equal(m5('1234567890'.repeat(8)), '57edf4a22be3c955ac49da2e2107b67a');
  assert.equal(await digest('SHA-1', 'abc'), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(await digest('SHA-256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await hmac('SHA-256', 'key', 'The quick brown fox jumps over the lazy dog'), 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
});
