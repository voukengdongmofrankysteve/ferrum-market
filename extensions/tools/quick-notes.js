// Quick Notes: a notepad panel for each project. Notes are saved by the editor and come back next time.

const CSS = `<style>
  body { font-family: var(--ui); }
  .bar { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
  .bar b { flex: 1; }
  textarea { width: 100%; height: calc(100vh - 120px); min-height: 220px; box-sizing: border-box; background: var(--raised, transparent); color: var(--fg); border: 1px solid var(--border); border-radius: 6px; padding: 10px; font: 13px/1.55 var(--mono, monospace); resize: none; outline: none; }
  textarea:focus { border-color: var(--accent); }
  button { background: var(--raised, transparent); color: var(--fg); border: 1px solid var(--border); border-radius: 5px; padding: 4px 10px; cursor: pointer; }
  button:hover { border-color: var(--accent); }
  .dim { color: var(--fg-dim); font-size: 12px; }
</style>`;

function html(name, text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return CSS + `<div class="bar"><b>Notes: ${esc(name)}</b><span class="dim" id="state">Saved</span><button id="send">Insert into file</button><button id="clear">Clear</button></div>
<textarea id="t" spellcheck="true" placeholder="Write anything: ideas, to-dos, commands you keep forgetting...">${esc(text)}</textarea>
<script>
  const t = document.getElementById('t'), s = document.getElementById('state');
  let timer = null;
  t.addEventListener('input', () => { s.textContent = 'Typing...'; clearTimeout(timer); timer = setTimeout(() => { ferrumPanel.postMessage({ type: 'save', text: t.value }); s.textContent = 'Saving...'; }, 500); });
  document.getElementById('send').onclick = () => ferrumPanel.postMessage({ type: 'insert', text: t.value });
  document.getElementById('clear').onclick = () => { t.value = ''; ferrumPanel.postMessage({ type: 'save', text: '' }); };
  ferrumPanel.onMessage((m) => { if (m.type === 'saved') s.textContent = 'Saved'; });
</script>`;
}

exports._test = { html };

exports.activate = function (context) {
  let panel = null;
  const project = () => ferrum.workspace.root || '(no folder)';
  const label = () => (project().split(/[\\/]/).filter(Boolean).pop() || 'No folder');
  const read = async () => (await ferrum.storage.get('notes.v1', {}))[project()] || '';

  context.subscriptions.push(
    ferrum.commands.register('quickNotes.open', async () => {
      if (panel) {
        panel.setHtml(html(label(), await read()));
        return;
      }
      panel = await ferrum.window.showPanel({ title: 'Quick Notes', html: html(label(), await read()) });
      panel.onDidClose(() => (panel = null));
      panel.onMessage(async (m) => {
        if (m.type === 'save') {
          const all = await ferrum.storage.get('notes.v1', {});
          if (m.text) all[project()] = String(m.text).slice(0, 200000);
          else delete all[project()];
          await ferrum.storage.set('notes.v1', all);
          panel.postMessage({ type: 'saved' });
        } else if (m.type === 'insert') {
          const doc = await ferrum.editor.active();
          if (!doc) return ferrum.window.showMessage('Open a file to insert the notes into.', 'warn');
          await ferrum.editor.insert(String(m.text || ''));
        }
      });
    }),
    ferrum.commands.register('quickNotes.addSelection', async () => {
      const doc = await ferrum.editor.active();
      if (!doc || !doc.selectedText) return ferrum.window.showMessage('Select some text to keep as a note.', 'warn');
      const all = await ferrum.storage.get('notes.v1', {});
      const where = doc.name + (doc.path ? '' : ' (unsaved)') + ':' + (doc.selection.start.line + 1);
      all[project()] = ((all[project()] || '') + (all[project()] ? '\n\n' : '') + '--- ' + where + '\n' + doc.selectedText).slice(0, 200000);
      await ferrum.storage.set('notes.v1', all);
      ferrum.window.showMessage('Added to Quick Notes.');
      if (panel) panel.setHtml(html(label(), all[project()]));
    }),
  );
};

exports.deactivate = function () {};
