import { h } from '../util/dom.js';
import { MODULES, topicsOfModule, topicById, TOPICS } from '../content/topics.js';
import { prog, status, levelFor } from '../engine/mastery.js';
import { exercisesFor } from '../content/exercises.js';

export function render(main, { go }) {
  const totalMin = TOPICS.reduce((a, t) => a + t.minutes, 0);
  main.append(h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Lernplan'), h('h1', {}, 'Von der Kraft bis zur Energie'), h('p', { class: 'muted' }, `${TOPICS.length} Themen in ${MODULES.length} Modulen, logisch aufgebaut. Jedes Thema: Erklärung in Schritten, Skizzen, Beispiele aus dem Kurs, Aufgaben in drei Stufen. Richtwert gesamt rund ${Math.round(totalMin / 60)} Stunden.`))));
  for (const m of MODULES) {
    const ts = topicsOfModule(m.id);
    const list = h('div', { class: 'topic-list' });
    for (const t of ts) {
      const p = prog(t.id), st = status(t.id);
      const missing = (t.prereq || []).filter((id) => prog(id).mastery < 40 && !prog(id).read);
      const n = exercisesFor(t.id).length;
      list.append(h('div', { class: 'topic-item', role: 'button', tabindex: 0, onClick: () => go('thema', { currentTopic: t.id }), onKeydown: (e) => { if (e.key === 'Enter') go('thema', { currentTopic: t.id }); } },
        h('div', { class: 'num' }, t.order),
        h('div', {}, h('div', { class: 't' }, t.title), h('div', { class: 'small' }, t.short), h('div', { class: 'row', style: { gap: '6px', marginTop: '6px' } },
          h('span', { class: 'pill' }, `${t.minutes} min`), h('span', { class: 'pill' }, `${n} Aufgabentypen`), h('span', { class: 'pill lvl' }, `Stufe ${levelFor(t.id)}`),
          missing.length ? h('span', { class: 'pill weak' }, `Vorher: ${missing.map((id) => topicById(id).title).join(', ')}`) : null),
          h('div', { class: `bar ${p.mastery >= 80 ? 'good' : ''}`, style: { marginTop: '8px' } }, h('i', { style: { width: p.mastery + '%' } }))),
        h('div', { class: 'meta' }, h('span', { class: `pill ${st.key}` }, st.label), h('button', { class: 'btn small', onClick: (e) => { e.stopPropagation(); go('ueben', { currentTopic: t.id }); } }, 'Üben'))));
    }
    main.append(h('div', { class: 'module-head' }, h('h2', {}, `Modul ${m.order}: ${m.title}`)), list);
  }
  main.append(h('p', { class: 'small', style: { marginTop: '18px' } }, 'Module 1 und 2 folgen den Kursunterlagen (Z05, Z10, Z30, DM10, DM20, T10, T20). Modul 3 ergänzt die Lehrplanthemen Reibung, Arbeit, Leistung und Energie.'));
}
