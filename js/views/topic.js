import { h, esc } from '../util/dom.js';
import { state } from '../platform/store.js';
import { TOPICS, topicById, moduleById } from '../content/topics.js';
import { prog, status, markRead, levelFor } from '../engine/mastery.js';
import { renderLab } from './labs.js';
import { docs, chunksForTopic, searchDocs } from '../platform/docs.js';
import { exercisesFor } from '../content/exercises.js';

export function render(main, { go }) {
  const t = topicById(state.currentTopic) || TOPICS[0];
  const p = prog(t.id), st = status(t.id);
  const idx = TOPICS.indexOf(t);
  const prev = TOPICS[idx - 1], next = TOPICS[idx + 1];

  // Themenwahl
  const sel = h('select', { id: 'topic-select', 'aria-label': 'Thema wählen', onChange: (e) => go('thema', { currentTopic: e.target.value }) }, TOPICS.map((x) => h('option', { value: x.id, selected: x.id === t.id }, `${x.order}. ${x.title}`)));
  main.append(h('div', { class: 'page-head' },
    h('div', {}, h('div', { class: 'eyebrow' }, moduleById(t.module).title), h('h1', {}, t.title), h('p', { class: 'muted' }, t.short),
      h('div', { class: 'row', style: { gap: '6px' } }, h('span', { class: `pill ${st.key}` }, st.label), h('span', { class: 'pill' }, `${p.mastery} % beherrscht`), h('span', { class: 'pill' }, `${t.minutes} min`), (t.prereq || []).map((id) => h('span', { class: 'pill' }, 'Voraussetzung: ' + topicById(id).title)))),
    h('div', { class: 'stack', style: { gap: '8px', alignItems: 'flex-end' } }, sel, h('div', { class: 'row' },
      h('button', { class: 'btn primary', onClick: () => go('ueben', { currentTopic: t.id }) }, `Üben (Stufe ${levelFor(t.id)})`),
      h('button', { class: 'btn', onClick: () => go('tutor', { currentTopic: t.id, tutorIntent: 'explain' }) }, 'Tutor fragen'),
      h('button', { class: 'btn', onClick: () => go('tutor', { currentTopic: t.id, tutorIntent: 'quiz' }) }, 'Abfragen lassen')))));

  const tabs = [['lernen', 'Erklärung'], ['formeln', 'Formeln'], ['beispiele', 'Beispiele aus dem Kurs'], ['fehler', 'Fehler & Tipps'], ['unterlagen', `Meine Unterlagen${linkedDocs(t).length ? ` (${linkedDocs(t).length})` : ''}`]];
  let active = 'lernen';
  const tabBar = h('div', { class: 'tabs', role: 'tablist' });
  const body = h('div');
  const show = (key) => {
    active = key;
    tabBar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.key === key));
    body.innerHTML = '';
    body.append(SECTIONS[key](t, go));
  };
  for (const [key, label] of tabs) tabBar.append(h('button', { 'data-key': key, role: 'tab', onClick: () => show(key) }, label));
  main.append(tabBar, body);
  show(active);

  // Navigation unten
  main.append(h('hr'), h('div', { class: 'row between' },
    prev ? h('button', { class: 'btn ghost', onClick: () => go('thema', { currentTopic: prev.id }) }, `← ${prev.title}`) : h('span'),
    h('button', { class: 'btn', onClick: () => { markRead(t.id); go('ueben', { currentTopic: t.id }); } }, 'Verstanden, jetzt üben'),
    next ? h('button', { class: 'btn ghost', onClick: () => go('thema', { currentTopic: next.id }) }, `${next.title} →`) : h('span')));

  // Als gelesen markieren, wenn der Nutzer bis unten gescrollt hat
  let marked = p.read;
  const onScroll = () => { if (!marked && window.scrollY + window.innerHeight > document.body.scrollHeight - 200) { marked = true; markRead(t.id); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

function linkedDocs(t) { return docs().filter((d) => (d.topicIds || []).includes(t.id)); }

const SECTIONS = {
  lernen(t) {
    const wrap = h('div', { class: 'stack' });
    wrap.append(h('div', { class: 'card' }, h('p', { html: t.intro, style: { marginBottom: 0 } })));
    const steps = h('div', { class: 'steps' });
    t.steps.forEach((s, i) => {
      const el = h('div', { class: 'step' }, h('div', { class: 'n' }, i + 1), h('div', { style: { minWidth: 0 } }, h('h3', {}, s.h), h('div', { html: s.html })));
      if (s.sketch) el.lastChild.append(h('div', { class: 'sketch-box paper', html: s.sketch() }));
      if (s.lab) { const lab = renderLab(s.lab); if (lab) el.lastChild.append(lab); }
      steps.append(el);
    });
    wrap.append(h('div', { class: 'card' }, steps));
    if (t.tips && t.tips.length) wrap.append(h('div', { class: 'card' }, h('h3', {}, 'Merk dir'), h('div', { class: 'stack', style: { gap: '8px' } }, t.tips.map((x) => h('div', { class: 'tip' }, x)))));
    wrap.append(h('p', { class: 'small' }, `Quellen im Kurs: ${(t.sources || []).join(', ')}`));
    return wrap;
  },
  formeln(t) {
    const list = h('div', { class: 'formula-list' }, t.formulas.map((f) => h('div', { class: 'f' }, h('div', {}, h('b', {}, f.name), f.note ? h('div', { class: 'small' }, f.note) : null), h('div', {}, h('span', { class: 'formula' }, f.f)))));
    return h('div', { class: 'card' }, h('h3', {}, 'Formelsammlung'), list, h('p', { class: 'small', style: { marginTop: '12px' } }, 'Im Übungsmodus kannst du diese Formeln direkt in das Rechenfeld tippen, z. B. F*cos(alpha) oder (FG/2)/sin(alpha). Winkelfunktionen rechnen in Grad.'));
  },
  beispiele(t) {
    const wrap = h('div', { class: 'stack' });
    for (const ex of t.examples || []) {
      wrap.append(h('div', { class: 'card' }, h('div', { class: 'example' }, h('h3', {}, ex.title), h('div', { class: 'small' }, ex.source),
        h('div', { class: 'given' }, `geg.: ${ex.given}\nges.: ${ex.wanted}`),
        h('details', { open: false }, h('summary', {}, 'Lösungsweg Schritt für Schritt'), h('div', { class: 'solution', style: { marginTop: '8px' } }, h('ol', {}, ex.steps.map((s) => h('li', {}, s))), h('p', { style: { marginBottom: 0 } }, h('b', {}, 'Ergebnis: '), ex.result))))));
    }
    const n = exercisesFor(t.id).length;
    wrap.append(h('div', { class: 'notice info' }, `Zu diesem Thema gibt es ${n} Aufgabentypen mit zufälligen Zahlenwerten. Im Übungsmodus prüfst du jede Zwischengröße einzeln und bekommst bei Fehlern einen Hinweis, wo der Denkfehler liegt.`));
    return wrap;
  },
  fehler(t) {
    return h('div', { class: 'stack' },
      h('div', { class: 'card' }, h('h3', {}, 'Typische Fehler'), (t.mistakes || []).map((m) => h('div', { class: 'mistake' }, h('b', {}, 'Falsch:'), h('span', {}, m.wrong), h('b', { style: { color: 'var(--good)' } }, 'Richtig:'), h('span', {}, m.right)))),
      t.tips && t.tips.length ? h('div', { class: 'card' }, h('h3', {}, 'Tipps aus dem Unterricht'), h('div', { class: 'stack', style: { gap: '8px' } }, t.tips.map((x) => h('div', { class: 'tip' }, x)))) : null);
  },
  unterlagen(t, go) {
    const linked = linkedDocs(t);
    const wrap = h('div', { class: 'stack' });
    if (!docs().length) {
      wrap.append(h('div', { class: 'card' }, h('p', {}, 'Du hast noch keine eigenen Unterlagen hochgeladen.'), h('button', { class: 'btn primary', onClick: () => go('unterlagen') }, 'Unterlagen hochladen')));
      return wrap;
    }
    if (!linked.length) wrap.append(h('div', { class: 'notice' }, 'Keine Unterlage ist diesem Thema zugeordnet. Unten findest du trotzdem Textstellen aus allen Dateien, die zu den Stichwörtern des Themas passen.'));
    for (const d of linked) {
      wrap.append(h('div', { class: 'card' }, h('h3', {}, d.title || d.name), d.summary ? h('p', {}, d.summary) : null,
        d.keyPoints && d.keyPoints.length ? h('ul', {}, d.keyPoints.slice(0, 6).map((k) => h('li', {}, k))) : null,
        d.formulas && d.formulas.length ? h('div', { class: 'chips' }, d.formulas.slice(0, 8).map((f) => h('span', { class: 'formula' }, f))) : null,
        d.exercises && d.exercises.length ? h('details', { style: { marginTop: '10px' } }, h('summary', {}, `${d.exercises.length} Aufgaben aus dieser Unterlage`), d.exercises.map((e) => h('div', { class: 'example', style: { marginTop: '8px' } }, h('p', {}, h('b', {}, 'Aufgabe: '), e.question), h('details', {}, h('summary', {}, 'Lösung'), h('div', { class: 'solution', html: esc(e.solution || '').replace(/\n/g, '<br>') }))))) : null));
    }
    const hits = searchDocs((t.keywords || []).slice(0, 6).join(' '), 6);
    if (hits.length) wrap.append(h('div', { class: 'card' }, h('h3', {}, 'Passende Textstellen'), hits.map((x) => h('div', { class: 'hit' }, h('div', { class: 'small' }, `${x.docName} · Seite/Folie ${x.page}`), h('div', {}, x.text.slice(0, 320) + (x.text.length > 320 ? ' …' : ''))))));
    wrap.append(h('button', { class: 'btn', onClick: () => go('tutor', { currentTopic: t.id, tutorIntent: 'docs' }) }, 'Tutor: Erkläre mir dieses Thema anhand meiner Unterlagen'));
    return wrap;
  },
};
