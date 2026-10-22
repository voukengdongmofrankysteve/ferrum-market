// Outline Lite: a sidebar view listing the functions, classes and headings of the open file. Click one to jump to it.

const PATTERNS = {
  js: [
    ['class', /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/, 'symbol-class'],
    ['function', /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/, 'symbol-function'],
    ['function', /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/, 'symbol-function'],
    ['interface', /^\s*(?:export\s+)?(?:interface|type|enum)\s+([A-Za-z_$][\w$]*)/, 'symbol-interface'],
    ['method', /^\s{2,}(?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^{=]+)?\{\s*$/, 'symbol-method'],
  ],
  python: [
    ['class', /^\s*class\s+([A-Za-z_]\w*)/, 'symbol-class'],
    ['function', /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/, 'symbol-function'],
  ],
  rust: [
    ['struct', /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:struct|enum|trait|union)\s+([A-Za-z_]\w*)/, 'symbol-struct'],
    ['impl', /^\s*impl(?:<[^>]*>)?\s+(?:[\w:<>,\s]+\s+for\s+)?([A-Za-z_][\w:<>]*)/, 'symbol-class'],
    ['function', /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:const\s+)?(?:unsafe\s+)?fn\s+([A-Za-z_]\w*)/, 'symbol-function'],
    ['module', /^\s*(?:pub\s+)?mod\s+([A-Za-z_]\w*)/, 'symbol-namespace'],
  ],
  go: [
    ['struct', /^type\s+([A-Za-z_]\w*)\s+(?:struct|interface)/, 'symbol-struct'],
    ['function', /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)/, 'symbol-function'],
  ],
  c: [
    ['class', /^\s*(?:class|struct|enum|union|namespace)\s+([A-Za-z_]\w*)/, 'symbol-class'],
    ['function', /^[A-Za-z_][\w\s*&:<>,]*\s+\**([A-Za-z_]\w*)\s*\([^;]*\)\s*(?:const\s*)?\{?\s*$/, 'symbol-function'],
  ],
  java: [
    ['class', /^\s*(?:public\s+|private\s+|protected\s+|static\s+|final\s+|abstract\s+|sealed\s+|partial\s+)*(?:class|interface|enum|record|struct)\s+([A-Za-z_]\w*)/, 'symbol-class'],
    ['method', /^\s+(?:public|private|protected|internal|static|final|async|override|virtual|abstract|\s)+[\w<>\[\],.?\s]+\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*(?:throws [\w,\s.]+)?\s*\{?\s*$/, 'symbol-method'],
  ],
  php: [
    ['class', /^\s*(?:abstract\s+|final\s+)?(?:class|interface|trait|enum)\s+([A-Za-z_]\w*)/, 'symbol-class'],
    ['function', /^\s*(?:public\s+|private\s+|protected\s+|static\s+|abstract\s+|final\s+)*function\s+&?([A-Za-z_]\w*)/, 'symbol-function'],
  ],
  ruby: [
    ['class', /^\s*(?:class|module)\s+([A-Za-z_][\w:]*)/, 'symbol-class'],
    ['function', /^\s*def\s+(?:self\.)?([A-Za-z_]\w*[?!=]?)/, 'symbol-function'],
  ],
  shell: [['function', /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{?/, 'symbol-function']],
  markdown: [['heading', /^(#{1,6})\s+(.+?)\s*#*\s*$/, 'list-tree']],
  css: [['rule', /^\s*([.#@][^{;]+?)\s*\{\s*$/, 'symbol-color']],
  sql: [['table', /^\s*create\s+(?:or\s+replace\s+)?(?:temporary\s+)?(?:table|view|function|procedure|index)\s+(?:if\s+not\s+exists\s+)?([\w."]+)/i, 'database']],
  html: [['element', /^\s*<(h[1-6]|section|header|footer|nav|main|article|aside|form|table)\b[^>]*?(?:id="([^"]+)")?[^>]*>/i, 'symbol-structure']],
};

const FAMILY = { javascript: 'js', typescript: 'js', jsx: 'js', tsx: 'js', vue: 'js', svelte: 'js', python: 'python', rust: 'rust', go: 'go', 'c / c++': 'c', 'java / c#': 'java', kotlin: 'java', scala: 'java', dart: 'java', swift: 'java', php: 'php', ruby: 'ruby', shell: 'shell', markdown: 'markdown', css: 'css', scss: 'css', sql: 'sql', 'html / xml': 'html' };

function familyOf(language, name) {
  const l = String(language || '').toLowerCase();
  if (FAMILY[l]) return FAMILY[l];
  const ext = String(name || '').split('.').pop().toLowerCase();
  return { js: 'js', ts: 'js', tsx: 'js', jsx: 'js', mjs: 'js', py: 'python', rs: 'rust', go: 'go', c: 'c', h: 'c', cpp: 'c', hpp: 'c', cc: 'c', java: 'java', cs: 'java', kt: 'java', swift: 'java', dart: 'java', php: 'php', rb: 'ruby', sh: 'shell', bash: 'shell', md: 'markdown', css: 'css', scss: 'css', sql: 'sql', html: 'html', vue: 'js' }[ext] || null;
}

/** Symbols of a file: [{ name, kind, icon, line, col, depth }]. Depth comes from how far the line is indented. */
function symbols(text, family) {
  const pats = PATTERNS[family];
  if (!pats) return [];
  const out = [];
  const lines = text.split('\n');
  let fence = false;
  for (let i = 0; i < lines.length && out.length < 3000; i++) {
    const line = lines[i];
    if (line.length > 400) continue;
    if (family === 'markdown' && /^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    for (const [kind, re, icon] of pats) {
      const m = re.exec(line);
      if (!m) continue;
      let name = m[m.length - 1] || m[1];
      let depth = Math.floor((/^\s*/.exec(line)[0].replace(/\t/g, '    ').length) / 2);
      if (family === 'markdown') depth = m[1].length - 1;
      if (family === 'html') name = '<' + m[1] + '>' + (m[2] ? ' #' + m[2] : '');
      if (!name) continue;
      out.push({ name: String(name).trim(), kind, icon, line: i, col: Math.max(0, line.indexOf(String(name))), depth });
      break;
    }
  }
  return out;
}

/** Nests symbols by depth: each symbol becomes a child of the nearest earlier one with a smaller depth. */
function nest(list) {
  const roots = [];
  const stack = [];
  for (const s of list) {
    const node = { ...s, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= s.depth) stack.pop();
    (stack.length ? stack[stack.length - 1].children : roots).push(node);
    stack.push(node);
  }
  return roots;
}

exports._test = { symbols, nest, familyOf };

exports.activate = function (context) {
  let tree = [];
  let byId = new Map();
  let view = null;
  let timer = null;

  async function rebuild() {
    const doc = await ferrum.editor.active();
    const fam = doc && familyOf(doc.language, doc.name);
    tree = doc && fam ? nest(symbols(doc.text, fam)) : [];
    byId = new Map();
    const walk = (nodes, prefix) => nodes.forEach((n, i) => { n.id = prefix + i; byId.set(n.id, n); walk(n.children, n.id + '.'); });
    walk(tree, 'o');
    view.setBadge(tree.length);
    view.refresh();
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 200);
  };

  const toItem = (n) => ({ id: n.id, label: n.name, description: n.kind === 'heading' ? '' : n.kind, icon: n.icon, collapsible: n.children.length ? 'expanded' : 'none', command: 'outlineLite.goto', args: [n.line, n.col], tooltip: n.kind + ' on line ' + (n.line + 1) });
  view = ferrum.window.registerTreeView('outlineLite.symbols', {
    getChildren: (element) => (element ? (byId.get(element.id) ? byId.get(element.id).children : []) : tree).map(toItem),
  });

  context.subscriptions.push(
    view,
    ferrum.commands.register('outlineLite.goto', async (line, col) => {
      await ferrum.editor.setSelection({ line: Number(line) || 0, col: Number(col) || 0 });
    }),
    ferrum.commands.register('outlineLite.show', () => ferrum.commands.execute('view.ext.vyloxi.outline-lite:outline')),
    ferrum.events.on('activeChanged', later),
    ferrum.events.on('open', later),
    ferrum.events.on('change', later),
    ferrum.events.on('save', later),
    { dispose: () => clearTimeout(timer) },
  );
  later();
};

exports.deactivate = function () {};
