# Extensions overview

Ferrum extensions add things to the editor without changing the editor itself. An extension can:

- add **color themes** and **file icon themes**
- add **languages**, with their own syntax colors, comment markers and file types
- add **snippets** that expand with the Tab key
- add **commands** to the command palette and bind **keyboard shortcuts** to them
- add **settings** that people can change
- run **JavaScript** that reads and changes the open file, shows messages, panels and status bar items, and reacts to events such as saving a file

Extensions are shared through the **Ferrum Marketplace**, this site. People find them in the **Extensions** view inside the editor (the puzzle icon in the sidebar), read the description here or there, and press **Install**.

## How it fits together

1. You write an extension: a folder with a `ferrum.json` file (the manifest), and optional files such as a theme, a grammar, snippets and a JavaScript file.
2. You run `ferrum-ext package`. It makes one file, `name-1.0.0.fext`, that holds everything.
3. You publish the file on the marketplace: upload it on the [Publish page](/publish), or run `ferrum-ext publish`.
4. Anyone can install it from the editor. Ferrum downloads the `.fext` file, checks it, stores it on their computer and turns it on.

## What Ferrum extensions are not

Ferrum is its own editor. Its extension system borrows ideas from VS Code, such as a manifest with contribution points and activation events, but **VS Code extensions do not run in Ferrum**. The API is different and smaller on purpose. Two things do carry over:

- **VS Code color themes** work as they are. A `contributes.themes` entry can point at a VS Code theme file.
- **VS Code snippet files** work as they are.

## How code runs

An extension's JavaScript runs in a **Web Worker**, away from the editor's own code. It cannot touch the editor's page. It talks to the editor through the `ferrum` object, and every call that reaches outside the extension (reading a file, running a command, using the network) is checked against the **permissions** the extension declared and the user accepted at install time. Read [Permissions and security](/docs/permissions) before you publish code.

Extensions only run in a folder you have marked as trusted. In **Restricted Mode** only the passive parts (themes, snippets, languages, icon themes) are active; code does not run.

## Where to go next

- [Your first extension](/docs/getting-started): a working Hello World in ten minutes.
- [Anatomy of an extension](/docs/anatomy): the files and how they are loaded.
- [Manifest reference](/docs/manifest) and [Contribution points](/docs/contribution-points).
- [JavaScript API](/docs/api).
- [Publishing](/docs/publishing) and the [ferrum-ext tool](/docs/cli).
