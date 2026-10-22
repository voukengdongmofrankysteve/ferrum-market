// Text Tools: sort, clean, convert case, encode and generate text. Works on the selection, or on the whole file when nothing is selected.

const split = (t) => t.split('\n');

function words(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const caseOps = {
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
  title: (s) => s.replace(/\w\S*/g, (w) => cap(w)),
  sentence: (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase()),
  camel: (s) => words(s).map((w, i) => (i ? cap(w) : w.toLowerCase())).join(''),
  pascal: (s) => words(s).map(cap).join(''),
  snake: (s) => words(s).map((w) => w.toLowerCase()).join('_'),
  kebab: (s) => words(s).map((w) => w.toLowerCase()).join('-'),
  constant: (s) => words(s).map((w) => w.toUpperCase()).join('_'),
  dot: (s) => words(s).map((w) => w.toLowerCase()).join('.'),
  path: (s) => words(s).map((w) => w.toLowerCase()).join('/'),
  swap: (s) => s.replace(/[A-Za-z]/g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())),
};

const lineOps = {
  sortAsc: (t) => split(t).sort((a, b) => a.localeCompare(b)).join('\n'),
  sortDesc: (t) => split(t).sort((a, b) => b.localeCompare(a)).join('\n'),
  sortCI: (t) => split(t).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join('\n'),
  sortNum: (t) => split(t).sort((a, b) => (parseFloat(a.replace(/[^0-9.\-]/g, '')) || 0) - (parseFloat(b.replace(/[^0-9.\-]/g, '')) || 0)).join('\n'),
  sortLen: (t) => split(t).sort((a, b) => a.length - b.length).join('\n'),
  unique: (t) => [...new Set(split(t))].join('\n'),
  reverse: (t) => split(t).reverse().join('\n'),
  shuffle: (t) => {
    const a = split(t);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.join('\n');
  },
  join: (t) => split(t).map((l) => l.trim()).filter(Boolean).join(' '),
  trim: (t) => split(t).map((l) => l.replace(/[ \t]+$/g, '')).join('\n'),
  trimBoth: (t) => split(t).map((l) => l.trim()).join('\n'),
  blank: (t) => split(t).filter((l) => l.trim() !== '').join('\n'),
  collapseBlank: (t) => t.replace(/\n{3,}/g, '\n\n'),
  number: (t) => {
    const a = split(t);
    const w = String(a.length).length;
    return a.map((l, i) => String(i + 1).padStart(w, '0') + '  ' + l).join('\n');
  },
  indent: (t, n = 2) => split(t).map((l) => (l ? ' '.repeat(n) + l : l)).join('\n'),
  outdent: (t, n = 2) => split(t).map((l) => l.replace(new RegExp('^ {1,' + n + '}'), '')).join('\n'),
  tabsToSpaces: (t, n = 4) => t.replace(/\t/g, ' '.repeat(n)),
  spacesToTabs: (t, n = 4) => split(t).map((l) => l.replace(new RegExp('^((?: {' + n + '})+)'), (m) => '\t'.repeat(m.length / n))).join('\n'),
  wrap: (t, width = 80) =>
    split(t)
      .map((line) => {
        if (line.length <= width) return line;
        const out = [];
        let cur = '';
        for (const w of line.split(/\s+/)) {
          if (cur && (cur + ' ' + w).length > width) {
            out.push(cur);
            cur = w;
          } else cur = cur ? cur + ' ' + w : w;
        }
        out.push(cur);
        return out.join('\n');
      })
      .join('\n'),
  quote: (t) => split(t).map((l) => JSON.stringify(l)).join(',\n'),
  bullet: (t) => split(t).map((l) => (l.trim() ? '- ' + l.replace(/^\s*[-*]\s*/, '') : l)).join('\n'),
};

const b64e = (s) => {
  let x = '';
  for (const c of new TextEncoder().encode(s)) x += String.fromCharCode(c);
  return btoa(x);
};
const b64d = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0)));
const htmlE = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const htmlD = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const codecOps = {
  b64e,
  b64d,
  urlE: (s) => encodeURIComponent(s),
  urlD: (s) => decodeURIComponent(s),
  htmlE,
  htmlD,
  jsonE: (s) => JSON.stringify(s).slice(1, -1),
  jsonD: (s) => JSON.parse('"' + s + '"'),
  hexE: (s) => Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, '0')).join(' '),
  hexD: (s) => new TextDecoder().decode(Uint8Array.from(s.trim().split(/[\s,]+/).map((h) => parseInt(h, 16)))),
  rot13: (s) => s.replace(/[A-Za-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26) + (c <= 'Z' ? 65 : 97))),
  slug: (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
};

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
function lorem(paragraphs) {
  const out = [];
  for (let p = 0; p < paragraphs; p++) {
    const sentences = [];
    for (let s = 0; s < 4 + (p % 3); s++) {
      const n = 8 + ((p * 7 + s * 5) % 9);
      const ws = [];
      for (let i = 0; i < n; i++) ws.push(LOREM[(p * 31 + s * 17 + i * 7) % LOREM.length]);
      const text = ws.join(' ');
      sentences.push(text.charAt(0).toUpperCase() + text.slice(1) + '.');
    }
    out.push(sentences.join(' '));
  }
  return out.join('\n\n');
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}

function pad(n) {
  return String(n).padStart(2, '0');
}
function stamp(kind, d = new Date()) {
  switch (kind) {
    case 'iso': return d.toISOString();
    case 'date': return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    case 'time': return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    case 'datetime': return stamp('date', d) + ' ' + stamp('time', d);
    case 'epoch': return String(Math.floor(d.getTime() / 1000));
    case 'epochms': return String(d.getTime());
    case 'utc': return d.toUTCString();
    default: return d.toString();
  }
}

