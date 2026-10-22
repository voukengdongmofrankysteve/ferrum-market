// Builds every official extension into a .fext package.
//   node build.mjs [outDir]        default: ./dist
// Also writes dist/catalog.json (what was built) and checks every grammar, manifest and file.
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icon } from './lib/png.mjs';
import { buildGrammar } from './lib/grammar.mjs';
import { LANGS1 } from './languages1.mjs';
import { LANGS2 } from './languages2.mjs';
import { SNIPPET_PACKS } from './snippetpacks.mjs';
import { THEMES, ICON_THEMES, themeJson, iconThemeJson } from './themes.mjs';
import { TOOLS } from './tools.mjs';

process.env.FERRUM_EXT_NO_MAIN = '1';
const { checkManifest } = await import('../ferrum-market/public/downloads/ferrum-ext.mjs');

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(here, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const VERSION = '1.0.0';
const PUBLISHER = 'vyloxi';
const REPO = 'https://github.com/voukengdongmofrankysteve/ferrum-market';
const text = (s) => ({ encoding: 'utf8', content: s });
const json = (o) => text(JSON.stringify(o, null, 2) + '\n');
const words = (s) => (s ?? '').trim().split(/\s+/).filter(Boolean);
const catalog = [];
const names = new Set();
let problems = 0;

function finish(manifest, files, kind) {
  if (names.has(manifest.name)) throw new Error('Duplicate extension name: ' + manifest.name);
  names.add(manifest.name);
  const buffers = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, Buffer.from(f.content, f.encoding === 'base64' ? 'base64' : 'utf8')]));
  const issues = checkManifest(manifest, buffers);
  if (issues.length) {
    problems += issues.length;
    console.error('PROBLEMS in ' + manifest.name + ':', issues);
    return;
  }
  const bundle = { format: 1, manifest, files };
  const raw = JSON.stringify(bundle);
  if (raw.length > 1.4 * 1024 * 1024) throw new Error(manifest.name + ' is too large');
  writeFileSync(join(out, `${PUBLISHER}.${manifest.name}-${manifest.version}.fext`), raw);
  catalog.push({ id: `${PUBLISHER}.${manifest.name}`, name: manifest.displayName, kind, version: manifest.version, bytes: raw.length });
}

const base = (id, displayName, description, category, extra) => ({
  name: id, publisher: PUBLISHER, version: VERSION, displayName, description, engines: { ferrum: '^0.1.0' }, categories: [category], icon: 'icon.png', repository: REPO, license: 'MIT', ...extra,
});

