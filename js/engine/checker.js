// Prüft Zahlenantworten, erkennt typische Rechen- und Denkfehler und formuliert Hinweise.
import { parseNumber, fmt } from '../util/expr.js';

/**
 * @param {object} w  gesuchte Größe {key,label,unit,value,tol?,alts?:[{value,hint}]}
 * @param {string|number} input
 * @returns {{ok:boolean, state:'ok'|'bad'|'empty', hint:string, rel:number}}
 */
export function checkValue(w, input) {
  const v = typeof input === 'number' ? input : parseNumber(input);
  if (!Number.isFinite(v)) return { ok: false, state: 'empty', hint: 'Bitte einen Zahlenwert eingeben (Komma oder Punkt).', rel: NaN };
  const target = w.value;
  const tol = w.tol ?? defaultTol(w);
  const diff = Math.abs(v - target);
  const rel = target !== 0 ? diff / Math.abs(target) : diff;
  const within = target !== 0 ? rel <= tol : diff <= (w.abs ?? 0.5);
  if (within) return { ok: true, state: 'ok', hint: rel > tol * 0.6 ? `Richtig (kleine Rundungsabweichung, genau: ${fmt(target)} ${w.unit}).` : 'Richtig.', rel };

  // Diagnose
  const hints = [];
  for (const a of w.alts || []) {
    if (!Number.isFinite(a.value)) continue;
    const r = a.value !== 0 ? Math.abs(v - a.value) / Math.abs(a.value) : Math.abs(v - a.value);
    if (r <= Math.max(tol, 0.02)) { hints.push(a.hint); break; }
  }
  if (!hints.length) {
    if (target !== 0 && Math.abs(v + target) / Math.abs(target) <= tol) hints.push('Der Betrag stimmt, aber das Vorzeichen ist umgekehrt. Prüfe die Richtung (nach oben/rechts positiv?) bzw. den Drehsinn.');
    else {
      for (const f of [1000, 100, 10, 0.001, 0.01, 0.1, 60, 3.6, 9.81]) {
        if (target !== 0 && Math.abs(v - target * f) / Math.abs(target * f) <= tol) {
          hints.push(f === 9.81 || f === 1 / 9.81 ? 'Du hast Masse und Gewichtskraft verwechselt (Faktor g = 9,81).' : f === 3.6 ? 'Einheitenfehler km/h ↔ m/s (Faktor 3,6).' : f === 60 ? 'Einheitenfehler bei der Zeit oder Drehzahl (Faktor 60).' : `Einheitenfehler: Dein Wert ist um den Faktor ${f >= 1 ? f : '1/' + (1 / f)} daneben (z. B. mm statt m oder kN statt N).`);
          break;
        }
      }
    }
  }
  if (!hints.length) {
    if (rel < 0.08) hints.push('Nahe dran, aber außerhalb der Toleranz. Vermutlich zu früh gerundet. Rechne mit mehr Nachkommastellen weiter.');
    else if (rel < 0.5) hints.push('Der Rechenweg ist wohl richtig, aber ein Zwischenwert stimmt nicht. Prüfe die Zerlegung (sin/cos) und die Hebelarme.');
    else hints.push('Das Ergebnis liegt weit daneben. Prüfe den Ansatz: Welches Dreieck, welche Gleichgewichtsbedingung, welcher Drehpunkt?');
  }
  return { ok: false, state: 'bad', hint: hints[0], rel };
}

function defaultTol(w) {
  if (w.unit === '°') return 0.03;
  return 0.025;
}

/** Bewertet eine ganze Aufgabe: Anteil richtiger Teilaufgaben. */
export function scoreResults(results) {
  const vals = Object.values(results);
  if (!vals.length) return 0;
  return vals.filter((r) => r && r.ok).length / vals.length;
}
