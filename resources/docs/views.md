# Sidebar views

An extension can add its own **icon to the activity bar** (the column of icons on the left) and fill the sidebar with **views**: a **tree** of items it supplies, or a **page of HTML**. Typical uses are an outline, a list of tasks or bookmarks, a scripts runner, a notes pad or a set of buttons.

Sidebar views arrived with extension API level **0.1.1**: an extension that uses them should say `"engines": { "ferrum": "^0.1.1" }`. Views need no permission of their own. What the extension does inside them (reading files, running commands) needs the permission it always needed.

## Declare it in ferrum.json

```json
{
  "activationEvents": ["onView:todo.items"],
  "contributes": {
    "viewsContainers": [
      { "id": "todo", "title": "TODO", "icon": "checklist" }
    ],
    "views": [
      { "id": "todo.items", "name": "Items", "container": "todo", "type": "tree" }
    ],
    "commands": [
      { "command": "todo.openAt", "title": "Open TODO", "hidden": true }
    ]
  }
}
```

| Key | Description |
| --- | --- |
| `viewsContainers[].id` | Lower case letters, digits and dashes. Up to 3 containers per extension. |
| `viewsContainers[].title` | The heading of the sidebar and the tooltip of the icon (30 characters at most). |
| `viewsContainers[].icon` | A [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) name such as `checklist`, `bookmark`, `package`, `symbol-class`, `history`. |
| `views[].id` | 3 to 80 letters, digits, dots, dashes or underscores. Up to 6 views per extension. |
| `views[].name` | The section title (40 characters at most). |
| `views[].container` | The `id` of one of **your** containers. |
| `views[].type` | `tree` (default) or `html`. |
| `commands[].hidden` | `true` keeps a command out of the command palette. Use it for commands that exist only to be run by a click in a tree. |

The icon appears as soon as the extension is installed and turned on, even before your code runs. When the person opens the container, Ferrum starts your extension if it lists `onView:<view id>` in `activationEvents` (or `onStartup`). A container also gets the palette command **View: Show &lt;title&gt;**.

In **Restricted Mode** the container is shown but its views say that the folder must be trusted, because extension code does not run there.

## Tree views

```js
exports.activate = function (context) {
  const view = ferrum.window.registerTreeView('todo.items', {
    // Called for the top level (element is undefined) and again for an item that is opened.
    async getChildren(element) {
      if (!element) {
        return [
          { id: 'f:a.js', label: 'a.js', description: '2', icon: 'file', collapsible: 'expanded' },
          { id: 'f:b.js', label: 'b.js', description: '1', icon: 'file', collapsible: 'collapsed' },
        ];
      }
      return [{ id: element.id + ':1', label: 'fix this', icon: 'circle-filled', color: '#3b82f6', command: 'todo.openAt', args: ['a.js', 1] }];
    },
  });
  context.subscriptions.push(view);

  context.subscriptions.push(
    ferrum.commands.register('todo.openAt', (file, line) => ferrum.editor.openFile(file, { line, col: 0 })),
  );
};
```

`registerTreeView(viewId, provider)` returns a handle:

| Member | Description |
| --- | --- |
| `refresh()` | Asks Ferrum to call `getChildren` again. Call it when your data changed (a file was saved, a scan finished). |
| `setBadge(n)` | A count shown on the section and on the activity bar icon. `0` or `undefined` removes it. |
| `setTitle(text)` | Changes the section title. |
| `dispose()` | Removes the view. |

`getChildren(element)` may return an array or a promise of one. `element` is the same item object you returned earlier. Ferrum asks for the children of an item only when it is opened.

### Items

| Key | Description |
| --- | --- |
| `id` | **Required.** Unique among your items. Used to ask for children. |
| `label` | **Required.** The text. |
| `description` | Dimmer text after the label. |
| `tooltip` | Text on hover. |
| `icon` | A Codicon name. |
| `color` | The icon's color, or the label's if there is no icon (same colors as [decorations](/docs/decorations)). |
| `collapsible` | `none` (default), `collapsed` or `expanded`. |
| `command` | A command to run when the item is clicked: one of yours (declare it in `contributes.commands`, use `hidden: true` to keep it out of the palette) or an editor command. |
| `args` | A list of JSON values passed to the command (2 KB at most). |

Up to 2,000 items per level. A slow `getChildren` is stopped after 30 seconds.

## HTML views

```js
const page = ferrum.window.registerHtmlView('notes.page', {
  html: '<h3>Notes</h3><textarea id="t"></textarea><script>/* ... */</script>',
});
page.onMessage((m) => { /* messages from the page */ });
page.postMessage({ type: 'saved' });   // to the page
page.setHtml('<p>New content</p>');
page.setBadge(3);
```

The page works exactly like a [panel](/docs/webviews): a locked frame, the `ferrumPanel.postMessage` and `ferrumPanel.onMessage` bridge, the editor's colors as CSS variables, no network. It is simply shown in the sidebar instead of in a tab. When the person switches to another sidebar view and comes back, the page is built again from the last HTML you gave it, so keep what matters in `ferrum.storage` and send it to the page when it starts.

## Things to know

- A view must be declared in `ferrum.json` before you register it: `registerTreeView('x')` fails if `x` is not in `contributes.views`, or if its `type` does not match.
- Register your views in `activate`, so they are ready when the sidebar asks.
- The views of an extension disappear when it is turned off or stops.
- Selecting a tree item runs its `command`; opening and closing is handled by Ferrum.

## Examples

Official extensions that use views: **Outline Lite** (a tree of the open file), **Bookmarks** and **TODO Tree** (grouped trees), **NPM Scripts** (click to run), **Recent Files** (remembered between sessions), **Quick Notes** and **Git Quick Actions** (HTML pages).
