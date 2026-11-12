import { h, md, esc, toast } from '../util/dom.js';
import { state, update } from '../platform/store.js';
import { ask, aiStatus } from '../platform/ai.js';
import { TOPICS, topicById, topicBrief } from '../content/topics.js';
import { COURSE_METHOD, TEACHER_TIPS, COURSE_FILES } from '../content/course.js';
import { progressBrief, recordAttempt, prog } from '../engine/mastery.js';
import { searchDocs, docs } from '../platform/docs.js';

const MODES = [
  ['explain', 'Erklären', 'Erkläre Schritt für Schritt auf dem Niveau des Lernenden. Frag am Ende kurz nach, ob der Schritt klar ist, bevor du weitergehst.'],
  ['quiz', 'Abfragen', 'Du prüfst aktiv: Stelle GENAU EINE Frage oder kleine Rechenaufgabe zum aktuellen Thema (mit konkreten Zahlen, Kursniveau), warte auf die Antwort, bewerte sie ehrlich, erkläre Fehler kurz und stelle dann die nächste Frage. Steigere die Schwierigkeit bei richtigen Antworten, vereinfache bei Fehlern. Beende jede Bewertung einer Antwort mit einer eigenen letzten Zeile im Format [[bewertung:richtig]], [[bewertung:teilweise]] oder [[bewertung:falsch]] (nur nach einer Antwort des Lernenden, nie nach einer reinen Frage).'],
  ['solve', 'Lösungsweg', 'Der Lernende bringt eine Aufgabe oder einen eigenen Rechenweg mit. Führe ihn mit Zwischenfragen zur Lösung, statt alles vorzurechnen. Zeige bei Fehlern genau die Stelle. Wenn er ausdrücklich die vollständige Lösung will, gib sie nummeriert in Schritten mit Einheiten.'],
];

let ctl = null;

