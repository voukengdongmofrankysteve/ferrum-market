# Contribution points

`contributes` in the manifest declares what an extension adds. Ferrum applies contributions when the extension is installed or turned on, **without running any code**. Nine contribution points exist.

```json
"contributes": {
  "commands": [],
  "keybindings": [],
  "themes": [],
  "iconThemes": [],
  "languages": [],
  "snippets": [],
  "configuration": {},
  "viewsContainers": [],
  "views": []
}
```

## commands

Adds entries to the command palette (Ctrl+Shift+P).

```json
"commands": [
  { "command": "hello.say", "title": "Say Hello", "category": "Hello" }
]
```

| Key | Description |
| --- | --- |
| `command` | The command id: 3 to 80 characters, letters, digits, dots, dashes and underscores. Prefix it with your extension's name. |
| `title` | The label. Required. |
| `category` | Optional. The palette shows `Category: Title`. |
| `hidden` | Optional. `true` keeps the command out of the palette. It can still be run by a click in a [sidebar tree](/docs/views) or by `ferrum.commands.execute`. |

The function behind the command is registered in your code with `ferrum.commands.register`. If the code is not running yet, Ferrum activates the extension on first use. See [Commands and keybindings](/docs/commands).

## keybindings

Binds keys to a command.

```json
"keybindings": [
  { "command": "hello.say", "key": "Ctrl+Alt+H" }
]
```

`key` is written as modifiers joined with `+`, then the key: `Ctrl`, `Alt`, `Shift` and a key such as `H`, `F5`, `[`, `Up`, `Enter`, `Tab`, `Esc`, `Space`. A shortcut needs at least one modifier, or must be a function key. People can change or remove any shortcut in **Preferences: Open Keyboard Shortcuts**, so an extension's keys are only defaults. If two commands use the same keys, the shortcuts editor warns the user.

## themes

Adds color themes.

```json
"themes": [
  { "label": "Night Owl", "path": "themes/night-owl.json", "uiTheme": "dark" }
]
```

`path` points at a theme file in **VS Code's color theme format** (the `colors` and `tokenColors` keys). Many VS Code themes work unchanged. `uiTheme` is `dark` or `light` and is used when the file does not say. See [Color themes](/docs/themes).

## iconThemes

Adds a file icon theme for the explorer.

```json
"iconThemes": [
  { "id": "folder-pop", "label": "Folder Pop", "path": "icons/pop.json" }
]
```

The file maps file types to [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) names and colors. See [Color themes](/docs/themes#file-icon-themes).

## languages

Adds a language: which files it covers and how they are colored.

```json
"languages": [
  {
    "id": "toml-plus",
    "name": "TOML Plus",
    "extensions": [".toml"],
    "filenames": ["Cargo.lock"],
    "lineComment": "#",
    "grammar": "grammars/toml.json"
  }
]
```

| Key | Description |
| --- | --- |
| `id` | Lower case letters, digits and dashes. Used in activation events (`onLanguage:toml-plus`). |
| `name` | The name shown in the status bar and used by snippets. |
| `extensions` | File endings, with the dot. |
| `filenames` | Exact file names. |
| `lineComment` | The line comment marker, used by Toggle Line Comment. |
| `blockComment` | An array of two strings, `["/*", "*/"]`. |
| `grammar` | Path to a grammar file with the coloring rules. |

If another language already covers a file ending, an extension's language wins for the files it names. See [Languages and highlighting](/docs/languages).

## snippets

Adds snippets for a language.

```json
"snippets": [
  { "language": "TOML Plus", "path": "snippets/toml.json" },
  { "language": "*", "path": "snippets/everywhere.json" }
]
```

`language` is a language name as the editor shows it (for example `JavaScript`, `Rust`) or the `name` of a language your extension adds, or `*` for every language. The file uses VS Code's snippet format. See [Snippets](/docs/snippets).

## viewsContainers and views

Add an icon to the activity bar and fill the sidebar with a tree or a page of HTML. A container is the icon; a view is a section inside it.

```json
"viewsContainers": [{ "id": "todo", "title": "TODO", "icon": "checklist" }],
"views": [{ "id": "todo.items", "name": "Items", "container": "todo", "type": "tree" }]
```

See [Sidebar views](/docs/views) for every key, the tree API and HTML views.

## configuration

Declares settings for your extension. People change them in the Extensions view; your code reads them with `ferrum.settings.get`.

```json
"configuration": {
  "title": "Hello",
  "properties": {
    "hello.greeting": { "type": "string", "default": "Hello", "description": "The word used to greet." },
    "hello.loud": { "type": "boolean", "default": false, "description": "Shout." },
    "hello.times": { "type": "number", "default": 1, "description": "How many times." },
    "hello.style": { "type": "string", "enum": ["plain", "fancy"], "default": "plain", "description": "Look." }
  }
}
```

Supported types: `string`, `number`, `boolean`, and `string` with an `enum` (shown as a drop-down). Use your extension's name as a prefix for every setting.
