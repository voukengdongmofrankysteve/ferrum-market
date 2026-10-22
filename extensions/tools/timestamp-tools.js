// Timestamp Tools: read Unix times and dates, convert between them, and see how long ago something was.

function parseWhen(s) {
  s = s.trim();
  if (/^-?\d{9,10}$/.test(s)) return new Date(Number(s) * 1000);
  if (/^-?\d{12,13}$/.test(s)) return new Date(Number(s));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function ago(d, now = new Date()) {
  const sec = Math.round((now.getTime() - d.getTime()) / 1000);
  const abs = Math.abs(sec);
  const units = [['year', 31557600], ['month', 2629800], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  for (const [name, size] of units) {
    if (abs >= size || name === 'second') {
      const n = Math.floor(abs / size);
      const label = n + ' ' + name + (n === 1 ? '' : 's');
      return sec >= 0 ? label + ' ago' : 'in ' + label;
    }
  }
  return '';
}

function pad(n) {
  return String(n).padStart(2, '0');
}
function local(d) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + sign + pad(Math.floor(Math.abs(off) / 60)) + ':' + pad(Math.abs(off) % 60);
}

function describe(d) {
  return [
    ['Unix seconds', String(Math.floor(d.getTime() / 1000))],
    ['Unix milliseconds', String(d.getTime())],
    ['ISO 8601 (UTC)', d.toISOString()],
    ['ISO 8601 (local)', local(d)],
    ['RFC 2822 (UTC)', d.toUTCString()],
    ['Relative', ago(d)],
  ];
}

exports._test = { parseWhen, ago, describe, local };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  reg('timestampTools.convertSelection', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
    let s = doc.selectedText;
    if (!s) s = await ferrum.window.showInputBox({ prompt: 'A Unix time or a date to convert', placeholder: '1767225600 or 2026-01-01T00:00:00Z' });
    if (!s) return;
    const d = parseWhen(s);
    if (!d) return ferrum.window.showMessage('Could not read "' + s + '" as a date or a Unix time.', 'error');
    const rows = describe(d);
    const pick = await ferrum.window.showQuickPick(rows.map(([label, value]) => ({ label: value, detail: label })), { placeholder: 'Insert one of these in place of the selection' });
    if (pick) await ferrum.editor.insert(pick.label);
  });

  reg('timestampTools.show', async () => {
    const doc = await ferrum.editor.active();
    const s = (doc && doc.selectedText) || (await ferrum.window.showInputBox({ prompt: 'A Unix time or a date', placeholder: '1767225600' }));
    if (!s) return;
    const d = parseWhen(s);
    if (!d) return ferrum.window.showMessage('Could not read "' + s + '" as a date or a Unix time.', 'error');
    ferrum.window.showMessage(describe(d).map(([k, v]) => k + ': ' + v).join('   |   '));
  });

  reg('timestampTools.now', async () => {
    const d = new Date();
    const pick = await ferrum.window.showQuickPick(describe(d).slice(0, 5).map(([label, value]) => ({ label: value, detail: label })), { placeholder: 'Insert the current time as...' });
    if (pick) await ferrum.editor.insert(pick.label);
  });

  reg('timestampTools.timestampsInFile', async () => {
    const doc = await ferrum.editor.active();
    if (!doc) return ferrum.window.showMessage('Open a file first.', 'warn');
    const found = [];
    doc.text.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/\b(1[0-9]{9}(?:[0-9]{3})?)\b/g)) {
        const d = parseWhen(m[1]);
        if (d) found.push({ label: d.toISOString() + '   (' + ago(d) + ')', detail: 'line ' + (i + 1) + ': ' + m[1], line: i, col: m.index, len: m[1].length });
      }
    });
    if (!found.length) return ferrum.window.showMessage('No Unix timestamps found in this file.');
    const pick = await ferrum.window.showQuickPick(found, { placeholder: found.length + ' timestamps found. Pick one to go there.' });
    if (pick) await ferrum.editor.setSelection({ line: pick.line, col: pick.col }, { line: pick.line, col: pick.col + pick.len });
  });
};

exports.deactivate = function () {};
