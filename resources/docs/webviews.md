# Panels with HTML

An extension can open a **panel**: a tab inside the editor that shows a web page the extension provides. Use it for previews, dashboards and forms.

```js
const panel = await ferrum.window.showPanel({
  title: 'Word count',
  html: `
    <h1 id="n">0</h1>
    <p>words in the open file</p>
    <button id="b">Refresh</button>
    <script>
      document.getElementById('b').onclick = () => ferrumPanel.postMessage({ type: 'refresh' });
      ferrumPanel.onMessage((m) => { if (m.type === 'count') document.getElementById('n').textContent = m.value; });
    </script>`,
});

panel.onMessage(async (m) => {
  if (m.type !== 'refresh') return;
  const doc = ferrum.editor.active();
  panel.postMessage({ type: 'count', value: doc ? doc.text.split(/\s+/).filter(Boolean).length : 0 });
});
```

## The panel object

| Member | Description |
| --- | --- |
| `panel.postMessage(data)` | Sends JSON data to the page. |
| `panel.onMessage(fn)` | `fn(data)` runs when the page sends a message. Returns a disposable. |
| `panel.setHtml(html)` | Replaces the page. |
| `panel.setTitle(title)` | Renames the tab. |
| `panel.onDidClose(fn)` | Runs when the person closes the tab. |
| `panel.close()` | Closes it. |

## Inside the page

The page runs in a locked frame. A small object, `ferrumPanel`, is added to it:

| Member | Description |
| --- | --- |
| `ferrumPanel.postMessage(data)` | Sends JSON data to your extension. |
| `ferrumPanel.onMessage(fn)` | `fn(data)` runs when the extension sends a message. |
| `ferrumPanel.theme` | `"dark"` or `"light"`. |

The page also receives the editor's colors as CSS variables, so it can match the theme: `--bg`, `--fg`, `--fg-dim`, `--accent`, `--border`, `--raised`, `--mono`, `--ui`.

```html
<style>body { background: var(--bg); color: var(--fg); font-family: var(--ui); }</style>
```

## Limits and safety

- The page is in a **sandboxed frame**: it can run scripts but has no access to the editor, cookies or storage, and it **cannot make network requests** or load outside images, styles or scripts. Put everything in the HTML you pass, or use `data:` images.
- HTML is limited to 1 MB. Messages must be JSON and small.
- A panel keeps its content while its tab is in the background.
- Panels are for the person's own use; they do not run in Restricted Mode.