// ---- language packs ----------------------------------------------------------------------------------------------
const langs = [...LANGS1, ...LANGS2];
for (const l of langs) {
  const grammar = buildGrammar(l);
  for (const r of grammar.rules) {
    for (const k of ['match', 'begin', 'end']) if (r[k]) new RegExp(r[k], grammar.ignoreCase ? 'i' : '');
  }
  const exts = words(l.ext).map((e) => (e.startsWith('.') ? e : '.' + e));
  const lang = { id: l.id, name: l.name, extensions: exts, grammar: `grammars/${l.id}.json` };
  if (l.files) lang.filenames = words(l.files);
  const lineComment = words(l.line)[0];
  if (lineComment) lang.lineComment = lineComment;
  if (l.block) {
    const b = Array.isArray(l.block[0]) ? l.block[0] : l.block;
    lang.blockComment = [b[0], b[1]];
  }
  const files = {
    'icon.png': { encoding: 'base64', content: icon(l.icon, l.id).toString('base64') },
    ['grammars/' + l.id + '.json']: json(grammar),
  };
  const hasSnips = l.snippets && Object.keys(l.snippets).length;
  const contributes = { languages: [lang] };
  if (hasSnips) {
    files['snippets/' + l.id + '.json'] = json(l.snippets);
    contributes.snippets = [{ language: l.name, path: `snippets/${l.id}.json` }];
  }
  const snipTable = hasSnips ? '\n## Snippets\n\nType the prefix and press Tab.\n\n| Prefix | What it inserts |\n| --- | --- |\n' + Object.values(l.snippets).map((s) => `| \`${[].concat(s.prefix)[0]}\` | ${s.description} |`).join('\n') + '\n' : '';
  files['README.md'] = text(`# ${l.name}\n\nSyntax coloring, comment toggling${hasSnips ? ' and snippets' : ''} for ${l.name}.\n\n## Files\n\n${[...exts.map((e) => '`' + e + '`'), ...words(l.files).map((f) => '`' + f + '`')].join(', ')}\n\n## Features\n\n- Colors keywords, types, strings, numbers, comments and more. The colors follow your theme.\n${lineComment ? `- **Toggle Line Comment** (Ctrl+/) uses \`${lineComment}\`.\n` : ''}${hasSnips ? `- ${Object.keys(l.snippets).length} snippets.\n` : ''}${snipTable}\nThis extension runs no code and asks for no permissions. It is built with the [language contribution](https://ferrum.vyloxi.com/docs/languages) format.\n`);
  const desc = `Syntax coloring${lineComment ? ', comment toggling' : ''}${hasSnips ? ' and snippets' : ''} for ${l.name} (${exts.slice(0, 4).join(' ')}).`;
  finish(base(l.id, l.name, desc, 'Languages', { contributes }), files, 'language');
}

// ---- snippet packs -----------------------------------------------------------------------------------------------
for (const p of SNIPPET_PACKS) {
  const files = { 'icon.png': { encoding: 'base64', content: icon(p.icon, p.id).toString('base64') } };
  const snips = [];
  let total = 0;
  const table = [];
  for (const g of p.groups) {
    const slug = g.language.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    files[`snippets/${slug}.json`] = json(g.snippets);
    snips.push({ language: g.language, path: `snippets/${slug}.json` });
    total += Object.keys(g.snippets).length;
    for (const s of Object.values(g.snippets)) table.push(`| ${g.language} | \`${[].concat(s.prefix)[0]}\` | ${s.description} |`);
  }
  files['README.md'] = text(`# ${p.name}\n\n${p.desc}\n\nType a prefix and press Tab. ${total} snippet${total === 1 ? '' : 's'}.\n\n| Language | Prefix | What it inserts |\n| --- | --- | --- |\n${table.join('\n')}\n\nThis extension runs no code and asks for no permissions.\n`);
  finish(base(p.id, p.name, p.desc, 'Snippets', { contributes: { snippets: snips } }), files, 'snippets');
}

// ---- themes -------------------------------------------------------------------------------------------------------
for (const t of THEMES) {
  const files = {
    'icon.png': { encoding: 'base64', content: icon(t.icon, t.id).toString('base64') },
    [`themes/${t.id}.json`]: json(themeJson(t)),
    'README.md': text(`# ${t.name}\n\n${t.desc}\n\nInstall it, then pick **${t.name}** in **Settings > Colour theme**. It is a ${t.mode} theme.\n\n${t.credit}\n\n| Role | Color |\n| --- | --- |\n| Background | \`${t.c.bg}\` |\n| Text | \`${t.c.fg}\` |\n| Accent | \`${t.c.accent}\` |\n| Keywords | \`${t.c.keyword}\` |\n| Strings | \`${t.c.string}\` |\n| Functions | \`${t.c.fn}\` |\n| Types | \`${t.c.type}\` |\n| Comments | \`${t.c.comment}\` |\n\nThis extension is only a theme: it runs no code and asks for no permissions.\n`),
  };
  finish(base(t.id, t.name, t.desc, 'Themes', { contributes: { themes: [{ label: t.name, path: `themes/${t.id}.json`, uiTheme: t.mode }] } }), files, 'theme');
}
for (const t of ICON_THEMES) {
  const files = {
    'icon.png': { encoding: 'base64', content: icon(t.icon, t.id).toString('base64') },
    [`icons/${t.id}.json`]: json(iconThemeJson(t)),
    'README.md': text(`# ${t.name}\n\n${t.desc}\n\nInstall it, then choose **${t.name}** in **Settings > File icon theme**.\n\nIt covers about 40 kinds of files and a set of well known folders such as \`src\`, \`docs\` and \`tests\`. It runs no code and asks for no permissions.\n`),
  };
  finish(base(t.id, t.name, t.desc, 'Themes', { contributes: { iconThemes: [{ id: t.id, label: t.name, path: `icons/${t.id}.json` }] } }), files, 'icon-theme');
}

// ---- tool extensions ----------------------------------------------------------------------------------------------
for (const t of TOOLS) {
  const code = readFileSync(join(here, 'tools', t.id + '.js'), 'utf8');
  const props = {};
  for (const [k, v] of Object.entries(t.config ?? {})) props[k] = v;
  const hidden = (t.hidden ?? []).map((id) => ({ command: id, title: t.name + ' (internal)', category: t.name, hidden: true }));
  const contributes = { commands: [...t.commands.map((c) => ({ command: c.id, title: c.title, category: t.name })), ...hidden] };
  if (t.views) {
    contributes.viewsContainers = t.views.boxes;
    contributes.views = t.views.list;
  }
  if (t.keys?.length) contributes.keybindings = t.keys.map(([command, key]) => ({ command, key }));
  if (Object.keys(props).length) contributes.configuration = { title: t.name, properties: props };
  const files = {
    'icon.png': { encoding: 'base64', content: icon(t.icon, t.id).toString('base64') },
    'extension.js': text(code),
    'README.md': text(t.readme),
  };
  const manifest = base(t.id, t.name, t.desc, t.category, {
    version: t.version ?? VERSION,
    engines: { ferrum: t.api ?? '^0.1.0' },
    main: 'extension.js',
    activationEvents: t.startup ? ['onStartup'] : [...(t.views?.list ?? []).map((v) => 'onView:' + v.id), ...t.commands.map((c) => 'onCommand:' + c.id), ...(t.hidden ?? []).map((id) => 'onCommand:' + id)],
    permissions: t.perms,
    contributes,
  });
  finish(manifest, files, 'tool');
}

writeFileSync(join(out, 'catalog.json'), JSON.stringify(catalog, null, 2));
const by = (k) => catalog.filter((c) => c.kind === k).length;
console.log(`Built ${catalog.length} extensions: ${by('language')} languages, ${by('snippets')} snippet packs, ${by('theme')} themes, ${by('icon-theme')} icon themes, ${by('tool')} tools. ${problems} problems.`);
if (problems) process.exit(1);
