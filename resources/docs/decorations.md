# Decorations

A **decoration** is something an extension paints on top of the text of a file: a background behind a color, a wavy underline, a note after a line, a star in the gutter. It does not change the file. It is only drawn, and it disappears when the extension is turned off.

Decorations arrived with extension API level **0.1.1**: an extension that uses them should say `"engines": { "ferrum": "^0.1.1" }`, so editors that do not have them do not install it. They need **no permission**, because they only affect the file the person already has open.

```js
exports.activate = function (context) {
  // 1. Make a type: how it looks.
  const warn = ferrum.editor.createDecorationType({
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    textDecoration: 'underline wavy',
  });
  context.subscriptions.push(warn);

  // 2. Say where to use it, in the open file.
  async function paint() {
    const doc = await ferrum.editor.active();
    if (!doc) return;
    const ranges = [];
    doc.text.split('\n').forEach((line, i) => {
      const col = line.indexOf('TODO');
      if (col >= 0) ranges.push({ start: { line: i, col }, end: { line: i, col: col + 4 }, hoverMessage: 'Something to do' });
    });
    await ferrum.editor.setDecorations(warn, ranges);
  }

  // 3. Paint again when the text changes.
  context.subscriptions.push(
    ferrum.events.on('change', paint),
    ferrum.events.on('activeChanged', paint),
  );
  paint();
};
```

## ferrum.editor.createDecorationType(options)

Returns a type: `{ id, dispose() }`. Disposing it removes every decoration of that type. An extension can make **30 types**; make them once, at activation, and reuse them.

| Option | Description |
| --- | --- |
| `color` | Text color. |
| `backgroundColor` | Background behind the range. |
| `fontWeight` | `normal`, `bold`, or `100` to `900`. |
| `fontStyle` | `normal` or `italic`. |
| `textDecoration` | `underline`, `line-through`, `overline`, `underline wavy`, `underline dotted`, `underline dashed` or `underline double`. |
| `border` | For example `1px solid #ff0000`. Width 1 to 99 px; `solid`, `dashed` or `dotted`. |
| `borderRadius` | A number of pixels, 0 to 20. |
| `opacity` | 0.1 to 1. |
| `outline` | Like `border`. |
| `isWholeLine` | `true` makes the background cover the whole line, not only the range. |
| `gutterText` | One or two characters shown next to the line number, such as `★` or `!`. |
| `gutterColor` | The color of that text. |
| `after` | `{ contentText, color?, backgroundColor?, fontStyle?, fontWeight? }`: a note drawn after the end of the line. |

Colors are `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, a color name, or `var(--accent)` (and the other editor variables) so a decoration can follow the theme. Anything else is ignored. Values are checked: `url(...)` and other CSS tricks never reach the page.

## ferrum.editor.setDecorations(type, ranges, path?)

Sets where `type` is used, **replacing** what it marked before in that file. Pass an empty array to clear it. By default it applies to the file being edited; pass `path` (from `ferrum.editor.active()`) to target another open file.

Each range:

| Key | Description |
| --- | --- |
| `start`, `end` | Positions `{ line, col }`, both from 0. A range can span lines. An `end` equal to `start` marks nothing inline but still draws the gutter mark, whole-line background and `after` note of that line. |
| `hoverMessage` | Text shown when the pointer rests on the range. |
| `after` | A note after this line, replacing the type's own. |
| `style` | Any of the type options above, **for this range only**. This is how a color extension gives each color its own background. |

Limits: 10,000 ranges per call, 200 characters per note. Notes appear after the end of the line (after the blame or inlay hint, if there is one). They do not push the code sideways.

## Keeping decorations up to date

Decorations are positions in the text, so they go stale when the text changes. Subscribe to these [events](/docs/api#ferrumevents):

| Event | When |
| --- | --- |
| `change` | The text of the open file changed (typing, undo, a command). Sent once things settle, about 150 ms after the last change. |
| `activeChanged` | The person switched to another file. |
| `open` | A file was opened. |
| `save` | A file was saved. |

Repaint on `change`, and make `paint` cheap: scan only what you need and cap the work (for example the first few thousand lines of a huge file).

## Tips

- **One type per look.** Create types at activation, not inside `paint`.
- **Whole-line highlights**: `isWholeLine: true` with `backgroundColor`, and a range whose `start` and `end` are the same position on the line.
- **Gutter marks**: `gutterText: '★'` with a zero-width range on the line.
- **Notes after a line** (like an error lens): give the range an `after: { contentText: '...' }` of its own.
- **Do not decorate everything.** Thousands of ranges per file are fine; hundreds of thousands are not.
- Decorations are drawn over the syntax colors, so a `color` replaces the token color for that range and a `backgroundColor` sits behind it.

## Examples

These official extensions use decorations and are good to read: **Color Swatches**, **TODO Highlight**, **Trailing Whitespace**, **Indent Rainbow**, **Long Lines** and **Bookmarks** (gutter star and line highlight).
