// SVG-Zeichenhelfer für technische Skizzen (Kräfte, Träger, Hebel, Winkel).
// Alle Funktionen liefern SVG-Strings; Farben kommen aus CSS-Tokens (var(--…)).

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const C = {
  force: 'var(--force)',
  force2: 'var(--force2)',
  result: 'var(--result)',
  line: 'var(--sk-line)',
  fg: 'var(--fg)',
  muted: 'var(--muted)',
  dim: 'var(--sk-dim)',
  fill: 'var(--sk-fill)',
};

let uid = 0;
/** Umschließendes SVG mit Pfeilspitzen-Markern. */
export function svg(w, h, inner, opts = {}) {
  const id = 'm' + (uid++);
  const cls = opts.class ? ` ${opts.class}` : '';
  const markers = ['force', 'force2', 'result', 'line', 'fg', 'dim'].map((k) =>
    `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C[k]}"/></marker>`).join('');
  return `<svg class="sketch${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.label || 'Skizze')}" data-mid="${id}" xmlns="http://www.w3.org/2000/svg"><defs>${markers}</defs>${inner.replace(/url\(#MK-/g, `url(#${id}-`)}</svg>`;
}

/** Pfeil (Kraftvektor). Winkel in Grad, mathematisch positiv (gegen Uhrzeigersinn), y nach oben. */
export function arrow(x, y, angleDeg, len, opts = {}) {
  const a = (angleDeg * Math.PI) / 180;
  const x2 = x + len * Math.cos(a);
  const y2 = y - len * Math.sin(a);
  return arrowXY(x, y, x2, y2, opts);
}
export function arrowXY(x1, y1, x2, y2, opts = {}) {
  const color = opts.color || C.force;
  const key = opts.marker || Object.keys(C).find((k) => C[k] === color) || 'force';
  const w = opts.width || 2.4;
  let s = `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${color}" stroke-width="${w}" marker-end="url(#MK-${key})" ${opts.dash ? `stroke-dasharray="${opts.dash}"` : ''}/>`;
  if (opts.label) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const off = opts.labelOffset ?? 12;
    const nx = -dy / L, ny = dx / L; // Normale
    const side = opts.labelSide ?? 1;
    const lx = (opts.labelAt === 'end' ? x2 : mx) + nx * off * side;
    const ly = (opts.labelAt === 'end' ? y2 : my) + ny * off * side;
    s += label(lx, ly, opts.label, { color, anchor: 'middle', size: opts.labelSize });
  }
  return s;
}

export function label(x, y, text, opts = {}) {
  const color = opts.color || C.fg;
  const size = opts.size || 13;
  const anchor = opts.anchor || 'start';
  const weight = opts.bold ? ' font-weight="600"' : '';
  const cls = opts.mono ? ' class="sk-mono"' : '';
  return `<text x="${r(x)}" y="${r(y)}" fill="${color}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="middle"${weight}${cls}>${esc(text)}</text>`;
}

