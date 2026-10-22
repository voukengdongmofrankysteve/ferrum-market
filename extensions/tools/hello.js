// Hello Ferrum: a small tour of the extension API.
// Docs: https://ferrum.vyloxi.com/docs/api

const words = (text) => (text.match(/\S+/g) || []).length;

exports.activate = function (context) {
  // 1. A command with an input box and a setting.
  context.subscriptions.push(
    ferrum.commands.register('hello.say', async () => {
      const name = await ferrum.window.showInputBox({ prompt: 'Who should I greet?', value: 'world' });
      if (name === undefined) return; // the person pressed Escape
      let text = ferrum.settings.get('hello.greeting') + ', ' + name + '!';
      if (ferrum.settings.get('hello.loud')) text = text.toUpperCase();
      ferrum.window.showMessage(text);
    }),
  );

  // 2. A command that edits the open file. One undoable step.
  context.subscriptions.push(
    ferrum.commands.register('hello.upper', async () => {
      const doc = await ferrum.editor.active();
      if (!doc || !doc.selectedText) return ferrum.window.showMessage('Select some text first.', 'warn');
      await ferrum.editor.insert(doc.selectedText.toUpperCase());
    }),
  );

  // 3. A status bar item that follows the open file.
  const refresh = async () => {
    if (!ferrum.settings.get('hello.counter')) return ferrum.window.setStatusBar('hello.words', { text: '' }) && undefined;
    const doc = await ferrum.editor.active();
    ferrum.window.setStatusBar('hello.words', {
      text: doc ? words(doc.text) + ' words' : 'no file',
      tooltip: 'Click for page statistics',
      command: 'hello.stats',
    });
  };
  context.subscriptions.push(ferrum.events.on('activeChanged', refresh), ferrum.events.on('save', refresh), ferrum.events.on('settingsChanged', refresh));
  refresh();

  // 4. A panel with HTML, talking to the extension with messages.
  context.subscriptions.push(
    ferrum.commands.register('hello.stats', async () => {
      const panel = await ferrum.window.showPanel({
        title: 'Page statistics',
        html: `
          <h2>Page statistics</h2>
          <p id="out">Loading...</p>
          <button id="again">Count again</button>
          <script>
            const out = document.getElementById('out');
            document.getElementById('again').onclick = () => ferrumPanel.postMessage({ type: 'count' });
            ferrumPanel.onMessage((m) => { if (m.type === 'result') out.textContent = m.text; });
            ferrumPanel.postMessage({ type: 'count' });
          </script>`,
      });
      panel.onMessage(async (m) => {
        if (m.type !== 'count') return;
        const doc = await ferrum.editor.active();
        panel.postMessage({
          type: 'result',
          text: doc ? doc.name + ': ' + doc.lineCount + ' lines, ' + words(doc.text) + ' words, ' + doc.text.length + ' characters.' : 'Open a file first.',
        });
      });
    }),
  );
};

exports.deactivate = function () {};
