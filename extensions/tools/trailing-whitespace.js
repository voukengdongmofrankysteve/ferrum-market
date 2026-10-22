// Trailing Whitespace: shows spaces and tabs at the end of lines in red, and removes them with one command.

/** [{ line, col, len }] for each line that ends with spaces or tabs (blank lines of only indentation are skipped when asked). */
function find(text, skipBlank) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length && out.length < 8000; i++) {
    const m = /[ \t]+$/.exec(lines[i]);
    if (!m) continue;
    if (skipBlank && m.index === 0) continue;
    out.push({ line: i, col: m.index, len: m[0].length });
  }
  return out;
}

exports._test = { find };

exports.activate = function (context) {
  const type = ferrum.editor.createDecorationType({ backgroundColor: 'rgba(229, 83, 75, 0.55)', borderRadius: 2 });
  context.subscriptions.push(type);
  let timer = null;

  async function paint() {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    if (ferrum.settings.get('trailingWhitespace.enabled') === false) return ferrum.editor.setDecorations(type, []);
    // The line being typed on is left alone, so the space after a word does not flash.
    const cursor = doc.selection.start.line;
    const skipBlank = ferrum.settings.get('trailingWhitespace.ignoreBlankLines') === true;
    const ranges = find(doc.text, skipBlank)
      .filter((h) => h.line !== cursor)
      .map((h) => ({ start: { line: h.line, col: h.col }, end: { line: h.line, col: h.col + h.len }, hoverMessage: 'Trailing whitespace' }));
    await ferrum.editor.setDecorations(type, ranges);
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 120);
  };

  context.subscriptions.push(
    ferrum.events.on('activeChanged', later),
    ferrum.events.on('open', later),
    ferrum.events.on('change', later),
    ferrum.events.on('selectionChanged', later),
    ferrum.events.on('settingsChanged', later),
    ferrum.commands.register('trailingWhitespace.trim', async () => {
      const doc = await ferrum.editor.active();
      if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
      const hits = find(doc.text, false);
      if (!hits.length) return ferrum.window.showMessage('There is no trailing whitespace.');
      await ferrum.editor.edit(hits.map((h) => ({ range: { start: { line: h.line, col: h.col }, end: { line: h.line, col: h.col + h.len } }, text: '' })));
      ferrum.window.showMessage('Removed trailing whitespace from ' + hits.length + ' line' + (hits.length === 1 ? '' : 's') + '.');
    }),
    { dispose: () => clearTimeout(timer) },
  );
  later();
};

exports.deactivate = function () {};
