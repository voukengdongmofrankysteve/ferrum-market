// The tool extensions: code that adds commands, status bar items and panels. The code is in tools/<id>.js.

const C = (id, title) => ({ id, title });

export const TOOLS = [
  {
    id: 'hello', name: 'Hello Ferrum', icon: 'HI', category: 'Tools', perms: [], startup: true,
    desc: 'The example extension: a greeting command, a live word counter in the status bar and a panel with page statistics.',
    commands: [C('hello.say', 'Say Hello'), C('hello.upper', 'Make Selection Upper Case'), C('hello.stats', 'Show Page Statistics')],
    keys: [['hello.say', 'Ctrl+Alt+H'], ['hello.upper', 'Ctrl+Alt+U']],
    config: { 'hello.greeting': { type: 'string', default: 'Hello', description: 'The word used to greet.' }, 'hello.loud': { type: 'boolean', default: false, description: 'Greet in capital letters.' }, 'hello.counter': { type: 'boolean', default: true, description: 'Show the word counter in the status bar.' } },
    readme: `# Hello Ferrum

The example extension for Ferrum. It is small on purpose: read \`extension.js\` next to this page to see how each feature is used. The source is in the [ferrum-market repository](https://github.com/voukengdongmofrankysteve/ferrum-market).

- **Hello: Say Hello** asks for a name and greets it. The greeting word and loud mode are settings.
- **Hello: Make Selection Upper Case** changes the selected text, as one undoable edit.
- A **word counter** in the status bar follows the open file. Click it to open the statistics.
- **Hello: Show Page Statistics** opens a panel with lines, words and characters of the open file.

## Make your own

Read the [documentation](https://ferrum.vyloxi.com/docs/getting-started), copy this folder, change \`publisher\` and \`name\` in \`ferrum.json\`, and publish it.

No permissions needed.
`,
  },
  {
    id: 'text-tools', name: 'Text Tools', icon: 'TX', category: 'Tools', perms: [],
    desc: 'Sort, clean, convert case, encode and generate text: 45 commands for selections or whole files.',
    commands: [
      ...[['sortAsc', 'Sort Lines Ascending'], ['sortDesc', 'Sort Lines Descending'], ['sortCaseInsensitive', 'Sort Lines (Ignore Case)'], ['sortNumeric', 'Sort Lines by Number'], ['sortByLength', 'Sort Lines by Length'],
        ['unique', 'Remove Duplicate Lines'], ['reverse', 'Reverse Lines'], ['shuffle', 'Shuffle Lines'], ['join', 'Join Lines'], ['trim', 'Trim Trailing Whitespace'], ['trimBoth', 'Trim Whitespace on Both Sides'],
        ['removeBlank', 'Remove Blank Lines'], ['collapseBlank', 'Collapse Repeated Blank Lines'], ['numberLines', 'Number Lines'], ['quoteLines', 'Quote Lines as JSON Strings'], ['bullets', 'Turn Lines into a Bullet List'],
        ['tabsToSpaces', 'Convert Tabs to Spaces'], ['spacesToTabs', 'Convert Spaces to Tabs'], ['wrap', 'Wrap Long Lines'], ['changeCase', 'Change Case...'],
        ['upper', 'To UPPER CASE'], ['lower', 'To lower case'], ['title', 'To Title Case'], ['sentence', 'To Sentence case'], ['camel', 'To camelCase'], ['pascal', 'To PascalCase'], ['snake', 'To snake_case'], ['kebab', 'To kebab-case'],
        ['constant', 'To CONSTANT_CASE'], ['swapCase', 'Swap Case'], ['base64Encode', 'Base64 Encode'], ['base64Decode', 'Base64 Decode'], ['urlEncode', 'URL Encode'], ['urlDecode', 'URL Decode'], ['htmlEncode', 'HTML Entities Encode'],
        ['htmlDecode', 'HTML Entities Decode'], ['jsonEscape', 'Escape for a JSON String'], ['jsonUnescape', 'Unescape a JSON String'], ['hexEncode', 'Text to Hex'], ['hexDecode', 'Hex to Text'], ['rot13', 'ROT13'], ['slugify', 'Slugify'],
        ['insertUuid', 'Insert UUID'], ['insertUuidMany', 'Insert Several UUIDs'], ['insertDate', 'Insert Date and Time...'], ['insertLorem', 'Insert Lorem Ipsum'], ['insertSeparator', 'Insert a Separator Line'], ['randomString', 'Insert a Random String']]
        .map(([id, title]) => C('textTools.' + id, title)),
    ],
    keys: [['textTools.sortAsc', 'Shift+Alt+S'], ['textTools.changeCase', 'Shift+Alt+C'], ['textTools.insertUuid', 'Shift+Alt+U']],
    config: { 'textTools.tabSize': { type: 'number', default: 4, description: 'How many spaces a tab is when converting.' }, 'textTools.wrapColumn': { type: 'number', default: 80, description: 'The column that Wrap Long Lines wraps at.' }, 'textTools.loremParagraphs': { type: 'number', default: 3, description: 'The default number of Lorem Ipsum paragraphs.' } },
    readme: `# Text Tools

The everyday text jobs, one command each. Every command works on your **selection**, or on the **whole file** when nothing is selected, as one undoable edit.

## Lines
Sort (ascending, descending, ignoring case, by number, by length), remove duplicates, reverse, shuffle, join, trim, remove blank lines, number lines, quote lines as JSON strings, make a bullet list, wrap long lines, convert tabs and spaces.

## Case
UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and swap case. "Change Case..." shows them all in a list.

## Encode and decode
Base64, URL, HTML entities, JSON string escapes, hex, ROT13 and slugify.

## Insert
UUID v4 (one or many), the date and time in seven formats, Lorem Ipsum, a separator line and a random string.

## Shortcuts
Shift+Alt+S sorts lines, Shift+Alt+C changes case, Shift+Alt+U inserts a UUID. Change them in **Settings > Keyboard shortcuts**.

## Permissions
None. It only edits the file you are working on.
`,
  },
  {
    id: 'json-tools', name: 'JSON Tools', icon: 'JSN', category: 'Formatters', perms: [],
    desc: 'Format, minify, sort keys, validate JSON with the error position, and convert it to CSV or TypeScript types.',
    commands: [C('jsonTools.format', 'Format JSON'), C('jsonTools.minify', 'Minify JSON'), C('jsonTools.sortKeys', 'Sort Keys'), C('jsonTools.sortKeysDeep', 'Sort Keys (Deep)'), C('jsonTools.validate', 'Validate JSON'), C('jsonTools.toCsv', 'Convert JSON Array to CSV'), C('jsonTools.toTypescript', 'Convert JSON to TypeScript Types'), C('jsonTools.flatten', 'Flatten JSON to Paths'), C('jsonTools.stringify', 'Stringify JSON into a String')],
    keys: [['jsonTools.format', 'Shift+Alt+J']],
    config: { 'jsonTools.indent': { type: 'enum', default: '2', enum: ['2', '4', 'tab'], description: 'How to indent formatted JSON.' } },
    readme: `# JSON Tools

Works on the selection, or the whole file.

- **Format JSON** and **Minify JSON**. Comments and trailing commas in the input are accepted (handy for config files), the output is strict JSON.
- **Sort Keys**, one level or deep.
- **Validate JSON** tells you the **line and column** of the first error.
- **Convert JSON Array to CSV**, **Convert JSON to TypeScript Types** and **Flatten JSON to Paths** (\`a.b[0].c\`).
- **Stringify JSON into a String** for putting JSON inside JSON.

Set the indent (2, 4 or tab) in the extension settings. Shortcut: Shift+Alt+J formats.

No permissions needed.
`,
  },
  {
    id: 'color-tools', name: 'Color Tools', icon: 'CLR', category: 'Tools', perms: [],
    desc: 'Convert colors between hex, rgb and hsl, lighten and darken them, check contrast and make a palette.',
    commands: [C('colorTools.toHex', 'Convert Colors to Hex'), C('colorTools.toRgb', 'Convert Colors to RGB'), C('colorTools.toHsl', 'Convert Colors to HSL'), C('colorTools.lighten', 'Lighten Colors'), C('colorTools.darken', 'Darken Colors'), C('colorTools.random', 'Insert a Random Color'), C('colorTools.contrast', 'Check Contrast Between Two Colors'), C('colorTools.palette', 'Insert a Palette of Shades')],
    keys: [],
    config: { 'colorTools.step': { type: 'number', default: 10, description: 'How many percent Lighten and Darken change the lightness.' } },
    readme: `# Color Tools

Select some CSS (or put the cursor on a line) and convert every color in it:

- **Convert Colors to Hex / RGB / HSL**: \`#ff8800\`, \`rgb(255, 136, 0)\`, \`hsl(32, 100%, 50%)\`, with alpha kept.
- **Lighten / Darken Colors** by a number of percent (a setting).
- **Check Contrast Between Two Colors** gives the WCAG ratio and the AA / AAA grade.
- **Insert a Palette of Shades** writes nine CSS variables from one base color.
- **Insert a Random Color**.

No permissions needed.
`,
  },
  {
    id: 'timestamp-tools', name: 'Timestamp Tools', icon: 'TS', category: 'Tools', perms: [],
    desc: 'Read Unix timestamps and dates, convert between formats, see how long ago they were and find them in a file.',
    commands: [C('timestampTools.convertSelection', 'Convert Selected Timestamp or Date'), C('timestampTools.show', 'Show What a Timestamp Means'), C('timestampTools.now', 'Insert the Current Time...'), C('timestampTools.timestampsInFile', 'Find Unix Timestamps in This File')],
    keys: [],
    config: {},
    readme: `# Timestamp Tools

- Select \`1767225600\` (seconds or milliseconds) or a date like \`2026-01-01T00:00:00Z\` and run **Convert Selected Timestamp or Date**. Pick a format to replace the selection: Unix seconds, milliseconds, ISO 8601 in UTC or local time, RFC 2822, or relative ("3 days ago").
- **Show What a Timestamp Means** displays all of them in a message.
- **Find Unix Timestamps in This File** lists every 10 or 13 digit number that is a date, with how long ago it was, and jumps to the one you choose. Very useful in logs and JSON.

No permissions needed.
`,
  },
  {
    id: 'markdown-tools', name: 'Markdown Tools', icon: 'MDT', category: 'Productivity', perms: [],
    desc: 'Format tables, build a table of contents, toggle task checkboxes, change heading levels and sort lists.',
    commands: [C('markdownTools.formatTable', 'Format Table'), C('markdownTools.insertTable', 'Insert Table'), C('markdownTools.insertToc', 'Insert Table of Contents'), C('markdownTools.toggleTask', 'Toggle Task Checkbox'), C('markdownTools.promoteHeading', 'Promote Heading'), C('markdownTools.demoteHeading', 'Demote Heading'), C('markdownTools.sortList', 'Sort Selected List'), C('markdownTools.wrapLink', 'Make Selection a Link')],
    keys: [['markdownTools.formatTable', 'Shift+Alt+T'], ['markdownTools.toggleTask', 'Shift+Alt+X']],
    config: { 'markdownTools.tocDepth': { type: 'number', default: 3, description: 'The deepest heading level in a table of contents.' } },
    readme: `# Markdown Tools

- **Format Table** aligns the pipes of the table around the cursor and keeps the \`:---:\` alignment. Write a rough table, run the command, done.
- **Insert Table** makes an empty table of the size you ask for.
- **Insert Table of Contents** builds a nested list of links from your headings (ignoring code blocks), with GitHub style anchors.
- **Toggle Task Checkbox** turns \`- [ ]\` into \`- [x]\` and back, and makes a plain line a task. Shortcut: Shift+Alt+X.
- **Promote / Demote Heading** changes the level of the headings in the selection.
- **Sort Selected List** and **Make Selection a Link**.

No permissions needed.
`,
  },
  {
    id: 'word-count', name: 'Word Count', icon: 'WC', category: 'Productivity', perms: [], startup: true,
    desc: 'Live word count in the status bar, with selection counts, characters, lines and reading time.',
    commands: [C('wordCount.details', 'Show Document Statistics')],
    keys: [],
    config: { 'wordCount.wordsPerMinute': { type: 'number', default: 220, description: 'Reading speed used for the reading time.' } },
    readme: `# Word Count

The status bar shows the **word count** of the open file, and "12 of 340 words" when you select text. Hover for characters, lines and the reading time. Click it, or run **Show Document Statistics**, for words, characters with and without spaces, lines, sentences, paragraphs and the reading time for the file and the selection.

Words are counted with Unicode letters, so it works for French, German, Greek, Cyrillic and more.

No permissions needed.
`,
  },
  {
    id: 'bookmarks', name: 'Bookmarks', icon: 'BK', category: 'Productivity', perms: ['workspace.read'], startup: true,
    desc: 'Mark lines, jump to the next or previous bookmark, and list bookmarks across files. They are remembered.',
    commands: [C('bookmarks.toggle', 'Toggle Bookmark'), C('bookmarks.next', 'Go to Next Bookmark'), C('bookmarks.previous', 'Go to Previous Bookmark'), C('bookmarks.list', 'List All Bookmarks'), C('bookmarks.clearFile', 'Clear Bookmarks in This File'), C('bookmarks.clearAll', 'Clear All Bookmarks')],
    keys: [['bookmarks.toggle', 'Shift+Alt+B'], ['bookmarks.next', 'Shift+Alt+N'], ['bookmarks.previous', 'Shift+Alt+P']],
    config: {},
    readme: `# Bookmarks

Mark a line (Shift+Alt+B), jump to the next (Shift+Alt+N) or previous (Shift+Alt+P) bookmark in the file, or list all bookmarks in all files and jump to one. A counter shows in the status bar. Bookmarks are saved by the editor and come back next time.

Bookmarks are tied to line numbers, so after big edits above a bookmark it may point a few lines off.

Permissions: workspace.read (to open the file when you pick a bookmark from another file).
`,
  },
  {
    id: 'quick-notes', name: 'Quick Notes', icon: 'QN', category: 'Productivity', perms: [],
    desc: 'A notepad panel for each project. Notes are saved and come back when you reopen the project.',
    commands: [C('quickNotes.open', 'Open Quick Notes'), C('quickNotes.addSelection', 'Add Selection to Quick Notes')],
    keys: [],
    config: {},
    readme: `# Quick Notes

A notepad for each project, always one command away. It saves as you type, remembers the notes per folder, and has **Insert into file** to drop the text in the editor.

**Add Selection to Quick Notes** appends the selected code with its file name and line number, so you can come back to it later.

No permissions needed. Notes stay on your computer.
`,
  },
  {
    id: 'npm-scripts', name: 'NPM Scripts', icon: 'NPM', category: 'Tools', perms: ['workspace.read', 'terminal'],
    desc: 'List and run package.json scripts in the terminal, with npm, pnpm, yarn or bun picked from your lock file.',
    commands: [C('npmScripts.show', 'Show Scripts Panel'), C('npmScripts.run', 'Run Script...'), C('npmScripts.runWithArgs', 'Run Script with Arguments...'), C('npmScripts.install', 'Install Dependencies')],
    keys: [],
    config: { 'npmScripts.packageManager': { type: 'enum', default: 'auto', enum: ['auto', 'npm', 'pnpm', 'yarn', 'bun'], description: 'Which package manager to use. Auto looks at your lock file.' } },
    readme: `# NPM Scripts

Open the **Scripts Panel** to see every script in \`package.json\` with its command and a Run button, or use **Run Script...** from the command palette. The command is typed in the terminal so you can see exactly what runs.

The package manager is chosen from the lock file (\`pnpm-lock.yaml\`, \`yarn.lock\`, \`bun.lockb\`, otherwise npm). It finds the package.json even when it is in a sub folder.

## Permissions
- **workspace.read** to read package.json and the lock files.
- **terminal** to run the command in the terminal.
`,
  },
  {
    id: 'git-quick', name: 'Git Quick Actions', icon: 'GQ', category: 'Git', perms: ['terminal'],
    desc: 'Status, pull, push, commit, branch, stash, log and blame as commands. Everything runs visibly in the terminal.',
    commands: [C('gitQuick.status', 'Status'), C('gitQuick.pull', 'Pull'), C('gitQuick.push', 'Push'), C('gitQuick.fetch', 'Fetch All'), C('gitQuick.commit', 'Commit Staged...'), C('gitQuick.commitAll', 'Stage All and Commit...'), C('gitQuick.amend', 'Amend Last Commit'), C('gitQuick.undoCommit', 'Undo Last Commit (Keep Changes)'),
      C('gitQuick.newBranch', 'New Branch...'), C('gitQuick.switchBranch', 'Switch Branch...'), C('gitQuick.branches', 'List Branches'), C('gitQuick.stash', 'Stash Changes'), C('gitQuick.stashPop', 'Pop Stash'), C('gitQuick.log', 'Show Log Graph'), C('gitQuick.diff', 'Show Diff'),
      C('gitQuick.diffStaged', 'Show Staged Diff'), C('gitQuick.discardUnstaged', 'Discard Unstaged Changes'), C('gitQuick.tag', 'Create Tag...'), C('gitQuick.tags', 'List Tags'), C('gitQuick.remotes', 'Show Remotes'), C('gitQuick.fileHistory', 'History of This File'), C('gitQuick.blameFile', 'Blame This File')],
    keys: [],
    config: {},
    readme: `# Git Quick Actions

The git commands you type every day, in the command palette (prefix "Git Quick"). They run **in the terminal, in front of you**, so nothing is hidden, and you can edit the command before pressing Enter if you want.

- Status, pull (fast-forward only), push, fetch all with prune.
- Commit staged, stage everything and commit, amend, undo the last commit but keep the changes.
- New branch, switch branch, list branches.
- Stash and pop, log graph, diff, staged diff, tags, remotes.
- History and blame of the open file.
- **Discard Unstaged Changes** asks first.

Messages and names are checked so nothing special (quotes, dollar signs, backticks) reaches the shell.

## Permissions
**terminal**, to type commands into the terminal.
`,
  },
  {
    id: 'http-client', name: 'HTTP Client', icon: 'HTP', category: 'Tools', perms: ['network'],
    desc: 'Write HTTP requests in a .http file, send them with a command, and read the response in a panel.',
    commands: [C('httpClient.send', 'Send Request at Cursor'), C('httpClient.newFile', 'Insert Example Requests')],
    keys: [['httpClient.send', 'Shift+Alt+R']],
    config: { 'httpClient.timeoutSeconds': { type: 'number', default: 30, description: 'Give up on a request after this many seconds.' } },
    readme: `# HTTP Client

Create a file ending in \`.http\` and write requests, separated by \`###\`:

\`\`\`
@host = https://httpbin.org

### Get something
GET {{host}}/get
Accept: application/json

### Post some JSON
POST {{host}}/post
Content-Type: application/json

{ "hello": "world" }
\`\`\`

Put the cursor in a request and press **Shift+Alt+R** (or run **Send Request at Cursor**). The response opens in a panel with the status, time, formatted body and headers.

- Variables with \`@name = value\` and \`{{name}}\`, plus \`{{$timestamp}}\`, \`{{$guid}}\` and \`{{$randomInt}}\`.
- Methods GET, POST, PUT, PATCH, DELETE, HEAD and OPTIONS.
- The "HTTP requests" language pack colors \`.http\` files.

## Permissions
**network**, to send the requests you write. The extension contacts nothing else.
`,
  },
  {
    id: 'emoji-picker', name: 'Emoji Picker', icon: 'EMO', category: 'Productivity', perms: [],
    desc: 'Search and insert emoji from a panel or a quick list.',
    commands: [C('emojiPicker.open', 'Open Emoji Picker'), C('emojiPicker.quick', 'Insert Emoji...')],
    keys: [['emojiPicker.quick', 'Shift+Alt+E']],
    config: {},
    readme: `# Emoji Picker

About 190 emoji, searchable by many words ("rocket", "check", "fire", "bug", "done"). Open the panel and click one to insert it at the cursor, or use **Insert Emoji...** (Shift+Alt+E) for a quick list.

No permissions needed.
`,
  },
  {
    id: 'pomodoro', name: 'Pomodoro Timer', icon: 'POM', category: 'Productivity', perms: [], startup: true,
    desc: 'A focus timer in the status bar: 25 minutes of work, 5 minutes of rest, a longer break every fourth round.',
    commands: [C('pomodoro.toggle', 'Start or Pause'), C('pomodoro.start', 'Start'), C('pomodoro.pause', 'Pause'), C('pomodoro.reset', 'Reset'), C('pomodoro.skip', 'Skip to the Next Phase')],
    keys: [],
    config: { 'pomodoro.workMinutes': { type: 'number', default: 25, description: 'Minutes of focus.' }, 'pomodoro.breakMinutes': { type: 'number', default: 5, description: 'Minutes of short break.' }, 'pomodoro.longBreakMinutes': { type: 'number', default: 15, description: 'Minutes of long break.' }, 'pomodoro.longBreakEvery': { type: 'number', default: 4, description: 'A long break after this many focus sessions.' } },
    readme: `# Pomodoro Timer

Click the timer in the status bar to start or pause. When a phase ends you get a message. After four focus sessions the break is longer. Change the minutes in the extension settings.

No permissions needed.
`,
  },
  {
    id: 'file-templates', name: 'File Templates', icon: 'FT', category: 'Productivity', perms: ['workspace.read', 'workspace.write'],
    desc: 'Create files from 19 templates, and add a LICENSE, README, .gitignore, .editorconfig or CI workflow in one step.',
    commands: [C('fileTemplates.newFile', 'New File from Template...'), C('fileTemplates.addLicense', 'Add a LICENSE...'), C('fileTemplates.addReadme', 'Add a README'), C('fileTemplates.addGitignore', 'Add a .gitignore'), C('fileTemplates.addEditorconfig', 'Add an .editorconfig'), C('fileTemplates.addGithubAction', 'Add a GitHub Actions Workflow'), C('fileTemplates.addDockerfile', 'Add a Dockerfile')],
    keys: [],
    config: { 'fileTemplates.author': { type: 'string', default: '', description: 'The name used in the LICENSE copyright line.' } },
    readme: `# File Templates

**New File from Template...** offers HTML, CSS, JavaScript, TypeScript, Python, Rust, Go, Bash, Dockerfile, Docker Compose, GitHub Actions, .gitignore, .editorconfig, README, CHANGELOG, CONTRIBUTING, package.json, JSON, Markdown and Makefile. You choose where it goes, inside the project. If the file already exists you are asked before replacing it.

**Add a LICENSE...** writes MIT, ISC, BSD 2-Clause or Unlicense text with the current year and the name you give.

## Permissions
- **workspace.read** to check if a file already exists and to open the new file.
- **workspace.write** to create the file. It can only write inside the open folder.
`,
  },
  {
    id: 'regex-tester', name: 'Regex Tester', icon: 'RX', category: 'Tools', perms: [],
    desc: 'Try a regular expression on sample text: live highlighting, every match and every capture group.',
    commands: [C('regexTester.open', 'Open Regex Tester')],
    keys: [],
    config: {},
    readme: `# Regex Tester

Open the panel (selected text becomes the test text). Type a pattern and flags and watch the matches light up as you type. A table lists every match with its position and its numbered and named groups. Errors in the pattern show under the field. **Insert /pattern/flags into the file** puts the regex in your code.

It uses JavaScript regular expressions, the same ones the editor's search uses.

No permissions needed. The panel never leaves your computer.
`,
  },
  {
    id: 'hash-tools', name: 'Hash Tools', icon: 'HSH', category: 'Tools', perms: [],
    desc: 'MD5, SHA-1, SHA-256, SHA-384, SHA-512 and HMAC-SHA256 of your selection or file.',
    commands: [C('hashTools.sha256', 'SHA-256 of Selection'), C('hashTools.sha1', 'SHA-1 of Selection'), C('hashTools.sha512', 'SHA-512 of Selection'), C('hashTools.sha384', 'SHA-384 of Selection'), C('hashTools.md5', 'MD5 of Selection'), C('hashTools.hmacSha256', 'HMAC-SHA256 of Selection...'), C('hashTools.all', 'Show All Hashes')],
    keys: [],
    config: {},
    readme: `# Hash Tools

Select text (or use the whole file) and get its hash. Choose to insert it or show it. **Show All Hashes** lists MD5, SHA-1, SHA-256 and SHA-512 together.

MD5 and SHA-1 are not safe for passwords or signatures; they are here to check files and match old checksums.

No permissions needed. Hashing happens on your computer.
`,
  },
  {
    id: 'todo-tree', name: 'TODO Tree', icon: 'TD', category: 'Productivity', perms: ['workspace.read'],
    desc: 'Find TODO, FIXME, HACK, BUG and NOTE comments across your project and jump to them from a panel.',
    commands: [C('todoTree.show', 'Show TODO Tree'), C('todoTree.list', 'List TODOs...')],
    keys: [['todoTree.show', 'Shift+Alt+O']],
    config: { 'todoTree.tags': { type: 'string', default: 'TODO,FIXME,HACK,BUG,XXX,NOTE', description: 'The tags to look for, separated by commas.' }, 'todoTree.maxFiles': { type: 'number', default: 800, description: 'How many files to scan at most.' } },
    readme: `# TODO Tree

Scans the open folder for comments like \`// TODO: write tests\`, \`# FIXME(ada) handle errors\` or \`<!-- NOTE: ... -->\` and shows them in a panel, grouped by file, with a colored tag. Click one to open the file at that line. The status bar shows the count.

Only text in comments is matched, and binary files, images, lock files and \`node_modules\` are skipped. Change the tags in the settings.

## Permissions
**workspace.read**, to read the files of the folder you opened. Nothing is sent anywhere.
`,
  },
];
