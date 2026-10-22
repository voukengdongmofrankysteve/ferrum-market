# Anatomy of an extension

An extension is a folder. The only required file is `ferrum.json`.

```
my-extension/
  ferrum.json          required: the manifest
  README.md            the marketplace page (Markdown)
  CHANGELOG.md         shown under the README
  icon.png             128x128 or 256x256 PNG, 200 KB at most
  extension.js         code, when the extension runs JavaScript
  themes/night.json    a color theme
  grammars/foo.json    a syntax grammar for a language
  snippets/foo.json    snippets
  icons/mine.json      a file icon theme
```

You choose the file names; the manifest points at them.

## The package: .fext

`ferrum-ext package` turns the folder into **one JSON file** with the extension `.fext`:

```json
{
  "format": 1,
  "manifest": { "...": "the contents of ferrum.json" },
  "files": {
    "README.md": { "encoding": "utf8", "content": "# My extension..." },
    "icon.png": { "encoding": "base64", "content": "iVBORw0KGgo..." }
  }
}
```

You never write this by hand. Limits: 200 files and 1.5 MB in total once unpacked. Text files are stored as is; images and other binary files as base64.

Files that are **not** packaged: anything starting with a dot, `node_modules`, `*.fext`, and what your `.ferrumignore` file lists (one pattern per line).

## What the editor does with it

When someone installs an extension, Ferrum:

1. downloads the `.fext` file from the marketplace (or reads it from disk),
2. checks the format and the manifest,
3. shows the **permissions** the extension asks for and waits for a yes,
4. stores the file in its settings folder,
5. applies the **contributions** (themes, languages, snippets, commands, keybindings, icon themes, settings),
6. starts the code when an **activation event** happens.

Uninstalling removes the stored file and all contributions. Disabling keeps the file but turns everything off.

## Where code runs

`main` is loaded into a **Web Worker** when the extension activates. The file is a CommonJS-style script: it sets `exports.activate` and, optionally, `exports.deactivate`. A global called `ferrum` gives access to the editor. There is no `require`, no `import`, and no access to the page. To use a library, bundle it into one file with a tool such as esbuild before you package.

```js
exports.activate = (context) => { /* ... */ };
exports.deactivate = () => { /* ... */ };
```

## One extension, many contributions

A single extension can add several kinds of things. A language pack, for example, usually adds a language, its snippets and a theme to go with it:

```json
"contributes": {
  "languages": [{ "id": "toml-plus", "name": "TOML+", "extensions": [".toml"], "grammar": "grammars/toml.json" }],
  "snippets": [{ "language": "TOML+", "path": "snippets/toml.json" }],
  "themes": [{ "label": "TOML Night", "path": "themes/night.json", "uiTheme": "dark" }]
}
```
