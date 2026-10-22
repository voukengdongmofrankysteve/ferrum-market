// Color Swatches: paints every color in your code (hex, rgb, hsl) with that color as its background, using decorations.

const COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\brgba?\(\s*[0-9.%]+(?:\s*,\s*|\s+)[0-9.%]+(?:\s*,\s*|\s+)[0-9.%]+(?:\s*[,/]\s*[0-9.%]+)?\s*\)|\bhsla?\(\s*-?[0-9.]+(?:deg)?(?:\s*,\s*|\s+)[0-9.]+%(?:\s*,\s*|\s+)[0-9.]+%(?:\s*[,/]\s*[0-9.%]+)?\s*\)/g;

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/** The color as { r, g, b, a } or null when the text is not a real color. */
function parse(s) {
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = /^rgba?\(\s*([0-9.%]+)(?:\s*,\s*|\s+)([0-9.%]+)(?:\s*,\s*|\s+)([0-9.%]+)(?:\s*[,/]\s*([0-9.%]+))?\s*\)$/i.exec(s);
  if (m) {
    const ch = (v) => Math.max(0, Math.min(255, v.endsWith('%') ? Math.round((parseFloat(v) / 100) * 255) : Math.round(parseFloat(v))));
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    const out = { r: ch(m[1]), g: ch(m[2]), b: ch(m[3]), a: Math.max(0, Math.min(1, a)) };
    return [out.r, out.g, out.b, out.a].some((v) => Number.isNaN(v)) ? null : out;
  }
  m = /^hsla?\(\s*(-?[0-9.]+)(?:deg)?(?:\s*,\s*|\s+)([0-9.]+)%(?:\s*,\s*|\s+)([0-9.]+)%(?:\s*[,/]\s*([0-9.%]+))?\s*\)$/i.exec(s);
  if (m) {
    const [r, g, b] = hslToRgb(((parseFloat(m[1]) % 360) + 360) % 360, Math.min(1, parseFloat(m[2]) / 100), Math.min(1, parseFloat(m[3]) / 100));
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r, g, b, a: Math.max(0, Math.min(1, a)) };
  }
  return null;
}

const css = (c) => (c.a < 1 ? 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + +c.a.toFixed(3) + ')' : 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')');
/** Black or white text, whichever is easier to read on the color (the alpha is blended with a mid grey page). */
function readable(c) {
  const mix = (v) => v * c.a + 128 * (1 - c.a);
  const lum = 0.2126 * mix(c.r) + 0.7152 * mix(c.g) + 0.0722 * mix(c.b);
  return lum > 150 ? '#000000' : '#ffffff';
}

/** Every color in the text as decoration ranges. */
function find(text, max) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length && out.length < max; i++) {
    const line = lines[i];
    if (line.length > 2000 || (line.indexOf('#') < 0 && line.indexOf('rgb') < 0 && line.indexOf('hsl') < 0)) continue;
    for (const m of line.matchAll(COLOR_RE)) {
      const c = parse(m[0]);
      if (!c) continue;
      out.push({ start: { line: i, col: m.index }, end: { line: i, col: m.index + m[0].length }, hoverMessage: css(c), style: { backgroundColor: css(c), color: readable(c), borderRadius: 3 } });
      if (out.length >= max) break;
    }
  }
  return out;
}

exports._test = { parse, find, readable, css };

exports.activate = function (context) {
  const type = ferrum.editor.createDecorationType({ borderRadius: 3 });
  context.subscriptions.push(type);
  let timer = null;

  async function paint() {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    if (ferrum.settings.get('colorSwatches.enabled') === false) return ferrum.editor.setDecorations(type, []);
    const max = Number(ferrum.settings.get('colorSwatches.maxPerFile')) || 3000;
    await ferrum.editor.setDecorations(type, find(doc.text, max));
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 60);
  };
  context.subscriptions.push(
    ferrum.events.on('activeChanged', later),
    ferrum.events.on('open', later),
    ferrum.events.on('change', later),
    ferrum.events.on('settingsChanged', later),
    ferrum.commands.register('colorSwatches.toggle', async () => {
      const now = ferrum.settings.get('colorSwatches.enabled') !== false;
      ferrum.window.showMessage('Color swatches are turned ' + (now ? 'off' : 'on') + ' in the extension settings (Color Swatches: Enabled).');
    }),
    { dispose: () => clearTimeout(timer) },
  );
  later();
};

exports.deactivate = function () {};
