// ===== Local storage helpers =====
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; }
  catch { return fallback; }
};

// ===== Reveal on scroll =====
(() => {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, {threshold: .12});
  els.forEach(el => io.observe(el));
})();

// ===== Belongings checklist =====
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

// ===== Pomodoro timer with conic progress =====
(() => {
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('reset');
  const clock = document.getElementById('clock');
  const modeLabel = document.getElementById('mode-label');
  const ring = document.getElementById('ring');

  let isRunning = false;
  let mode = 'work'; // 'work' or 'break'
  let remaining = 25 * 60;
  let timerId = null;

  const total = () => (mode === 'work' ? 25*60 : 5*60);

  function format(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }
  function updateRing(){
    const elapsed = total() - remaining;
    const deg = Math.max(0, Math.min(360, (elapsed / total()) * 360));
    ring.style.setProperty('--p', `${deg}deg`);
  }
  function updateUI() {
    clock.textContent = format(remaining);
    modeLabel.textContent = `Mode: ${mode === 'work' ? 'Work' : 'Break'}`;
    document.title = `${clock.textContent} • ${mode === 'work' ? 'Work 🔶' : 'Break 🔷'}`;
    updateRing();
  }
  function chime(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type='sine'; o.frequency.value = 880; g.gain.value=.001;
      o.connect(g).connect(ctx.destination); o.start();
      g.gain.exponentialRampToValueAtTime(.2, ctx.currentTime + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .25);
      o.stop(ctx.currentTime + .26);
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    } catch {}
  }
  function switchMode(){
    mode = mode === 'work' ? 'break' : 'work';
    remaining = total();
    chime();
  }
  function tick() {
    if (!isRunning) return;
    remaining -= 1;
    if (remaining <= 0) switchMode();
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

// ===== Tasks checklist with counts + progress bar =====
(() => {
  const listEl = document.getElementById('task-list');
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const stats = document.getElementById('task-stats');
  const clearBtn = document.getElementById('clear-tasks');
  const bar = document.getElementById('bar');
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
      rm.setAttribute('aria-label', `Remove ${t.title}`);
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
    const pct = total ? (done/total)*100 : 0;
    bar.style.width = `${pct}%`;
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

  clearBtn.addEventListener('click', ()=>{
    tasks = [];
    store('tasks', tasks);
    render();
  });

  render();
})();
