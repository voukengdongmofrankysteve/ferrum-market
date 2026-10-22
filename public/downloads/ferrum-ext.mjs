#!/usr/bin/env node
// ferrum-ext: create, check, package and publish extensions for the Ferrum editor.
// One file, no dependencies, Node 18 or newer. Docs: https://ferrum.vyloxi.com/docs/cli

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline/promises';

const DEFAULT_SERVER = 'https://ferrum.vyloxi.com';
const CATEGORIES = ['Themes', 'Languages', 'Snippets', 'Formatters', 'Linters', 'Git', 'AI', 'Tools', 'Productivity', 'Other'];
const PERMISSIONS = ['workspace.read', 'workspace.write', 'terminal', 'network', 'clipboard'];
const CONTRIBUTES = ['commands', 'keybindings', 'themes', 'iconThemes', 'languages', 'snippets', 'configuration'];
const ACTIVATION = ['onStartup', 'onCommand', 'onLanguage', 'onFileOpen', 'onSave'];
const MAX_BYTES = 1_500_000;
const MAX_FILES = 200;

const out = (s = '') => process.stdout.write(s + '\n');
const err = (s = '') => process.stderr.write(s + '\n');
const fail = (msg, code = 1) => {
  err(msg);
  process.exit(code);
};

// ---- arguments ----------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) args.flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--') && ['token', 'server', 'out', 'package'].includes(k)) args.flags[k] = argv[++i];
      else args.flags[k] = true;
    } else args._.push(a);
  }
  return args;
}

// ---- the checks (the marketplace runs the same ones) -----------------------------------------------------

const validVersion = (v) => /^\d{1,6}\.\d{1,6}\.\d{1,6}(-[0-9A-Za-z.-]{1,20})?$/.test(v);

export function checkManifest(m, files) {
  const problems = [];
  const bad = (s) => problems.push(s);
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(m.name ?? '')) bad('name must be 2 to 49 characters: lower case letters, digits and dashes.');
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(m.publisher ?? '')) bad('publisher must be 3 to 40 characters: lower case letters, digits and dashes.');
  if (!validVersion(String(m.version ?? ''))) bad('version must look like 1.2.3 (a prerelease like 1.2.3-beta.1 is allowed).');
  const dn = String(m.displayName ?? '').trim();
  if (!dn || dn.length > 80) bad('displayName is required (80 characters at most).');
  const ds = String(m.description ?? '').trim();
  if (!ds || ds.length > 280) bad('description is required (280 characters at most).');
  if (!/^[\^~>=<]*\d+\.\d+\.\d+$/.test(m.engines?.ferrum ?? '')) bad('engines.ferrum is required, for example "^0.1.0".');
  const cat = m.categories?.[0] ?? 'Other';
  if (!CATEGORIES.includes(cat)) bad(`categories[0] must be one of: ${CATEGORIES.join(', ')}.`);
  for (const p of m.permissions ?? []) if (!PERMISSIONS.includes(p)) bad(`Unknown permission "${p}". Allowed: ${PERMISSIONS.join(', ')}.`);
  for (const k of Object.keys(m.contributes ?? {})) if (!CONTRIBUTES.includes(k)) bad(`Unknown contribution point "${k}". Allowed: ${CONTRIBUTES.join(', ')}.`);
  for (const ev of m.activationEvents ?? []) if (typeof ev !== 'string' || !ACTIVATION.includes(ev.split(':')[0])) bad(`Unknown activation event "${ev}". Allowed: ${ACTIVATION.join(', ')}.`);
  if (m.repository && !String(m.repository).startsWith('https://')) bad('repository must be an https address.');
  if (m.main && !files[m.main]) bad(`main points to "${m.main}", which is not in the package.`);
  const c = m.contributes ?? {};
  for (const point of ['themes', 'iconThemes', 'snippets']) for (const e of c[point] ?? []) if (e?.path && !files[e.path]) bad(`contributes.${point} points to "${e.path}", which is not in the package.`);
  for (const l of c.languages ?? []) {
    if (!/^[a-z0-9][a-z0-9-]{0,30}$/.test(l?.id ?? '')) bad('Each contributes.languages entry needs an id of lower case letters, digits and dashes.');
    if (l?.grammar && !files[l.grammar]) bad(`contributes.languages grammar points to "${l.grammar}", which is not in the package.`);
  }
  for (const cmd of c.commands ?? []) if (!/^[A-Za-z0-9._-]{3,80}$/.test(cmd?.command ?? '') || !String(cmd?.title ?? '').trim()) bad('Each contributes.commands entry needs a "command" id and a "title".');
  if (m.icon) {
    const buf = files[m.icon];
    if (!buf || buf.length > 200_000 || buf.subarray(0, 4).toString('latin1') !== '\x89PNG') bad('icon must be a PNG file in the package, 200 KB at most.');
  }
  return problems;
}

// ---- reading the folder ------------------------------------------------------------------------------------

function patternToRegex(p) {
  const esc = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
  return new RegExp('^' + esc.replace(/\/$/, '(/.*)?') + '$');
}

function loadIgnore(dir) {
  const f = join(dir, '.ferrumignore');
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map(patternToRegex);
}

