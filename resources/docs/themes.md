# Color themes

A theme changes the colors of the whole editor: the interface, the text and the syntax colors. A theme extension needs no code.

## Make a theme

1. Create a theme file. Ferrum reads the **VS Code color theme format**, so you can start from any VS Code theme you are allowed to reuse, or write your own.
2. Point at it in the manifest:

```json
{
  "name": "night-owl",
  "publisher": "acme",
  "version": "1.0.0",
  "displayName": "Night Owl",
  "description": "A dark theme for late nights.",
  "engines": { "ferrum": "^0.1.0" },
  "categories": ["Themes"],
  "contributes": {
    "themes": [
      { "label": "Night Owl", "path": "themes/night-owl.json", "uiTheme": "dark" }
    ]
  }
}
```

A package may contain several themes, for example a dark and a light variant.

## The theme file

```json
{
  "name": "Night Owl",
  "type": "dark",
  "colors": {
    "editor.background": "#011627",
    "editor.foreground": "#d6deeb",
    "sideBar.background": "#010e1a",
    "activityBar.background": "#010e1a",
    "focusBorder": "#5f7e97",
    "editor.selectionBackground": "#1d3b53",
    "editorCursor.foreground": "#80a4c2"
  },
  "tokenColors": [
    { "scope": ["comment"], "settings": { "foreground": "#637777" } },
    { "scope": ["string"], "settings": { "foreground": "#ecc48d" } },
    { "scope": ["constant.numeric"], "settings": { "foreground": "#f78c6c" } },
    { "scope": ["keyword", "storage"], "settings": { "foreground": "#c792ea" } },
    { "scope": ["entity.name.function"], "settings": { "foreground": "#82aaff" } }
  ]
}
```

Comments and trailing commas are allowed in the file, as in VS Code.

### Which colors Ferrum reads

Ferrum has about 35 colors; each is taken from the nearest VS Code color. Anything you leave out is worked out from the background and text colors, so a theme with only `editor.background`, `editor.foreground` and a few `tokenColors` already looks complete.

| Ferrum uses | Read from |
| --- | --- |
| Editor background | `editor.background` |
| Text | `editor.foreground` or `foreground` |
| Side bar | `sideBar.background` |
| Activity and title bar | `activityBar.background`, `titleBar.activeBackground` |
| Tabs | `tab.inactiveBackground`, `tab.activeForeground` |
| Hover and selected rows | `list.hoverBackground`, `list.activeSelectionBackground` |
| Inputs and widgets | `input.background`, `editorWidget.background` |
| Borders | `panel.border`, `editorGroup.border` |
| Accent | `focusBorder`, `button.background` |
| Links | `textLink.foreground` |
| Selection, find, current line | `editor.selectionBackground`, `editor.findMatchHighlightBackground`, `editor.lineHighlightBackground` |
| Cursor | `editorCursor.foreground` |
| Indent guides | `editorIndentGuide.background` |
| Errors | `errorForeground` |
| Git colors | `gitDecoration.*ResourceForeground` |

### Syntax colors

Ferrum colors code with eleven kinds of token. Each one reads the most specific matching `tokenColors` scope:

| Token | Scopes tried, in order |
| --- | --- |
| Comment | `comment` |
| String | `string` |
| Number | `constant.numeric` |
| Keyword | `keyword`, `storage.modifier`, `storage` |
| Type | `entity.name.type`, `support.type`, `support.class`, `entity.name.class`, `storage.type` |
| Function | `entity.name.function`, `support.function`, `meta.function-call` |
| Constant | `constant.language`, `constant`, `variable.other.constant` |
| Macro | `entity.name.function.macro`, `meta.preprocessor` |
| Property | `variable.other.property`, `support.type.property-name`, `meta.object-literal.key` |
| Tag | `entity.name.tag`, `meta.tag` |
| Attribute | `entity.other.attribute-name` |

`uiTheme` (or `type` in the file) decides whether the theme sits on Ferrum's dark or light base for everything you do not set.

## Try it

Use **Extensions: Install from Folder**, then pick your theme in **Preferences: Open Settings > Theme**. After a change to the theme file, run **Extensions: Reload Extensions**.

## File icon themes

A file icon theme changes the icons in the explorer. The file maps file types to Codicon names and colors:

```json
{
  "folder": { "icon": "folder", "color": "#e5c07b" },
  "folderOpen": { "icon": "folder-opened", "color": "#e5c07b" },
  "file": { "icon": "file", "color": "#8a8f98" },
  "extensions": {
    "rs": { "icon": "symbol-event", "color": "#e8946a" },
    "ts": { "icon": "symbol-namespace", "color": "#5aa9e6" }
  },
  "names": {
    "package.json": { "icon": "package", "color": "#e06c6c" }
  },
  "folderNames": {
    "src": { "icon": "folder-library", "color": "#6bb7ff" }
  }
}
```

- `folder`, `folderOpen`, `file`: the defaults.
- `extensions`: by file ending without the dot, lower case.
- `names`: by exact file name, lower case.
- `folderNames`: by folder name, lower case.
- `icon` is the name of a [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) without the `codicon-` prefix. `color` is any CSS color.

Declare it with `contributes.iconThemes`, and the person picks it in **Settings > File icon theme**.

## Tips

- Keep text contrast readable: aim for a contrast ratio of at least 4.5 between the text and the background.
- Check the theme on a long file with comments, strings and numbers, on the Git panel, and with a selection.
- Add a screenshot to your README. Use an `https://` image address; images are shown on the marketplace page.
