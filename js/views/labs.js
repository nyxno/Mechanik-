// Interaktive Skizzen: Schieberegler verändern die Zeichnung und die Rechnung live.
import { h } from '../util/dom.js';
import { fmt } from '../util/expr.js';
import * as S from '../content/sketches.js';

const d2r = (d) => (d * Math.PI) / 180;

function slider(label, min, max, val, step, onInput, unit = '') {
  const out = h('b', {}, `${fmt(val)}${unit}`);
  const inp = h('input', { type: 'range', min, max, value: val, step, id: 'lab-' + label.replace(/\W+/g, '-') + '-' + Math.random().toString(36).slice(2, 6) });
  inp.addEventListener('input', () => { out.textContent = `${fmt(+inp.value)}${unit}`; onInput(+inp.value); });
  return h('label', {}, h('span', {}, label, ' ', out), inp);
}
function readout(pairs) {
  const el = h('div', { class: 'readout' });
  el.set = (ps) => { el.innerHTML = ''; for (const [k, v] of ps) el.append(h('span', {}, k), h('span', {}, v)); };
  el.set(pairs);
  return el;
}

const LABS = {
  zerlegung() {
    let F = 100, a = 30;
    const box = h('div', { class: 'sketch-box paper' });
    const ro = readout([]);
    const draw = () => {
      box.innerHTML = S.sketchZerlegung(F, a, 160 / F);
      ro.set([['Fx = F·cos α', `${fmt(F * Math.cos(d2r(a)))} N`], ['Fy = F·sin α', `${fmt(F * Math.sin(d2r(a)))} N`], ['Probe √(Fx²+Fy²)', `${fmt(Math.hypot(F * Math.cos(d2r(a)), F * Math.sin(d2r(a))))} N`]]);
    };
    draw();
    return h('div', { class: 'lab' }, box, h('div', { class: 'controls' }, slider('Kraft F', 20, 500, F, 5, (v) => { F = v; draw(); }, ' N'), slider('Winkel α', 0, 360, a, 1, (v) => { a = v; draw(); }, '°'), ro, h('p', { class: 'small' }, 'Beobachte: Bei 90° verschwindet Fx, bei 180° wird Fx negativ.')));
  },
  resultierende() {
    let F1 = 100, a1 = 0, F2 = 60, a2 = 120, F3 = 0, a3 = 180;
    const box = h('div', { class: 'sketch-box paper' });
    const ro = readout([]);
    const draw = () => {
      const fs = [{ F: F1, a: a1, name: 'F1' }, { F: F2, a: a2, name: 'F2' }];
      if (F3 > 0) fs.push({ F: F3, a: a3, name: 'F3' });
      const sx = fs.reduce((s, f) => s + f.F * Math.cos(d2r(f.a)), 0), sy = fs.reduce((s, f) => s + f.F * Math.sin(d2r(f.a)), 0);
      const Fr = Math.hypot(sx, sy); let al = (Math.atan2(sy, sx) * 180) / Math.PI; if (al < 0) al += 360;
      box.innerHTML = S.sketchKrafteck(fs, { scale: 1.1 });
      ro.set([['ΣFx', `${fmt(sx)} N`], ['ΣFy', `${fmt(sy)} N`], ['Fr', `${fmt(Fr)} N`], ['αr', `${fmt(al)}°`]]);
    };
    draw();
    return h('div', { class: 'lab' }, box, h('div', { class: 'controls' },
      slider('F1', 0, 200, F1, 5, (v) => { F1 = v; draw(); }, ' N'), slider('α1', 0, 360, a1, 5, (v) => { a1 = v; draw(); }, '°'),
      slider('F2', 0, 200, F2, 5, (v) => { F2 = v; draw(); }, ' N'), slider('α2', 0, 360, a2, 5, (v) => { a2 = v; draw(); }, '°'),
      slider('F3 (0 = aus)', 0, 200, F3, 5, (v) => { F3 = v; draw(); }, ' N'), slider('α3', 0, 360, a3, 5, (v) => { a3 = v; draw(); }, '°'), ro,
      h('p', { class: 'small' }, 'Stelle die Kräfte so ein, dass Fr ≈ 0 wird: Dann schließt sich das Krafteck – Gleichgewicht.')));
  },
  drehmoment() {
    let F = 30, l = 600, a = 30;
    const box = h('div', { class: 'sketch-box paper' });
    const ro = readout([]);
    const draw = () => {
      const ln = l * Math.cos(d2r(a));
      box.innerHTML = S.sketchDrehmoment(a);
      ro.set([['ln = l·cos α', `${fmt(ln)} mm`], ['M = F·ln', `${fmt(F * ln / 1000)} kNm`], ['Fy = F·cos α', `${fmt(F * Math.cos(d2r(a)))} kN`], ['Fy·l', `${fmt(F * Math.cos(d2r(a)) * l / 1000)} kNm`]]);
    };
    draw();
    return h('div', { class: 'lab' }, box, h('div', { class: 'controls' }, slider('Kraft F', 5, 100, F, 5, (v) => { F = v; draw(); }, ' kN'), slider('Hebel l', 100, 1000, l, 50, (v) => { l = v; draw(); }, ' mm'), slider('Winkel α zur Senkrechten', 0, 85, a, 1, (v) => { a = v; draw(); }, '°'), ro, h('p', { class: 'small' }, 'Beide Wege (Normalabstand oder Komponente) liefern dasselbe Moment.')));
  },
  hebel() {
    let F1 = 100, l1 = 300, l2 = 100;
    const box = h('div', { class: 'sketch-box paper' });
    const ro = readout([]);
    const draw = () => {
      const F2 = F1 * l1 / l2;
      box.innerHTML = S.sketchHebel(F1, l1, F2, l2);
      ro.set([['Übersetzung i = l1/l2', fmt(l1 / l2)], ['F2 = F1·l1/l2', `${fmt(F2)} N`], ['Stützkraft S = F1 + F2', `${fmt(F1 + F2)} N`]]);
    };
    draw();
    return h('div', { class: 'lab' }, box, h('div', { class: 'controls' }, slider('F1', 10, 500, F1, 10, (v) => { F1 = v; draw(); }, ' N'), slider('l1', 50, 800, l1, 10, (v) => { l1 = v; draw(); }, ' mm'), slider('l2', 50, 800, l2, 10, (v) => { l2 = v; draw(); }, ' mm'), ro));
  },
  traeger() {
    let L = 1800, F1 = 500, a1 = 500, F2 = 800, a2 = 1400;
    const box = h('div', { class: 'sketch-box paper' });
    const box2 = h('div', { class: 'sketch-box' });
    const ro = readout([]);
    const draw = () => {
      a1 = Math.min(a1, L + 600); a2 = Math.min(a2, L + 600);
      const B = (F1 * a1 + F2 * a2) / L, A = F1 + F2 - B;
      const pts = [{ x: 0, M: 0 }];
      const xs = [a1, a2, L].filter((v, i, arr) => arr.indexOf(v) === i).sort((p, q) => p - q);
      const Mat = (x) => { let M = A * x; if (a1 < x) M -= F1 * (x - a1); if (a2 < x) M -= F2 * (x - a2); return M / 1000; };
      for (const x of xs) pts.push({ x, M: Mat(x), label: `${fmt(Mat(x))}` });
      const end = Math.max(L, a1, a2); if (end > L) pts.push({ x: end, M: 0 });
      box.innerHTML = S.sketchTraeger(L, [{ x: a1, F: F1, name: 'F1' }, { x: a2, F: F2, name: 'F2' }], { showReactions: true });
      box2.innerHTML = S.sketchMomentenverlauf(end, pts);
      ro.set([['B = (F1·a1 + F2·a2)/L', `${fmt(B)} N`], ['A = F1 + F2 − B', `${fmt(A)} N`], ['Mb unter F1', `${fmt(Mat(a1))} Nm`], ['Mb unter F2', `${fmt(Mat(a2))} Nm`]]);
    };
    draw();
    return h('div', { class: 'lab' }, h('div', { class: 'stack' }, box, box2), h('div', { class: 'controls' },
      slider('Stützweite L', 800, 2400, L, 100, (v) => { L = v; draw(); }, ' mm'),
      slider('F1', 0, 2000, F1, 50, (v) => { F1 = v; draw(); }, ' N'), slider('a1 (von A)', 0, 3000, a1, 50, (v) => { a1 = v; draw(); }, ' mm'),
      slider('F2', 0, 2000, F2, 50, (v) => { F2 = v; draw(); }, ' N'), slider('a2 (von A)', 0, 3000, a2, 50, (v) => { a2 = v; draw(); }, ' mm'), ro,
      h('p', { class: 'small' }, 'Schiebe eine Last über das Lager B hinaus (a > L): A wird negativ, der Träger würde abheben.')));
  },
  'schiefe-ebene'() {
    let m = 100, a = 25, mu = 0.2;
    const box = h('div', { class: 'sketch-box paper' });
    const ro = readout([]);
    const draw = () => {
      const G = m * 9.81, FH = G * Math.sin(d2r(a)), FN = G * Math.cos(d2r(a)), FR = mu * FN;
      box.innerHTML = S.sketchSchiefeEbene(a);
      ro.set([['G = m·g', `${fmt(G)} N`], ['FH = G·sin α', `${fmt(FH)} N`], ['FN = G·cos α', `${fmt(FN)} N`], ['FR = μ·FN', `${fmt(FR)} N`], ['Zustand', FH > FR ? 'rutscht' : 'bleibt liegen'], ['Reibungswinkel ρ', `${fmt(Math.atan(mu) * 180 / Math.PI)}°`]]);
    };
    draw();
    return h('div', { class: 'lab' }, box, h('div', { class: 'controls' }, slider('Masse m', 10, 500, m, 10, (v) => { m = v; draw(); }, ' kg'), slider('Neigung α', 0, 60, a, 1, (v) => { a = v; draw(); }, '°'), slider('Reibungszahl μ', 0, 1, mu, 0.05, (v) => { mu = v; draw(); }), ro));
  },
};

export function renderLab(name) {
  const fn = LABS[name];
  if (!fn) return null;
  const el = fn();
  return h('div', { class: 'card' }, h('h3', {}, 'Ausprobieren'), el);
}
export const LAB_NAMES = Object.keys(LABS);
