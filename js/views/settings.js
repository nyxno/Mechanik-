import { h, toast } from '../util/dom.js';
import { state, update, exportState, importState, resetState, sync } from '../platform/store.js';
import { platform } from '../platform/platform.js';
import { aiStatus } from '../platform/ai.js';

export function render(main) {
  const st = aiStatus();
  main.append(h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Einstellungen'), h('h1', {}, 'App anpassen'))));

  const name = h('input', { type: 'text', id: 'set-name', value: state.settings.name, placeholder: 'Dein Vorname (für die Anrede)' });
  name.addEventListener('change', () => update((s) => { s.settings.name = name.value.trim(); }, 'settings'));
  const theme = h('select', { id: 'set-theme', onChange: (e) => update((s) => { s.settings.theme = e.target.value; }, 'settings') }, [['system', 'Wie das System'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => h('option', { value: v, selected: state.settings.theme === v }, l)));
  const level = h('select', { id: 'set-level', onChange: (e) => update((s) => { s.settings.levelMode = e.target.value; }, 'settings') }, [['auto', 'Automatisch anpassen (empfohlen)'], ['1', 'Immer Stufe 1 – Grundlagen'], ['2', 'Immer Stufe 2 – Kursniveau'], ['3', 'Immer Stufe 3 – Prüfung/Transfer']].map(([v, l]) => h('option', { value: v, selected: state.settings.levelMode === v }, l)));
  main.append(h('div', { class: 'card' }, h('h3', {}, 'Allgemein'), h('div', { class: 'grid cols-3' }, h('label', {}, h('div', { class: 'small' }, 'Name'), name), h('label', {}, h('div', { class: 'small' }, 'Darstellung'), theme), h('label', {}, h('div', { class: 'small' }, 'Aufgabenstufe'), level))));

  // KI
  const key = h('input', { type: 'password', id: 'set-key', value: state.settings.apiKey, placeholder: 'sk-ant-…', autocomplete: 'off', style: { width: '100%', fontFamily: 'var(--font-mono)' } });
  key.addEventListener('change', () => { update((s) => { s.settings.apiKey = key.value.trim(); }, 'settings'); toast(key.value ? 'Schlüssel gespeichert (nur in diesem Browser)' : 'Schlüssel entfernt'); });
  const model = h('select', { id: 'set-model', onChange: (e) => update((s) => { s.settings.model = e.target.value; }, 'settings') }, [['claude-opus-5-5', 'Claude Opus 5.5 (Standard, beste Erklärungen)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (schneller, günstiger)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (sehr günstig)']].map(([v, l]) => h('option', { value: v, selected: state.settings.model === v }, l)));
  main.append(h('div', { class: 'card' }, h('h3', {}, 'KI-Tutor'),
    h('div', { class: `notice ${st.ok ? 'good' : 'warn'}` }, h('b', {}, st.label), platform.mode === 'artifact' ? ' – Die App läuft in claude.ai. Der Tutor nutzt dein Claude-Konto; ein API-Schlüssel ist nicht nötig.' : ' – Die App läuft eigenständig (z. B. GitHub Pages). Für den Tutor und die Unterlagen-Analyse brauchst du einen Anthropic-API-Schlüssel.'),
    platform.mode !== 'artifact' ? h('div', { class: 'stack', style: { marginTop: '10px' } },
      h('label', {}, h('div', { class: 'small' }, 'Anthropic-API-Schlüssel (bleibt nur in diesem Browser, wird nie synchronisiert)'), key),
      h('label', {}, h('div', { class: 'small' }, 'Modell'), model),
      h('p', { class: 'small' }, 'Schlüssel erstellen unter platform.claude.com → Settings → API Keys. Die Anfragen gehen direkt von deinem Browser an die Anthropic-API; Kosten fallen pro Anfrage an.')) : null));

  // Daten
  const file = h('input', { type: 'file', accept: 'application/json', hidden: true, onChange: async (e) => { const f = e.target.files[0]; if (!f) return; try { importState(await f.text()); toast('Fortschritt importiert', 'good'); } catch (err) { toast(err.message, 'bad'); } } });
  const exportArea = h('textarea', { hidden: true, rows: 8, readonly: true });
  main.append(h('div', { class: 'card' }, h('h3', {}, 'Fortschritt und Daten'),
    h('p', { class: 'small' }, platform.db ? `Fortschritt wird in deinem Browser und im Speicher des Artifacts gesichert (Status: ${sync.status === 'synced' ? 'synchronisiert' : sync.status === 'error' ? 'Fehler' : 'lokal'}). So siehst du am PC und am Smartphone denselben Stand.` : 'Fortschritt wird in diesem Browser gespeichert. Zum Übertragen auf ein anderes Gerät exportieren und dort importieren.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onClick: async () => { const json = exportState(); try { await navigator.clipboard.writeText(json); toast('Sicherung in die Zwischenablage kopiert', 'good'); } catch { exportArea.hidden = false; exportArea.value = json; exportArea.select(); } } }, 'Sicherung kopieren'),
      h('button', { class: 'btn', onClick: () => file.click() }, 'Sicherung importieren'), file,
      h('button', { class: 'btn', onClick: () => { exportArea.hidden = !exportArea.hidden; exportArea.value = exportState(); } }, 'Sicherung anzeigen'),
      resetButton()),
    exportArea));

  main.append(h('div', { class: 'card' }, h('h3', {}, 'Über diese App'), h('p', {}, 'Mechanik Lernwerkstatt: Lernplan mit 16 Themen nach den Kursunterlagen der Werkmeisterschule (Zentrales Kraftsystem, Drehmoment, Träger, Biegemoment) plus Reibung, Arbeit, Leistung und Energie. Aufgaben mit zufälligen Zahlen in drei Stufen, Fehlerdiagnose, Formel-Rechner, interaktive Skizzen, KI-Tutor, eigene Unterlagen.'), h('p', { class: 'small', style: { marginBottom: 0 } }, 'Alle Rechnungen in Grad. Vorzeichenkonvention wie im Kurs: Drehmoment nach rechts +, y nach oben +, x nach rechts +.')));
}

function resetButton() {
  const wrap = h('span');
  const b = h('button', { class: 'btn danger', onClick: () => { wrap.innerHTML = ''; wrap.append(h('span', { class: 'small' }, 'Gesamten Fortschritt löschen? '), h('button', { class: 'btn small danger', onClick: () => { resetState(); toast('Fortschritt zurückgesetzt'); } }, 'Ja, löschen'), ' ', h('button', { class: 'btn small ghost', onClick: () => { wrap.innerHTML = ''; wrap.append(b); } }, 'Abbrechen')); } }, 'Fortschritt zurücksetzen');
  wrap.append(b);
  return wrap;
}
