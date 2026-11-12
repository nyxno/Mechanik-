// Zustand der App: Fortschritt, Einstellungen, Versuche, Tutor-Verlauf.
// Lokal in localStorage (immer), zusätzlich im Artifact-Speicher (db) unter dem privaten Pfad des Nutzers,
// damit der Fortschritt auf PC und Smartphone gleich ist.
import { platform, onPlatformReady } from './platform.js';

const KEY = 'mechanik.state.v1';
const listeners = new Set();

function defaultState() {
  return {
    version: 1,
    updatedAt: 0,
    settings: { name: '', apiKey: '', model: 'claude-opus-5-5', levelMode: 'auto', theme: 'system' },
    progress: {},      // topicId -> { mastery, attempts, correct, lastAt, due, interval, ease, read }
    attempts: [],      // letzte 300 Versuche
    tutor: { turns: [] },
    currentTopic: null,
    lastRoute: 'start',
    firstSeen: Date.now(),
    days: [],          // Lerntage (YYYY-MM-DD) für Streak
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { ...defaultState(), ...s, settings: { ...defaultState().settings, ...(s.settings || {}) } };
  } catch { return null; }
}
function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* privates Fenster o. Ä. */ }
}

export const state = loadLocal() || defaultState();

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(what) { for (const fn of listeners) { try { fn(state, what); } catch (e) { console.error(e); } } }

/** Zustand ändern: Mutator bekommt den Zustand, danach wird gespeichert und synchronisiert. */
export function update(mutator, what = 'change') {
  mutator(state);
  state.updatedAt = Date.now();
  saveLocal();
  scheduleRemote();
  emit(what);
}

export function markToday() {
  const d = new Date().toISOString().slice(0, 10);
  if (!state.days.includes(d)) update((s) => { s.days.push(d); if (s.days.length > 400) s.days = s.days.slice(-400); }, 'day');
}

export function streak() {
  const set = new Set(state.days);
  let n = 0;
  const d = new Date();
  for (;;) {
    const k = d.toISOString().slice(0, 10);
    if (set.has(k)) { n++; d.setDate(d.getDate() - 1); }
    else if (n === 0) { d.setDate(d.getDate() - 1); if (set.has(d.toISOString().slice(0, 10))) continue; else break; }
    else break;
    if (n > 400) break;
  }
  return n;
}

// ---------- Synchronisierung mit dem Artifact-Speicher ----------
let remoteRef = null;
let remoteTimer = null;
let remoteReady = false;
export const sync = { status: 'local', lastError: null };

function sanitizedForRemote() {
  const copy = JSON.parse(JSON.stringify(state));
  copy.settings.apiKey = '';           // Schlüssel bleibt nur im Browser
  copy.attempts = copy.attempts.slice(-300);
  copy.tutor.turns = copy.tutor.turns.slice(-40);
  return copy;
}

function scheduleRemote() {
  if (!remoteReady || !remoteRef) return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(async () => {
    try {
      await remoteRef.set({ state: sanitizedForRemote(), savedAt: Date.now() });
      sync.status = 'synced';
    } catch (e) {
      sync.status = 'error'; sync.lastError = e && e.code;
      console.warn('Sync fehlgeschlagen', e);
    }
  }, 1200);
}

onPlatformReady(async (p) => {
  if (!p.db || !p.uid) return;
  try {
    remoteRef = p.db.doc('data/users/' + p.uid + '/profile');
    const snap = await remoteRef.get();
    const remote = snap && snap.exists ? snap.data() : null;
    if (remote && remote.state && (remote.state.updatedAt || 0) > (state.updatedAt || 0)) {
      const keepKey = state.settings.apiKey;
      Object.assign(state, remote.state);
      state.settings = { ...defaultState().settings, ...remote.state.settings, apiKey: keepKey };
      saveLocal();
      emit('remote');
    }
    remoteReady = true;
    sync.status = 'synced';
    scheduleRemote();
  } catch (e) {
    sync.status = 'error'; sync.lastError = e && e.code;
    console.warn('Remote-Speicher nicht erreichbar', e);
  }
});

export function exportState() {
  return JSON.stringify(sanitizedForRemote(), null, 2);
}
export function importState(json) {
  const s = JSON.parse(json);
  if (!s || typeof s !== 'object' || !s.progress) throw new Error('Keine gültige Sicherung.');
  update((st) => {
    const keepKey = st.settings.apiKey;
    Object.assign(st, { ...defaultState(), ...s });
    st.settings = { ...defaultState().settings, ...(s.settings || {}), apiKey: keepKey };
  }, 'import');
}
export function resetState() {
  const keepKey = state.settings.apiKey;
  update((st) => { Object.assign(st, defaultState()); st.settings.apiKey = keepKey; }, 'reset');
}