export function render(main, { go }) {
  const t = topicById(state.currentTopic);
  const st = aiStatus();
  let mode = state.tutorMode || 'explain';

  main.append(h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'KI-Tutor'), h('h1', {}, 'Frag, so oft du willst'), h('p', { class: 'muted' }, 'Der Tutor kennt den Lernplan, die Methode deines Kurses, deinen Lernstand und deine hochgeladenen Unterlagen. Er erklärt schrittweise, fragt dich ab und sucht Fehler in deinem Rechenweg.'))));

  if (!st.ok) {
    main.append(h('div', { class: 'notice warn' }, h('b', {}, st.label + '. '), st.mode === 'artifact' ? 'Erlaube dieser App die Nutzung von Claude über das Menü des Artifacts (Berechtigungen). Danach funktioniert der Tutor ohne weitere Einrichtung.' : 'Hinterlege unter Einstellungen einen Anthropic-API-Schlüssel, oder öffne die App auf claude.ai, wo der Tutor ohne Schlüssel läuft.'));
  }

  const topicSel = h('select', { id: 'tutor-topic', 'aria-label': 'Thema für den Tutor', onChange: (e) => update((s) => { s.currentTopic = e.target.value || null; }, 'nav') },
    h('option', { value: '' }, 'Kein bestimmtes Thema'), TOPICS.map((x) => h('option', { value: x.id, selected: t && x.id === t.id }, `${x.order}. ${x.title}`)));
  const modeChips = h('div', { class: 'chips' }, MODES.map(([key, label]) => h('button', { class: `chip ${mode === key ? 'active' : ''}`, onClick: (e) => { mode = key; update((s) => { s.tutorMode = key; }, 'nav'); modeChips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === e.currentTarget)); } }, label)));
  main.append(h('div', { class: 'card' }, h('div', { class: 'row between' }, h('div', { class: 'row' }, h('span', { class: 'small' }, 'Thema:'), topicSel), modeChips),
    h('div', { class: 'chips', style: { marginTop: '10px' } },
      h('button', { class: 'chip', onClick: () => send(t ? `Erkläre mir „${t.title}“ von Grund auf, Schritt für Schritt.` : 'Womit sollte ich heute anfangen?') }, t ? 'Thema erklären' : 'Wo anfangen?'),
      h('button', { class: 'chip', onClick: () => { mode = 'quiz'; update((s) => { s.tutorMode = 'quiz'; }, 'nav'); modeChips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.textContent === 'Abfragen')); send(t ? `Frag mich zu „${t.title}“ ab. Fang mit einer Frage auf meinem Niveau an.` : 'Frag mich ab, beginnend bei meinem schwächsten Thema.'); } }, 'Frag mich ab'),
      h('button', { class: 'chip', onClick: () => send('Wo sind meine größten Wissenslücken, und was soll ich als Nächstes üben?') }, 'Meine Lücken'),
      docs().length ? h('button', { class: 'chip', onClick: () => send(t ? `Was steht in meinen Unterlagen zu „${t.title}“? Fasse zusammen und erkläre die Beispiele daraus.` : 'Fasse meine Unterlagen zusammen und ordne sie dem Lernplan zu.') }, 'Aus meinen Unterlagen') : null,
      h('button', { class: 'chip', onClick: () => { update((s) => { s.tutor.turns = []; }, 'tutor'); drawChat(); } }, 'Verlauf löschen'))));

  const chat = h('div', { class: 'chat', id: 'chat' });
  main.append(chat);
  const ta = h('textarea', { id: 'tutor-input', placeholder: t ? `Frage zu „${t.title}“ … (Enter = senden, Shift+Enter = neue Zeile)` : 'Deine Frage … (Enter = senden, Shift+Enter = neue Zeile)', rows: 2, onKeydown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } });
  const sendBtn = h('button', { class: 'btn primary', disabled: !st.ok, onClick: () => send() }, 'Senden');
  const stopBtn = h('button', { class: 'btn', hidden: true, onClick: () => ctl && ctl.abort() }, 'Stopp');
  main.append(h('div', { class: 'composer' }, h('div', { class: 'box' }, ta, h('div', { class: 'stack', style: { gap: '6px' } }, sendBtn, stopBtn))));

  function drawChat() {
    chat.innerHTML = '';
    const turns = state.tutor.turns;
    if (!turns.length) chat.append(h('div', { class: 'msg ai' }, h('p', {}, t ? `Hallo! Wir sind beim Thema „${t.title}“. Soll ich es erklären, dich abfragen oder eine Aufgabe mit dir durchgehen?` : 'Hallo! Wähle oben ein Thema oder stell direkt eine Frage. Ich erkläre so einfach wie möglich und immer Schritt für Schritt.'), h('p', { class: 'small', style: { marginBottom: 0 } }, 'Beispiele: „Warum ist die Seilkraft größer als die Last?“ · „Rechne Beispiel 5 aus Z10 mit mir durch“ · „Was ist der Normalabstand?“')));
    for (const m of turns) chat.append(h('div', { class: `msg ${m.role === 'user' ? 'user' : 'ai'}`, html: md(stripMarker(m.content)) }));
    chat.lastElementChild && chat.lastElementChild.scrollIntoView({ block: 'end' });
  }
  drawChat();

  async function send(text) {
    const msg = (text || ta.value).trim();
    if (!msg) return;
    if (!aiStatus().ok) { toast(aiStatus().label, 'bad'); return; }
    ta.value = '';
    update((s) => { s.tutor.turns.push({ role: 'user', content: msg }); if (s.tutor.turns.length > 40) s.tutor.turns = s.tutor.turns.slice(-40); }, 'tutor');
    drawChat();
    const bubble = h('div', { class: 'msg ai thinking' }, 'Der Tutor denkt nach …');
    chat.append(bubble); bubble.scrollIntoView({ block: 'end' });
    sendBtn.disabled = true; stopBtn.hidden = false;
    ctl = new AbortController();
    try {
      const res = await ask({
        system: buildSystem(mode, msg),
        turns: state.tutor.turns.slice(-16).map((x) => ({ role: x.role, content: x.content })),
        onText: ({ text: tx }) => { bubble.className = 'msg ai'; bubble.innerHTML = md(stripMarker(tx)); bubble.scrollIntoView({ block: 'end' }); },
        signal: ctl.signal,
      });
      const full = res.text || '';
      update((s) => { s.tutor.turns.push({ role: 'assistant', content: full }); }, 'tutor');
      handleMarker(full);
      drawChat();
    } catch (e) {
      if (e.text) update((s) => { s.tutor.turns.push({ role: 'assistant', content: e.text }); }, 'tutor');
      drawChat();
      if (e.code !== 'cancelled') chat.append(h('div', { class: 'notice bad' }, e.message || 'Keine Antwort.'));
    } finally { sendBtn.disabled = false; stopBtn.hidden = true; ctl = null; }
  }

  // Absicht aus anderer Seite (z. B. „Abfragen lassen“ im Thema)
  const intent = state.tutorIntent;
  if (intent) {
    const payload = state.tutorPayload;
    update((s) => { s.tutorIntent = null; s.tutorPayload = null; }, 'nav');
    if (intent === 'quiz') { mode = 'quiz'; update((s) => { s.tutorMode = 'quiz'; }, 'nav'); modeChips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.textContent === 'Abfragen')); send(t ? `Frag mich zu „${t.title}“ ab.` : 'Frag mich ab.'); }
    else if (intent === 'explain') send(t ? `Erkläre mir „${t.title}“ Schritt für Schritt.` : 'Erkläre mir das aktuelle Thema.');
    else if (intent === 'docs') send(t ? `Erkläre mir „${t.title}“ anhand meiner eigenen Unterlagen.` : 'Fasse meine Unterlagen zusammen.');
    else if (intent === 'exercise' && payload) { mode = 'solve'; update((s) => { s.tutorMode = 'solve'; }, 'nav'); modeChips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.textContent === 'Lösungsweg')); send(`Ich habe gerade diese Aufgabe bearbeitet und möchte sie besprechen:\n${payload}\n\nWo lag mein Fehler bzw. wie gehe ich am besten vor?`); }
  }

  return () => { if (ctl) ctl.abort(); };
}

