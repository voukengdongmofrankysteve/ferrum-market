# Permissions and security

Extensions are code written by other people. Ferrum is built so that installing one is a decision you can understand, and so that a mistake in an extension stays small.

## What the person sees

Before an extension is installed, Ferrum shows its name, publisher and **permissions**, and waits for a yes. The marketplace page shows the same list. An extension that asks for nothing says "Asks for no special permissions".

## The permissions

Declare what your code needs in `permissions` in the manifest. Ask for the least you can.

| Permission | What it allows |
| --- | --- |
| `workspace.read` | Read files in the open folder: `workspace.readFile`, `listFiles`, `editor.openFile`. |
| `workspace.write` | Create and change files in the open folder: `workspace.writeFile`. |
| `terminal` | Type commands into the terminal: `terminal.run`. |
| `network` | Use the internet: `network.fetch`. |
| `clipboard` | Read and write the clipboard. |

Reading and editing **the file the person is looking at** through `ferrum.editor` needs no permission: it is what extensions are for, and every edit is one undoable step.

Themes, snippets, languages, icon themes, commands and keybindings run no code and need no permission.

## How it is enforced

- Your code runs in a **Web Worker**, which has no access to the editor's page, its memory or its storage.
- Every call out of the worker goes to the editor, which checks the permission **in the editor**, not in the worker. A call without the permission is refused, whatever the worker does.
- Files are limited to the **open folder**. Paths are resolved and checked; `..` and absolute paths outside the folder are refused.
- In a worker without the `network` permission, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `importScripts` and nested workers are removed before your code loads.
- Extension code does not run at all in a folder that is not **trusted** (Restricted Mode).
- An extension that does not answer for 10 seconds while starting, or fails repeatedly, is turned off.

## What is not guaranteed

Be honest with yourself and your users about the limits:

- The marketplace **does not review the code** of extensions. A publisher is an account anyone can create. Install extensions from people you trust, and read the permissions.
- Removing `fetch` from a worker is a barrier, not a vault: the real protection against leaking data is that without `workspace.read` the extension cannot read your files in the first place. An extension with both `workspace.read` and `network` can send files from your folder to the internet. Treat that combination with care, as a user and as a publisher.
- Panels (`showPanel`) are sandboxed pages, but a panel can still show whatever its author wants.

## For publishers

- Ask for the least permissions. Users and reviewers notice `network` plus `workspace.read`.
- Never put secrets (API keys, tokens) in the package. It is public.
- Do not download and run code at run time.
- Say in your README what each permission is for.
- To report an extension that behaves badly, write to the marketplace administrators from the contact in the footer. Administrators can hide an extension at once.

## For users

- Prefer extensions with the **verified publisher** badge, many installs, reviews and a linked source repository.
- In a project you do not know, stay in Restricted Mode.
- You can disable or uninstall any extension at any time in the Extensions view; this removes everything it contributed.
