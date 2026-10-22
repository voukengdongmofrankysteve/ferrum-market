// Long Lines: marks the part of a line that goes past your limit, and tells you how long the line is.

function find(text, max, notes) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length && out.length < 4000; i++) {
    const len = [...lines[i].replace(/\t/g, '    ')].length;
    if (len <= max) continue;
    // The column in the real text where the limit falls (tabs count as 4 columns, like the length above).
    let col = 0;
    let v = 0;
    const line = lines[i];
    while (col < line.length && v < max) {
      v += line[col] === '\t' ? 4 : 1;
      col++;
    }
    out.push({ line: i, col, end: line.length, len, note: notes ? len + ' characters (limit ' + max + ')' : undefined });
  }
  return out;
}

exports._test = { find };

exports.activate = function (context) {
  const type = ferrum.editor.createDecorationType({ backgroundColor: 'rgba(245, 158, 11, 0.28)', textDecoration: 'underline wavy' });
  context.subscriptions.push(type);
  let timer = null;

  async function paint() {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    if (ferrum.settings.get('longLines.enabled') === false) return ferrum.editor.setDecorations(type, []);
    const max = Math.max(20, Number(ferrum.settings.get('longLines.maxColumns')) || 100);
    const notes = ferrum.settings.get('longLines.showLength') !== false;
    const ranges = find(doc.text, max, notes).map((h) => ({
      start: { line: h.line, col: h.col },
      end: { line: h.line, col: h.end },
      hoverMessage: h.len + ' characters, ' + (h.len - max) + ' over the limit of ' + max,
      after: h.note ? { contentText: h.note, color: '#f59e0b', fontStyle: 'italic' } : undefined,
    }));
    await ferrum.editor.setDecorations(type, ranges);
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 120);
  };
  context.subscriptions.push(ferrum.events.on('activeChanged', later), ferrum.events.on('open', later), ferrum.events.on('change', later), ferrum.events.on('settingsChanged', later), { dispose: () => clearTimeout(timer) });
  later();
};

exports.deactivate = function () {};