function stripMarker(s) { return String(s || '').replace(/\[\[bewertung:(richtig|teilweise|falsch)\]\]/gi, '').trim(); }
function handleMarker(text) {
  const m = String(text || '').match(/\[\[bewertung:(richtig|teilweise|falsch)\]\]/i);
  if (!m) return;
  const tid = state.currentTopic || (TOPICS.find((x) => prog(x.id).attempts > 0) || TOPICS[0]).id;
  const score = m[1].toLowerCase() === 'richtig' ? 1 : m[1].toLowerCase() === 'teilweise' ? 0.5 : 0;
  recordAttempt(tid, { score, level: 2, exId: 'tutor-quiz', kind: 'quiz' });
}

function buildSystem(mode, lastMsg) {
  const t = topicById(state.currentTopic);
  const modeText = (MODES.find((m) => m[0] === mode) || MODES[0])[2];
  const name = state.settings.name ? ` Der Lernende heißt ${state.settings.name}.` : '';
  const hits = searchDocs(`${lastMsg} ${t ? t.keywords.slice(0, 5).join(' ') : ''}`, 6, t ? [t.id] : null);
  const moreHits = hits.length < 3 ? searchDocs(lastMsg, 4) : [];
  const allHits = [...hits, ...moreHits.filter((x) => !hits.includes(x))].slice(0, 7);
  const docText = allHits.length ? `\nAuszüge aus den eigenen Unterlagen des Lernenden (bevorzugt verwenden, Quelle nennen):\n${allHits.map((x) => `[${x.docName}, S./Folie ${x.page}] ${x.text.slice(0, 700)}`).join('\n')}` : (docs().length ? '' : '\n(Der Lernende hat noch keine eigenen Unterlagen hochgeladen.)');
  const docSummaries = docs().slice(0, 8).map((d) => `- ${d.title || d.name}: ${(d.summary || '').slice(0, 200)}`).join('\n');
  return `Du bist ein persönlicher Mechanik-Tutor für die Werkmeisterschule (Fach „Mechanik und technische Grundlagen“, Österreich).${name}
Sprache: Deutsch, du-Form, einfache klare Sätze, Fachbegriffe nur wenn nötig und dann kurz erklärt. Formeln in Klartext (F = m · g), keine LaTeX-Syntax. Nutze Markdown sparsam (Fettdruck, Listen, nummerierte Schritte).
Grundsatz: Schrittweise Lösungswege statt fertiger Ergebnisse. Erst Skizze/Ansatz (Freikörperbild, welches Dreieck, welche Gleichgewichtsbedingung), dann Formel, dann Zahlen mit Einheiten, dann Probe. Erkenne Wissenslücken aktiv und sprich sie an.
Modus: ${modeText}
${COURSE_METHOD}
Tipps des Lehrers: ${TEACHER_TIPS.join(' | ')}
Kursunterlagen (Kürzel): ${COURSE_FILES.map((f) => `${f.code} = ${f.name}`).join('; ')}
${t ? `\nAktuelles Thema aus dem Lernplan:\n${topicBrief(t)}` : '\nKein Thema gewählt. Themen des Lernplans: ' + TOPICS.map((x) => x.title).join(', ')}
\n${progressBrief()}
${docSummaries ? `\nHochgeladene Unterlagen:\n${docSummaries}` : ''}${docText}`;
}
