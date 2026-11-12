// Gesamter Lernplan: Module und Themen in Reihenfolge.
import * as K from './topics-kraefte.js';
import * as ST from './topics-statik.js';
import * as E from './topics-energie.js';

export const MODULES = [K.MODULE, ST.MODULE, E.MODULE].sort((a, b) => a.order - b.order);
export const TOPICS = [...K.TOPICS, ...ST.TOPICS, ...E.TOPICS].sort((a, b) => a.order - b.order);

export const topicById = (id) => TOPICS.find((t) => t.id === id);
export const topicsOfModule = (mid) => TOPICS.filter((t) => t.module === mid);
export const moduleById = (id) => MODULES.find((m) => m.id === id);

/** Kurzfassung eines Themas als Text für den KI-Tutor. */
export function topicBrief(t) {
  if (!t) return '';
  const steps = t.steps.map((s, i) => `${i + 1}. ${s.h}: ${stripHtml(s.html).slice(0, 400)}`).join('\n');
  const formulas = t.formulas.map((f) => `- ${f.name}: ${f.f}${f.note ? ' (' + f.note + ')' : ''}`).join('\n');
  const mistakes = (t.mistakes || []).map((m) => `- Falsch: ${m.wrong} Richtig: ${m.right}`).join('\n');
  return `Thema: ${t.title}\n${stripHtml(t.intro)}\n\nLernschritte:\n${steps}\n\nFormeln:\n${formulas}\n\nTypische Fehler:\n${mistakes}\n\nQuellen im Kurs: ${(t.sources || []).join(', ')}`;
}

export function stripHtml(s) {
  return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