exports._test = { caseOps, lineOps, codecOps, lorem, uuid, stamp, words };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  /** Applies fn to the selection, or to the whole file when nothing is selected. One undoable edit. */
  async function transform(fn, label) {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
    try {
      if (doc.selectedText) {
        await ferrum.editor.insert(fn(doc.selectedText));
      } else {
        const lines = doc.text.split('\n');
        const end = { line: lines.length - 1, col: lines[lines.length - 1].length };
        const next = fn(doc.text);
        if (next !== doc.text) await ferrum.editor.replace({ start: { line: 0, col: 0 }, end }, next);
      }
    } catch (e) {
      ferrum.window.showMessage((label || 'This') + ' failed: ' + (e && e.message ? e.message : e), 'error');
    }
  }
  const ins = async (text) => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
    await ferrum.editor.insert(text);
  };

  const map = {
    'textTools.sortAsc': lineOps.sortAsc, 'textTools.sortDesc': lineOps.sortDesc, 'textTools.sortCaseInsensitive': lineOps.sortCI, 'textTools.sortNumeric': lineOps.sortNum, 'textTools.sortByLength': lineOps.sortLen,
    'textTools.unique': lineOps.unique, 'textTools.reverse': lineOps.reverse, 'textTools.shuffle': lineOps.shuffle, 'textTools.join': lineOps.join,
    'textTools.trim': lineOps.trim, 'textTools.trimBoth': lineOps.trimBoth, 'textTools.removeBlank': lineOps.blank, 'textTools.collapseBlank': lineOps.collapseBlank,
    'textTools.numberLines': lineOps.number, 'textTools.quoteLines': lineOps.quote, 'textTools.bullets': lineOps.bullet,
    'textTools.tabsToSpaces': (t) => lineOps.tabsToSpaces(t, Number(ferrum.settings.get('textTools.tabSize')) || 4),
    'textTools.spacesToTabs': (t) => lineOps.spacesToTabs(t, Number(ferrum.settings.get('textTools.tabSize')) || 4),
    'textTools.wrap': (t) => lineOps.wrap(t, Number(ferrum.settings.get('textTools.wrapColumn')) || 80),
    'textTools.upper': caseOps.upper, 'textTools.lower': caseOps.lower, 'textTools.title': caseOps.title, 'textTools.sentence': caseOps.sentence,
    'textTools.camel': caseOps.camel, 'textTools.pascal': caseOps.pascal, 'textTools.snake': caseOps.snake, 'textTools.kebab': caseOps.kebab, 'textTools.constant': caseOps.constant,
    'textTools.swapCase': caseOps.swap, 'textTools.base64Encode': codecOps.b64e, 'textTools.base64Decode': codecOps.b64d,
    'textTools.urlEncode': codecOps.urlE, 'textTools.urlDecode': codecOps.urlD, 'textTools.htmlEncode': codecOps.htmlE, 'textTools.htmlDecode': codecOps.htmlD,
    'textTools.jsonEscape': codecOps.jsonE, 'textTools.jsonUnescape': codecOps.jsonD, 'textTools.hexEncode': codecOps.hexE, 'textTools.hexDecode': codecOps.hexD,
    'textTools.rot13': codecOps.rot13, 'textTools.slugify': codecOps.slug,
  };
  for (const [id, fn] of Object.entries(map)) reg(id, () => transform(fn, id));

  reg('textTools.changeCase', async () => {
    const pick = await ferrum.window.showQuickPick(
      [['UPPER CASE', 'upper'], ['lower case', 'lower'], ['Title Case', 'title'], ['Sentence case', 'sentence'], ['camelCase', 'camel'], ['PascalCase', 'pascal'], ['snake_case', 'snake'], ['kebab-case', 'kebab'], ['CONSTANT_CASE', 'constant'], ['dot.case', 'dot'], ['path/case', 'path'], ['sWAP cASE', 'swap']].map(([label, key]) => ({ label, detail: key })),
      { placeholder: 'Change case to...' },
    );
    if (pick) await transform(caseOps[pick.detail], 'Change case');
  });

  reg('textTools.insertUuid', () => ins(uuid()));
  reg('textTools.insertUuidMany', async () => {
    const n = Number(await ferrum.window.showInputBox({ prompt: 'How many UUIDs?', value: '5' }));
    if (n > 0 && n <= 1000) await ins(Array.from({ length: n }, uuid).join('\n'));
  });
  reg('textTools.insertDate', async () => {
    const kinds = ['date', 'datetime', 'time', 'iso', 'epoch', 'epochms', 'utc'];
    const pick = await ferrum.window.showQuickPick(kinds.map((k) => ({ label: stamp(k), detail: k })), { placeholder: 'Insert the current date and time as...' });
    if (pick) await ins(pick.label);
  });
  reg('textTools.insertLorem', async () => {
    const n = Number(await ferrum.window.showInputBox({ prompt: 'How many paragraphs?', value: String(ferrum.settings.get('textTools.loremParagraphs') || 3) }));
    if (n > 0 && n <= 50) await ins(lorem(n));
  });
  reg('textTools.insertSeparator', () => ins('-'.repeat(Number(ferrum.settings.get('textTools.wrapColumn')) || 80)));
  reg('textTools.randomString', async () => {
    const n = Number(await ferrum.window.showInputBox({ prompt: 'Length of the random string?', value: '24' }));
    if (!(n > 0 && n <= 4096)) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(n);
    (typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256))));
    await ins(Array.from(bytes, (b) => chars[b % chars.length]).join(''));
  });
};

exports.deactivate = function () {};
