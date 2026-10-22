# Testing and debugging

You can try an extension in the editor before you package it, with no account and no upload.

## Install from a folder

Open the command palette and run **Extensions: Install from Folder**. Pick your extension's folder (the one with `ferrum.json`). Ferrum installs it in **development mode**:

- The extension is marked "development" in the Extensions view.
- Ferrum **reads the files from your folder** each time it loads the extension, so you do not have to install again after a change.
- After you change a file, run **Extensions: Reload Extensions**. Ferrum stops every extension, reads the files again and starts the ones that should be running.

Use **Extensions: Install from File** to try a packaged `.fext` file the way a user would.

## Look at the log

Run **Extensions: Show Log**. It lists everything extensions print with `console.log`, `console.warn` and `console.error`, errors that were not caught, activation times, and refused calls (a missing permission, a path outside the folder). It is the first place to look when something does not happen.

```js
console.log('activated', context.extensionId);
ferrum.commands.register('acme.run', async () => {
  try { /* ... */ } catch (e) { console.error('acme.run failed', e); throw e; }
});
```

## Common mistakes

| Symptom | Likely cause |
| --- | --- |
| The command is in the palette but nothing happens | `exports.activate` threw an error (see the log), or the command id in `register` does not match the manifest. |
| "Permission denied: workspace.read" | Add the permission to `permissions` in the manifest, reload. |
| The extension does not start | No `activationEvents` fire. Add `onStartup` to test, or use the right event. |
| "Extension is not trusted here" | The folder is in Restricted Mode. Trust it with **Workspace: Manage Trust**. |
| Theme looks wrong | A color is missing or a scope does not match; compare with the table in [Color themes](/docs/themes). |
| The grammar colors nothing | The `match` is not a valid regular expression, or the doubled backslashes are wrong (see the log). |
| Reload shows the old behaviour | You edited a copy. Development mode reads the folder you picked; check the path in the Extensions view. |

## Check the package

`ferrum-ext package` runs the same checks as the marketplace (manifest rules, file paths, sizes, that every file the manifest points to exists). If it passes, the upload will not be refused for those reasons.

```bash
ferrum-ext package        # builds acme.hello-0.1.0.fext and prints what is inside
ferrum-ext check          # runs the checks only
```

## A test checklist before you publish

1. A fresh folder with no files from your project, in Restricted Mode (extensions' code must not run) and in a trusted folder.
2. Every command from the palette, with and without an open file, with and without a selection.
3. A file that is read-only, an empty file, a very large file.
4. Turn the extension off and on, then uninstall: the commands, themes and snippets must disappear.
5. Read your README as a stranger: does it say what the extension does, what each permission is for, and show a screenshot?
