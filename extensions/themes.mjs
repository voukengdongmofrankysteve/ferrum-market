// Color themes and file icon themes. Each theme is built from a palette; the file format is the VS Code color theme format.

const P = (o) => o;

export const THEMES = [
  { id: 'dracula-soft', name: 'Dracula Soft', icon: 'DR', credit: 'Palette by the Dracula Theme project (MIT).', mode: 'dark', desc: 'The popular purple and pink dark palette.',
    c: P({ bg: '#282a36', fg: '#f8f8f2', side: '#21222c', act: '#191a21', tab: '#21222c', hover: '#343746', sel: '#44475a', input: '#343746', border: '#191a21', accent: '#bd93f9', comment: '#6272a4', string: '#f1fa8c', number: '#bd93f9', keyword: '#ff79c6', type: '#8be9fd', fn: '#50fa7b', constant: '#bd93f9', prop: '#f8f8f2', tag: '#ff79c6', attr: '#50fa7b', macro: '#ffb86c', add: '#50fa7b', mod: '#ffb86c', del: '#ff5555', err: '#ff5555' }) },
  { id: 'one-dark-pro-like', name: 'One Dark Classic', icon: '1D', credit: 'Inspired by the Atom One Dark palette.', mode: 'dark', desc: 'A balanced dark theme with soft blues and greens.',
    c: P({ bg: '#282c34', fg: '#abb2bf', side: '#21252b', act: '#21252b', tab: '#21252b', hover: '#2c313a', sel: '#3e4451', input: '#1d1f23', border: '#181a1f', accent: '#528bff', comment: '#5c6370', string: '#98c379', number: '#d19a66', keyword: '#c678dd', type: '#e5c07b', fn: '#61afef', constant: '#d19a66', prop: '#e06c75', tag: '#e06c75', attr: '#d19a66', macro: '#56b6c2', add: '#98c379', mod: '#e5c07b', del: '#e06c75', err: '#e06c75' }) },
  { id: 'one-light-classic', name: 'One Light Classic', icon: '1L', credit: 'Inspired by the Atom One Light palette.', mode: 'light', desc: 'A clean light theme with gentle colors.',
    c: P({ bg: '#fafafa', fg: '#383a42', side: '#f0f0f1', act: '#eaeaeb', tab: '#eaeaeb', hover: '#e5e5e6', sel: '#e5e5e6', input: '#ffffff', border: '#dbdbdc', accent: '#4078f2', comment: '#a0a1a7', string: '#50a14f', number: '#986801', keyword: '#a626a4', type: '#c18401', fn: '#4078f2', constant: '#986801', prop: '#e45649', tag: '#e45649', attr: '#986801', macro: '#0184bc', add: '#50a14f', mod: '#c18401', del: '#e45649', err: '#e45649' }) },
  { id: 'monokai-classic', name: 'Monokai Classic', icon: 'MO', credit: 'Inspired by the Monokai palette.', mode: 'dark', desc: 'High contrast colors on a warm dark background.',
    c: P({ bg: '#272822', fg: '#f8f8f2', side: '#1e1f1c', act: '#1e1f1c', tab: '#1e1f1c', hover: '#3e3d32', sel: '#49483e', input: '#3e3d32', border: '#1b1c19', accent: '#a6e22e', comment: '#75715e', string: '#e6db74', number: '#ae81ff', keyword: '#f92672', type: '#66d9ef', fn: '#a6e22e', constant: '#ae81ff', prop: '#f8f8f2', tag: '#f92672', attr: '#a6e22e', macro: '#fd971f', add: '#a6e22e', mod: '#e6db74', del: '#f92672', err: '#f92672' }) },
  { id: 'solarized-night', name: 'Solarized Night', icon: 'SD', credit: 'Colors from the Solarized palette by Ethan Schoonover (MIT).', mode: 'dark', desc: 'Low contrast Solarized dark for long sessions.',
    c: P({ bg: '#002b36', fg: '#93a1a1', side: '#00252e', act: '#00212b', tab: '#00212b', hover: '#073642', sel: '#073642', input: '#073642', border: '#00212b', accent: '#268bd2', comment: '#586e75', string: '#2aa198', number: '#d33682', keyword: '#859900', type: '#b58900', fn: '#268bd2', constant: '#cb4b16', prop: '#93a1a1', tag: '#268bd2', attr: '#b58900', macro: '#cb4b16', add: '#859900', mod: '#b58900', del: '#dc322f', err: '#dc322f' }) },
  { id: 'solarized-day', name: 'Solarized Day', icon: 'SL', credit: 'Colors from the Solarized palette by Ethan Schoonover (MIT).', mode: 'light', desc: 'Solarized light, warm paper colors.',
    c: P({ bg: '#fdf6e3', fg: '#657b83', side: '#eee8d5', act: '#e6dfc8', tab: '#eee8d5', hover: '#e6dfc8', sel: '#eee8d5', input: '#fdf6e3', border: '#ddd6c1', accent: '#268bd2', comment: '#93a1a1', string: '#2aa198', number: '#d33682', keyword: '#859900', type: '#b58900', fn: '#268bd2', constant: '#cb4b16', prop: '#586e75', tag: '#268bd2', attr: '#b58900', macro: '#cb4b16', add: '#859900', mod: '#b58900', del: '#dc322f', err: '#dc322f' }) },
  { id: 'nordic-frost', name: 'Nordic Frost', icon: 'NF', credit: 'Colors from the Nord palette (MIT).', mode: 'dark', desc: 'An arctic, north-bluish dark theme.',
    c: P({ bg: '#2e3440', fg: '#d8dee9', side: '#292e39', act: '#272c36', tab: '#272c36', hover: '#3b4252', sel: '#434c5e', input: '#3b4252', border: '#232831', accent: '#88c0d0', comment: '#616e88', string: '#a3be8c', number: '#b48ead', keyword: '#81a1c1', type: '#8fbcbb', fn: '#88c0d0', constant: '#b48ead', prop: '#d8dee9', tag: '#81a1c1', attr: '#8fbcbb', macro: '#d08770', add: '#a3be8c', mod: '#ebcb8b', del: '#bf616a', err: '#bf616a' }) },
  { id: 'tokyo-midnight', name: 'Tokyo Midnight', icon: 'TK', credit: 'Inspired by the Tokyo Night palette.', mode: 'dark', desc: 'A dark theme with neon accents from the city at night.',
    c: P({ bg: '#1a1b26', fg: '#a9b1d6', side: '#16161e', act: '#16161e', tab: '#16161e', hover: '#292e42', sel: '#33467c', input: '#14141b', border: '#101014', accent: '#7aa2f7', comment: '#565f89', string: '#9ece6a', number: '#ff9e64', keyword: '#bb9af7', type: '#2ac3de', fn: '#7aa2f7', constant: '#ff9e64', prop: '#73daca', tag: '#f7768e', attr: '#e0af68', macro: '#7dcfff', add: '#9ece6a', mod: '#e0af68', del: '#f7768e', err: '#f7768e' }) },
  { id: 'github-night', name: 'Hub Night', icon: 'HN', credit: 'Inspired by the GitHub Primer dark colors (MIT).', mode: 'dark', desc: 'A neutral dark theme in the style of a code hosting site.',
    c: P({ bg: '#0d1117', fg: '#c9d1d9', side: '#010409', act: '#010409', tab: '#010409', hover: '#161b22', sel: '#264f78', input: '#0d1117', border: '#30363d', accent: '#1f6feb', comment: '#8b949e', string: '#a5d6ff', number: '#79c0ff', keyword: '#ff7b72', type: '#ffa657', fn: '#d2a8ff', constant: '#79c0ff', prop: '#79c0ff', tag: '#7ee787', attr: '#79c0ff', macro: '#ffa657', add: '#3fb950', mod: '#d29922', del: '#f85149', err: '#f85149' }) },
  { id: 'github-day', name: 'Hub Day', icon: 'HD', credit: 'Inspired by the GitHub Primer light colors (MIT).', mode: 'light', desc: 'A crisp, neutral light theme.',
    c: P({ bg: '#ffffff', fg: '#24292f', side: '#f6f8fa', act: '#f6f8fa', tab: '#f6f8fa', hover: '#eaeef2', sel: '#b6e3ff', input: '#ffffff', border: '#d0d7de', accent: '#0969da', comment: '#6e7781', string: '#0a3069', number: '#0550ae', keyword: '#cf222e', type: '#953800', fn: '#8250df', constant: '#0550ae', prop: '#0550ae', tag: '#116329', attr: '#0550ae', macro: '#953800', add: '#1a7f37', mod: '#9a6700', del: '#cf222e', err: '#cf222e' }) },
  { id: 'gruvbox-warm', name: 'Gruvbox Warm', icon: 'GB', credit: 'Colors from the Gruvbox palette by Pavel Pertsev (MIT).', mode: 'dark', desc: 'Retro groove colors, warm and easy on the eyes.',
    c: P({ bg: '#282828', fg: '#ebdbb2', side: '#1d2021', act: '#1d2021', tab: '#1d2021', hover: '#3c3836', sel: '#504945', input: '#3c3836', border: '#1d2021', accent: '#fabd2f', comment: '#928374', string: '#b8bb26', number: '#d3869b', keyword: '#fb4934', type: '#fabd2f', fn: '#b8bb26', constant: '#d3869b', prop: '#83a598', tag: '#fb4934', attr: '#fabd2f', macro: '#fe8019', add: '#b8bb26', mod: '#fabd2f', del: '#fb4934', err: '#fb4934' }) },
  { id: 'gruvbox-paper', name: 'Gruvbox Paper', icon: 'GP', credit: 'Colors from the Gruvbox palette by Pavel Pertsev (MIT).', mode: 'light', desc: 'The light side of Gruvbox.',
    c: P({ bg: '#fbf1c7', fg: '#3c3836', side: '#ebdbb2', act: '#ebdbb2', tab: '#ebdbb2', hover: '#d5c4a1', sel: '#d5c4a1', input: '#f2e5bc', border: '#d5c4a1', accent: '#b57614', comment: '#928374', string: '#79740e', number: '#8f3f71', keyword: '#9d0006', type: '#b57614', fn: '#79740e', constant: '#8f3f71', prop: '#076678', tag: '#9d0006', attr: '#b57614', macro: '#af3a03', add: '#79740e', mod: '#b57614', del: '#9d0006', err: '#9d0006' }) },
  { id: 'catppuccin-mocha-like', name: 'Mocha Latte Dark', icon: 'MC', credit: 'Colors from the Catppuccin Mocha palette (MIT).', mode: 'dark', desc: 'Soft pastel colors on a warm dark base.',
    c: P({ bg: '#1e1e2e', fg: '#cdd6f4', side: '#181825', act: '#11111b', tab: '#181825', hover: '#313244', sel: '#45475a', input: '#313244', border: '#11111b', accent: '#cba6f7', comment: '#6c7086', string: '#a6e3a1', number: '#fab387', keyword: '#cba6f7', type: '#f9e2af', fn: '#89b4fa', constant: '#fab387', prop: '#89dceb', tag: '#f38ba8', attr: '#f9e2af', macro: '#f5c2e7', add: '#a6e3a1', mod: '#f9e2af', del: '#f38ba8', err: '#f38ba8' }) },
  { id: 'material-deep-ocean', name: 'Material Deep Ocean', icon: 'MO', credit: 'Inspired by the Material Theme palettes.', mode: 'dark', desc: 'A deep, saturated blue-black theme.',
    c: P({ bg: '#0f111a', fg: '#a6accd', side: '#090b10', act: '#090b10', tab: '#090b10', hover: '#1a1c25', sel: '#1f2233', input: '#1a1c25', border: '#090b10', accent: '#84ffff', comment: '#464b5d', string: '#c3e88d', number: '#f78c6c', keyword: '#c792ea', type: '#ffcb6b', fn: '#82aaff', constant: '#f78c6c', prop: '#f07178', tag: '#f07178', attr: '#ffcb6b', macro: '#89ddff', add: '#c3e88d', mod: '#ffcb6b', del: '#f07178', err: '#ff5370' }) },
  { id: 'ayu-mirage-like', name: 'Mirage Dusk', icon: 'AY', credit: 'Inspired by the Ayu Mirage palette (MIT).', mode: 'dark', desc: 'A dusky mid-tone dark theme with warm orange accents.',
    c: P({ bg: '#1f2430', fg: '#cccac2', side: '#1a1f29', act: '#171b24', tab: '#171b24', hover: '#2a3040', sel: '#33415e', input: '#2a3040', border: '#171b24', accent: '#ffcc66', comment: '#6e7c8e', string: '#d5ff80', number: '#dfbfff', keyword: '#ffad66', type: '#73d0ff', fn: '#ffd173', constant: '#dfbfff', prop: '#cccac2', tag: '#5ccfe6', attr: '#ffd173', macro: '#f28779', add: '#87d96c', mod: '#ffcc66', del: '#f28779', err: '#f28779' }) },
  { id: 'synth-nights', name: 'Synth Nights', icon: 'SY', credit: 'Inspired by the Synthwave 84 look.', mode: 'dark', desc: 'Neon pinks and cyans on a deep purple background.',
    c: P({ bg: '#262335', fg: '#ffffff', side: '#241b2f', act: '#171520', tab: '#241b2f', hover: '#34294f', sel: '#463465', input: '#34294f', border: '#171520', accent: '#ff7edb', comment: '#848bbd', string: '#ff8b39', number: '#f97e72', keyword: '#fede5d', type: '#fe4450', fn: '#36f9f6', constant: '#f97e72', prop: '#ff7edb', tag: '#72f1b8', attr: '#fede5d', macro: '#ff7edb', add: '#72f1b8', mod: '#fede5d', del: '#fe4450', err: '#fe4450' }) },
  { id: 'rose-dawn', name: 'Rose Dawn', icon: 'RP', credit: 'Inspired by the Rosé Pine palette (MIT).', mode: 'dark', desc: 'Soho vibes: muted roses and golds on a dark base.',
    c: P({ bg: '#191724', fg: '#e0def4', side: '#1f1d2e', act: '#16141f', tab: '#1f1d2e', hover: '#26233a', sel: '#403d52', input: '#26233a', border: '#16141f', accent: '#ebbcba', comment: '#6e6a86', string: '#f6c177', number: '#ebbcba', keyword: '#31748f', type: '#9ccfd8', fn: '#c4a7e7', constant: '#ebbcba', prop: '#9ccfd8', tag: '#eb6f92', attr: '#f6c177', macro: '#c4a7e7', add: '#9ccfd8', mod: '#f6c177', del: '#eb6f92', err: '#eb6f92' }) },
  { id: 'cobalt-sky', name: 'Cobalt Sky', icon: 'CB', credit: 'Inspired by the Cobalt color scheme.', mode: 'dark', desc: 'A vivid blue theme with yellow and green accents.',
    c: P({ bg: '#193549', fg: '#ffffff', side: '#15232d', act: '#122738', tab: '#15232d', hover: '#1f4662', sel: '#0050a4', input: '#0d3a58', border: '#122738', accent: '#ffc600', comment: '#0088ff', string: '#a5ff90', number: '#ff628c', keyword: '#ff9d00', type: '#80ffbb', fn: '#ffc600', constant: '#ff628c', prop: '#9effff', tag: '#9effff', attr: '#ffc600', macro: '#ff9d00', add: '#a5ff90', mod: '#ffc600', del: '#ff628c', err: '#ff628c' }) },
  { id: 'night-forest', name: 'Night Forest', icon: 'NT', credit: 'An original palette by Vyloxi.', mode: 'dark', desc: 'Deep greens, moss and amber. Calm and low glare.',
    c: P({ bg: '#1b2420', fg: '#d3ddd5', side: '#16201b', act: '#121a16', tab: '#16201b', hover: '#25332c', sel: '#33493e', input: '#25332c', border: '#121a16', accent: '#8fbf7f', comment: '#6b8576', string: '#d9c58a', number: '#e0a074', keyword: '#8fbf7f', type: '#7fbfb0', fn: '#a8d8a0', constant: '#e0a074', prop: '#b4cdbb', tag: '#e58f7a', attr: '#d9c58a', macro: '#7fbfb0', add: '#8fbf7f', mod: '#d9c58a', del: '#e58f7a', err: '#e58f7a' }) },
  { id: 'paper-ink', name: 'Paper and Ink', icon: 'PI', credit: 'An original palette by Vyloxi.', mode: 'light', desc: 'Black ink on warm paper. Made for reading and writing prose.',
    c: P({ bg: '#f7f4ee', fg: '#2b2b2b', side: '#eeeae1', act: '#e6e1d6', tab: '#eeeae1', hover: '#e3ded2', sel: '#d9d2c0', input: '#fbf9f4', border: '#d8d2c4', accent: '#b5481f', comment: '#8b8678', string: '#4a7a3d', number: '#9b5d1e', keyword: '#8b2e5a', type: '#2d5f8a', fn: '#b5481f', constant: '#9b5d1e', prop: '#2d5f8a', tag: '#8b2e5a', attr: '#9b5d1e', macro: '#2d6f6a', add: '#4a7a3d', mod: '#9b5d1e', del: '#b0302a', err: '#b0302a' }) },
  { id: 'high-contrast-dark', name: 'High Contrast Dark', icon: 'HC', credit: 'An original palette by Vyloxi, designed for accessibility.', mode: 'dark', desc: 'Strong contrast and bright colors that meet the WCAG AAA ratio.',
    c: P({ bg: '#000000', fg: '#ffffff', side: '#0a0a0a', act: '#000000', tab: '#0a0a0a', hover: '#1a1a1a', sel: '#264f78', input: '#000000', border: '#6fc3df', accent: '#f38518', comment: '#7ca668', string: '#ce9178', number: '#b5cea8', keyword: '#569cd6', type: '#4ec9b0', fn: '#dcdcaa', constant: '#4fc1ff', prop: '#9cdcfe', tag: '#569cd6', attr: '#9cdcfe', macro: '#c586c0', add: '#6dd36d', mod: '#e2c08d', del: '#f48771', err: '#f48771' }) },
];

