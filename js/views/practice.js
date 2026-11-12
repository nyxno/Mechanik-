import { h, esc, md, toast } from '../util/dom.js';
import { state, update } from '../platform/store.js';
import { evaluate, fmt, ExprError } from '../util/expr.js';
import { randomSeed } from '../util/rng.js';
import { TOPICS, topicById, topicBrief } from '../content/topics.js';
import { makeExercise } from '../content/exercises.js';
import { checkValue, scoreResults } from '../engine/checker.js';
import { prog, levelFor, recordAttempt, status } from '../engine/mastery.js';
import { ask, aiStatus } from '../platform/ai.js';
import { COURSE_METHOD } from '../content/course.js';

let session = null; // { topicId, level, seed, ex, results, recorded, revealed }

export function render(main, { go }) {
  const t = topicById(state.currentTopic) || TOPICS[0];
  if (!session || session.topicId !== t.id) newExercise(t.id);
  const header = h('div', { class: 'page-head' },
    h('div', {}, h('div', { class: 'eyebrow' }, 'Üben'), h('h1', {}, t.title), h('p', { class: 'muted' }, `Beherrschung ${prog(t.id).mastery} % · ${status(t.id).label}. Die Stufe passt sich deinen Ergebnissen an.`)),
    h('div', { class: 'stack', style: { gap: '8px', alignItems: 'flex-end' } },
      h('select', { id: 'practice-topic', 'aria-label': 'Thema', onChange: (e) => { go('ueben', { currentTopic: e.target.value }); } }, TOPICS.map((x) => h('option', { value: x.id, selected: x.id === t.id }, `${x.order}. ${x.title}`))),
      h('div', { class: 'row' }, h('span', { class: 'small' }, 'Stufe:'), ['auto', '1', '2', '3'].map((lv) => h('button', { class: `chip ${state.settings.levelMode === lv ? 'active' : ''}`, onClick: () => { update((s) => { s.settings.levelMode = lv; }, 'settings'); newExercise(t.id); go('ueben'); } }, lv === 'auto' ? 'automatisch' : lv)))));
  main.append(header);
  const host = h('div');
  main.append(host);
  drawExercise(host, go);
}

function newExercise(topicId) {
  const level = levelFor(topicId);
  const ex = makeExercise(topicId, level, randomSeed(), session && session.ex ? session.ex.id : null);
  session = { topicId, level: ex ? ex.level : level, seed: ex ? ex.seed : 0, ex, results: {}, recorded: false, revealed: false, inputs: {} };
}