function collect(dir) {
  const ignore = loadIgnore(dir);
  const files = {};
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      if (name.startsWith('.') || name === 'node_modules' || name.endsWith('.fext')) continue;
      const full = join(d, name);
      const rel = relative(dir, full).split(sep).join('/');
      if (ignore.some((re) => re.test(rel) || re.test(rel + '/'))) continue;
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) files[rel] = readFileSync(full);
    }
  };
  walk(dir);
  return files;
}

function readManifest(dir) {
  const f = join(dir, 'ferrum.json');
  if (!existsSync(f)) fail('There is no ferrum.json in ' + dir + '. Run "ferrum-ext init" to create an extension.', 2);
  try {
    return JSON.parse(readFileSync(f, 'utf8'));
  } catch (e) {
    return fail('ferrum.json is not valid JSON: ' + e.message);
  }
}

const isText = (rel) => /\.(json|js|mjs|cjs|md|txt|css|html|svg|ts|toml|yml|yaml)$/i.test(rel);

function build(dir) {
  const manifest = readManifest(dir);
  const files = collect(dir);
  files['ferrum.json'] ??= Buffer.from(JSON.stringify(manifest));
  const problems = checkManifest(manifest, files);
  const names = Object.keys(files);
  if (names.length > MAX_FILES) problems.push(`A package may hold at most ${MAX_FILES} files (this one has ${names.length}).`);
  const total = names.reduce((n, k) => n + files[k].length, 0);
  if (total > MAX_BYTES) problems.push(`The package is ${(total / 1e6).toFixed(2)} MB; the limit is ${(MAX_BYTES / 1e6).toFixed(1)} MB. Bundle and minify code, drop large files.`);
  if (problems.length) {
    err(`Found ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
    for (const p of problems) err('  - ' + p);
    process.exit(1);
  }
  const bundle = { format: 1, manifest, files: {} };
  for (const k of names.sort()) {
    const buf = files[k];
    const text = isText(k);
    bundle.files[k] = text ? { encoding: 'utf8', content: buf.toString('utf8') } : { encoding: 'base64', content: buf.toString('base64') };
  }
  return { manifest, bundle, names, total };
}

// ---- commands -----------------------------------------------------------------------------------------------

function cmdCheck(dir) {
  const { manifest, names, total } = build(dir);
  out(`OK: ${manifest.publisher}.${manifest.name} ${manifest.version}, ${names.length} files, ${(total / 1024).toFixed(1)} KB.`);
}

function cmdPackage(dir, flags) {
  const { manifest, bundle, names, total } = build(dir);
  const outDir = resolve(typeof flags.out === 'string' ? flags.out : '.');
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `${manifest.publisher}.${manifest.name}-${manifest.version}.fext`);
  writeFileSync(file, JSON.stringify(bundle));
  out('Packaged files:');
  for (const n of names) out('  ' + n + '  (' + bundle.files[n].content.length + ' chars)');
  out(`\n${file}\n${names.length} files, ${(total / 1024).toFixed(1)} KB unpacked.`);
  return file;
}

function configFile() {
  return join(homedir(), '.ferrum-ext.json');
}

function savedToken() {
  try {
    return JSON.parse(readFileSync(configFile(), 'utf8')).token;
  } catch {
    return undefined;
  }
}

async function cmdPublish(dir, flags) {
  const server = String(flags.server || process.env.FERRUM_SERVER || DEFAULT_SERVER).replace(/\/$/, '');
  const token = (typeof flags.token === 'string' && flags.token) || process.env.FERRUM_TOKEN || savedToken();
  if (!token) fail('No token. Create one on your account page, then pass --token, set FERRUM_TOKEN, or run "ferrum-ext login".');
  const body = typeof flags.package === 'string' ? readFileSync(flags.package, 'utf8') : readFileSync(cmdPackage(dir, { out: join(dir, '.ferrum-build') }), 'utf8');
  out(`\nUploading to ${server} ...`);
  let res;
  try {
    res = await fetch(server + '/api/v1/publish', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body });
  } catch (e) {
    return fail('Could not reach the marketplace: ' + e.message);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) fail('Refused: ' + (data.message || data.error || 'HTTP ' + res.status));
  out(data.message + '\n' + server + '/extensions/' + data.id);
}

async function cmdLogin(flags) {
  const server = String(flags.server || process.env.FERRUM_SERVER || DEFAULT_SERVER).replace(/\/$/, '');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = (await rl.question('Email: ')).trim();
  const password = await rl.question('Password (shown as you type): ');
  rl.close();
  const res = await fetch(server + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(data.error || 'Sign in failed (HTTP ' + res.status + ').');
  writeFileSync(configFile(), JSON.stringify({ token: data.token, server }, null, 2));
  try {
    chmodSync(configFile(), 0o600);
  } catch {
    /* Windows has no modes */
  }
  out('Signed in as ' + data.user.name + '. Token saved in ' + configFile());
}

function cmdVersion(dir, kind) {
  if (!['major', 'minor', 'patch'].includes(kind)) fail('Use: ferrum-ext version major|minor|patch', 2);
  const m = readManifest(dir);
  const [a, b, c] = String(m.version).split('-')[0].split('.').map(Number);
  m.version = kind === 'major' ? `${a + 1}.0.0` : kind === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
  writeFileSync(join(dir, 'ferrum.json'), JSON.stringify(m, null, 2) + '\n');
  out('Version is now ' + m.version);
}

function cmdInit(name, flags) {
  if (!name) fail('Give a name: ferrum-ext init my-extension', 2);
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(name)) fail('The name must be 2 to 49 characters: lower case letters, digits and dashes.', 2);
  const dir = resolve(name);
  if (existsSync(dir)) fail(dir + ' already exists.');
  mkdirSync(dir, { recursive: true });
  const title = name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const manifest = { name, publisher: 'your-publisher-id', version: '0.1.0', displayName: title, description: 'Describe what ' + title + ' does in one sentence.', engines: { ferrum: '^0.1.0' }, categories: ['Tools'], permissions: [], contributes: {} };
  const write = (rel, text) => {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  if (flags.theme) {
    manifest.categories = ['Themes'];
    manifest.contributes = { themes: [{ label: title, path: 'themes/' + name + '.json', uiTheme: 'dark' }] };
    write('themes/' + name + '.json', JSON.stringify({ name: title, type: 'dark', colors: { 'editor.background': '#1b1d23', 'editor.foreground': '#d7dae0', 'focusBorder': '#61afef' }, tokenColors: [{ scope: ['comment'], settings: { foreground: '#7f848e' } }, { scope: ['string'], settings: { foreground: '#98c379' } }, { scope: ['keyword'], settings: { foreground: '#c678dd' } }, { scope: ['entity.name.function'], settings: { foreground: '#61afef' } }] }, null, 2) + '\n');
  } else if (flags.language) {
    manifest.categories = ['Languages'];
    manifest.contributes = { languages: [{ id: name, name: title, extensions: ['.' + name], lineComment: '#', grammar: 'grammars/' + name + '.json' }] };
    write('grammars/' + name + '.json', JSON.stringify({ rules: [{ match: '#.*$', token: 'comment' }, { match: '"(?:[^"\\\\]|\\\\.)*"', token: 'string' }, { match: '\\b\\d+(?:\\.\\d+)?\\b', token: 'number' }, { match: '\\b(?:if|else|for|while|return)\\b', token: 'keyword' }] }, null, 2) + '\n');
  } else if (flags.snippets) {
    manifest.categories = ['Snippets'];
    manifest.contributes = { snippets: [{ language: '*', path: 'snippets/snippets.json' }] };
    write('snippets/snippets.json', JSON.stringify({ 'Hello snippet': { prefix: 'hello', body: ['Hello, ${1:world}!', '$0'], description: 'A first snippet' } }, null, 2) + '\n');
  } else {
    manifest.main = 'extension.js';
    manifest.activationEvents = ['onCommand:' + name + '.hello'];
    manifest.contributes = { commands: [{ command: name + '.hello', title: 'Say Hello', category: title }] };
    write('extension.js', `exports.activate = function (context) {\n  context.subscriptions.push(\n    ferrum.commands.register('${name}.hello', async () => {\n      ferrum.window.showMessage('Hello from ${title}!');\n    }),\n  );\n};\n\nexports.deactivate = function () {};\n`);
  }
  write('ferrum.json', JSON.stringify(manifest, null, 2) + '\n');
  write('README.md', `# ${title}\n\nDescribe what the extension does, with a screenshot, and what each permission is for.\n\n## Features\n\n- ...\n`);
  write('CHANGELOG.md', '# Changelog\n\n## 0.1.0\n\n- First release.\n');
  out(`Created ${dir}\nNext: edit ferrum.json (set your publisher id), then "ferrum-ext package".`);
}

const HELP = `ferrum-ext: create, check, package and publish Ferrum extensions

Usage:
  ferrum-ext init <name> [--theme | --language | --snippets]
  ferrum-ext check
  ferrum-ext package [--out <folder>]
  ferrum-ext publish [--token <token>] [--server <url>] [--package <file.fext>]
  ferrum-ext login [--server <url>]
  ferrum-ext version major|minor|patch

Run commands inside the extension's folder (the one with ferrum.json).
Documentation: ${DEFAULT_SERVER}/docs/cli`;

async function main() {
  const { _: [cmd, ...rest], flags } = parseArgs(process.argv.slice(2));
  const dir = resolve('.');
  switch (cmd) {
    case 'init': return cmdInit(rest[0], flags);
    case 'check': return cmdCheck(dir);
    case 'package': return void cmdPackage(dir, flags);
    case 'publish': return cmdPublish(dir, flags);
    case 'login': return cmdLogin(flags);
    case 'version': return cmdVersion(dir, rest[0]);
    case undefined:
    case 'help':
    case '--help': return out(HELP);
    default: err(`Unknown command "${cmd}".\n`); err(HELP); process.exit(2);
  }
}

// Tests import this file with FERRUM_EXT_NO_MAIN set, to use checkManifest alone.
if (!process.env.FERRUM_EXT_NO_MAIN) main().catch((e) => fail(e.message));
