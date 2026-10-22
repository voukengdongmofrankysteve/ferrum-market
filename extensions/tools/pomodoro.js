// Pomodoro Timer: focus for 25 minutes, rest for 5. The timer lives in the status bar.

function fmt(sec) {
  const m = Math.floor(sec / 60);
  return String(m).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
}

/** The state machine, with no timers in it so it can be tested. */
function step(state, cfg) {
  if (state.left > 1) return { state: { ...state, left: state.left - 1 }, event: null };
  if (state.phase === 'work') {
    const done = state.done + 1;
    const long = cfg.longEvery > 0 && done % cfg.longEvery === 0;
    return { state: { phase: long ? 'long' : 'break', left: (long ? cfg.longBreak : cfg.shortBreak) * 60, done, running: true }, event: long ? 'long' : 'break' };
  }
  return { state: { phase: 'work', left: cfg.work * 60, done: state.done, running: true }, event: 'work' };
}

exports._test = { fmt, step };

exports.activate = function (context) {
  const cfg = () => ({
    work: Number(ferrum.settings.get('pomodoro.workMinutes')) || 25,
    shortBreak: Number(ferrum.settings.get('pomodoro.breakMinutes')) || 5,
    longBreak: Number(ferrum.settings.get('pomodoro.longBreakMinutes')) || 15,
    longEvery: Number(ferrum.settings.get('pomodoro.longBreakEvery')) || 4,
  });
  let state = { phase: 'work', left: cfg().work * 60, done: 0, running: false };
  let timer = null;

  function draw() {
    const label = state.phase === 'work' ? 'Focus' : state.phase === 'long' ? 'Long break' : 'Break';
    ferrum.window.setStatusBar('pomodoro.status', {
      text: (state.running ? '' : 'Paused ') + label + ' ' + fmt(state.left) + (state.done ? '  (' + state.done + ')' : ''),
      tooltip: 'Click to ' + (state.running ? 'pause' : 'start') + ' the timer. ' + state.done + ' focus sessions done.',
      command: 'pomodoro.toggle',
    });
  }
  function tick() {
    const r = step(state, cfg());
    state = r.state;
    if (r.event === 'break') ferrum.window.showMessage('Focus session done. Take a ' + cfg().shortBreak + ' minute break.');
    else if (r.event === 'long') ferrum.window.showMessage('Four sessions done. Take a longer break of ' + cfg().longBreak + ' minutes.');
    else if (r.event === 'work') ferrum.window.showMessage('Break over. Back to focus for ' + cfg().work + ' minutes.');
    draw();
  }
  function start() {
    if (timer) return;
    state.running = true;
    timer = setInterval(tick, 1000);
    draw();
  }
  function pause() {
    clearInterval(timer);
    timer = null;
    state.running = false;
    draw();
  }

  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));
  reg('pomodoro.toggle', () => (state.running ? pause() : start()));
  reg('pomodoro.start', start);
  reg('pomodoro.pause', pause);
  reg('pomodoro.reset', () => {
    pause();
    state = { phase: 'work', left: cfg().work * 60, done: 0, running: false };
    draw();
  });
  reg('pomodoro.skip', () => {
    state = step({ ...state, left: 1 }, cfg()).state;
    draw();
  });
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  draw();
};

exports.deactivate = function () {};
