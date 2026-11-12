// Adaptives Lernen: Beherrschungsgrad (0–100) je Thema, Schwierigkeitswahl und zeitlich gestaffelte Wiederholung.
import { state, update, markToday } from '../platform/store.js';
import { TOPICS } from '../content/topics.js';

const DAY = 86400000;

export function prog(topicId) {
  return state.progress[topicId] || { mastery: 0, attempts: 0, correct: 0, lastAt: 0, due: 0, interval: 0, ease: 2.3, read: false, streak: 0 };
}

export function status(topicId) {
  const p = prog(topicId);
  if (p.due && p.due < Date.now() && p.attempts > 0) return { key: 'due', label: 'Wiederholen' };
  if (p.attempts === 0 && !p.read) return { key: 'new', label: 'Neu' };
  if (p.mastery >= 80) return { key: 'strong', label: 'Sicher' };
  if (p.attempts >= 3 && p.mastery < 45) return { key: 'weak', label: 'Unsicher' };
  return { key: 'progress', label: 'In Arbeit' };
}

/** Schwierigkeitsstufe 1–3 aus dem Beherrschungsgrad ableiten (bei Einstellung „auto“). */
export function levelFor(topicId) {
  const mode = state.settings.levelMode;
  if (mode === '1' || mode === '2' || mode === '3') return +mode;
  const p = prog(topicId);
  if (p.mastery >= 75 && p.streak >= 2) return 3;
  if (p.mastery >= 40 || p.attempts >= 2 && p.streak >= 2) return 2;
  return 1;
}

/**
 * Versuch verbuchen. score: 0..1 (Anteil richtiger Teilaufgaben), level 1..3.
 * Beherrschung bewegt sich träge; höhere Stufen zählen mehr. Wiederholung nach SM-2-Prinzip.
 */
export function recordAttempt(topicId, { score, level = 1, exId = '', kind = 'exercise' }) {
  const correct = score >= 0.99;
  update((s) => {
    const p = { ...prog(topicId) };
    const weight = level === 3 ? 1.3 : level === 2 ? 1.0 : 0.75;
    const target = Math.round(score * 100);
    const alpha = 0.3 * weight;
    p.mastery = Math.max(0, Math.min(100, Math.round(p.mastery + alpha * (target - p.mastery) + (correct ? 4 * weight : -3))));
    p.attempts += 1;
    if (correct) p.correct += 1;
    p.streak = correct ? (p.streak || 0) + 1 : 0;
    p.lastAt = Date.now();
    // Wiederholungsabstand
    if (correct) {
      p.ease = Math.min(3, (p.ease || 2.3) + 0.08);
      p.interval = p.interval ? Math.round(p.interval * p.ease * 10) / 10 : 1;
    } else {
      p.ease = Math.max(1.3, (p.ease || 2.3) - 0.2);
      p.interval = 0.5;
    }
    p.due = Date.now() + p.interval * DAY;
    s.progress[topicId] = p;
    s.attempts.push({ id: Math.random().toString(36).slice(2, 9), topicId, exId, level, score, correct, at: Date.now(), kind });
    if (s.attempts.length > 300) s.attempts = s.attempts.slice(-300);
  }, 'attempt');
  markToday();
}

export function markRead(topicId) {
  update((s) => { const p = { ...prog(topicId), read: true }; if (!p.due) p.due = Date.now() + 2 * DAY; s.progress[topicId] = p; }, 'read');
  markToday();
}

export function overallMastery() {
  const vals = TOPICS.map((t) => prog(t.id).mastery);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function dueTopics() {
  const now = Date.now();
  return TOPICS.filter((t) => { const p = prog(t.id); return p.attempts > 0 && p.due && p.due < now; });
}
export function weakTopics() {
  return TOPICS.filter((t) => { const p = prog(t.id); return p.attempts >= 2 && p.mastery < 50; }).sort((a, b) => prog(a.id).mastery - prog(b.id).mastery);
}

/** Empfehlung für den nächsten Schritt. */
export function recommend() {
  const due = dueTopics();
  if (due.length) return { kind: 'review', topic: due[0], reason: 'Wiederholung fällig. Kurz üben, damit es sitzt.' };
  const weak = weakTopics();
  if (weak.length) return { kind: 'practice', topic: weak[0], reason: `Hier liegt die Beherrschung erst bei ${prog(weak[0].id).mastery} %.` };
  const started = TOPICS.filter((t) => { const p = prog(t.id); return (p.read || p.attempts > 0) && p.mastery < 80; });
  if (started.length) return { kind: 'practice', topic: started[0], reason: 'Angefangen, aber noch nicht sicher.' };
  const unlocked = TOPICS.find((t) => prog(t.id).attempts === 0 && !prog(t.id).read && (t.prereq || []).every((id) => prog(id).mastery >= 50 || prog(id).read));
  if (unlocked) return { kind: 'learn', topic: unlocked, reason: 'Nächstes Thema im Lernplan.' };
  const next = TOPICS.find((t) => prog(t.id).mastery < 80) || TOPICS[0];
  return { kind: 'practice', topic: next, reason: 'Weiter festigen.' };
}

/** Zusammenfassung des Lernstands als Text für den KI-Tutor. */
export function progressBrief() {
  const lines = TOPICS.map((t) => { const p = prog(t.id); const st = status(t.id); return `- ${t.title}: ${p.mastery} % (${st.label}, ${p.attempts} Versuche)`; });
  const recent = state.attempts.slice(-8).map((a) => `${a.correct ? '✓' : '✗'} ${a.topicId} (Stufe ${a.level})`).join(', ');
  return `Lernstand (Beherrschung je Thema):\n${lines.join('\n')}\nLetzte Versuche: ${recent || 'noch keine'}`;
}
