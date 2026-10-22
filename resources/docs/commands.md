# Commands and keybindings

Commands are the actions in the command palette (Ctrl+Shift+P). An extension adds its own.

## Declare and register

In the manifest:

```json
"contributes": {
  "commands": [
    { "command": "acme.upper", "title": "Make Selection Upper Case", "category": "Acme" }
  ],
  "keybindings": [
    { "command": "acme.upper", "key": "Ctrl+Alt+U" }
  ]
},
"main": "extension.js"
```

In the code:

```js
exports.activate = (context) => {
  context.subscriptions.push(
    ferrum.commands.register('acme.upper', async () => {
      const doc = ferrum.editor.active();
      if (!doc || !doc.selectedText) return ferrum.window.showMessage('Select some text first.', 'warn');
      await ferrum.editor.insert(doc.selectedText.toUpperCase());
    }),
  );
};
```

The palette shows **Acme: Make Selection Upper Case** from the moment the extension is installed. The first time someone runs it, Ferrum starts your code and then calls your function.

## Arguments and results

`ferrum.commands.execute(id, ...args)` runs a command and returns what it returns. Commands you register may take arguments:

```js
ferrum.commands.register('acme.greet', (name) => 'Hello, ' + name);
const text = await ferrum.commands.execute('acme.greet', 'Ada'); // "Hello, Ada"
```

From the palette a command gets no arguments.

## Commands of the editor

You can run Ferrum's own commands with `execute`. Use `ferrum.commands.list()` to see the ids. Some useful ones:

| Id | What it does |
| --- | --- |
| `file.save` | Save the active file. |
| `file.format` | Format the document with its language server. |
| `view.wordwrap` | Toggle word wrap. |
| `view.terminal` | Show or hide the terminal. |
| `go.symbol` | Go to symbol in file. |

## Keybindings

A key listed in `contributes.keybindings` is a **default**. The person can rebind or remove it in **Preferences: Open Keyboard Shortcuts**. Choose keys that are unlikely to clash: add `Alt` or `Shift`, and avoid the common editing keys (Ctrl+C, Ctrl+S, Ctrl+Z...).

Write keys like this:

- Modifiers: `Ctrl`, `Alt`, `Shift` (in this order), joined with `+`
- Letters in upper case: `Ctrl+Alt+U`
- Named keys: `F1` to `F12`, `Up`, `Down`, `Left`, `Right`, `Enter`, `Tab`, `Esc`, `Space`, `Backspace`, `Delete`, `PageUp`, `PageDown`
- Punctuation as itself: `Ctrl+Shift+[`, `Ctrl+,`

## The status bar

A command can be tied to a status bar item, so people can click it:

```js
ferrum.window.setStatusBar('acme.count', { text: '0 words', tooltip: 'Count words', command: 'acme.count' });
```
