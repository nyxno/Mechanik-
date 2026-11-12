// Wiederverwendbare Skizzen für Themen und Aufgaben. Alle Winkel in Grad, mathematisch positiv.
import { svg, arrow, arrowXY, label, angleArc, dashed, line, dot, dimH, dimV, beam, supportFixed, supportRoller, hatch, wall, axes, momentArc, loadArrow, rightAngle, C } from '../util/svg.js';

export { svg, arrow, arrowXY, label, angleArc, dashed, line, dot, dimH, dimV, beam, supportFixed, supportRoller, hatch, wall, axes, momentArc, loadArrow, rightAngle, C };

/** Einzelne Kraft mit Bestimmungsstücken. */
export function sketchKraft() {
  const x = 90, y = 150;
  return svg(420, 220,
    dashed(20, 190, 400, -25) +
    arrow(x, y, 30, 170, { label: 'F = 100 N', labelOffset: 14 }) +
    dot(x, y, 5) + label(x - 8, y + 22, 'Angriffspunkt', { anchor: 'middle', size: 12, color: C.muted }) +
    angleArc(x, y, 40, 0, 30, { label: 'α = 30°' }) +
    line(x, y, x + 60, y, { color: C.dim, width: 1 }) +
    label(300, 40, 'Wirkungslinie', { size: 12, color: C.muted }) +
    label(230, 95, 'Richtung (Pfeilspitze)', { size: 12, color: C.force }) +
    label(140, 190, 'Betrag = Pfeillänge (KM)', { size: 12, color: C.muted }),
    { label: 'Kraft als Pfeil mit Angriffspunkt, Wirkungslinie, Richtung und Betrag' });
}

/** Rechtwinkliges Dreieck mit GK, AK, HY */
export function sketchDreieck(alpha = 30) {
  const x0 = 60, y0 = 190, b = 300;
  const a = b * Math.tan((alpha * Math.PI) / 180);
  return svg(440, 230,
    `<polygon points="${x0},${y0} ${x0 + b},${y0} ${x0 + b},${y0 - a}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` +
    rightAngle(x0 + b, y0, 180, 12) +
    angleArc(x0, y0, 50, 0, alpha, { label: 'α' }) +
    label(x0 + b / 2, y0 + 18, 'Ankathete AK', { anchor: 'middle', color: C.muted }) +
    label(x0 + b + 12, y0 - a / 2, 'GK', { color: C.muted }) +
    label(x0 + b / 2 - 30, y0 - a / 2 - 14, 'Hypotenuse HY', { anchor: 'middle', color: C.muted }) +
    label(x0 + 10, 30, 'sin α = GK / HY    cos α = AK / HY    tan α = GK / AK', { size: 13, mono: true }),
    { label: 'Rechtwinkliges Dreieck mit Gegenkathete, Ankathete und Hypotenuse' });
}

/** Zerlegung einer Kraft in Fx und Fy */
export function sketchZerlegung(F = 100, alpha = 30, scale = 1.9) {
  const x = 70, y = 190;
  const L = F * scale;
  const a = (alpha * Math.PI) / 180;
  const fx = L * Math.cos(a), fy = L * Math.sin(a);
  return svg(440, 230,
    axes(x, y, 50) +
    dashed(x + fx, y, x + fx, y - fy) + dashed(x, y - fy, x + fx, y - fy) +
    arrowXY(x, y, x + fx, y, { color: C.force2, label: `Fx = ${fmt(F * Math.cos(a))} N`, labelOffset: -14, labelSide: -1 }) +
    arrowXY(x, y, x, y - fy, { color: C.force2, label: `Fy = ${fmt(F * Math.sin(a))} N`, labelOffset: 44, labelSide: -1 }) +
    arrow(x, y, alpha, L, { label: `F = ${fmt(F)} N`, labelOffset: 14 }) +
    angleArc(x, y, 42, 0, alpha, { label: `α = ${fmt(alpha)}°` }) + dot(x, y, 4),
    { label: 'Zerlegung einer Kraft in x- und y-Komponente' });
}