function drawExercise(host, go) {
  host.innerHTML = '';
  const { ex } = session;
  const t = topicById(session.topicId);
  if (!ex) { host.append(h('div', { class: 'notice' }, 'Für dieses Thema gibt es noch keine Aufgaben.')); return; }

  const left = h('div', { class: 'stack' });
  left.append(h('div', { class: 'card' },
    h('div', { class: 'row between' }, h('h3', {}, ex.title), h('span', { class: 'level-dots', title: `Stufe ${ex.level}` }, [1, 2, 3].map((i) => h('i', { class: i <= ex.level ? 'on' : '' })))),
    h('div', { class: 'text', html: ex.text }),
    ex.given.length ? h('div', { class: 'given-list' }, ex.given.map((g) => h('div', {}, `${g.sym} = ${fmt(g.val)}${g.unit ? ' ' + g.unit : ''}`))) : null,
    ex.sketch ? h('div', { class: 'sketch-box paper', html: ex.sketch() }) : null));

  const right = h('div', { class: 'stack' });
  const feedbackBox = h('div');

  if (ex.mc) {
    const mc = h('div', { class: 'mc' });
    ex.mc.options.forEach((opt, i) => {
      mc.append(h('button', { html: opt, onClick: (e) => {
        if (session.recorded) return;
        const ok = i === ex.mc.correct;
        mc.querySelectorAll('button').forEach((b, j) => { b.classList.toggle('ok', j === ex.mc.correct); b.classList.toggle('bad', j === i && !ok); b.disabled = true; });
        session.recorded = true;
        recordAttempt(session.topicId, { score: ok ? 1 : 0, level: ex.level, exId: ex.id });
        feedbackBox.innerHTML = '';
        feedbackBox.append(h('div', { class: `notice ${ok ? 'good' : 'bad'}` }, h('b', {}, ok ? 'Richtig. ' : 'Nicht richtig. '), ex.mc.why));
        feedbackBox.append(nextBar(host, go));
      } }));
    });
    right.append(h('div', { class: 'card' }, h('h3', {}, 'Antwort wählen'), mc), feedbackBox);
  } else {
    const vars = { ...ex.vars };
    const form = h('div', { class: 'stack' });
    for (const w of ex.wanted) {
      const formulaIn = h('input', { type: 'text', id: `f-${w.key}`, placeholder: 'Formel, z. B. F*cos(alpha)', autocomplete: 'off', spellcheck: 'false', 'aria-label': `Formel für ${w.label}` });
      const valueIn = h('input', { type: 'text', inputmode: 'decimal', id: `v-${w.key}`, placeholder: 'Wert', autocomplete: 'off', 'aria-label': `Wert für ${w.label}` });
      const fb = h('div', { class: 'fb' });
      const box = h('div', { class: 'answer' },
        h('div', { class: 'lbl' }, h('span', {}, w.label), h('span', { class: 'unit' }, w.unit)),
        h('div', { class: 'calc' }, formulaIn, h('button', { class: 'btn small', title: 'Formel mit den gegebenen Werten ausrechnen', onClick: () => {
          try {
            const v = evaluate(formulaIn.value, vars);
            valueIn.value = fmt(v, 3);
            fb.className = 'fb'; fb.textContent = `Berechnet: ${fmt(v, 3)} ${w.unit}`;
          } catch (e) { fb.className = 'fb bad'; fb.textContent = e instanceof ExprError ? e.message : 'Formel konnte nicht gerechnet werden.'; }
        } }, '= rechnen')),
        h('div', { class: 'val' }, valueIn, h('span', { class: 'unit' }, w.unit)), fb);
      box.check = () => {
        const r = checkValue(w, valueIn.value);
        session.inputs[w.key] = { formula: formulaIn.value, value: valueIn.value };
        session.results[w.key] = r;
        box.classList.toggle('ok', r.ok); box.classList.toggle('bad', !r.ok && r.state !== 'empty');
        fb.className = 'fb ' + (r.ok ? 'ok' : 'bad'); fb.textContent = r.hint;
        return r;
      };
      box.reveal = () => { valueIn.value = fmt(w.value, 3); };
      form.append(box);
    }
    const checkBtn = h('button', { class: 'btn primary', onClick: () => {
      form.querySelectorAll('.answer').forEach((b) => b.check());
      const results = session.results;
      const complete = ex.wanted.every((w) => results[w.key] && results[w.key].state !== 'empty');
      if (!complete) { toast('Bitte alle gesuchten Größen eingeben.', 'info'); return; }
      const score = scoreResults(results);
      if (!session.recorded) { session.recorded = true; recordAttempt(session.topicId, { score, level: ex.level, exId: ex.id }); }
      feedbackBox.innerHTML = '';
      const allOk = score >= 0.99;
      feedbackBox.append(h('div', { class: `notice ${allOk ? 'good' : score > 0 ? 'warn' : 'bad'}` }, h('b', {}, allOk ? 'Alles richtig. ' : `${Math.round(score * ex.wanted.length)} von ${ex.wanted.length} richtig. `), allOk ? 'Die nächste Aufgabe wird etwas anspruchsvoller.' : 'Lies die Hinweise bei den roten Feldern. Du kannst korrigieren und noch einmal prüfen, oder dir den Lösungsweg zeigen lassen.'));
      feedbackBox.append(nextBar(host, go));
    } }, 'Prüfen');
    const solveBtn = h('button', { class: 'btn', onClick: () => { session.revealed = true; if (!session.recorded) { session.recorded = true; recordAttempt(session.topicId, { score: 0, level: ex.level, exId: ex.id }); } showSolution(left, ex); } }, 'Lösungsweg zeigen');
    right.append(h('div', { class: 'card' }, h('h3', {}, 'Deine Lösung'), h('p', { class: 'small' }, 'Tipp: Formel ins erste Feld tippen (Variablen wie oben, Winkel in Grad) und „= rechnen“ drücken, oder den Wert direkt eintragen.'), form, h('div', { class: 'row', style: { marginTop: '10px' } }, checkBtn, solveBtn)), feedbackBox);
    right.append(aiCheckCard(ex, t));
  }
  host.append(h('div', { class: 'task' }, left, right));
}

function nextBar(host, go) {
  return h('div', { class: 'row', style: { marginTop: '10px' } },
    h('button', { class: 'btn primary', onClick: () => { newExercise(session.topicId); drawExercise(host, go); window.scrollTo(0, 0); } }, 'Nächste Aufgabe'),
    h('button', { class: 'btn', onClick: () => go('thema', { currentTopic: session.topicId }) }, 'Erklärung nachlesen'),
    h('button', { class: 'btn ghost', onClick: () => go('tutor', { currentTopic: session.topicId, tutorIntent: 'exercise', tutorPayload: exerciseBrief(session.ex, session.inputs) }) }, 'Mit dem Tutor besprechen'));
}