export function themeJson(t) {
  const c = t.c;
  return {
    name: t.name,
    type: t.mode,
    colors: {
      'editor.background': c.bg, 'editor.foreground': c.fg, 'sideBar.background': c.side, 'activityBar.background': c.act, 'titleBar.activeBackground': c.act,
      'tab.inactiveBackground': c.tab, 'list.hoverBackground': c.hover, 'list.activeSelectionBackground': c.sel, 'input.background': c.input,
      'editorWidget.background': c.side, 'panel.border': c.border, 'focusBorder': c.accent, 'button.background': c.accent, 'textLink.foreground': c.accent,
      'editor.selectionBackground': c.sel, 'editor.lineHighlightBackground': c.hover + '80', 'editorCursor.foreground': c.accent, 'editorIndentGuide.background': c.border,
      'errorForeground': c.err, 'gitDecoration.addedResourceForeground': c.add, 'gitDecoration.modifiedResourceForeground': c.mod, 'gitDecoration.deletedResourceForeground': c.del,
    },
    tokenColors: [
      { scope: ['comment'], settings: { foreground: c.comment } },
      { scope: ['string'], settings: { foreground: c.string } },
      { scope: ['constant.numeric'], settings: { foreground: c.number } },
      { scope: ['keyword', 'storage'], settings: { foreground: c.keyword } },
      { scope: ['entity.name.type', 'support.type', 'storage.type'], settings: { foreground: c.type } },
      { scope: ['entity.name.function', 'support.function'], settings: { foreground: c.fn } },
      { scope: ['constant.language', 'constant'], settings: { foreground: c.constant } },
      { scope: ['variable.other.property', 'support.type.property-name'], settings: { foreground: c.prop } },
      { scope: ['entity.name.tag'], settings: { foreground: c.tag } },
      { scope: ['entity.other.attribute-name'], settings: { foreground: c.attr } },
      { scope: ['entity.name.function.macro', 'meta.preprocessor'], settings: { foreground: c.macro } },
    ],
  };
}

