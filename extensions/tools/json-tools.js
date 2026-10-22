// JSON Tools: format, minify, sort keys, validate and convert JSON.

function indent() {
  const v = ferrum.settings.get('jsonTools.indent');
  return v === 'tab' ? '\t' : Number(v) || 2;
}

function sortKeys(v, deep) {
  if (Array.isArray(v)) return v.map((x) => (deep ? sortKeys(x, deep) : x));
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort((a, b) => a.localeCompare(b))) out[k] = deep ? sortKeys(v[k], deep) : v[k];
    return out;
  }
  return v;
}

/** Turns "Unexpected token } in JSON at position 41" into a line and column in the text. */
function locate(text, e) {
  const m = /position (\d+)/.exec(e.message || '');
  if (!m) return null;
  const pos = Number(m[1]);
  const before = text.slice(0, pos).split('\n');
  return { line: before.length, col: before[before.length - 1].length + 1 };
}

function parse(text) {
  // Comments and trailing commas are common in config files: accept them when the strict parse fails.
  try {
    return JSON.parse(text);
  } catch (strict) {
    const relaxed = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1');
    try {
      return JSON.parse(relaxed);
    } catch {
      throw strict;
    }
  }
}

function flatten(v, prefix = '', out = {}) {
  if (Array.isArray(v)) v.forEach((x, i) => flatten(x, prefix + '[' + i + ']', out));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) flatten(v[k], prefix ? prefix + '.' + k : k, out);
  else out[prefix] = v;
  return out;
}

function toCsv(v) {
  if (!Array.isArray(v) || !v.length || typeof v[0] !== 'object') throw new Error('The JSON must be an array of objects.');
  const cols = [...new Set(v.flatMap((r) => Object.keys(r)))];
  const cell = (x) => {
    const s = x === null || x === undefined ? '' : typeof x === 'object' ? JSON.stringify(x) : String(x);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(','), ...v.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
}

function toTypes(v, name = 'Root') {
  const lines = [];
  const kind = (x, n) => {
    if (x === null) return 'null';
    if (Array.isArray(x)) return (x.length ? kind(x[0], n + 'Item') : 'unknown') + '[]';
    if (typeof x === 'object') {
      const body = Object.keys(x).map((k) => '  ' + (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + kind(x[k], n + k.charAt(0).toUpperCase() + k.slice(1)) + ';');
      lines.push('interface ' + n + ' {\n' + body.join('\n') + '\n}');
      return n;
    }
    return typeof x;
  };
  const root = kind(v, name);
  if (!lines.length) lines.push('type ' + name + ' = ' + root + ';');
  return lines.reverse().join('\n\n');
}

exports._test = { sortKeys, parse, flatten, toCsv, toTypes, locate };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  async function work(fn, opts = {}) {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a JSON file first.', 'warn');
    const text = doc.selectedText || doc.text;
    let value;
    try {
      value = parse(text);
    } catch (e) {
      const at = locate(text, e);
      return ferrum.window.showMessage('Not valid JSON: ' + e.message + (at ? ' (line ' + at.line + ', column ' + at.col + ')' : ''), 'error');
    }
    const result = fn(value);
    if (opts.newFile) {
      const doc2 = await ferrum.editor.active();
      return doc2 && ferrum.window.showMessage(opts.message ? opts.message(result) : 'Done.');
    }
    if (doc.selectedText) await ferrum.editor.insert(result);
    else {
      const lines = doc.text.split('\n');
      await ferrum.editor.replace({ start: { line: 0, col: 0 }, end: { line: lines.length - 1, col: lines[lines.length - 1].length } }, result);
    }
  }

  reg('jsonTools.format', () => work((v) => JSON.stringify(v, null, indent())));
  reg('jsonTools.minify', () => work((v) => JSON.stringify(v)));
  reg('jsonTools.sortKeys', () => work((v) => JSON.stringify(sortKeys(v, false), null, indent())));
  reg('jsonTools.sortKeysDeep', () => work((v) => JSON.stringify(sortKeys(v, true), null, indent())));
  reg('jsonTools.toCsv', () => work((v) => toCsv(v)));
  reg('jsonTools.toTypescript', () => work((v) => toTypes(v)));
  reg('jsonTools.flatten', () => work((v) => JSON.stringify(flatten(v), null, indent())));
  reg('jsonTools.stringify', () => work((v) => JSON.stringify(JSON.stringify(v))));
  reg('jsonTools.validate', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a JSON file first.', 'warn');
    try {
      const v = JSON.parse(doc.selectedText || doc.text);
      const n = Object.keys(flatten(v)).length;
      ferrum.window.showMessage('Valid JSON. ' + n + ' value' + (n === 1 ? '' : 's') + '.');
    } catch (e) {
      const at = locate(doc.selectedText || doc.text, e);
      ferrum.window.showMessage('Not valid JSON: ' + e.message + (at ? ' (line ' + at.line + ', column ' + at.col + ')' : ''), 'error');
    }
  });
};

exports.deactivate = function () {};
