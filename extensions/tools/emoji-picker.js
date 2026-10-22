// Emoji Picker: search and insert emoji. Click one in the panel, or use the quick list.

const EMOJI = {
  'smile happy grin face': '😀', 'laugh joy tears': '😂', 'wink': '😉', 'blush': '😊', 'heart eyes love': '😍', 'cool sunglasses': '😎', 'think hmm': '🤔', 'neutral': '😐', 'sad cry': '😢', 'angry mad': '😠',
  'scream shock': '😱', 'sleep tired zzz': '😴', 'party celebrate': '🥳', 'nerd glasses': '🤓', 'sweat nervous': '😅', 'upside down silly': '🙃', 'shush quiet': '🤫', 'eyes roll': '🙄', 'mind blown': '🤯', 'hug': '🤗',
  'thumbs up yes ok approve': '👍', 'thumbs down no': '👎', 'clap applause': '👏', 'wave hello bye': '👋', 'pray thanks please': '🙏', 'muscle strong': '💪', 'point up': '👆', 'point right': '👉', 'ok hand': '👌', 'victory peace': '✌️', 'fist bump': '👊', 'raised hands': '🙌',
  'heart love red': '❤️', 'broken heart': '💔', 'blue heart': '💙', 'green heart': '💚', 'sparkles': '✨', 'star': '⭐', 'fire hot lit': '🔥', 'boom explosion': '💥', 'hundred perfect': '💯', 'zap lightning': '⚡',
  'check done ok yes': '✅', 'cross no fail wrong': '❌', 'warning caution': '⚠️', 'question': '❓', 'exclamation': '❗', 'no entry forbidden': '⛔', 'stop sign': '🛑', 'info': 'ℹ️', 'new': '🆕', 'cool': '🆒',
  'rocket launch ship fast': '🚀', 'bug insect': '🐛', 'beetle ladybug': '🐞', 'wrench fix tool': '🔧', 'hammer build': '🔨', 'gear settings': '⚙️', 'lock secure': '🔒', 'unlock open': '🔓', 'key': '🔑', 'shield security': '🛡️',
  'memo note write pencil': '📝', 'book docs read': '📖', 'books library': '📚', 'bookmark': '🔖', 'clipboard': '📋', 'folder': '📁', 'open folder': '📂', 'file page': '📄', 'package box': '📦', 'link chain': '🔗',
  'computer laptop': '💻', 'desktop monitor': '🖥️', 'keyboard': '⌨️', 'phone mobile': '📱', 'cd disk': '💿', 'database storage': '🗄️', 'cloud': '☁️', 'satellite antenna': '📡', 'battery': '🔋', 'plug': '🔌',
  'chart up growth': '📈', 'chart down': '📉', 'bar chart stats': '📊', 'calendar date': '📅', 'clock time': '🕐', 'hourglass wait': '⏳', 'stopwatch': '⏱️', 'alarm bell': '⏰', 'bell notification': '🔔', 'mail email': '📧',
  'magnifier search find': '🔍', 'bulb idea light': '💡', 'trophy win': '🏆', 'medal': '🏅', 'target goal': '🎯', 'flag': '🚩', 'finish checkered': '🏁', 'gift present': '🎁', 'tada party popper': '🎉', 'balloon': '🎈',
  'sun sunny': '☀️', 'moon night': '🌙', 'rain': '🌧️', 'snow': '❄️', 'rainbow': '🌈', 'tree plant': '🌳', 'flower': '🌸', 'leaf': '🍃', 'earth globe world': '🌍', 'mountain': '⛰️',
  'dog': '🐶', 'cat': '🐱', 'mouse': '🐭', 'rabbit': '🐰', 'fox': '🦊', 'bear': '🐻', 'panda': '🐼', 'penguin': '🐧', 'owl': '🦉', 'snake python': '🐍', 'crab rust': '🦀', 'whale': '🐳', 'octopus': '🐙', 'butterfly': '🦋', 'unicorn': '🦄',
  'coffee tea': '☕', 'pizza': '🍕', 'burger': '🍔', 'cake': '🍰', 'apple fruit': '🍎', 'beer': '🍺', 'wine': '🍷', 'cookie': '🍪', 'popcorn': '🍿', 'donut': '🍩',
  'car': '🚗', 'bike': '🚲', 'plane flight': '✈️', 'train': '🚆', 'ship boat': '🚢', 'house home': '🏠', 'building office': '🏢', 'hospital': '🏥', 'school': '🏫', 'factory': '🏭',
  'arrow right': '➡️', 'arrow left': '⬅️', 'arrow up': '⬆️', 'arrow down': '⬇️', 'refresh cycle repeat': '🔄', 'back': '🔙', 'plus add': '➕', 'minus remove': '➖', 'infinity': '♾️', 'recycle': '♻️',
  'money cash dollar': '💵', 'credit card pay': '💳', 'gem diamond': '💎', 'bank': '🏦', 'cart shopping': '🛒', 'tag label price': '🏷️', 'receipt': '🧾', 'coin': '🪙', 'briefcase work': '💼', 'handshake deal': '🤝',
  'test tube lab': '🧪', 'microscope': '🔬', 'dna': '🧬', 'atom': '⚛️', 'telescope': '🔭', 'robot ai bot': '🤖', 'alien': '👽', 'ghost': '👻', 'skull dead': '💀', 'poop': '💩',
  'construction wip': '🚧', 'police siren alert': '🚨', 'seedling new start': '🌱', 'paint art palette': '🎨', 'music note': '🎵', 'game controller': '🎮', 'dice random': '🎲', 'puzzle': '🧩', 'crown king': '👑', 'sparkle heart': '💖',
};

