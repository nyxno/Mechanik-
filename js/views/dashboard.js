import { h, relTime } from '../util/dom.js';
import { state, streak } from '../platform/store.js';
import { TOPICS, MODULES, topicsOfModule, topicById } from '../content/topics.js';
import { prog, status, overallMastery, dueTopics, weakTopics, recommend } from '../engine/mastery.js';
import { docs } from '../platform/docs.js';
import { aiStatus } from '../platform/ai.js';

export function render(main, { go }) {
  const name = state.settings.name ? `, ${state.settings.name}` : '';
  const total = overallMastery();
  const due = dueTopics(), weak = weakTopics();
  const started = TOPICS.filter((t) => prog(t.id).attempts > 0 || prog(t.id).read).length;
  const strong = TOPICS.filter((t) => prog(t.id).mastery >= 80).length;
  const rec = recommend();
  const ai = aiStatus();

  const head = h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Mechanik und technische Grundlagen'), h('h1', {}, `Servus${name}.`), h('p', { class: 'muted' }, 'Dein Lernstand auf einen Blick. Die App merkt sich jeden Versuch und schlägt vor, was als Nächstes dran ist.')));

  const ring = h('div', { class: 'ring', style: { '--p': total } }, h('span', {}, `${total} %`));
  const kpis = h('div', { class: 'card' }, h('div', { class: 'row', style: { gap: '22px' } }, ring,
    h('div', { class: 'kpi' }, h('b', {}, `${strong}/${TOPICS.length}`), h('span', {}, 'Themen sicher')),
    h('div', { class: 'kpi' }, h('b', {}, `${started}`), h('span', {}, 'begonnen')),
    h('div', { class: 'kpi' }, h('b', {}, `${state.attempts.length}`), h('span', {}, 'Aufgaben gelöst')),
    h('div', { class: 'kpi' }, h('b', {}, `${streak()}`), h('span', {}, streak() === 1 ? 'Tag in Folge' : 'Tage in Folge'))));

  const recCard = h('div', { class: 'card', style: { borderColor: 'var(--accent)' } },
    h('div', { class: 'eyebrow' }, rec.kind === 'review' ? 'Wiederholung fällig' : rec.kind === 'learn' ? 'Nächstes Thema' : 'Jetzt üben'),
    h('h3', {}, rec.topic.title), h('p', { class: 'muted' }, rec.reason),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onClick: () => go(rec.kind === 'learn' ? 'thema' : 'ueben', { currentTopic: rec.topic.id }) }, rec.kind === 'learn' ? 'Thema lernen' : 'Aufgaben üben'),
      h('button', { class: 'btn', onClick: () => go('thema', { currentTopic: rec.topic.id }) }, 'Erklärung ansehen'),
      h('button', { class: 'btn ghost', onClick: () => go('tutor', { currentTopic: rec.topic.id }) }, 'Tutor fragen')));

  const alerts = h('div', { class: 'stack' });
  if (due.length) alerts.append(h('div', { class: 'notice warn' }, h('b', {}, `${due.length} ${due.length === 1 ? 'Thema' : 'Themen'} zur Wiederholung fällig: `), due.slice(0, 4).map((t) => t.title).join(', '), '. Kurz üben hält das Wissen frisch.'));
  if (weak.length) alerts.append(h('div', { class: 'notice bad' }, h('b', {}, 'Noch unsicher: '), weak.slice(0, 4).map((t) => t.title).join(', '), '. Die App wählt hier automatisch leichtere Aufgaben, bis es sitzt.'));
  if (!ai.ok) alerts.append(h('div', { class: 'notice info' }, h('b', {}, 'KI-Tutor: '), ai.mode === 'artifact' ? 'Erlaube der App die Nutzung von Claude (Menü des Artifacts), dann kann der Tutor erklären, abfragen und deine Unterlagen auswerten.' : 'Ohne API-Schlüssel funktionieren Lernplan, Aufgaben mit Fehlerdiagnose und Fortschritt. Für Tutor und Unterlagen-Analyse unter Einstellungen einen Schlüssel hinterlegen, oder die App auf claude.ai öffnen.'));

  // Module-Übersicht
  const modules = h('div', { class: 'stack' });
  for (const m of MODULES) {
    const ts = topicsOfModule(m.id);
    const avg = Math.round(ts.reduce((a, t) => a + prog(t.id).mastery, 0) / ts.length);
    const list = h('div', { class: 'topic-list' });
    for (const t of ts) {
      const p = prog(t.id), st = status(t.id);
      list.append(h('a', { class: 'topic-item', href: '#thema', onClick: (e) => { e.preventDefault(); go('thema', { currentTopic: t.id }); } },
        h('div', { class: 'num' }, t.order), h('div', {}, h('div', { class: 't' }, t.title), h('div', { class: `bar ${p.mastery >= 80 ? 'good' : p.attempts >= 3 && p.mastery < 45 ? 'weak' : ''}` }, h('i', { style: { width: p.mastery + '%' } }))),
        h('div', { class: 'meta' }, h('span', { class: 'mono small' }, `${p.mastery} %`), h('span', { class: `pill ${st.key}` }, st.label))));
    }
    modules.append(h('div', {}, h('div', { class: 'module-head' }, h('h2', {}, m.title), h('span', { class: 'small mono' }, `${avg} %`)), list));
  }

  // Letzte Aktivität
  const recent = state.attempts.slice(-6).reverse();
  const act = h('div', { class: 'card' }, h('h3', {}, 'Zuletzt'),
    recent.length ? h('div', { class: 'stack', style: { gap: '6px' } }, recent.map((a) => { const t = topicById(a.topicId); return h('div', { class: 'row between small' }, h('span', {}, h('b', { style: { color: a.correct ? 'var(--good)' : 'var(--bad)' } }, a.correct ? '✓ ' : '✗ '), t ? t.title : a.topicId, a.kind === 'quiz' ? ' (Abfrage)' : ` (Stufe ${a.level})`), h('span', { class: 'muted' }, relTime(a.at))); }))
      : h('p', { class: 'muted' }, 'Noch keine Aufgaben gelöst. Starte mit dem empfohlenen Thema oder wähle eines aus dem Lernplan.'));
  const docCard = h('div', { class: 'card' }, h('h3', {}, 'Eigene Unterlagen'), h('p', { class: 'muted' }, docs().length ? `${docs().length} ${docs().length === 1 ? 'Datei' : 'Dateien'} eingelesen. Der Tutor und die Aufgaben greifen darauf zurück.` : 'Lade Skripten, Folien oder Fotos deiner Mitschriften hoch. Die KI ordnet sie den Themen zu und erstellt passende Aufgaben.'), h('button', { class: 'btn', onClick: () => go('unterlagen') }, docs().length ? 'Unterlagen öffnen' : 'Unterlagen hochladen'));

  main.append(head, h('div', { class: 'grid cols-2' }, kpis, recCard), alerts, h('div', { class: 'grid cols-2', style: { marginTop: '14px' } }, act, docCard), modules);
}
