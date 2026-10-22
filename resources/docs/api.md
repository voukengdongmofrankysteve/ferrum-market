# JavaScript API

Extension code gets one global object, `ferrum`. Everything that touches the editor goes through it. All methods that talk to the editor return **promises**; you can `await` them.

This page lists the whole API. Calls that need a [permission](/docs/permissions) say so. Calling one without the permission rejects with an error that names it.

## The module

```js
exports.activate = function (context) { };   // required for code extensions
exports.deactivate = function () { };        // optional, may return a promise
```

`context`:

| Property | Description |
| --- | --- |
| `context.extensionId` | `publisher.name`. |
| `context.version` | The installed version. |
| `context.subscriptions` | An array. Push any object with a `dispose()` method; it is disposed when the extension is turned off. |
| `context.storage` | The same as `ferrum.storage`. |

Everything that registers something (`commands.register`, `events.on`, `window.setStatusBar`) returns a **disposable**: an object with `dispose()`.

## ferrum.commands

| Method | Description |
| --- | --- |
| `register(id, fn)` | Registers the function that runs when the command `id` runs. `fn(...args)` may return a promise. Returns a disposable. |
| `execute(id, ...args)` | Runs any command, yours or the editor's (for example `file.save`). Returns the result. |
| `list()` | The ids of every command that exists. |

## ferrum.window

| Method | Description |
| --- | --- |
| `showMessage(text, kind?)` | Shows a notification. `kind` is `info` (default), `warn` or `error`. |
| `showInputBox({ prompt, value?, placeholder? })` | Asks for a line of text. Resolves to the string, or `undefined` if cancelled. |
| `showQuickPick(items, { placeholder? })` | Shows a list. `items` are strings or `{ label, detail?, description? }`. Resolves to the chosen item, or `undefined`. |
| `confirm(message, okLabel?)` | A yes or no question. Resolves to `true` or `false`. |
| `setStatusBar(id, { text, tooltip?, command? })` | Puts text in the status bar. When the person clicks it, `command` runs. Call again with the same `id` to update. Returns a disposable that removes it. |
| `showPanel({ title, html })` | Opens a tab with your HTML. Returns a panel. See [Panels with HTML](/docs/webviews). |
| `withProgress(title, fn)` | Shows `title` in the status bar while the async function `fn` runs. |

## ferrum.editor

Works on the file the person is editing. Positions are `{ line, col }`, both starting at 0, `col` counted in UTF-16 units like JavaScript strings.

| Member | Description |
| --- | --- |
| `active()` | A snapshot of the open file, or `undefined`: `{ path, name, language, lineCount, text, selection: { start, end }, selectedText, dirty }`. `path` is `null` for a file that is not saved yet. |
| `getText(range?)` | The text of a range, or of the whole file. |
| `getLine(n)` | The text of line `n` without its newline. |
| `insert(text)` | Replaces the selection with `text` (or inserts at the cursor). One undoable edit. |
| `replace(range, text)` | Replaces a range. One undoable edit. |
| `edit(edits)` | Applies several `{ range, text }` edits as **one** undoable change. Ranges refer to the text before any edit. |
| `setSelection(start, end?)` | Moves the cursor or selects a range, and scrolls it into view. |
| `openFile(path, position?)` | Opens a file (needs `workspace.read`). |

Editing a file that is read-only rejects with an error.

## ferrum.workspace

| Member | Description |
| --- | --- |
| `root` | The open folder's path, or `null`. |
| `readFile(path)` | The text of a file. Needs `workspace.read`. Only paths inside the open folder. |
| `writeFile(path, text)` | Writes a file, creating folders. Needs `workspace.write`. Only inside the open folder. |
| `listFiles(pattern?)` | The files in the open folder, optionally filtered with a pattern such as `*.rs` or `src/**`. Needs `workspace.read`. Skips `node_modules`, `target` and similar folders. |

## ferrum.terminal

| Method | Description |
| --- | --- |
| `run(command)` | Types `command` into the terminal and runs it, visibly. Needs `terminal`. The person sees exactly what runs. |

## ferrum.clipboard

| Method | Description |
| --- | --- |
| `readText()` | The clipboard text. Needs `clipboard`. |
| `writeText(text)` | Replaces the clipboard text. Needs `clipboard`. |

## ferrum.settings

Settings declared under `contributes.configuration`.

| Method | Description |
| --- | --- |
| `get(key)` | The current value, or the default from the manifest. |
| `onDidChange(fn)` | `fn(key, value)` runs when a setting of this extension changes. Returns a disposable. |

## ferrum.storage

Private storage that stays between sessions, for this extension only. Values must be JSON.

| Method | Description |
| --- | --- |
| `get(key, fallback?)` | The stored value. |
| `set(key, value)` | Stores a value. About 1 MB in total per extension. |
| `delete(key)` | Removes it. |

## ferrum.events

`ferrum.events.on(name, fn)` returns a disposable.

| Event | Argument |
| --- | --- |
| `open` | `{ path, name, language }`, when a file is opened. |
| `save` | `{ path, name, language }`, after a file is saved. |
| `activeChanged` | `{ path, name, language }` or `undefined`, when the person switches file. |
| `selectionChanged` | `{ selection }`, when the cursor or selection moves (at most 10 times a second). |
| `settingsChanged` | `{ key, value }`, for this extension's settings. |

## ferrum.network

`ferrum.network.fetch(url, options?)` works like the browser's `fetch`. Needs `network`. Without that permission the standard `fetch` is also removed from the worker.

## Timers and the rest of JavaScript

`setTimeout`, `setInterval`, `Promise`, `JSON`, `Math`, `Date`, `RegExp`, `TextEncoder`, `URL` and the other standard JavaScript are available as usual. There is no DOM (`document`, `window`) in a worker. To show a page, use `ferrum.window.showPanel`.

## Errors

A call that fails rejects with an `Error`. Uncaught errors in your code are shown to the person as "Extension X failed: message" and written to the Extensions log (**Extensions: Show Log**). Use `console.log` for your own debugging; it goes to that log too.