// File icon themes use Codicon names. Each theme picks colors per kind of file.
const ICON_BASE = {
  folder: 'folder', folderOpen: 'folder-opened', file: 'file',
};
const KINDS = {
  rs: 'gear', ts: 'symbol-namespace', tsx: 'symbol-namespace', js: 'symbol-method', jsx: 'symbol-method', json: 'json', py: 'symbol-misc', md: 'markdown', html: 'code', css: 'symbol-color', scss: 'symbol-color',
  png: 'file-media', jpg: 'file-media', svg: 'file-media', gif: 'file-media', toml: 'settings-gear', yml: 'settings-gear', yaml: 'settings-gear', lock: 'lock', sh: 'terminal', ps1: 'terminal', bat: 'terminal',
  go: 'symbol-method', java: 'coffee', kt: 'symbol-class', swift: 'symbol-class', php: 'symbol-misc', rb: 'ruby', c: 'symbol-ruler', cpp: 'symbol-ruler', h: 'symbol-ruler', sql: 'database', zip: 'file-zip', pdf: 'file-pdf',
  txt: 'file-text', log: 'output', env: 'key', vue: 'symbol-namespace', svelte: 'symbol-namespace',
};
const NAMES = { 'package.json': 'package', 'cargo.toml': 'package', 'composer.json': 'package', dockerfile: 'server-environment', 'readme.md': 'book', license: 'law', makefile: 'tools', '.gitignore': 'source-control', '.env': 'key' };
const FOLDERS = { src: 'folder-library', docs: 'book', test: 'beaker', tests: 'beaker', public: 'globe', assets: 'file-media', node_modules: 'package', '.git': 'source-control', '.github': 'github', dist: 'package', build: 'package', target: 'package' };

