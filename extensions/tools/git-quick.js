// Git Quick Actions: the git commands you use all day, one command away. Everything runs visibly in the terminal.

// Double quotes work in cmd, PowerShell and Bash. Anything a shell would treat specially inside them is refused.
const q = (s) => {
  const t = String(s);
  if (/["$`\\!%^]/.test(t)) throw new Error('That text has a character that is not safe to type into a shell (double quote, dollar, backtick, backslash, !, %, ^). Use the terminal for it.');
  return '"' + t + '"';
};
/** Paths are written with forward slashes, which every shell and git accept. */
const qpath = (p) => q(String(p).replace(/\\/g, '/'));

/** A commit message must be one line without anything a shell would treat specially. */
function commitCommand(message, all) {
  const m = String(message).trim();
  if (!m) throw new Error('A commit message cannot be empty.');
  if (/[\r\n]/.test(m)) throw new Error('Use a one line message here.');
  return (all ? 'git add -A && ' : '') + 'git commit -m ' + q(m);
}

function branchName(s) {
  const b = String(s).trim().replace(/\s+/g, '-');
  if (!/^[A-Za-z0-9._\/-]+$/.test(b) || b.startsWith('-') || b.includes('..') || b.endsWith('/') || b.endsWith('.lock')) throw new Error('That is not a good branch name. Use letters, digits, dots, dashes and slashes.');
  return b;
}

exports._test = { q, qpath, commitCommand, branchName };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));
  const run = (cmd) => ferrum.terminal.run(cmd);
  const simple = {
    'gitQuick.status': 'git status -sb', 'gitQuick.pull': 'git pull --ff-only', 'gitQuick.push': 'git push', 'gitQuick.fetch': 'git fetch --all --prune',
    'gitQuick.log': 'git log --oneline --graph --decorate -20', 'gitQuick.diff': 'git diff', 'gitQuick.diffStaged': 'git diff --staged', 'gitQuick.stash': 'git stash push -u',
    'gitQuick.stashPop': 'git stash pop', 'gitQuick.undoCommit': 'git reset --soft HEAD~1', 'gitQuick.discardUnstaged': null, 'gitQuick.branches': 'git branch -vv',
    'gitQuick.remotes': 'git remote -v', 'gitQuick.amend': 'git commit --amend --no-edit', 'gitQuick.tags': 'git tag --sort=-creatordate | head -20',
  };
  for (const [id, cmd] of Object.entries(simple)) {
    if (cmd) reg(id, () => run(cmd));
  }

  reg('gitQuick.discardUnstaged', async () => {
    if (await ferrum.window.confirm('Discard every change that is not staged? This cannot be undone.', 'Discard')) await run('git restore .');
  });
  reg('gitQuick.commit', async () => {
    const m = await ferrum.window.showInputBox({ prompt: 'Commit message (staged changes)', placeholder: 'Fix the thing' });
    if (m === undefined) return;
    try { await run(commitCommand(m, false)); } catch (e) { ferrum.window.showMessage(e.message, 'warn'); }
  });
  reg('gitQuick.commitAll', async () => {
    const m = await ferrum.window.showInputBox({ prompt: 'Commit message (stages everything first)', placeholder: 'Fix the thing' });
    if (m === undefined) return;
    try { await run(commitCommand(m, true)); } catch (e) { ferrum.window.showMessage(e.message, 'warn'); }
  });
  reg('gitQuick.newBranch', async () => {
    const n = await ferrum.window.showInputBox({ prompt: 'New branch name', placeholder: 'feature/my-change' });
    if (n === undefined) return;
    try { await run('git switch -c ' + q(branchName(n))); } catch (e) { ferrum.window.showMessage(e.message, 'warn'); }
  });
  reg('gitQuick.switchBranch', async () => {
    const n = await ferrum.window.showInputBox({ prompt: 'Switch to which branch?', placeholder: 'main' });
    if (n === undefined) return;
    try { await run('git switch ' + q(branchName(n))); } catch (e) { ferrum.window.showMessage(e.message, 'warn'); }
  });
  reg('gitQuick.tag', async () => {
    const n = await ferrum.window.showInputBox({ prompt: 'Tag name', placeholder: 'v1.0.0' });
    if (n === undefined) return;
    try { await run('git tag ' + q(branchName(n))); } catch (e) { ferrum.window.showMessage(e.message, 'warn'); }
  });
  reg('gitQuick.fileHistory', async () => {
    const doc = await ferrum.editor.active();
    if (!doc || !doc.path) return ferrum.window.showMessage('Open a saved file first.', 'warn');
    await run('git log --follow --oneline -- ' + qpath(doc.path));
  });
  reg('gitQuick.blameFile', async () => {
    const doc = await ferrum.editor.active();
    if (!doc || !doc.path) return ferrum.window.showMessage('Open a saved file first.', 'warn');
    await run('git blame ' + qpath(doc.path));
  });
};

exports.deactivate = function () {};
