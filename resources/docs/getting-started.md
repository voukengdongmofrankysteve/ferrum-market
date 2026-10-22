# Your first extension

In this guide you build a small extension that adds a command, **Hello: Say Hello**. It greets you with a message, and can also insert a greeting into the open file. Then you try it in the editor, package it and publish it.

You need Ferrum and [Node.js](https://nodejs.org) 18 or newer (only for the `ferrum-ext` tool; your extension itself needs no build step).

## 1. Get the tool

Download `ferrum-ext.mjs` from the [ferrum-ext page](/docs/cli) and put it somewhere on your path, or run it with `node ferrum-ext.mjs`. In the examples below we write `ferrum-ext`.

## 2. Create the folder

```bash
ferrum-ext init hello
cd hello
```

This creates:

```
hello/
  ferrum.json     the manifest
  extension.js    your code
  README.md       the page people read on the marketplace
  CHANGELOG.md
```

## 3. Read the manifest

```json
{
  "name": "hello",
  "publisher": "your-publisher-id",
  "version": "0.1.0",
  "displayName": "Hello",
  "description": "Says hello from the command palette.",
  "engines": { "ferrum": "^0.1.0" },
  "categories": ["Tools"],
  "main": "extension.js",
  "activationEvents": ["onCommand:hello.say"],
  "permissions": [],
  "contributes": {
    "commands": [
      { "command": "hello.say", "title": "Say Hello", "category": "Hello" }
    ],
    "keybindings": [
      { "command": "hello.say", "key": "Ctrl+Alt+H" }
    ]
  }
}
```

- `name` and `publisher` together make the identifier `your-publisher-id.hello`.
- `activationEvents` says when Ferrum starts your code. Here, the first time someone runs the command.
- `contributes.commands` puts "Hello: Say Hello" in the command palette.

Change `publisher` to a publisher id you own. You will create one in step 7. For trying it locally, any id works.

## 4. Read the code

```js
// extension.js
exports.activate = function (context) {
  context.subscriptions.push(
    ferrum.commands.register('hello.say', async () => {
      const name = await ferrum.window.showInputBox({ prompt: 'Who should I greet?', value: 'world' });
      if (name === undefined) return; // the person pressed Escape
      ferrum.window.showMessage('Hello, ' + name + '!');
    }),
  );
};

exports.deactivate = function () {};
```

`activate` runs once, when an activation event happens. It receives a `context`; anything you put in `context.subscriptions` is cleaned up when the extension is turned off.

## 5. Try it

In Ferrum, open the command palette (Ctrl+Shift+P) and run **Extensions: Install from Folder**, then pick your `hello` folder. The extension is installed in development mode: Ferrum reads the files from your folder, and **Extensions: Reload Extensions** picks up your changes without installing again.

Now run **Hello: Say Hello** from the palette, or press Ctrl+Alt+H.

## 6. Do something with the open file

Replace the command with one that uses the editor:

```js
ferrum.commands.register('hello.say', async () => {
  const doc = ferrum.editor.active();
  if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
  await ferrum.editor.insert('// Hello from my extension!\n');
});
```

Run **Extensions: Reload Extensions** and try it again. `ferrum.editor.insert` replaces the selection (or inserts at the cursor) as one undoable edit.

## 7. Package and publish

1. [Create an account](/register), then create a **publisher** on your [account page](/account). Use its id as `publisher` in `ferrum.json`.
2. Run:

```bash
ferrum-ext package
```

   It checks the manifest and makes `your-publisher-id.hello-0.1.0.fext`.
3. Publish it. Either upload the file on the [Publish page](/publish), or create a token on your account page and run:

```bash
ferrum-ext publish --token fxt_your_token
```

Within a minute your extension is on the marketplace. To release an update, raise `version` in `ferrum.json` (it must be higher than the last one) and package and publish again.

## Next steps

- Add a [theme](/docs/themes), a [language](/docs/languages) or [snippets](/docs/snippets).
- Learn the whole [JavaScript API](/docs/api).
- Read [Testing and debugging](/docs/testing).
