# FAQ and troubleshooting

## For users

### How do I install an extension?

In Ferrum, open **Extensions** in the sidebar, search, open an extension and press **Install**. Ferrum shows the permissions first. You can also run **Extensions: Install from File** with a `.fext` file you downloaded from a marketplace page.

### Do I need an account?

No. An account is only for publishing and reviewing. Signing in inside the editor (Extensions view, **Sign in**) lets you rate extensions from there.

### Where are extensions stored?

In Ferrum's settings folder on your computer (`extensions` inside the app's configuration folder). Uninstalling removes them.

### An extension does nothing

Check that it is **enabled** and that the folder is **trusted**: extension code does not run in Restricted Mode (status bar chip, or **Workspace: Manage Trust**). Then open **Extensions: Show Log**.

### Is it safe?

Extensions are written by other people and are not reviewed. Read the permissions, prefer verified publishers with many installs, and read [Permissions and security](/docs/permissions).

### Can I use VS Code extensions?

No: VS Code extensions use VS Code's API, which Ferrum does not have. VS Code **color themes** and **snippet files** can be reused inside a Ferrum extension, and Ferrum can also import a VS Code theme directly (**Settings > Import a VS Code theme**).

### How do I update?

The Extensions view shows an **Update** button when a newer version exists. Ferrum checks when you open the view.

## For publishers

### "version is not newer than the latest published version"

Each upload needs a higher version number than the last one. Raise `version` in `ferrum.json`.

### "You do not own the publisher"

The `publisher` in `ferrum.json` must be one of the publishers on your account. Create it on your account page or change the manifest.

### "manifest.main points to ..., which is not in the package"

The file named in `main` is missing from the package. Check the path (it is relative to the extension's folder, with forward slashes) and that `.ferrumignore` does not exclude it.

### "Unknown contribution point" or "Unknown permission"

Only the points and permissions listed in [Contribution points](/docs/contribution-points) and [Permissions](/docs/permissions) exist. A typo in a name is the usual cause.

### "The package is larger than 1.5 MB"

Remove what you do not need. For JavaScript, bundle and minify it with a tool such as esbuild. Large images belong in your repository, not in the package.

### My extension page shows no icon

`icon` must be a PNG file inside the package, 200 KB or smaller, and listed in the manifest.

### Images in my README do not show

Use `https://` addresses. Relative paths and `http://` addresses are not loaded, for the safety of readers.

### Can I delete a version?

No. Versions are permanent so that nobody's installed copy changes under them. Publish a fixed version. Administrators can hide an extension if there is a serious problem.

### Can I transfer a publisher or an extension?

Ask the administrators from the footer contact. They can move a publisher to another account after checking both owners.

## Still stuck?

Write to the administrators with the extension identifier, what you did and the exact message you saw.