/** Winkelbogen von a0 bis a1 (Grad, gegen Uhrzeigersinn) um (x,y). */
export function angleArc(x, y, radius, a0, a1, opts = {}) {
  const A0 = (a0 * Math.PI) / 180, A1 = (a1 * Math.PI) / 180;
  const sx = x + radius * Math.cos(A0), sy = y - radius * Math.sin(A0);
  const ex = x + radius * Math.cos(A1), ey = y - radius * Math.sin(A1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 0 : 1;
  let s = `<path d="M${r(sx)},${r(sy)} A${radius},${radius} 0 ${large} ${sweep} ${r(ex)},${r(ey)}" fill="none" stroke="${opts.color || C.muted}" stroke-width="1.4"/>`;
  if (opts.label) {
    const am = ((a0 + a1) / 2) * Math.PI / 180;
    const lr = radius + (opts.labelOffset ?? 14);
    s += label(x + lr * Math.cos(am), y - lr * Math.sin(am), opts.label, { color: opts.color || C.muted, anchor: 'middle', size: 12 });
  }
  return s;
}

/** Gestrichelte Linie (Wirkungslinie, Hilfslinie). */
export function dashed(x1, y1, x2, y2, opts = {}) {
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${opts.color || C.dim}" stroke-width="${opts.width || 1.2}" stroke-dasharray="${opts.dash || '5 4'}"/>`;
}
export function line(x1, y1, x2, y2, opts = {}) {
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${opts.color || C.line}" stroke-width="${opts.width || 2}" stroke-linecap="round"/>`;
}
export function dot(x, y, radius = 4, color = C.fg) {
  return `<circle cx="${r(x)}" cy="${r(y)}" r="${radius}" fill="${color}"/>`;
}
/** Rechter-Winkel-Marke */
export function rightAngle(x, y, dirDeg, size = 10) {
  const a = (dirDeg * Math.PI) / 180;
  const ux = Math.cos(a), uy = -Math.sin(a);
  const vx = -uy, vy = ux;
  const p1 = [x + ux * size, y + uy * size];
  const p2 = [x + ux * size + vx * size, y + uy * size + vy * size];
  const p3 = [x + vx * size, y + vy * size];
  return `<polyline points="${r(p1[0])},${r(p1[1])} ${r(p2[0])},${r(p2[1])} ${r(p3[0])},${r(p3[1])}" fill="none" stroke="${C.muted}" stroke-width="1.2"/>`;
}

/** Bemaßung zwischen x1 und x2 auf Höhe y. */
export function dimH(x1, x2, y, text, opts = {}) {
  const c = opts.color || C.muted;
  return `<g>` +
    `<line x1="${r(x1)}" y1="${r(y - 6)}" x2="${r(x1)}" y2="${r(y + 6)}" stroke="${c}" stroke-width="1"/>` +
    `<line x1="${r(x2)}" y1="${r(y - 6)}" x2="${r(x2)}" y2="${r(y + 6)}" stroke="${c}" stroke-width="1"/>` +
    `<line x1="${r(x1)}" y1="${r(y)}" x2="${r(x2)}" y2="${r(y)}" stroke="${c}" stroke-width="1" marker-start="url(#MK-dim)" marker-end="url(#MK-dim)"/>` +
    label((x1 + x2) / 2, y + (opts.below === false ? -11 : 12), text, { color: c, anchor: 'middle', size: 12 }) + `</g>`;
}
export function dimV(y1, y2, x, text, opts = {}) {
  const c = opts.color || C.muted;
  return `<g>` +
    `<line x1="${r(x - 6)}" y1="${r(y1)}" x2="${r(x + 6)}" y2="${r(y1)}" stroke="${c}" stroke-width="1"/>` +
    `<line x1="${r(x - 6)}" y1="${r(y2)}" x2="${r(x + 6)}" y2="${r(y2)}" stroke="${c}" stroke-width="1"/>` +
    `<line x1="${r(x)}" y1="${r(y1)}" x2="${r(x)}" y2="${r(y2)}" stroke="${c}" stroke-width="1" marker-start="url(#MK-dim)" marker-end="url(#MK-dim)"/>` +
    label(x + (opts.left ? -10 : 10), (y1 + y2) / 2, text, { color: c, anchor: opts.left ? 'end' : 'start', size: 12 }) + `</g>`;
}

/** Träger (Balken) als Rechteck. */
export function beam(x, y, len, h = 14) {
  return `<rect x="${r(x)}" y="${r(y - h / 2)}" width="${r(len)}" height="${h}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>`;
}
/** Festlager (Dreieck mit Schraffur) – Oberkante bei y. */
export function supportFixed(x, y, name) {
  const s = 16;
  return `<g><polygon points="${r(x)},${r(y)} ${r(x - s)},${r(y + s * 1.4)} ${r(x + s)},${r(y + s * 1.4)}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` +
    hatch(x - s - 4, y + s * 1.4, 2 * s + 8) + (name ? label(x, y + s * 1.4 + 22, name, { anchor: 'middle', bold: true }) : '') + `</g>`;
}
/** Loslager (Dreieck auf Rollen) – Oberkante bei y. */
export function supportRoller(x, y, name) {
  const s = 16;
  return `<g><polygon points="${r(x)},${r(y)} ${r(x - s)},${r(y + s * 1.2)} ${r(x + s)},${r(y + s * 1.2)}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` +
    `<circle cx="${r(x - 8)}" cy="${r(y + s * 1.2 + 5)}" r="4" fill="none" stroke="${C.line}" stroke-width="1.6"/>` +
    `<circle cx="${r(x + 8)}" cy="${r(y + s * 1.2 + 5)}" r="4" fill="none" stroke="${C.line}" stroke-width="1.6"/>` +
    hatch(x - s - 4, y + s * 1.2 + 10, 2 * s + 8) + (name ? label(x, y + s * 1.2 + 32, name, { anchor: 'middle', bold: true }) : '') + `</g>`;
}
/** Schraffur (Boden/Wand) */
export function hatch(x, y, len, opts = {}) {
  const n = Math.max(2, Math.floor(len / 8));
  let s = `<line x1="${r(x)}" y1="${r(y)}" x2="${r(x + len)}" y2="${r(y)}" stroke="${C.line}" stroke-width="1.6"/>`;
  for (let i = 0; i <= n; i++) {
    const xx = x + (i * len) / n;
    s += opts.vertical
      ? `<line x1="${r(xx)}" y1="${r(y)}" x2="${r(xx - 7)}" y2="${r(y + 7)}" stroke="${C.muted}" stroke-width="1"/>`
      : `<line x1="${r(xx)}" y1="${r(y)}" x2="${r(xx - 7)}" y2="${r(y + 7)}" stroke="${C.muted}" stroke-width="1"/>`;
  }
  return s;
}
/** Wand (senkrechte Schraffur) rechts von x, von y1 bis y2 */
export function wall(x, y1, y2, side = 'left') {
  const n = Math.max(2, Math.floor((y2 - y1) / 9));
  let s = `<line x1="${r(x)}" y1="${r(y1)}" x2="${r(x)}" y2="${r(y2)}" stroke="${C.line}" stroke-width="2"/>`;
  for (let i = 0; i <= n; i++) {
    const yy = y1 + (i * (y2 - y1)) / n;
    const dx = side === 'left' ? -7 : 7;
    s += `<line x1="${r(x)}" y1="${r(yy)}" x2="${r(x + dx)}" y2="${r(yy + 7)}" stroke="${C.muted}" stroke-width="1"/>`;
  }
  return s;
}
/** Koordinatenkreuz */
export function axes(x, y, len = 40) {
  return arrowXY(x, y, x + len, y, { color: C.dim, marker: 'dim', width: 1.4, label: 'x', labelAt: 'end', labelOffset: 10, labelSide: 1 }) +
    arrowXY(x, y, x, y - len, { color: C.dim, marker: 'dim', width: 1.4, label: 'y', labelAt: 'end', labelOffset: 10, labelSide: 1 });
}
/** Drehrichtungs-Pfeil (Moment) um (x,y) */
export function momentArc(x, y, radius, cw = true, color = C.result) {
  const a0 = cw ? 150 : 30, a1 = cw ? -120 : 300;
  const A0 = (a0 * Math.PI) / 180, A1 = (a1 * Math.PI) / 180;
  const sx = x + radius * Math.cos(A0), sy = y - radius * Math.sin(A0);
  const ex = x + radius * Math.cos(A1), ey = y - radius * Math.sin(A1);
  const key = Object.keys(C).find((k) => C[k] === color) || 'result';
  return `<path d="M${r(sx)},${r(sy)} A${radius},${radius} 0 1 ${cw ? 1 : 0} ${r(ex)},${r(ey)}" fill="none" stroke="${color}" stroke-width="2" marker-end="url(#MK-${key})"/>`;
}
/** Kraftpfeil, der in (x,y) ENDET (Last auf Träger von oben) */
export function loadArrow(x, y, len, text, color = C.force) {
  return arrowXY(x, y - len, x, y, { color, label: text, labelOffset: 10, labelSide: -1 });
}

function r(v) { return Math.round(v * 10) / 10; }

export { esc };