function showSolution(left, ex) {
  if (left.querySelector('.solution-card')) return;
  left.append(h('div', { class: 'card solution-card' }, h('h3', {}, 'Lösungsweg'), h('div', { class: 'solution' }, h('ol', {}, ex.steps.map((s) => h('li', {}, s))), ex.wanted.length ? h('p', { style: { marginBottom: 0 } }, h('b', {}, 'Ergebnis: '), ex.wanted.map((w) => `${w.label} = ${fmt(w.value)} ${w.unit}`).join(' · ')) : null)));
}

export function exerciseBrief(ex, inputs = {}) {
  if (!ex) return '';
  const given = ex.given.map((g) => `${g.sym} = ${fmt(g.val)} ${g.unit}`).join(', ');
  const wanted = ex.wanted.map((w) => `${w.label} [${w.unit}] = ${fmt(w.value, 3)}`).join('; ');
  const mine = Object.entries(inputs).map(([k, v]) => `${k}: Formel „${v.formula || '–'}“, Wert ${v.value || '–'}`).join('; ');
  return `Aufgabe (${ex.title}, Stufe ${ex.level}): ${ex.text.replace(/<[^>]+>/g, '')}\nGegeben: ${given}\nMusterlösung (nur für dich, nicht vorsagen): ${ex.steps.join(' | ')}\nRichtige Ergebnisse: ${wanted}\nEingaben des Lernenden: ${mine || 'noch keine'}`;
}

function aiCheckCard(ex, t) {
  const st = aiStatus();
  const ta = h('textarea', { id: 'my-way', placeholder: 'Schreib deinen Rechenweg auf, z. B.:\nsin 15° = (F/2)/S\nS = 200 / sin 15° = 773 N', rows: 5 });
  const out = h('div', { class: 'msg ai', hidden: true });
  let ctl = null;
  const btn = h('button', { class: 'btn', disabled: !st.ok, onClick: async () => {
    const way = ta.value.trim();
    if (!way) { toast('Bitte zuerst deinen Rechenweg eintippen.', 'info'); return; }
    ctl = new AbortController();
    out.hidden = false; out.className = 'msg ai thinking'; out.textContent = 'Der Tutor liest deinen Rechenweg …';
    btn.disabled = true; stop.hidden = false;
    try {
      const res = await ask({
        system: `Du bist ein geduldiger Mechanik-Tutor an einer Werkmeisterschule (Österreich). Du sprichst Deutsch, duzt, erklärst in einfacher Sprache und ohne unnötige Fachbegriffe.\n${COURSE_METHOD}\n\nAufgabe: Finde im Rechenweg des Lernenden den ERSTEN Fehler (Denkfehler, Formelwahl, sin/cos, Vorzeichen, Einheit, Rundung) und erkläre genau, wo und warum. Wenn alles richtig ist, bestätige kurz und nenne, was besonders gut war. Gib NICHT die komplette Musterlösung vor, sondern einen Hinweis, wie es ab der Fehlerstelle weitergeht. Antworte in höchstens 8 Sätzen, mit Formeln in Klartext.`,
        turns: [{ role: 'user', content: `${exerciseBrief(ex, session.inputs)}\n\nMein Rechenweg:\n${way}` }],
        onText: ({ text }) => { out.className = 'msg ai'; out.innerHTML = md(text); },
        signal: ctl.signal,
      });
      out.className = 'msg ai'; out.innerHTML = md(res.text);
    } catch (e) {
      out.className = 'msg ai'; out.innerHTML = e.text ? md(e.text) : `<span class="muted">${esc(e.message || 'Keine Antwort.')}</span>`;
    } finally { btn.disabled = false; stop.hidden = true; }
  } }, 'Rechenweg von der KI prüfen lassen');
  const stop = h('button', { class: 'btn small ghost', hidden: true, onClick: () => ctl && ctl.abort() }, 'Stopp');
  return h('div', { class: 'card' }, h('h3', {}, 'Wo liegt mein Fehler?'), h('p', { class: 'small' }, st.ok ? 'Schreib deinen Lösungsweg auf. Die KI vergleicht ihn mit der Musterlösung und zeigt dir die erste Stelle, an der etwas schiefgeht.' : 'Dafür wird die KI gebraucht (auf claude.ai freigeben oder API-Schlüssel in den Einstellungen).'), ta, h('div', { class: 'row' }, btn, stop), out);
}
