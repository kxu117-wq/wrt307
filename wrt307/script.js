// Local storage helpers
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; }
  catch { return fallback; }
};

// Belongings checklist
(() => {
  const form = document.getElementById('belongings-form');
  if (!form) return;
  const keys = Array.from(form.querySelectorAll('input[type="checkbox"]')).map(i => i.dataset.key);
  const state = load('belongings', {});
  for (const input of form.querySelectorAll('input[type="checkbox"]')) {
    input.checked = !!state[input.dataset.key];
    input.addEventListener('change', () => {
      state[input.dataset.key] = input.checked;
      store('belongings', state);
    });
  }
  document.getElementById('clear-belongings').addEventListener('click', () => {
    for (const input of form.querySelectorAll('input[type="checkbox"]')) input.checked = false;
    keys.forEach(k => state[k] = false);
    store('belongings', state);
  });
})();

// Pomodoro timer
(() => {
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('reset');
  const clock = document.getElementById('clock');
  const modeLabel = document.getElementById('mode-label');

  let isRunning = false;
  let mode = 'work'; // 'work' or 'break'
  let remaining = 25 * 60;
  let timerId = null;

  function format(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
  function updateUI() {
    clock.textContent = format(remaining);
    modeLabel.textContent = `Mode: ${mode === 'work' ? 'Work' : 'Break'}`;
    document.title = `${clock.textContent} • ${mode}`;
  }
  function tick() {
    if (!isRunning) return;
    remaining -= 1;
    if (remaining <= 0) {
      // switch modes
      mode = mode === 'work' ? 'break' : 'work';
      remaining = mode === 'work' ? 25 * 60 : 5 * 60;
      // simple alert
      try { new AudioContext(); } catch {}
      alert(`Time for ${mode === 'work' ? 'work' : 'a break'}!`);
    }
    updateUI();
  }

  startBtn.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    timerId = setInterval(tick, 1000);
  });
  pauseBtn.addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerId);
  });
  resetBtn.addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerId);
    mode = 'work';
    remaining = 25 * 60;
    updateUI();
  });
  updateUI();
})();

// Tasks checklist with counts
(() => {
  const listEl = document.getElementById('task-list');
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const stats = document.getElementById('task-stats');
  if (!listEl) return;

  let tasks = load('tasks', []);

  function render() {
    listEl.innerHTML = '';
    tasks.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'task';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!t.done;
      cb.addEventListener('change', () => {
        t.done = cb.checked;
        store('tasks', tasks);
        render();
      });
      const span = document.createElement('span');
      span.className = 'title';
      span.textContent = t.title;
      const rm = document.createElement('button');
      rm.className = 'remove';
      rm.title = 'Remove task';
      rm.textContent = '✕';
      rm.addEventListener('click', () => {
        tasks.splice(idx, 1);
        store('tasks', tasks);
        render();
      });
      li.append(cb, span, rm);
      listEl.appendChild(li);
    });
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    stats.textContent = `${done} / ${total} finished`;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    tasks.push({ title, done: false });
    input.value = '';
    store('tasks', tasks);
    render();
  });

  render();
})();
