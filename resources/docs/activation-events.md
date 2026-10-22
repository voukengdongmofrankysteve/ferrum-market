# Activation events

An extension's code does not run all the time. Ferrum starts it, **activates** it, when one of the extension's **activation events** happens. Until then it costs nothing. This keeps the editor fast when many extensions are installed.

Activation events are listed in `activationEvents` in the manifest. Extensions that only contribute themes, snippets, languages or icon themes need none.

| Event | When it fires |
| --- | --- |
| `onStartup` | When Ferrum starts (or the extension is installed or turned on). Use it sparingly. |
| `onCommand:<id>` | The first time the command `<id>` runs, from the palette, a key or `ferrum.commands.execute`. |
| `onLanguage:<id>` | When a file in that language is opened. The id is a language id, such as `rust` or one you contribute. |
| `onFileOpen:<pattern>` | When a file whose name matches the pattern is opened. The pattern may use `*`, for example `onFileOpen:*.toml` or `onFileOpen:Dockerfile`. |
| `onSave` | The first time any file is saved. |
| `onView:<id>` | When the person opens the sidebar container that holds the view `<id>`. See [Sidebar views](/docs/views). |

## Commands you contribute activate automatically

If your extension contributes a command in `contributes.commands`, Ferrum shows it in the palette even before your code is running. When the person runs it, Ferrum activates the extension first (even if you did not list `onCommand:<id>`), then calls the function you registered. Listing the event is still good practice, because it documents the intent.

## What happens at activation

1. The worker starts and loads your `main` file.
2. Ferrum calls `exports.activate(context)`. Register commands and event handlers here.
3. If `activate` returns a promise, Ferrum waits for it (up to 10 seconds). If it fails or takes longer, the extension is turned off and the person is told.

The extension stays active until Ferrum closes, the extension is disabled or uninstalled, or the folder changes. Then `exports.deactivate()` runs, if you defined it, and everything in `context.subscriptions` is disposed.

## Example

```json
"activationEvents": ["onLanguage:toml", "onCommand:acme.format"],
```

```js
exports.activate = (context) => {
  context.subscriptions.push(
    ferrum.commands.register('acme.format', formatCurrentFile),
    ferrum.events.on('save', (doc) => { if (doc.language === 'toml') ferrum.window.setStatusBar('acme', { text: 'saved' }); }),
  );
};
```