const entries = Object.entries(EMOJI).map(([k, v]) => ({ emoji: v, keys: k }));

function search(q) {
  const s = q.trim().toLowerCase();
  if (!s) return entries;
  return entries.filter((e) => e.keys.split(' ').some((w) => w.startsWith(s)) || e.keys.includes(s));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function page() {
  const cells = entries.map((e) => `<button class="e" data-k="${esc(e.keys)}" title="${esc(e.keys.split(' ')[0])}">${e.emoji}</button>`).join('');
  return `<style>
  body { font-family: var(--ui); } input { width: 100%; box-sizing: border-box; padding: 8px 10px; background: var(--raised, transparent); color: var(--fg); border: 1px solid var(--border); border-radius: 6px; font-size: 14px; outline: none; } input:focus { border-color: var(--accent); }
  #g { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 4px; margin-top: 12px; }
  .e { font-size: 24px; background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 4px; cursor: pointer; } .e:hover { border-color: var(--accent); background: var(--raised, rgba(128,128,128,.15)); }
  #none { display: none; color: var(--fg-dim); margin-top: 14px; } .dim { color: var(--fg-dim); font-size: 12px; margin-top: 8px; }
</style>
<input id="q" placeholder="Search: rocket, check, fire, bug..." autofocus>
<div class="dim">Click an emoji to put it in your file at the cursor.</div>
<div id="g">${cells}</div><div id="none">Nothing matches.</div>
<script>
  const q = document.getElementById('q'), g = document.getElementById('g'), none = document.getElementById('none');
  q.addEventListener('input', () => { const s = q.value.trim().toLowerCase(); let n = 0; for (const b of g.children) { const ok = !s || b.dataset.k.split(' ').some((w) => w.startsWith(s)) || b.dataset.k.includes(s); b.style.display = ok ? '' : 'none'; if (ok) n++; } none.style.display = n ? 'none' : 'block'; });
  g.addEventListener('click', (e) => { const b = e.target.closest('.e'); if (b) ferrumPanel.postMessage({ type: 'insert', emoji: b.textContent }); });
</script>`;
}

exports._test = { search, entries, EMOJI };

exports.activate = function (context) {
  let panel = null;
  context.subscriptions.push(
    ferrum.commands.register('emojiPicker.open', async () => {
      if (panel) return;
      panel = await ferrum.window.showPanel({ title: 'Emoji', html: page() });
      panel.onDidClose(() => (panel = null));
      panel.onMessage(async (m) => {
        if (m.type !== 'insert') return;
        const doc = await ferrum.editor.active();
        if (!doc) return ferrum.window.showMessage('Open a file to insert into.', 'warn');
        await ferrum.editor.insert(String(m.emoji).slice(0, 16));
      });
    }),
    ferrum.commands.register('emojiPicker.quick', async () => {
      const pick = await ferrum.window.showQuickPick(entries.map((e) => ({ label: e.emoji + '  ' + e.keys.split(' ')[0], detail: e.keys, emoji: e.emoji })), { placeholder: 'Type to search emoji' });
      if (pick) await ferrum.editor.insert(pick.emoji);
    }),
  );
};

exports.deactivate = function () {};