export const ICON_THEMES = [
  { id: 'colorful-icons', name: 'Colorful Icons', icon: 'CI', desc: 'Every kind of file has its own color: orange for Rust, blue for TypeScript, yellow for JavaScript.', palette: { folder: '#f0a24a', file: '#9aa5b1', hues: { rs: '#ff7043', ts: '#3178c6', tsx: '#3fa9f5', js: '#f7df1e', jsx: '#61dafb', json: '#f5c518', py: '#4b8bbe', md: '#42a5f5', html: '#e44d26', css: '#2965f1', scss: '#cd6799', png: '#26a69a', jpg: '#26a69a', svg: '#ffb13b', gif: '#26a69a', toml: '#9c6b4e', yml: '#cb171e', yaml: '#cb171e', lock: '#8d8d8d', sh: '#89e051', ps1: '#5391fe', bat: '#c1f12e', go: '#00add8', java: '#e76f00', kt: '#a97bff', swift: '#fa7343', php: '#777bb4', rb: '#cc342d', c: '#5c6bc0', cpp: '#00599c', h: '#7986cb', sql: '#e38c00', zip: '#a1887f', pdf: '#e53935', txt: '#bdbdbd', log: '#90a4ae', env: '#ecd53f', vue: '#41b883', svelte: '#ff3e00' } } },
  { id: 'monochrome-icons', name: 'Monochrome Icons', icon: 'MI', desc: 'Calm, single color icons that never distract from the code.', palette: { folder: '#8a94a3', file: '#8a94a3', mono: '#8a94a3' } },
  { id: 'pastel-icons', name: 'Pastel Icons', icon: 'PA', desc: 'Soft pastel icons for a lighter look.', palette: { folder: '#f7c59f', file: '#b8c4d4', hues: { rs: '#f4a58a', ts: '#8ab4f8', tsx: '#9ad0f5', js: '#f6e58d', jsx: '#9fe0f0', json: '#f7dc8f', py: '#8fb8e0', md: '#9cc9f5', html: '#f2a18d', css: '#8fa8f2', scss: '#e5a0c4', png: '#8fd5c9', svg: '#f7c98a', toml: '#c9a58d', yml: '#e89a9c', yaml: '#e89a9c', sh: '#b4e49a', go: '#8fd8e8', java: '#f0b27a', kt: '#c5a8ff', swift: '#f8a98a', php: '#b0b3dd', rb: '#e8908c', c: '#a3aee0', cpp: '#8fc0e0', sql: '#f0c470', vue: '#9adbb8', svelte: '#f8a690' } } },
];

export function iconThemeJson(t) {
  const p = t.palette;
  const pick = (ext) => (p.mono ? p.mono : (p.hues && p.hues[ext]) || p.file);
  const extensions = {};
  for (const [ext, icon] of Object.entries(KINDS)) extensions[ext] = { icon, color: pick(ext) };
  const names = {};
  for (const [n, icon] of Object.entries(NAMES)) names[n] = { icon, color: p.mono ?? '#e0a458' };
  const folderNames = {};
  for (const [n, icon] of Object.entries(FOLDERS)) folderNames[n] = { icon, color: p.mono ?? p.folder };
  return {
    folder: { icon: ICON_BASE.folder, color: p.folder }, folderOpen: { icon: ICON_BASE.folderOpen, color: p.folder }, file: { icon: ICON_BASE.file, color: p.file },
    extensions, names, folderNames,
  };
}