/** Kräfteparallelogramm / Krafteck zweier Kräfte */
export function sketchResultierende(F1 = 60, a1 = 0, F2 = 40, a2 = 60, scale = 2.2) {
  const x = 70, y = 190;
  const p = (F, a) => [F * scale * Math.cos((a * Math.PI) / 180), -F * scale * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = p(F1, a1), [x2, y2] = p(F2, a2);
  const rx = x1 + x2, ry = y1 + y2;
  const R = Math.hypot(F1 * Math.cos(a1 * Math.PI / 180) + F2 * Math.cos(a2 * Math.PI / 180), F1 * Math.sin(a1 * Math.PI / 180) + F2 * Math.sin(a2 * Math.PI / 180));
  return svg(440, 230,
    dashed(x + x1, y + y1, x + rx, y + ry) + dashed(x + x2, y + y2, x + rx, y + ry) +
    arrowXY(x, y, x + x1, y + y1, { label: `F1 = ${fmt(F1)} N`, labelOffset: -14, labelSide: -1 }) +
    arrowXY(x, y, x + x2, y + y2, { color: C.force2, label: `F2 = ${fmt(F2)} N`, labelOffset: 14 }) +
    arrowXY(x, y, x + rx, y + ry, { color: C.result, width: 3, label: `Fr = ${fmt(R)} N`, labelOffset: 14, labelSide: -1 }) +
    dot(x, y, 4),
    { label: 'Kräfteparallelogramm zweier Kräfte mit Resultierender' });
}

/** Krafteck (Linienzug) für n Kräfte: forces = [{F, a, name}] */
export function sketchKrafteck(forces, opts = {}) {
  const scale = opts.scale || 1.6;
  const pts = [[0, 0]];
  for (const f of forces) {
    const [lx, ly] = pts[pts.length - 1];
    pts.push([lx + f.F * scale * Math.cos((f.a * Math.PI) / 180), ly - f.F * scale * Math.sin((f.a * Math.PI) / 180)]);
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = Math.max(300, maxX - minX + 120), H = Math.max(200, maxY - minY + 100);
  const ox = 60 - minX, oy = 50 - minY;
  let s = '';
  forces.forEach((f, i) => {
    s += arrowXY(pts[i][0] + ox, pts[i][1] + oy, pts[i + 1][0] + ox, pts[i + 1][1] + oy, { color: i % 2 ? C.force2 : C.force, label: f.name || `F${i + 1}`, labelOffset: 12 });
  });
  const last = pts[pts.length - 1];
  const closed = Math.hypot(last[0], last[1]) < 3;
  if (!closed && !opts.noResult) s += arrowXY(ox, oy, last[0] + ox, last[1] + oy, { color: C.result, width: 3, label: opts.resultName || 'Fr', labelOffset: 12, labelSide: -1 });
  s += dot(ox, oy, 4) + label(ox - 8, oy + 16, 'Anfang', { size: 11, color: C.muted, anchor: 'end' });
  if (closed) s += label(W / 2, H - 12, 'Krafteck geschlossen → Gleichgewicht', { anchor: 'middle', size: 12, color: C.good });
  return svg(W, H, s, { label: 'Krafteck (Linienzug)' });
}

/** Symmetrische Aufhängung (Ampel/Spannrolle): Last F, zwei Seile mit Winkel α zur Waagrechten */
export function sketchAmpel(F = 400, alpha = 15) {
  const cx = 220, cy = 120;
  const a = (alpha * Math.PI) / 180;
  const L = 180;
  return svg(440, 230,
    hatch(10, 40, 70) + hatch(360, 40, 70) +
    line(40, 40, cx, cy, { width: 2 }) + line(400, 40, cx, cy, { width: 2 }) +
    dot(cx, cy, 5) +
    arrowXY(cx, cy, cx - L * Math.cos(a) * 0.5, cy - L * Math.sin(a) * 0.5, { color: C.force2, label: 'S', labelOffset: -12, labelSide: -1 }) +
    arrowXY(cx, cy, cx + L * Math.cos(a) * 0.5, cy - L * Math.sin(a) * 0.5, { color: C.force2, label: 'S', labelOffset: 12, labelSide: -1 }) +
    arrowXY(cx, cy, cx, cy + 85, { label: `F = ${fmt(F)} N`, labelOffset: 14 }) +
    dashed(cx - 100, cy, cx + 100, cy) +
    angleArc(cx, cy, 55, 0, alpha, { label: `α = ${fmt(alpha)}°` }) +
    angleArc(cx, cy, 55, 180 - alpha, 180, { label: `α` }),
    { label: 'Last an zwei symmetrischen Seilen' });
}

/** Kolben mit Pleuel: Kolbenkraft FK, Normalkraft FN, Pleuelkraft FP unter αP */
export function sketchKolben(alphaP = 20) {
  const x = 120, y = 110;
  const a = (alphaP * Math.PI) / 180;
  return svg(440, 230,
    wall(60, 40, 180, 'left') + wall(180, 40, 180, 'right') +
    `<rect x="70" y="70" width="100" height="80" rx="4" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` +
    line(x, y, x + 200 * Math.cos(a), y + 200 * Math.sin(a), { width: 6 }) +
    dot(x, y, 5) +
    arrowXY(x - 110, y, x - 10, y, { label: 'FK', labelOffset: -12, labelSide: -1 }) +
    arrowXY(x, y, x + 120 * Math.cos(a), y + 120 * Math.sin(a), { color: C.force2, label: 'FP', labelOffset: 14 }) +
    arrowXY(x, y, x, y - 70, { color: C.force2, label: 'FN', labelOffset: 12, labelSide: -1 }) +
    dashed(x, y, x + 150, y) +
    angleArc(x, y, 60, -alphaP, 0, { label: `αP = ${fmt(alphaP)}°` }),
    { label: 'Kräfte am Kolbenbolzen: Kolbenkraft, Pleuelkraft, Normalkraft' });
}

/** Drehmoment: Hebel mit schräg angreifender Kraft */
export function sketchDrehmoment(alpha = 30, L = 260) {
  const x = 70, y = 150;
  const a = (alpha * Math.PI) / 180;
  const ex = x + L, ey = y;
  const fx = ex - 110 * Math.sin(a), fy = ey - 110 * Math.cos(a); // Kraft unter alpha zur Senkrechten
  const dirx = ex - fx, diry = ey - fy;
  const Lv = Math.hypot(dirx, diry);
  const ux = dirx / Lv, uy = diry / Lv;
  // Normalabstand: Lot vom Drehpunkt auf WL
  const t = ((x - fx) * ux + (y - fy) * uy);
  const px = fx + ux * t, py = fy + uy * t;
  return svg(440, 230,
    line(x, y, ex, ey, { width: 8 }) + dot(x, y, 7) + dot(x, y, 3, 'var(--surface)') +
    label(x, y + 24, 'Drehpunkt', { anchor: 'middle', size: 12, color: C.muted }) +
    dashed(fx - ux * 160, fy - uy * 160, ex + ux * 40, ey + uy * 40) +
    arrowXY(fx, fy, ex, ey, { label: 'F', labelOffset: 12 }) +
    dashed(x, y, px, py, { color: C.result, dash: '3 3' }) +
    label((x + px) / 2 - 14, (y + py) / 2 - 10, 'ln', { color: C.result, bold: true }) +
    rightAngle(px, py, (Math.atan2(-uy, ux) * 180) / Math.PI + 180, 9) +
    dimH(x, ex, y + 40, 'l') +
    angleArc(ex, ey, 48, 90, 90 + alpha, { label: `α` }) +
    dashed(ex, ey, ex, ey - 80) +
    momentArc(x, y, 30, true),
    { label: 'Hebel mit schräg angreifender Kraft: Normalabstand ln' });
}

/** Zweiseitiger Hebel */
export function sketchHebel(F1 = 100, l1 = 300, F2 = 0, l2 = 100) {
  const total = 320, scale = total / (l1 + l2);
  const x0 = 60, y = 110, px = x0 + l1 * scale;
  return svg(440, 230,
    line(x0, y, x0 + total, y, { width: 8 }) +
    `<polygon points="${px},${y + 4} ${px - 16},${y + 34} ${px + 16},${y + 34}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` + hatch(px - 24, y + 34, 48) +
    loadArrow(x0, y - 4, 70, `F1 = ${fmt(F1)} N`) +
    (F2 ? loadArrow(x0 + total, y - 4, 70, `F2 = ${fmt(F2)} N`, C.force2) : arrowXY(x0 + total, y - 4, x0 + total, y - 70, { color: C.force2, label: 'F2 = ?', labelOffset: -14, labelSide: -1 })) +
    dimH(x0, px, y + 60, `l1 = ${fmt(l1)} mm`) + dimH(px, x0 + total, y + 60, `l2 = ${fmt(l2)} mm`) +
    dot(px, y, 4),
    { label: 'Zweiseitiger Hebel mit Drehpunkt' });
}

/** Träger auf 2 Stützen mit Lasten: loads = [{x (mm), F, name}], L (mm), optional Kragarm */
export function sketchTraeger(L = 1200, loads = [{ x: 700, F: 500, name: 'F1' }], opts = {}) {
  const W = 460, x0 = 60, len = 320;
  const maxX = Math.max(L, ...loads.map((l) => l.x));
  const scale = len / maxX;
  const y = 110;
  const totalLen = maxX * scale;
  let s = beam(x0, y, totalLen);
  s += supportRoller(x0, y + 7, 'A') + supportFixed(x0 + L * scale, y + 7, 'B');
  for (const l of loads) {
    if (l.angle && l.angle !== 90) {
      const a = (l.angle * Math.PI) / 180;
      const ex = x0 + l.x * scale, ey = y - 7;
      s += arrowXY(ex - 80 * Math.cos(a), ey - 80 * Math.sin(a), ex, ey, { label: `${l.name} = ${fmt(l.F)} N`, labelOffset: -14 });
    } else {
      s += loadArrow(x0 + l.x * scale, y - 7, 70, `${l.name} = ${fmt(l.F)} N`);
    }
  }
  if (opts.showReactions) {
    s += arrowXY(x0, y + 70, x0, y + 12, { color: C.result, label: 'A', labelOffset: -12, labelSide: -1 }) + arrowXY(x0 + L * scale, y + 70, x0 + L * scale, y + 12, { color: C.result, label: 'B', labelOffset: 12, labelSide: -1 });
  }
  // Bemaßung
  const marks = [0, ...loads.map((l) => l.x), L].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  for (let i = 0; i < marks.length - 1; i++) s += dimH(x0 + marks[i] * scale, x0 + marks[i + 1] * scale, y + 72, `${fmt(marks[i + 1] - marks[i])}`);
  s += label(x0 + totalLen + 8, y + 84, 'mm', { size: 11, color: C.muted });
  return svg(W, 200, s, { label: 'Träger auf zwei Stützen mit Lasten' });
}

/** Türblatt / Wandkran: Festlager B unten, Loslager A oben, Last FG im Abstand b, Lagerabstand h */
export function sketchKran(h = 1500, b = 2000, FG = 5, unit = 'kN', FE = 0, bE = 0) {
  const x0 = 110, yB = 190, scale = 150 / h;
  const yA = yB - h * scale;
  const xE = x0 + b * scale;
  let s = wall(x0 - 20, yA - 30, yB + 20, 'left');
  s += line(x0, yB, x0, yA, { width: 6 }) + line(x0, yA, xE, yA, { width: 6 }) + line(x0, yB, xE - 40, yA, { width: 4, color: C.dim });
  s += dot(x0, yA, 6) + dot(x0, yB, 6);
  s += label(x0 - 48, yA, 'A', { bold: true }) + label(x0 - 48, yB, 'B', { bold: true });
  s += arrowXY(xE, yA + 4, xE, yA + 60, { label: `FG = ${fmt(FG)} ${unit}`, labelOffset: 14 });
  if (FE) s += arrowXY(x0 + bE * scale, yA + 4, x0 + bE * scale, yA + 45, { color: C.force2, label: `FE = ${fmt(FE)} ${unit}`, labelOffset: -14 });
  s += arrowXY(x0 - 70, yA, x0 - 8, yA, { color: C.result, label: 'Ax', labelOffset: -12, labelSide: -1 });
  s += arrowXY(x0 - 8, yB, x0 - 70, yB, { color: C.result, label: 'Bx', labelOffset: 12, labelSide: -1 });
  s += arrowXY(x0, yB + 60, x0, yB + 8, { color: C.result, label: 'By', labelOffset: 12 });
  s += dimV(yA, yB, xE + 30, `${fmt(h)} mm`) + dimH(x0, xE, yA - 28, `${fmt(b)} mm`, { below: false });
  return svg(440, 260, s, { label: 'Wandkran mit Festlager B und Loslager A' });
}

/** Schiefe Ebene mit Gewichtskraft, Normalkraft, Hangabtrieb, Reibung */
export function sketchSchiefeEbene(alpha = 25) {
  const x0 = 40, y0 = 190, L = 340;
  const a = (alpha * Math.PI) / 180;
  const hgt = L * Math.tan(a);
  const bx = x0 + L * 0.55, by = y0 - L * 0.55 * Math.tan(a);
  const ux = Math.cos(a), uy = -Math.sin(a);
  const nx = Math.sin(a), ny = Math.cos(a) * -1; // Normale nach oben
  const hh = 28;
  // Block als rotiertes Rechteck, Kräfte greifen im Blockmittelpunkt an
  const cx = bx + nx * hh / 2, cy = by - Math.cos(a) * hh / 2;
  return svg(440, 230,
    `<polygon points="${x0},${y0} ${x0 + L},${y0} ${x0 + L},${y0 - hgt}" fill="${C.fill}" stroke="${C.line}" stroke-width="2"/>` +
    hatch(x0 - 10, y0, L + 20) +
    `<g transform="translate(${bx},${by}) rotate(${-alpha})"><rect x="-22" y="-28" width="44" height="28" fill="var(--surface)" stroke="${C.line}" stroke-width="2"/></g>` +
    arrowXY(cx, cy, cx, cy + 80, { label: 'G', labelOffset: 12 }) +
    arrowXY(cx, cy, cx - nx * 70, cy - Math.cos(a) * 70, { color: C.force2, label: 'FN', labelOffset: 12, labelSide: -1 }) +
    arrowXY(cx, cy, cx + ux * 70, cy + uy * 70, { color: C.result, label: 'FH', labelOffset: -12, labelSide: -1 }) +
    arrowXY(cx, cy, cx - ux * 50, cy - uy * 50, { color: C.force2, label: 'FR', labelOffset: 12 }) +
    angleArc(x0, y0, 60, 0, alpha, { label: `α = ${fmt(alpha)}°` }),
    { label: 'Körper auf schiefer Ebene mit Gewichtskraft, Normalkraft, Hangabtriebskraft und Reibungskraft' });
}

/** Biegemomentenverlauf unter einem Träger: xs in mm, Ms in Nm */
export function sketchMomentenverlauf(L, points, opts = {}) {
  const x0 = 60, len = 320, scale = len / L;
  const maxM = Math.max(1, ...points.map((p) => Math.abs(p.M)));
  const H = 70, y0 = 60;
  let path = `M${x0},${y0}`;
  for (const p of points) path += ` L${x0 + p.x * scale},${y0 + (p.M / maxM) * H * (opts.positiveDown === false ? -1 : 1)}`;
  path += ` L${x0 + L * scale},${y0} Z`;
  let s = `<path d="${path}" fill="${C.fill}" stroke="${C.result}" stroke-width="2"/>` + line(x0, y0, x0 + len, y0, { width: 1.4, color: C.dim });
  for (const p of points) {
    if (!p.label) continue;
    const yy = y0 + (p.M / maxM) * H;
    s += dot(x0 + p.x * scale, yy, 3.5, C.result) + label(x0 + p.x * scale, yy + (p.M >= 0 ? 16 : -12), p.label, { anchor: 'middle', size: 11, mono: true });
  }
  s += label(x0 - 6, y0, 'Mb', { anchor: 'end', size: 12, color: C.muted });
  return svg(440, 160, s, { label: 'Biegemomentenverlauf' });
}

function fmt(v) {
  if (!Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  const d = a >= 100 ? 0 : a >= 10 ? 1 : 2;
  return v.toFixed(d).replace(/\.?0+$/, '').replace('.', ',');
}
