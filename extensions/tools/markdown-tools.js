// Markdown Tools: format tables, build a table of contents, toggle tasks, shift headings.

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { cur += '\\|'; i++; }
    else if (s[i] === '|') { cells.push(cur.trim()); cur = ''; }
    else cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

const isSep = (cells) => cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c));
const width = (s) => [...s].length;

function formatTable(text) {
  const rows = text.split('\n').filter((l) => l.trim() !== '').map(splitRow);
  if (rows.length < 2) throw new Error('A table needs a header row and a separator row.');
  const sepAt = rows.findIndex(isSep);
  if (sepAt < 1) throw new Error('There is no separator row (like | --- | --- |).');
  const cols = Math.max(...rows.map((r) => r.length));
  const align = Array.from({ length: cols }, (_, i) => {
    const c = rows[sepAt][i] || '---';
    return c.startsWith(':') && c.endsWith(':') ? 'c' : c.endsWith(':') ? 'r' : c.startsWith(':') ? 'l' : 'n';
  });
  const w = Array.from({ length: cols }, (_, i) => Math.max(3, ...rows.map((r, ri) => (ri === sepAt ? 3 : width(r[i] || '')))));
  const cell = (s, i) => {
    const gap = w[i] - width(s);
    if (align[i] === 'r') return ' '.repeat(gap) + s;
    if (align[i] === 'c') return ' '.repeat(Math.floor(gap / 2)) + s + ' '.repeat(Math.ceil(gap / 2));
    return s + ' '.repeat(gap);
  };
  const sep = (i) => (align[i] === 'c' ? ':' + '-'.repeat(w[i] - 2) + ':' : align[i] === 'r' ? '-'.repeat(w[i] - 1) + ':' : align[i] === 'l' ? ':' + '-'.repeat(w[i] - 1) : '-'.repeat(w[i]));
  return rows
    .map((r, ri) => '| ' + Array.from({ length: cols }, (_, i) => (ri === sepAt ? sep(i) : cell(r[i] || '', i))).join(' | ') + ' |')
    .join('\n');
}

function slug(s) {
  return s.toLowerCase().replace(/[`*_~[\]()]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
}

function toc(text, min = 1, max = 3) {
  const out = [];
  const seen = {};
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    if (level < min || level > max) continue;
    let id = slug(m[2]);
    if (seen[id] !== undefined) id += '-' + ++seen[id];
    else seen[id] = 0;
    out.push('  '.repeat(level - min) + '- [' + m[2].replace(/\[|\]/g, '') + '](#' + id + ')');
  }
  return out.join('\n');
}

function toggleTask(line) {
  if (/^(\s*[-*+]\s+)\[ \]/.test(line)) return line.replace(/\[ \]/, '[x]');
  if (/^(\s*[-*+]\s+)\[[xX]\]/.test(line)) return line.replace(/\[[xX]\]/, '[ ]');
  if (/^(\s*)([-*+])\s+/.test(line)) return line.replace(/^(\s*[-*+]\s+)/, '$1[ ] ');
  return line.replace(/^(\s*)/, '$1- [ ] ');
}

function shiftHeading(line, d) {
  const m = /^(#{1,6})(\s+.*)$/.exec(line);
  if (!m) return d > 0 ? '## ' + line : line;
  const n = Math.max(1, Math.min(6, m[1].length + d));
  return '#'.repeat(n) + m[2];
}

function sortList(text, desc) {
  const lines = text.split('\n');
  const sorted = lines.slice().sort((a, b) => a.replace(/^\s*[-*+\d.]+\s*(\[[ xX]\]\s*)?/, '').localeCompare(b.replace(/^\s*[-*+\d.]+\s*(\[[ xX]\]\s*)?/, '')));
  return (desc ? sorted.reverse() : sorted).join('\n');
}

exports._test = { formatTable, toc, toggleTask, shiftHeading, sortList, slug };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  /** The block of lines around the cursor that look like a table. */
  async function tableAtCursor(doc) {
    const line = doc.selection.start.line;
    const isRow = (t) => /^\s*\|.*\|\s*$/.test(t) || /^\s*[^|]+\|[^|]+/.test(t);
    let a = line, b = line;
    while (a > 0 && isRow(await ferrum.editor.getLine(a - 1))) a--;
    while (b < doc.lineCount - 1 && isRow(await ferrum.editor.getLine(b + 1))) b++;
    const last = await ferrum.editor.getLine(b);
    return { range: { start: { line: a, col: 0 }, end: { line: b, col: last.length } }, text: await ferrum.editor.getText({ start: { line: a, col: 0 }, end: { line: b, col: last.length } }) };
  }

  reg('markdownTools.formatTable', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a Markdown file first.', 'warn');
    try {
      if (doc.selectedText) await ferrum.editor.insert(formatTable(doc.selectedText));
      else {
        const t = await tableAtCursor(doc);
        await ferrum.editor.replace(t.range, formatTable(t.text));
      }
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });

  reg('markdownTools.insertToc', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a Markdown file first.', 'warn');
    const max = Number(ferrum.settings.get('markdownTools.tocDepth')) || 3;
    const t = toc(doc.text, 1, max);
    if (!t) return ferrum.window.showMessage('This file has no headings yet.', 'warn');
    await ferrum.editor.insert(t + '\n');
  });

  reg('markdownTools.toggleTask', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    const line = doc.selection.start.line;
    const text = await ferrum.editor.getLine(line);
    await ferrum.editor.replace({ start: { line, col: 0 }, end: { line, col: text.length } }, toggleTask(text));
  });

  const shift = (d) => async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    const a = doc.selection.start.line;
    const b = doc.selection.end.line;
    const edits = [];
    for (let l = a; l <= b; l++) {
      const text = await ferrum.editor.getLine(l);
      const next = shiftHeading(text, d);
      if (next !== text) edits.push({ range: { start: { line: l, col: 0 }, end: { line: l, col: text.length } }, text: next });
    }
    if (edits.length) await ferrum.editor.edit(edits);
  };
  reg('markdownTools.promoteHeading', shift(-1));
  reg('markdownTools.demoteHeading', shift(1));

  reg('markdownTools.sortList', async () => {
    const doc = await ferrum.editor.active();
    if (!doc || !doc.selectedText) return ferrum.window.showMessage('Select the list lines first.', 'warn');
    await ferrum.editor.insert(sortList(doc.selectedText, false));
  });

  reg('markdownTools.wrapLink', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    const sel = doc.selectedText;
    const url = await ferrum.window.showInputBox({ prompt: 'Link address', value: 'https://' });
    if (!url) return;
    await ferrum.editor.insert('[' + (sel || 'link') + '](' + url + ')');
  });

  reg('markdownTools.insertTable', async () => {
    const cols = Number(await ferrum.window.showInputBox({ prompt: 'How many columns?', value: '3' }));
    const rows = Number(await ferrum.window.showInputBox({ prompt: 'How many rows?', value: '2' }));
    if (!(cols > 0 && cols <= 20 && rows > 0 && rows <= 100)) return;
    const head = Array.from({ length: cols }, (_, i) => 'Column ' + (i + 1));
    const body = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
    const raw = ['| ' + head.join(' | ') + ' |', '| ' + head.map(() => '---').join(' | ') + ' |', ...body.map((r) => '| ' + r.join(' | ') + ' |')].join('\n');
    await ferrum.editor.insert(formatTable(raw));
  });
};

exports.deactivate = function () {};
