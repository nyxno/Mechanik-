// Kleine DOM-Helfer, damit die Views ohne Framework lesbar bleiben.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Sehr kleines Markdown: **fett**, *kursiv*, `code`, Zeilenumbrüche, Listen, Überschriften. Kein HTML erlaubt. */
export function md(text) {
  const lines = esc(text || '').split('\n');
  let out = '', inList = false, inCode = false, codeBuf = [];
  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\*)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>');
  for (const raw of lines) {
    if (raw.trim().startsWith('```')) {
      if (inCode) { out += `<pre class="code">${codeBuf.join('\n')}</pre>`; codeBuf = []; inCode = false; }
      else { if (inList) { out += '</ul>'; inList = false; } inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }
    const m = raw.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
    if (m) {
      if (!inList) { out += '<ul>'; inList = true; }
      out += `<li>${inline(m[2])}</li>`;
      continue;
    }
    if (inList) { out += '</ul>'; inList = false; }
    const hm = raw.match(/^(#{1,4})\s+(.*)$/);
    if (hm) { out += `<h${hm[1].length + 2}>${inline(hm[2])}</h${hm[1].length + 2}>`; continue; }
    if (!raw.trim()) { out += '<div class="md-gap"></div>'; continue; }
    out += `<p>${inline(raw)}</p>`;
  }
  if (inList) out += '</ul>';
  if (inCode) out += `<pre class="code">${codeBuf.join('\n')}</pre>`;
  return out;
}

export function toast(msg, kind = 'info', ms = 3200) {
  let host = $('#toasts');
  if (!host) { host = h('div', { id: 'toasts' }); document.body.append(host); }
  const t = h('div', { class: `toast ${kind}`, role: 'status' }, msg);
  host.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}

export function debounce(fn, ms = 400) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function relTime(ts) {
  if (!ts) return '–';
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'gerade eben';
  if (d < 3600) return `vor ${Math.floor(d / 60)} min`;
  if (d < 86400) return `vor ${Math.floor(d / 3600)} h`;
  if (d < 86400 * 14) return `vor ${Math.floor(d / 86400)} Tagen`;
  return new Date(ts).toLocaleDateString('de-AT');
}

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
