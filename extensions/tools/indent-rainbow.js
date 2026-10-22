// Indent Rainbow: tints each level of indentation in a different soft color, so deep nesting is easy to follow.

const COLORS = ['rgba(255, 200, 50, 0.10)', 'rgba(127, 255, 127, 0.10)', 'rgba(79, 200, 255, 0.10)', 'rgba(220, 120, 255, 0.10)'];
const ERROR = 'rgba(229, 83, 75, 0.35)';

/** Ranges per color index (0 to 3) and the lines whose indent does not fit the size (a mix of tabs and spaces, or an odd count). */
function levels(text, size, maxLines) {
  const per = COLORS.map(() => []);
  const odd = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length && i < maxLines; i++) {
    const line = lines[i];
    const m = /^[ \t]+/.exec(line);
    if (!m || m[0].length === line.length) continue;
    const ws = m[0];
    if (ws.includes('\t')) {
      for (let k = 0; k < ws.length; k++) per[k % COLORS.length].push({ line: i, s: k, e: k + 1 });
      if (ws.includes(' ') && /\t +|^ +\t/.test(ws)) odd.push({ line: i, s: 0, e: ws.length });
      continue;
    }
    const levelsHere = Math.floor(ws.length / size);
    for (let k = 0; k < levelsHere; k++) per[k % COLORS.length].push({ line: i, s: k * size, e: (k + 1) * size });
    if (ws.length % size !== 0) odd.push({ line: i, s: levelsHere * size, e: ws.length });
  }
  return { per, odd };
}

exports._test = { levels };

exports.activate = function (context) {
  const types = COLORS.map((c) => ferrum.editor.createDecorationType({ backgroundColor: c }));
  const bad = ferrum.editor.createDecorationType({ backgroundColor: ERROR });
  types.forEach((t) => context.subscriptions.push(t));
  context.subscriptions.push(bad);
  let timer = null;

  async function paint() {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    if (ferrum.settings.get('indentRainbow.enabled') === false) {
      for (const t of types) await ferrum.editor.setDecorations(t, []);
      return ferrum.editor.setDecorations(bad, []);
    }
    const size = Math.max(1, Number(ferrum.settings.get('indentRainbow.indentSize')) || 4);
    const r = levels(doc.text, size, 6000);
    const toRange = (x) => ({ start: { line: x.line, col: x.s }, end: { line: x.line, col: x.e } });
    for (let i = 0; i < types.length; i++) await ferrum.editor.setDecorations(types[i], r.per[i].map(toRange));
    await ferrum.editor.setDecorations(bad, ferrum.settings.get('indentRainbow.markIrregular') === false ? [] : r.odd.map((x) => ({ ...toRange(x), hoverMessage: 'The indentation does not match ' + size + ' spaces per level.' })));
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 100);
  };
  context.subscriptions.push(ferrum.events.on('activeChanged', later), ferrum.events.on('open', later), ferrum.events.on('change', later), ferrum.events.on('settingsChanged', later), { dispose: () => clearTimeout(timer) });
  later();
};

exports.deactivate = function () {};
