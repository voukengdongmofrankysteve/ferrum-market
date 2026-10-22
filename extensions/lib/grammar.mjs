// Builds a Ferrum grammar from a short description of a language.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&');
const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const alt = (s) => words(s).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

export function buildGrammar(l) {
  const rules = [];
  for (const r of l.extra ?? []) rules.push(r);
  for (const b of l.block ? (Array.isArray(l.block[0]) ? l.block : [l.block]) : []) rules.push({ begin: esc(b[0]), end: esc(b[1]), token: 'comment' });
  for (const c of words(l.line ?? '')) rules.push({ match: esc(c) + '.*$', token: 'comment' });
  const str = l.str ?? 'ds';
  if (l.triple) for (const q of l.triple.split(' ')) rules.push({ begin: esc(q), end: esc(q), token: 'string' });
  if (str.includes('d')) rules.push({ match: '"(?:[^"\\\\]|\\\\.)*"', token: 'string' });
  if (str.includes('s')) rules.push({ match: "'(?:[^'\\\\]|\\\\.)*'", token: 'string' });
  if (str.includes('b')) rules.push({ match: '`(?:[^`\\\\]|\\\\.)*`', token: 'string' });
  for (const r of l.mid ?? []) rules.push(r);
  if (l.num !== false) rules.push({ match: '\\b(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][+-]?\\d+)?)[uUlLfFdDnNiI]{0,3}\\b', token: 'number' });
  if (l.kw) rules.push({ match: '\\b(?:' + alt(l.kw) + ')\\b', token: 'keyword' });
  if (l.const) rules.push({ match: '\\b(?:' + alt(l.const) + ')\\b', token: 'constant' });
  if (l.ty) rules.push({ match: '\\b(?:' + alt(l.ty) + ')\\b', token: 'type' });
  if (l.fn) rules.push({ match: '\\b(?:' + alt(l.fn) + ')\\b', token: 'function' });
  for (const r of l.post ?? []) rules.push(r);
  if (l.caps !== false) rules.push({ match: '\\b[A-Z][A-Za-z0-9_]*\\b', token: 'type' });
  if (l.calls !== false) rules.push({ match: '\\b[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\()', token: 'function' });
  if (rules.length > 200) throw new Error('too many rules in ' + l.id);
  return { ignoreCase: !!l.ignoreCase, rules };
}

/** One snippet: name, prefix, description, then the lines of the body. */
export const S = (name, prefix, desc, ...body) => [name, { prefix, body, description: desc }];
export const snippets = (...list) => Object.fromEntries(list);
