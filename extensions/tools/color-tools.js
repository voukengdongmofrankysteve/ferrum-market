// Color Tools: convert, lighten, darken and generate colors in your code.

function parseColor(s) {
  s = s.trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6 || h.length === 8) {
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
    }
    return null;
  }
  m = /^rgba?\(\s*(\d+(?:\.\d+)?%?)[\s,]+(\d+(?:\.\d+)?%?)[\s,]+(\d+(?:\.\d+)?%?)(?:\s*[,/]\s*(\d*\.?\d+%?))?\s*\)$/i.exec(s);
  if (m) {
    const ch = (v) => (v.endsWith('%') ? Math.round((parseFloat(v) / 100) * 255) : Math.round(parseFloat(v)));
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: ch(m[1]), g: ch(m[2]), b: ch(m[3]), a };
  }
  m = /^hsla?\(\s*(-?\d+(?:\.\d+)?)(?:deg)?[\s,]+(\d+(?:\.\d+)?)%[\s,]+(\d+(?:\.\d+)?)%(?:\s*[,/]\s*(\d*\.?\d+%?))?\s*\)$/i.exec(s);
  if (m) {
    const [r, g, b] = hslToRgb(((parseFloat(m[1]) % 360) + 360) % 360, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r, g, b, a };
  }
  return NAMED[s.toLowerCase()] ? parseColor(NAMED[s.toLowerCase()]) : null;
}

const NAMED = { red: '#ff0000', green: '#008000', blue: '#0000ff', black: '#000000', white: '#ffffff', yellow: '#ffff00', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', gray: '#808080', grey: '#808080', cyan: '#00ffff', magenta: '#ff00ff', teal: '#008080', navy: '#000080', lime: '#00ff00', maroon: '#800000', olive: '#808000', silver: '#c0c0c0', brown: '#a52a2a', gold: '#ffd700', coral: '#ff7f50', salmon: '#fa8072', indigo: '#4b0082', violet: '#ee82ee', turquoise: '#40e0d0', tomato: '#ff6347', crimson: '#dc143c', transparent: '#00000000' };

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const fmt = {
  hex: (c) => '#' + hex2(c.r) + hex2(c.g) + hex2(c.b) + (c.a < 1 ? hex2(c.a * 255) : ''),
  rgb: (c) => (c.a < 1 ? 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + +c.a.toFixed(3) + ')' : 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'),
  hsl: (c) => {
    const h = rgbToHsl(c.r, c.g, c.b);
    return c.a < 1 ? 'hsla(' + h.h + ', ' + h.s + '%, ' + h.l + '%, ' + +c.a.toFixed(3) + ')' : 'hsl(' + h.h + ', ' + h.s + '%, ' + h.l + '%)';
  },
};

function shift(c, delta) {
  const h = rgbToHsl(c.r, c.g, c.b);
  const [r, g, b] = hslToRgb(h.h, h.s / 100, Math.max(0, Math.min(1, (h.l + delta) / 100)));
  return { r, g, b, a: c.a };
}

function luminance(c) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

exports._test = { parseColor, fmt, shift, contrast, rgbToHsl, hslToRgb, COLOR_RE };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  async function convertSelection(f) {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
    // With a selection, convert the colors in it; otherwise convert the colors on the cursor's line.
    const line = doc.selection.start.line;
    const source = doc.selectedText ? doc.selectedText : await ferrum.editor.getLine(line);
    const range = doc.selectedText ? null : { start: { line, col: 0 }, end: { line, col: source.length } };
    let count = 0;
    const next = source.replace(COLOR_RE, (m) => {
      const c = parseColor(m);
      if (!c) return m;
      count++;
      return f(c);
    });
    // Bare names and hex without a hash typed on their own.
    if (!count) {
      const c = parseColor(source.trim());
      if (c) return replace(doc, range, f(c));
      return ferrum.window.showMessage('No color found. Select a color like #ff8800 or rgb(255, 136, 0).', 'warn');
    }
    await replace(doc, range, next);
  }
  async function replace(doc, range, text) {
    if (range) await ferrum.editor.replace(range, text);
    else await ferrum.editor.insert(text);
  }

  reg('colorTools.toHex', () => convertSelection(fmt.hex));
  reg('colorTools.toRgb', () => convertSelection(fmt.rgb));
  reg('colorTools.toHsl', () => convertSelection(fmt.hsl));
  reg('colorTools.lighten', () => convertSelection((c) => fmt.hex(shift(c, Number(ferrum.settings.get('colorTools.step')) || 10))));
  reg('colorTools.darken', () => convertSelection((c) => fmt.hex(shift(c, -(Number(ferrum.settings.get('colorTools.step')) || 10)))));
  reg('colorTools.random', async () => {
    const c = { r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256), a: 1 };
    await ferrum.editor.insert(fmt.hex(c));
  });
  reg('colorTools.contrast', async () => {
    const a = await ferrum.window.showInputBox({ prompt: 'Text color (hex, rgb, hsl or a name)', value: '#ffffff' });
    if (!a) return;
    const b = await ferrum.window.showInputBox({ prompt: 'Background color', value: '#000000' });
    if (!b) return;
    const ca = parseColor(a), cb = parseColor(b);
    if (!ca || !cb) return ferrum.window.showMessage('Could not read one of the colors.', 'error');
    const r = contrast(ca, cb);
    const grade = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA for large text only' : 'fails WCAG';
    ferrum.window.showMessage('Contrast ratio ' + r.toFixed(2) + ':1 (' + grade + ').');
  });
  reg('colorTools.palette', async () => {
    const base = await ferrum.window.showInputBox({ prompt: 'Base color', value: '#3b82f6' });
    const c = base && parseColor(base);
    if (!c) return base ? ferrum.window.showMessage('Could not read that color.', 'error') : undefined;
    const steps = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
    await ferrum.editor.insert(steps.map((s, i) => '--shade-' + (i + 1) + ': ' + fmt.hex(shift(c, s)) + ';').join('\n'));
  });
};

exports.deactivate = function () {};
