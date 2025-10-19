// Simple checklist + progress with localStorage

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

const store = {
  get(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

function renderList(id){
  const ul = qs('#'+id);
  const items = store.get(id, []);
  ul.innerHTML = '';
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = it.done ? 'done' : '';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = it.done;
    cb.addEventListener('change', () => {
      items[idx].done = cb.checked;
      store.set(id, items);
      renderList(id);
    });
    const span = document.createElement('span');
    span.textContent = it.text;
    const del = document.createElement('button');
    del.className = 'remove';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      items.splice(idx,1);
      store.set(id, items);
      renderList(id);
    });
    li.append(cb, span, del);
    ul.append(li);
  });
  // Update counts
  const done = items.filter(i=>i.done).length;
  const total = items.length;
  const label = id === 'belongings' ? `${done} complete` : `${done} of ${total} finished`;
  qs(`#${id}-count`).textContent = label;
}

function wireAdder(form){
  const id = form.dataset.target;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.querySelector('input');
    const text = input.value.trim();
    if(!text) return;
    const items = store.get(id, []);
    items.push({ text, done:false });
    store.set(id, items);
    input.value='';
    renderList(id);
  });
}

function wireReset(btn){
  const id = btn.dataset.clear;
  btn.addEventListener('click', () => {
    if(confirm('Clear all items?')){
      store.set(id, []);
      renderList(id);
    }
  });
}

// File upload preview for "phone far away" image
const phoneUpload = qs('#phoneUpload');
const phonePreview = qs('#phonePreview');
if (phoneUpload){
  phoneUpload.addEventListener('change', () => {
    const f = phoneUpload.files && phoneUpload.files[0];
    if(!f) return;
    const url = URL.createObjectURL(f);
    phonePreview.src = url;
    phonePreview.alt = 'Uploaded photo of your phone placed far away';
  });
}

// Init
['belongings','assignments'].forEach(id => renderList(id));
qsa('form.adder').forEach(wireAdder);
qsa('[data-clear]').forEach(wireReset);
