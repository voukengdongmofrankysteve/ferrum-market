// Word Count: words, characters, lines and reading time for the open file and your selection, in the status bar.

function count(text) {
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) || []).length;
  const chars = [...text].length;
  const noSpace = [...text.replace(/\s/g, '')].length;
  const lines = text === '' ? 0 : text.split('\n').length;
  const sentences = (text.match(/[^.!?\n]+[.!?]+/g) || []).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  return { words, chars, noSpace, lines, sentences, paragraphs };
}

function reading(words, wpm) {
  const min = words / Math.max(60, wpm || 220);
  if (min < 1) return Math.max(1, Math.round(min * 60)) + ' s';
  return Math.round(min) + ' min';
}

exports._test = { count, reading };

exports.activate = function (context) {
  let timer = null;

  async function refresh() {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.setStatusBar('wordCount.status', { text: '' });
    const all = count(doc.text);
    const sel = doc.selectedText ? count(doc.selectedText) : null;
    const text = sel ? sel.words + ' of ' + all.words + ' words' : all.words + ' words';
    ferrum.window.setStatusBar('wordCount.status', {
      text,
      tooltip: all.chars + ' characters, ' + all.lines + ' lines, about ' + reading(all.words, ferrum.settings.get('wordCount.wordsPerMinute')) + ' to read. Click for details.',
      command: 'wordCount.details',
    });
  }
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 150);
  };

  context.subscriptions.push(
    ferrum.events.on('activeChanged', later),
    ferrum.events.on('save', later),
    ferrum.events.on('selectionChanged', later),
    ferrum.events.on('settingsChanged', later),
    { dispose: () => clearTimeout(timer) },
  );

  context.subscriptions.push(
    ferrum.commands.register('wordCount.details', async () => {
      const doc = await ferrum.editor.active();
      if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
      const a = count(doc.text);
      const s = doc.selectedText ? count(doc.selectedText) : null;
      const rows = [
        ['Words', a.words, s && s.words], ['Characters', a.chars, s && s.chars], ['Characters without spaces', a.noSpace, s && s.noSpace],
        ['Lines', a.lines, s && s.lines], ['Sentences', a.sentences, s && s.sentences], ['Paragraphs', a.paragraphs, s && s.paragraphs],
      ].map(([k, v, sv]) => ({ label: k + ': ' + v, detail: sv === null ? '' : 'selection: ' + sv }));
      rows.push({ label: 'Reading time: ' + reading(a.words, ferrum.settings.get('wordCount.wordsPerMinute')), detail: '' });
      await ferrum.window.showQuickPick(rows, { placeholder: doc.name });
    }),
  );
  refresh();
};

exports.deactivate = function () {};
