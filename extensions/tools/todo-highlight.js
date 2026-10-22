// TODO Highlight: makes TODO, FIXME, HACK, BUG, NOTE and other tags in your comments stand out, with decorations.

const DEFAULT_TAGS = { TODO: '#3b82f6', FIXME: '#ef4444', BUG: '#ef4444', HACK: '#f59e0b', XXX: '#f59e0b', NOTE: '#10b981', REVIEW: '#8b5cf6', OPTIMIZE: '#14b8a6' };

function tagTable() {
  const custom = String(ferrum.settings.get('todoHighlight.tags') || '').split(/[,\s]+/).filter(Boolean);
  if (!custom.length) return DEFAULT_TAGS;
  const out = {};
  custom.slice(0, 20).forEach((t, i) => (out[t.toUpperCase()] = DEFAULT_TAGS[t.toUpperCase()] || ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'][i % 5]));
  return out;
}

/** Where tags sit in comment text: [{ line, col, tag, len }]. Same rules as the TODO Tree extension. */
function scan(text, tags) {
  const names = Object.keys(tags);
  if (!names.length) return [];
  const re = new RegExp('(?:^|[^A-Za-z0-9_])(' + names.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'g');
  const found = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length && found.length < 5000; i++) {
    const line = lines[i];
    if (line.length > 1500) continue;
    const c = /(?:\/\/|#|--|;|%|\/\*|<!--|^\s*\*)/.exec(line);
    if (!c) continue;
    re.lastIndex = c.index;
    const m = re.exec(line);
    if (!m) continue;
    const tag = m[1];
    const col = m.index + m[0].length - tag.length;
    found.push({ line: i, col, tag, len: tag.length, rest: line.length });
  }
  return found;
}

exports._test = { scan, DEFAULT_TAGS };

exports.activate = function (context) {
  let types = new Map();
  let timer = null;

  function build() {
    for (const t of types.values()) t.dispose();
    types = new Map();
    const tags = tagTable();
    for (const [tag, color] of Object.entries(tags)) {
      const t = ferrum.editor.createDecorationType({ backgroundColor: color, color: '#ffffff', fontWeight: 'bold', borderRadius: 3 });
      types.set(tag, t);
    }
  }

  async function paint() {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    if (ferrum.settings.get('todoHighlight.enabled') === false) {
      for (const t of types.values()) await ferrum.editor.setDecorations(t, []);
      return;
    }
    const tags = tagTable();
    const hits = scan(doc.text, tags);
    const by = new Map([...types.keys()].map((k) => [k, []]));
    for (const h of hits) by.get(h.tag)?.push({ start: { line: h.line, col: h.col }, end: { line: h.line, col: h.col + h.len }, hoverMessage: h.tag });
    for (const [tag, t] of types) await ferrum.editor.setDecorations(t, by.get(tag) || []);
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 60);
  };

  build();
  context.subscriptions.push(
    ferrum.events.on('activeChanged', later),
    ferrum.events.on('open', later),
    ferrum.events.on('change', later),
    ferrum.events.on('settingsChanged', () => { build(); later(); }),
    { dispose: () => { clearTimeout(timer); for (const t of types.values()) t.dispose(); } },
  );
  later();
};

exports.deactivate = function () {};
