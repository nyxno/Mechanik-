// Aufgaben-Generatoren mit Lösungsweg und Fehlerdiagnose. Jede Aufgabe entsteht aus einem Seed (reproduzierbar).
// Stufen: 1 = Grundlagen, 2 = Standard (Kursniveau), 3 = Prüfung/Transfer.
import { makeRng } from '../util/rng.js';
import { fmt } from '../util/expr.js';
import * as S from './sketches.js';

const d2r = (d) => (d * Math.PI) / 180;
const sin = (d) => Math.sin(d2r(d));
const cos = (d) => Math.cos(d2r(d));
const tan = (d) => Math.tan(d2r(d));
const atan = (x) => (Math.atan(x) * 180) / Math.PI;
const asin = (x) => (Math.asin(x) * 180) / Math.PI;
const g = 9.81;
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

const W = (key, label, unit, value, alts = [], extra = {}) => ({ key, label, unit, value, alts: alts.filter((a) => a && Number.isFinite(a.value)), ...extra });
const A = (value, hint) => ({ value, hint });
const G = (sym, val, unit, note = '') => ({ sym, val, unit, note });
const F = fmt;

const EX = [];
function ex(def) { EX.push(def); }

// ---------------------------------------------------------------- Kraftbegriff
ex({ id: 'km-umrechnen', topic: 'kraftbegriff', level: 1, title: 'Kräftemaßstab umrechnen',
  gen(r) {
    const km = r.pick([10, 20, 50, 100, 200]); const L = r.num(2.5, 9.5, 1);
    const Fv = km * L;
    return {
      text: `Im Krafteck wurde mit dem Kräftemaßstab <b>1 cm ≙ ${km} N</b> gezeichnet. Die Resultierende ist <b>${F(L)} cm</b> lang. Wie groß ist die Kraft?`,
      given: [G('KM', km, 'N/cm'), G('L', L, 'cm')], vars: { KM: km, L },
      wanted: [W('F', 'Resultierende Fr', 'N', Fv, [A(L / km, 'Du hast dividiert statt multipliziert: Länge mal Maßstab.')])],
      steps: [`Kraft = gemessene Länge · Kräftemaßstab`, `Fr = ${F(L)} cm · ${km} N/cm = ${F(Fv)} N`],
    };
  } });
ex({ id: 'km-laenge', topic: 'kraftbegriff', level: 1, title: 'Pfeillänge im Kräftemaßstab',
  gen(r) {
    const km = r.pick([0.5, 1, 2, 5]); const Fv = r.int(4, 30) * (km >= 1 ? 1 : 1);
    const L = Fv / km;
    return {
      text: `Eine Kraft von <b>${F(Fv)} kN</b> soll mit dem Kräftemaßstab <b>1 cm ≙ ${F(km)} kN</b> gezeichnet werden. Wie lang wird der Pfeil?`,
      given: [G('F', Fv, 'kN'), G('KM', km, 'kN/cm')], vars: { F: Fv, KM: km },
      wanted: [W('L', 'Pfeillänge', 'cm', L, [A(Fv * km, 'Länge = Kraft geteilt durch Maßstab, nicht multipliziert.')])],
      steps: [`Länge = Kraft / Kräftemaßstab`, `L = ${F(Fv)} kN / ${F(km)} kN/cm = ${F(L)} cm`],
    };
  } });
ex({ id: 'gewichtskraft', topic: 'kraftbegriff', level: 1, title: 'Gewichtskraft einer Masse',
  gen(r) {
    const m = r.pick([25, 40, 75, 120, 250, 500, 850, 1200]);
    const FG = m * g;
    return {
      text: `Ein Werkstück hat die Masse <b>m = ${m} kg</b>. Wie groß ist seine Gewichtskraft (g = 9,81 m/s²)?`,
      given: [G('m', m, 'kg'), G('g', 9.81, 'm/s²')], vars: { m, g },
      wanted: [W('FG', 'Gewichtskraft FG', 'N', FG, [A(m, 'Das ist die Masse in kg. Gewichtskraft = m · g.'), A(m * 10, 'Mit g = 10 gerechnet. Im Kurs gilt g = 9,81 m/s².')])],
      steps: [`FG = m · g`, `FG = ${m} kg · 9,81 m/s² = ${F(FG)} N${FG >= 1000 ? ` = ${F(FG / 1000)} kN` : ''}`],
    };
  } });

// ---------------------------------------------------------------- Winkelfunktionen
ex({ id: 'dreieck-seiten', topic: 'winkelfunktionen', level: 1, title: 'Katheten aus Hypotenuse und Winkel',
  gen(r) {
    const HY = r.int(40, 400, 10); const al = r.int(15, 70, 5);
    return {
      text: `In einem rechtwinkligen Dreieck ist die Hypotenuse <b>HY = ${HY} mm</b> und der Winkel <b>α = ${al}°</b>. Berechne Gegenkathete und Ankathete.`,
      given: [G('HY', HY, 'mm'), G('α', al, '°')], vars: { HY, alpha: al },
      wanted: [W('GK', 'Gegenkathete GK', 'mm', HY * sin(al), [A(HY * cos(al), 'Das ist die Ankathete. GK liegt dem Winkel gegenüber ⇒ sin.')]),
        W('AK', 'Ankathete AK', 'mm', HY * cos(al), [A(HY * sin(al), 'Das ist die Gegenkathete. AK liegt am Winkel an ⇒ cos.')])],
      steps: [`sin α = GK / HY ⇒ GK = HY · sin α = ${HY} · sin ${al}° = ${F(HY * sin(al))} mm`, `cos α = AK / HY ⇒ AK = HY · cos α = ${HY} · cos ${al}° = ${F(HY * cos(al))} mm`, `Probe: √(GK² + AK²) = ${F(Math.hypot(HY * sin(al), HY * cos(al)))} mm = HY ✓`],
      sketch: () => S.sketchDreieck(al),
    };
  } });
ex({ id: 'dreieck-winkel', topic: 'winkelfunktionen', level: 1, title: 'Winkel aus zwei Längen',
  gen(r) {
    const AK = r.int(200, 2500, 50); const GK = r.int(50, Math.round(AK * 0.9), 10);
    const al = atan(GK / AK);
    return {
      text: `Eine Schubstange ist <b>${AK} mm</b> lang (waagrecht gemessen), der Kurbelzapfen steht <b>${GK} mm</b> über der Achse. Welchen Winkel α bildet die Schubstange mit der Waagrechten?`,
      given: [G('AK', AK, 'mm'), G('GK', GK, 'mm')], vars: { AK, GK },
      wanted: [W('alpha', 'Winkel α', '°', al, [A(atan(AK / GK), 'Verhältnis verkehrt: tan α = GK / AK, also Gegenkathete durch Ankathete.'), A(asin(GK / AK), 'Du hast asin verwendet, aber ' + AK + ' mm ist nicht die Hypotenuse, sondern die Ankathete ⇒ tan.')])],
      steps: [`tan α = GK / AK = ${GK} / ${AK} = ${F(GK / AK, 3)}`, `α = arctan(${F(GK / AK, 3)}) = ${F(al)}°`],
      sketch: () => S.sketchDreieck(al),
    };
  } });
ex({ id: 'hypotenuse', topic: 'winkelfunktionen', level: 2, title: 'Hypotenuse aus Kathete und Winkel',
  gen(r) {
    const GK = r.int(100, 900, 10); const al = r.int(10, 60, 5);
    const HY = GK / sin(al);
    return {
      text: `Die Gegenkathete eines rechtwinkligen Dreiecks ist <b>${GK} N</b> lang (eine Kraftkomponente), der Winkel <b>α = ${al}°</b>. Wie groß ist die Hypotenuse (die ganze Kraft)?`,
      given: [G('GK', GK, 'N'), G('α', al, '°')], vars: { GK, alpha: al },
      wanted: [W('HY', 'Hypotenuse HY', 'N', HY, [A(GK * sin(al), 'Du hast multipliziert. Aus sin α = GK/HY folgt HY = GK / sin α.'), A(GK / cos(al), 'cos gehört zur Ankathete. Hier ist die Gegenkathete gegeben ⇒ sin.')])],
      steps: [`sin α = GK / HY ⇒ HY = GK / sin α`, `HY = ${GK} / sin ${al}° = ${F(HY)} N`],
    };
  } });

// ---------------------------------------------------------------- Zerlegung
ex({ id: 'zerlegung-x', topic: 'zerlegung', level: 1, title: 'Kraft in Fx und Fy zerlegen',
  gen(r) {
    const Fv = r.int(50, 900, 10); const al = r.int(10, 80, 5);
    return {
      text: `Die Kraft <b>F = ${Fv} N</b> greift unter <b>α = ${al}°</b> zur x-Achse an. Zerlege sie in die Komponenten Fx und Fy.`,
      given: [G('F', Fv, 'N'), G('α', al, '° zur x-Achse')], vars: { F: Fv, alpha: al },
      wanted: [W('Fx', 'Fx', 'N', Fv * cos(al), [A(Fv * sin(al), 'sin und cos vertauscht. Der Winkel liegt an der x-Achse ⇒ Fx = F · cos α.')]),
        W('Fy', 'Fy', 'N', Fv * sin(al), [A(Fv * cos(al), 'sin und cos vertauscht. Fy = F · sin α.')])],
      steps: [`Winkel liegt an der x-Achse: Fx = F · cos α = ${Fv} · cos ${al}° = ${F(Fv * cos(al))} N`, `Fy = F · sin α = ${Fv} · sin ${al}° = ${F(Fv * sin(al))} N`, `Probe: √(Fx² + Fy²) = ${F(Fv)} N ✓`],
      sketch: () => S.sketchZerlegung(Fv, al, 170 / Fv),
    };
  } });
ex({ id: 'zerlegung-y', topic: 'zerlegung', level: 2, title: 'Winkel zur Senkrechten',
  gen(r) {
    const Fv = r.int(2, 40) * 0.5; const al = r.int(15, 60, 5);
    return {
      text: `Eine Seilkraft <b>F = ${F(Fv)} kN</b> wirkt unter <b>${al}° zur Senkrechten</b> (y-Achse). Wie groß sind die waagrechte und die senkrechte Komponente?`,
      given: [G('F', Fv, 'kN'), G('α', al, '° zur y-Achse')], vars: { F: Fv, alpha: al },
      wanted: [W('Fx', 'Fx (waagrecht)', 'kN', Fv * sin(al), [A(Fv * cos(al), 'Der Winkel liegt an der y-Achse, daher vertauscht: Fx = F · sin α.')]),
        W('Fy', 'Fy (senkrecht)', 'kN', Fv * cos(al), [A(Fv * sin(al), 'Der Winkel liegt an der y-Achse: Fy = F · cos α (Ankathete).')])],
      steps: [`Winkel an der y-Achse ⇒ vertauscht (wie F2 in Z10, Beispiel 2)`, `Fy = F · cos α = ${F(Fv)} · cos ${al}° = ${F(Fv * cos(al))} kN`, `Fx = F · sin α = ${F(Fv)} · sin ${al}° = ${F(Fv * sin(al))} kN`],
      sketch: () => S.sketchZerlegung(Fv, 90 - al, 170 / Fv),
    };
  } });
ex({ id: 'zerlegung-quadrant', topic: 'zerlegung', level: 2, title: 'Komponenten mit Vorzeichen',
  gen(r) {
    const Fv = r.int(20, 120, 5); const al = r.pick([110, 120, 135, 150, 200, 210, 225, 240, 300, 315, 330]);
    const fx = Fv * cos(al), fy = Fv * sin(al);
    return {
      text: `Die Kraft <b>F = ${Fv} N</b> hat die Richtung <b>α = ${al}°</b> (gegen den Uhrzeigersinn von der x-Achse). Gib Fx und Fy <b>mit Vorzeichen</b> an.`,
      given: [G('F', Fv, 'N'), G('α', al, '°')], vars: { F: Fv, alpha: al },
      wanted: [W('Fx', 'Fx', 'N', fx, [A(-fx, 'Vorzeichen: Bei ' + al + '° zeigt die Kraft nach ' + (fx < 0 ? 'links' : 'rechts') + ' ⇒ Fx ' + (fx < 0 ? 'negativ' : 'positiv') + '.')]),
        W('Fy', 'Fy', 'N', fy, [A(-fy, 'Vorzeichen: Bei ' + al + '° zeigt die Kraft nach ' + (fy < 0 ? 'unten' : 'oben') + ' ⇒ Fy ' + (fy < 0 ? 'negativ' : 'positiv') + '.')])],
      steps: [`Fx = F · cos α = ${Fv} · cos ${al}° = ${F(fx)} N (${fx < 0 ? 'zeigt nach links' : 'zeigt nach rechts'})`, `Fy = F · sin α = ${Fv} · sin ${al}° = ${F(fy)} N (${fy < 0 ? 'zeigt nach unten' : 'zeigt nach oben'})`, `Alternativ: spitzen Hilfswinkel zur nächsten Achse bilden und Vorzeichen aus der Skizze ablesen.`],
      sketch: () => S.sketchZerlegung(Fv, al, 90 / Fv),
    };
  } });
ex({ id: 'zerlegung-wl', topic: 'zerlegung', level: 3, title: 'Zerlegen in zwei Wirkungslinien',
  gen(r) {
    const Fv = r.int(4, 20); const al = r.pick([30, 40, 50, 60]);
    const a1 = r.pick([-10, 0, 10]); const a2 = r.pick([90, 100, 110]);
    // F1*cos a1 + F2*cos a2 = F cos al ; F1*sin a1 + F2*sin a2 = F sin al
    const det = cos(a1) * sin(a2) - cos(a2) * sin(a1);
    const F1 = (Fv * cos(al) * sin(a2) - cos(a2) * Fv * sin(al)) / det;
    const F2 = (cos(a1) * Fv * sin(al) - Fv * cos(al) * sin(a1)) / det;
    const phi = a2 - a1; const beta = 180 - phi - (al - a1); // Winkel gegenüber F2 ... Sinussatz
    return {
      text: `Die Kraft <b>F = ${Fv} kN</b> unter <b>α = ${al}°</b> soll in die Wirkungslinien <b>WL1 = ${a1}°</b> und <b>WL2 = ${a2}°</b> zerlegt werden (wie in Z05, Beispiel 2). Berechne F1 und F2.`,
      given: [G('F', Fv, 'kN'), G('α', al, '°'), G('WL1', a1, '°'), G('WL2', a2, '°')], vars: { F: Fv, alpha: al, WL1: a1, WL2: a2 },
      wanted: [W('F1', 'F1 (auf WL1)', 'kN', F1, [A(Fv * cos(al), 'Das wäre die x-Komponente. WL1 liegt bei ' + a1 + '°, nicht bei 0°, und WL2 steht nicht senkrecht dazu ⇒ Sinussatz.')]),
        W('F2', 'F2 (auf WL2)', 'kN', F2, [A(Fv * sin(al), 'Das wäre die y-Komponente. Verwende den Sinussatz im Kräftedreieck.')])],
      steps: [`Winkel zwischen WL1 und WL2: φ = ${a2} − (${a1}) = ${phi}°. Im Kräftedreieck liegt F gegenüber dem Winkel 180° − φ = ${180 - phi}°.`, `Winkel zwischen F und WL1: ${al - a1}° (liegt F2 gegenüber). Winkel zwischen F und WL2: ${a2 - al}° (liegt F1 gegenüber).`, `Sinussatz: F1 / sin(${a2 - al}°) = F2 / sin(${al - a1}°) = F / sin(${180 - phi}°)`, `F1 = ${Fv} · sin ${a2 - al}° / sin ${180 - phi}° = ${F(F1)} kN`, `F2 = ${Fv} · sin ${al - a1}° / sin ${180 - phi}° = ${F(F2)} kN`, `Probe: F1·cos ${a1}° + F2·cos ${a2}° = ${F(F1 * cos(a1) + F2 * cos(a2))} = F·cos α = ${F(Fv * cos(al))} ✓`],
      sketch: () => S.sketchResultierende(F1, a1, F2, a2, 150 / Fv),
    };
  } });

// ---------------------------------------------------------------- Resultierende
ex({ id: 'res-rechtwinklig', topic: 'resultierende', level: 1, title: 'Zwei Kräfte im rechten Winkel',
  gen(r) {
    const F1 = r.int(30, 400, 10), F2 = r.int(30, 400, 10);
    const Fr = Math.hypot(F1, F2), al = atan(F2 / F1);
    return {
      text: `Zwei Kräfte greifen im selben Punkt an: <b>F1 = ${F1} N</b> nach rechts (0°) und <b>F2 = ${F2} N</b> nach oben (90°). Bestimme die Resultierende nach Betrag und Richtung.`,
      given: [G('F1', F1, 'N'), G('F2', F2, 'N')], vars: { F1, F2 },
      wanted: [W('Fr', 'Resultierende Fr', 'N', Fr, [A(F1 + F2, 'Beträge einfach addiert. Die Kräfte stehen senkrecht ⇒ Pythagoras.')]), W('alpha', 'Richtung αr', '°', al, [A(atan(F1 / F2), 'Verhältnis verkehrt: tan αr = Fy / Fx = F2 / F1.')])],
      steps: [`Fr = √(F1² + F2²) = √(${F1}² + ${F2}²) = ${F(Fr)} N`, `tan αr = F2 / F1 = ${F2} / ${F1} ⇒ αr = ${F(al)}°`],
      sketch: () => S.sketchResultierende(F1, 0, F2, 90, 150 / Math.max(F1, F2)),
    };
  } });
ex({ id: 'res-zwei', topic: 'resultierende', level: 2, title: 'Zwei Kräfte unter beliebigem Winkel',
  gen(r) {
    const F1 = r.int(20, 120, 5), F2 = r.int(20, 120, 5), a2 = r.pick([30, 45, 60, 75, 120, 135]);
    const sx = F1 + F2 * cos(a2), sy = F2 * sin(a2);
    const Fr = Math.hypot(sx, sy); let al = atan(sy / sx); if (sx < 0) al += 180;
    return {
      text: `<b>F1 = ${F1} N</b> wirkt in Richtung 0°, <b>F2 = ${F2} N</b> in Richtung <b>${a2}°</b>. Berechne die Resultierende rechnerisch (Z10, Beispiel 1).`,
      given: [G('F1', F1, 'N'), G('α1', 0, '°'), G('F2', F2, 'N'), G('α2', a2, '°')], vars: { F1, F2, alpha1: 0, alpha2: a2 },
      wanted: [W('Fr', 'Fr', 'N', Fr, [A(F1 + F2, 'Beträge einfach addiert. Erst Komponenten bilden, dann Pythagoras.'), A(Math.hypot(F1, F2), 'Pythagoras direkt mit F1 und F2 gilt nur bei 90° zwischen den Kräften.')]), W('alpha', 'αr', '°', al, [A(al - 180, 'ΣFx ist negativ ⇒ 180° addieren.'), A(a2 / 2, 'Der Winkel halbiert sich nur bei gleich großen Kräften.')])],
      steps: [`ΣFx = F1 + F2 · cos ${a2}° = ${F1} + ${F(F2 * cos(a2))} = ${F(sx)} N`, `ΣFy = F2 · sin ${a2}° = ${F(sy)} N`, `Fr = √(${F(sx)}² + ${F(sy)}²) = ${F(Fr)} N`, `tan αr = ΣFy / ΣFx ⇒ αr = ${F(al)}°${sx < 0 ? ' (ΣFx < 0 ⇒ 180° addiert)' : ''}`],
      sketch: () => S.sketchResultierende(F1, 0, F2, a2, 150 / Math.max(F1, F2, Fr)),
    };
  } });
ex({ id: 'res-drei', topic: 'resultierende', level: 3, title: 'Drei Kräfte zusammensetzen',
  gen(r) {
    const fs = [{ F: r.int(40, 150, 10), a: r.pick([0, 20, 30, 45]) }, { F: r.int(40, 150, 10), a: r.pick([90, 110, 120, 135, 150]) }, { F: r.int(40, 150, 10), a: r.pick([180, 200, 225, 240, 270, 300]) }];
    const sx = fs.reduce((s, f) => s + f.F * cos(f.a), 0), sy = fs.reduce((s, f) => s + f.F * sin(f.a), 0);
    const Fr = Math.hypot(sx, sy); let al = atan(sy / sx); if (sx < 0) al += 180; if (al < 0) al += 360;
    return {
      text: `Drei Kräfte greifen in einem Punkt an: <b>F1 = ${fs[0].F} N (${fs[0].a}°)</b>, <b>F2 = ${fs[1].F} N (${fs[1].a}°)</b>, <b>F3 = ${fs[2].F} N (${fs[2].a}°)</b>. Bestimme Fr nach Betrag und Richtung (0°–360°).`,
      given: fs.flatMap((f, i) => [G(`F${i + 1}`, f.F, 'N'), G(`α${i + 1}`, f.a, '°')]), vars: { F1: fs[0].F, F2: fs[1].F, F3: fs[2].F, alpha1: fs[0].a, alpha2: fs[1].a, alpha3: fs[2].a },
      wanted: [W('Fr', 'Fr', 'N', Fr, [A(fs.reduce((s, f) => s + f.F, 0), 'Beträge addiert. Komponententabelle anlegen!')]), W('alpha', 'αr', '°', al, [A(atan(sy / sx), 'Taschenrechner-Winkel ungeprüft übernommen. Quadrant prüfen (ΣFx < 0 ⇒ +180°).'), A(atan(sy / sx) + 180, 'Quadrant falsch gewählt. Vorzeichen von ΣFx und ΣFy ansehen.')], { tol: 0.03 })],
      steps: [`Tabelle: ` + fs.map((f, i) => `F${i + 1}x = ${f.F}·cos ${f.a}° = ${F(f.F * cos(f.a))} N, F${i + 1}y = ${f.F}·sin ${f.a}° = ${F(f.F * sin(f.a))} N`).join('; '), `ΣFx = ${F(sx)} N, ΣFy = ${F(sy)} N`, `Fr = √(ΣFx² + ΣFy²) = ${F(Fr)} N`, `αr = arctan(ΣFy/ΣFx) = ${F(atan(sy / sx))}° ⇒ Quadrant: ΣFx ${sx < 0 ? '< 0 ⇒ +180°' : '> 0'}${sy < 0 && sx > 0 ? ', ΣFy < 0 ⇒ +360°' : ''} ⇒ αr = ${F(al)}°`],
      sketch: () => S.sketchKrafteck(fs.map((f, i) => ({ F: f.F, a: f.a, name: `F${i + 1}` })), { scale: 1.2 }),
    };
  } });

// ---------------------------------------------------------------- Gleichgewicht
ex({ id: 'ampel', topic: 'gleichgewicht', level: 1, title: 'Verkehrsampel an zwei Seilen',
  gen(r) {
    const Fv = r.int(150, 900, 50); const al = r.pick([10, 12, 15, 18, 20, 25, 30]);
    const Sv = (Fv / 2) / sin(al);
    return {
      text: `Eine Ampel mit <b>F = ${Fv} N</b> hängt symmetrisch an zwei Seilen, die je <b>${al}° zur Waagrechten</b> geneigt sind (Z10, Beispiel 5). Wie groß ist die Seilkraft S?`,
      given: [G('F', Fv, 'N'), G('α', al, '° zur Waagrechten')], vars: { F: Fv, alpha: al },
      wanted: [W('S', 'Seilkraft S', 'N', Sv, [A(Fv / 2, 'F/2 ist nur die senkrechte Komponente. S = (F/2) / sin α.'), A((Fv / 2) / cos(al), 'Winkel zur Waagrechten ⇒ senkrechte Komponente ist S · sin α, also S = (F/2)/sin α.'), A(Fv / sin(al), 'Du hast die ganze Last einem Seil gegeben. Jedes Seil trägt senkrecht F/2.')])],
      steps: [`Symmetrie: jedes Seil trägt senkrecht F/2 = ${F(Fv / 2)} N`, `Krafteck: halbes Dreieck mit GK = F/2, HY = S: sin α = (F/2) / S`, `S = (F/2) / sin α = ${F(Fv / 2)} / sin ${al}° = ${F(Sv)} N`],
      sketch: () => S.sketchAmpel(Fv, al),
    };
  } });
ex({ id: 'spannrolle', topic: 'gleichgewicht', level: 2, title: 'Spannrolle (Winkel zur Senkrechten)',
  gen(r) {
    const FG = r.int(800, 3000, 100); const al = r.pick([30, 35, 40, 45, 50, 55]);
    const Sv = (FG / 2) / cos(al);
    return {
      text: `Eine Spannrolle wird mit <b>FG = ${FG} N</b> belastet. Die beiden Riementrume laufen je unter <b>${al}° zur Senkrechten</b> von der Rolle weg (Z30, Beispiel 158). Welche Spannkraft S entsteht im Riemen?`,
      given: [G('FG', FG, 'N'), G('α', al, '° zur Senkrechten')], vars: { FG, alpha: al },
      wanted: [W('S', 'Riemenkraft S', 'N', Sv, [A((FG / 2) / sin(al), 'Der Winkel ist zur Senkrechten angegeben ⇒ cos α = (FG/2)/S.'), A(FG / 2, 'FG/2 ist nur die senkrechte Komponente jedes Trums.')])],
      steps: [`Krafteck mit Umlaufsinn: FG, S, S bilden ein gleichschenkliges Dreieck`, `cos α = (FG/2) / S ⇒ S = (FG/2) / cos α`, `S = ${F(FG / 2)} / cos ${al}° = ${F(Sv)} N`],
      sketch: () => S.sketchAmpel(FG, 90 - al),
    };
  } });
ex({ id: 'bogen', topic: 'gleichgewicht', level: 2, title: 'Sportbogen: Resultierende der Sehnenkräfte',
  gen(r) {
    const Sv = r.int(300, 900, 50); const al = r.pick([25, 30, 35, 40]);
    const Fv = 2 * Sv * cos(al);
    return {
      text: `Beim Spannen eines Bogens zieht jede Sehnenhälfte mit <b>S = ${Sv} N</b>, beide Hälften bilden je <b>${al}°</b> mit der Zugrichtung der Hand (Z10, Beispiel 4). Welche Handkraft F hält das Gleichgewicht?`,
      given: [G('S', Sv, 'N'), G('α', al, '°')], vars: { S: Sv, alpha: al },
      wanted: [W('F', 'Handkraft F', 'N', Fv, [A(Sv * cos(al), 'Es gibt zwei Sehnenhälften: F = 2 · S · cos α.'), A(2 * Sv * sin(al), 'Der Winkel liegt an der Zugrichtung ⇒ Komponente in Zugrichtung ist S · cos α.'), A(2 * Sv, 'Nur bei α = 0° wäre F = 2S. Die schrägen Anteile heben sich auf.')])],
      steps: [`Jede Sehnenhälfte liefert in Zugrichtung S · cos α = ${F(Sv * cos(al))} N; die Queranteile heben sich auf.`, `Gleichgewicht: F = 2 · S · cos α = 2 · ${Sv} · cos ${al}° = ${F(Fv)} N`, `Krafteck: S, S und F schließen sich mit Umlaufsinn.`],
      sketch: () => S.sketchKrafteck([{ F: Sv / 8, a: al, name: 'S' }, { F: Sv / 8, a: -al, name: 'S' }, { F: Fv / 8, a: 180, name: 'F' }], { scale: 1.4 }),
    };
  } });
ex({ id: 'zwei-seile', topic: 'gleichgewicht', level: 3, title: 'Last an zwei Seilen mit verschiedenen Winkeln',
  gen(r) {
    const Fv = r.int(200, 1200, 50); const a1 = r.pick([15, 20, 25, 30]); const a2 = r.pick([35, 40, 45, 50, 60]);
    // S1 links unter a1, S2 rechts unter a2 zur Waagrechten
    const beta = 90 - a1, gamma = 90 - a2, phi = a1 + a2; // Sinussatz wie im Kurs
    const S1 = Fv * sin(gamma) / sin(phi), S2 = Fv * sin(beta) / sin(phi);
    return {
      text: `Eine Last <b>F = ${Fv} N</b> hängt an zwei Seilen: Seil 1 unter <b>α1 = ${a1}°</b>, Seil 2 unter <b>α2 = ${a2}°</b> zur Waagrechten (Z10, Beispiel 5b). Berechne S1 und S2.`,
      given: [G('F', Fv, 'N'), G('α1', a1, '°'), G('α2', a2, '°')], vars: { F: Fv, alpha1: a1, alpha2: a2 },
      wanted: [W('S1', 'S1', 'N', S1, [A(S2, 'S1 und S2 vertauscht: Das flachere Seil (kleinerer Winkel) hat die kleinere senkrechte Komponente je Newton … rechne mit dem Sinussatz nach.'), A((Fv / 2) / sin(a1), 'F/2 gilt nur bei symmetrischer Aufhängung.')]), W('S2', 'S2', 'N', S2, [A(S1, 'S1 und S2 vertauscht.'), A((Fv / 2) / sin(a2), 'F/2 gilt nur bei symmetrischer Aufhängung.')])],
      steps: [`Kräftedreieck: Winkel bei F ist α1 + α2 = ${phi}°; gegenüber S1 liegt γ = 90° − α2 = ${gamma}°, gegenüber S2 liegt β = 90° − α1 = ${beta}° (Winkelsumme 180° ✓)`, `Sinussatz: S1 / sin γ = S2 / sin β = F / sin(α1 + α2)`, `S1 = ${Fv} · sin ${gamma}° / sin ${phi}° = ${F(S1)} N`, `S2 = ${Fv} · sin ${beta}° / sin ${phi}° = ${F(S2)} N`, `Probe ΣFx: −S1·cos α1 + S2·cos α2 = ${F(-S1 * cos(a1) + S2 * cos(a2), 1)} ≈ 0 ✓`],
      sketch: () => S.sketchAmpel(Fv, (a1 + a2) / 2),
    };
  } });
ex({ id: 'kolben', topic: 'gleichgewicht', level: 2, title: 'Kräfte am Kolben',
  gen(r) {
    const FK = r.num(1.5, 6, 1); const al = r.pick([10, 15, 20, 25, 30, 40]);
    return {
      text: `Auf einen Kolben wirkt die Kolbenkraft <b>FK = ${F(FK)} kN</b>. Das Pleuel steht unter <b>αP = ${al}°</b> zur Kolbenachse (Z10, Beispiel 6). Berechne die Normalkraft FN auf die Zylinderwand und die Pleuelkraft FP.`,
      given: [G('FK', FK, 'kN'), G('αP', al, '°')], vars: { FK, alpha: al },
      wanted: [W('FN', 'Normalkraft FN', 'kN', FK * tan(al), [A(FK * sin(al), 'FN = FK · tan α. (FK · sin α wäre falsch: FK ist die Ankathete, nicht die Hypotenuse.)'), A(FK * cos(al), 'Das ist weder FN noch FP. FN = FK · tan α.')]), W('FP', 'Pleuelkraft FP', 'kN', FK / cos(al), [A(FK * cos(al), 'FP ist die Hypotenuse und damit größer als FK: FP = FK / cos α.'), A(FK / sin(al), 'cos, nicht sin: FK liegt am Winkel an.')])],
      steps: [`Rechtwinkliges Dreieck: FK = Ankathete, FN = Gegenkathete, FP = Hypotenuse`, `tan α = FN / FK ⇒ FN = FK · tan α = ${F(FK)} · tan ${al}° = ${F(FK * tan(al))} kN`, `cos α = FK / FP ⇒ FP = FK / cos α = ${F(FK)} / cos ${al}° = ${F(FK / cos(al))} kN`],
      sketch: () => S.sketchKolben(al),
    };
  } });

// ---------------------------------------------------------------- Anwendungen
ex({ id: 'kurbeltrieb', topic: 'anwendungen', level: 3, title: 'Kurbeltrieb: Schubstangenkraft und Moment',
  gen(r) {
    const FK = r.int(20, 160, 10); const rr = r.int(200, 600, 50); const l = rr * r.pick([4, 5, 6]);
    const al = atan(rr / l); const Sv = FK / cos(al); const FN = Sv * sin(al); const M = Sv * rr / 1000;
    return {
      text: `Kurbeltrieb: Kolbenkraft <b>FK = ${FK} kN</b>, Schubstange <b>l = ${l} mm</b>, Kurbelradius <b>r = ${rr} mm</b>. Schubstange und Kurbel stehen im rechten Winkel (Z30, Beispiel 173). Berechne den Schubstangenwinkel α, die Schubstangenkraft S, die Normalkraft FN auf die Gleitbahn und das Drehmoment an der Kurbelwelle.`,
      given: [G('FK', FK, 'kN'), G('l', l, 'mm'), G('r', rr, 'mm')], vars: { FK, l, r: rr },
      wanted: [W('alpha', 'α', '°', al, [A(atan(l / rr), 'tan α = r / l (Gegenkathete r, Ankathete l).')]), W('S', 'Schubstangenkraft S', 'kN', Sv, [A(FK * cos(al), 'S = FK / cos α (Hypotenuse, größer als FK).')]), W('FN', 'Normalkraft FN', 'kN', FN, [A(FK * cos(al), 'FN = S · sin α = FK · tan α.')]), W('M', 'Drehmoment M', 'kNm', M, [A(Sv * rr, 'Einheit: r in m einsetzen ⇒ kNm.'), A(FK * rr / 1000, 'Am Kurbelzapfen wirkt S (nicht FK) senkrecht zur Kurbel.')])],
      steps: [`tan α = r / l = ${rr} / ${l} ⇒ α = ${F(al)}°`, `cos α = FK / S ⇒ S = ${FK} / cos ${F(al)}° = ${F(Sv)} kN`, `sin α = FN / S ⇒ FN = ${F(Sv)} · sin ${F(al)}° = ${F(FN)} kN`, `Kurbel ⊥ Schubstange ⇒ ln = r: M = S · r = ${F(Sv)} kN · ${rr / 1000} m = ${F(M)} kNm`],
      sketch: () => S.sketchKolben(al),
    };
  } });
ex({ id: 'kurbelmoment', topic: 'anwendungen', level: 3, title: 'Moment an der Kurbelwelle über FP',
  gen(r) {
    const FK = r.num(1.5, 4, 1); const al = r.pick([10, 15, 20]); const rr = r.pick([80, 100, 120, 150]);
    const FP = FK / cos(al); const M = FP * rr; // kNmm = Nm
    return {
      text: `FK = <b>${F(FK)} kN</b>, Pleuel unter <b>αP = ${al}°</b>, Kurbelradius <b>r = ${rr} mm</b>. In der gezeichneten Stellung steht die Kurbel senkrecht zum Pleuel (Z10, Beispiel 7). Berechne FP und das Moment M an der Kurbelwelle in Nm.`,
      given: [G('FK', FK, 'kN'), G('αP', al, '°'), G('r', rr, 'mm')], vars: { FK, alpha: al, r: rr },
      wanted: [W('FP', 'FP', 'kN', FP, [A(FK * cos(al), 'FP = FK / cos α.')]), W('M', 'M', 'Nm', M, [A(FP * rr * 1000, 'kN · mm = Nm (1 kNmm = 1 Nm). Du hast um 1000 zu viel.'), A(FK * rr, 'Am Kurbelzapfen wirkt FP, nicht FK.')])],
      steps: [`FP = FK / cos αP = ${F(FK)} / cos ${al}° = ${F(FP)} kN`, `Kurbel ⊥ Pleuel ⇒ Normalabstand ln = r = ${rr} mm`, `M = FP · ln = ${F(FP)} kN · ${rr} mm = ${F(M)} kNmm = ${F(M)} Nm`],
      sketch: () => S.sketchKolben(al),
    };
  } });
ex({ id: 'kniehebel', topic: 'anwendungen', level: 3, title: 'Kniehebelpresse',
  gen(r) {
    const Fv = r.int(800, 2500, 100); const al = r.pick([6, 8, 10, 12, 15]);
    const Sv = (Fv / 2) / sin(al); const FQ = Sv * cos(al);
    return {
      text: `Eine Kniehebelpresse wird mit der waagrechten Kraft <b>F = ${Fv} N</b> angezogen. Die beiden Spreizen stehen unter <b>${al}° zur Waagrechten</b> (Z30, Beispiel 160). Berechne die Druckkraft S in den Spreizen (Zentrum I) und die Presskraft FQ (Zentrum II).`,
      given: [G('F', Fv, 'N'), G('α', al, '°')], vars: { F: Fv, alpha: al },
      wanted: [W('S', 'Spreizenkraft S', 'N', Sv, [A((Fv / 2) / cos(al), 'Zentrum I: F/2 ist die Gegenkathete zu α ⇒ sin.'), A(Fv / sin(al), 'F teilt sich auf zwei Spreizen: F/2.')]), W('FQ', 'Presskraft FQ', 'N', FQ, [A(Sv * sin(al), 'Zentrum II: FQ ist die Komponente senkrecht zur Führung ⇒ cos.'), A(Sv, 'FQ ist nur die senkrechte Komponente von S.')])],
      steps: [`Zentrum I: sin α = (F/2) / S ⇒ S = ${F(Fv / 2)} / sin ${al}° = ${F(Sv)} N`, `Zentrum II: cos α = FQ / S ⇒ FQ = ${F(Sv)} · cos ${al}° = ${F(FQ)} N`, `Normalkraft an der Führung: FN = F/2 = ${F(Fv / 2)} N`],
    };
  } });
ex({ id: 'keil', topic: 'anwendungen', level: 2, title: 'Spannvorrichtung mit Keil',
  gen(r) {
    const Fv = r.int(400, 2000, 100); const h = r.pick([20, 25, 30, 40]); const b = r.pick([60, 80, 100]);
    const al = atan(h / b); const FN = Fv / tan(al);
    return {
      text: `Ein Keil mit der Steigung <b>${h} : ${b}</b> wird mit <b>F = ${Fv} N</b> vorgeschoben. Welche Spannkraft FN entsteht senkrecht zur Wand (Z30, Spannvorrichtung)?`,
      given: [G('F', Fv, 'N'), G('h', h, 'mm'), G('b', b, 'mm')], vars: { F: Fv, h, b },
      wanted: [W('alpha', 'Keilwinkel α', '°', al, [A(atan(b / h), 'tan α = h / b.')]), W('FN', 'Spannkraft FN', 'N', FN, [A(Fv * tan(al), 'tan α = F / FN ⇒ FN = F / tan α (größer als F).')])],
      steps: [`tan α = ${h} / ${b} ⇒ α = ${F(al)}°`, `Krafteck: tan α = F / FN ⇒ FN = F / tan α = ${Fv} / tan ${F(al)}° = ${F(FN)} N`],
    };
  } });
ex({ id: 'druckkraft', topic: 'anwendungen', level: 2, title: 'Kraft aus Druck und Kolbenfläche',
  gen(r) {
    const d = r.pick([8, 10, 12, 16, 18, 20, 25]); const p = r.pick([4, 5, 6, 6.5, 8, 10]);
    const Aa = d * d * Math.PI / 4; const Fv = Aa * p * 10;
    return {
      text: `Ein Pneumatikzylinder hat den Kolbendurchmesser <b>d = ${d} cm</b> und wird mit <b>p = ${F(p)} bar</b> beaufschlagt (DM10, Hebel 1). Berechne die Kolbenfläche und die Kolbenkraft.`,
      given: [G('d', d, 'cm'), G('p', p, 'bar')], vars: { d, p },
      wanted: [W('A', 'Fläche A', 'cm²', Aa, [A(d * d * Math.PI, 'A = d² · π / 4 (durch 4 vergessen).')]), W('F', 'Kolbenkraft F', 'N', Fv, [A(Aa * p, '1 bar = 10 N/cm². Der Faktor 10 fehlt.'), A(Aa * p * 100, 'Faktor: 1 bar = 10 N/cm² (nicht 100).')])],
      steps: [`A = d² · π / 4 = ${d}² · π / 4 = ${F(Aa)} cm²`, `p = ${F(p)} bar = ${F(p * 10)} N/cm²`, `F = p · A = ${F(p * 10)} · ${F(Aa)} = ${F(Fv)} N = ${F(Fv / 1000)} kN`],
    };
  } });

// ---------------------------------------------------------------- Drehmoment
ex({ id: 'moment-senkrecht', topic: 'drehmoment', level: 1, title: 'Drehmoment bei senkrechtem Kraftangriff',
  gen(r) {
    const Fv = r.int(50, 800, 10); const l = r.int(150, 900, 50);
    const M = Fv * l / 1000;
    return {
      text: `Am Ende eines <b>${l} mm</b> langen Hebels greift die Kraft <b>F = ${Fv} N</b> senkrecht an. Wie groß ist das Drehmoment um den Drehpunkt in Nm?`,
      given: [G('F', Fv, 'N'), G('l', l, 'mm')], vars: { F: Fv, l },
      wanted: [W('M', 'Drehmoment M', 'Nm', M, [A(Fv * l, 'Einheit: mm in m umrechnen (÷ 1000).')])],
      steps: [`Senkrechter Angriff ⇒ ln = l = ${l} mm = ${l / 1000} m`, `M = F · ln = ${Fv} N · ${l / 1000} m = ${F(M)} Nm`],
      sketch: () => S.sketchHebel(Fv, l, 0, 1),
    };
  } });
ex({ id: 'schluessel', topic: 'drehmoment', level: 1, title: 'Schraubenschlüssel: nötige Handkraft',
  gen(r) {
    const M = r.pick([25, 40, 60, 80, 120, 200]); const l = r.pick([150, 200, 250, 300, 400]);
    const Fv = M / (l / 1000);
    return {
      text: `Eine Schraube soll mit <b>M = ${M} Nm</b> angezogen werden. Der Schlüssel ist <b>${l} mm</b> lang. Welche Handkraft ist nötig (senkrecht zum Schlüssel)?`,
      given: [G('M', M, 'Nm'), G('l', l, 'mm')], vars: { M, l },
      wanted: [W('F', 'Handkraft F', 'N', Fv, [A(M / l, 'l in m einsetzen (÷ 1000).'), A(M * l / 1000, 'F = M / l, nicht M · l.')])],
      steps: [`M = F · l ⇒ F = M / l`, `F = ${M} Nm / ${l / 1000} m = ${F(Fv)} N`],
    };
  } });
ex({ id: 'moment-schraeg', topic: 'drehmoment', level: 2, title: 'Schräg angreifende Kraft: Normalabstand',
  gen(r) {
    const Fv = r.int(5, 40, 5); const l = r.int(300, 900, 50); const al = r.pick([20, 25, 30, 40, 45]);
    const ln = l * cos(al); const M = Fv * ln / 1000;
    return {
      text: `Eine Kraft <b>F = ${Fv} kN</b> greift am Ende eines Hebels <b>l = ${l} mm</b> unter <b>α = ${al}° zur Senkrechten auf den Hebel</b> an (DM10). Berechne den Normalabstand ln und das Drehmoment M.`,
      given: [G('F', Fv, 'kN'), G('l', l, 'mm'), G('α', al, '° zur Senkrechten')], vars: { F: Fv, l, alpha: al },
      wanted: [W('ln', 'Normalabstand ln', 'mm', ln, [A(l * sin(al), 'α liegt zur Senkrechten auf den Hebel ⇒ ln = l · cos α.'), A(l, 'Bei schrägem Angriff ist ln kleiner als l.')]), W('M', 'M', 'kNm', M, [A(Fv * l / 1000, 'Du hast l statt ln verwendet.'), A(Fv * ln, 'Einheit: kN · mm = Nm, hier kNm verlangt (÷ 1000).'), A(Fv * l * sin(al) / 1000, 'sin/cos vertauscht: drehwirksam ist F · cos α.')])],
      steps: [`Weg 1: ln = l · cos α = ${l} · cos ${al}° = ${F(ln)} mm`, `M = F · ln = ${Fv} kN · ${F(ln / 1000, 3)} m = ${F(M)} kNm`, `Weg 2 (Probe): Fy = F · cos α = ${F(Fv * cos(al))} kN ⇒ M = Fy · l = ${F(Fv * cos(al))} · ${l / 1000} = ${F(M)} kNm ✓`],
      sketch: () => S.sketchDrehmoment(al),
    };
  } });
ex({ id: 'moment-komponenten', topic: 'drehmoment', level: 2, title: 'Drehmoment über Komponenten',
  gen(r) {
    const Fv = r.int(100, 900, 50); const l = r.int(200, 800, 50); const al = r.pick([30, 40, 50, 60, 70]);
    const Fy = Fv * sin(al), M = Fy * l / 1000;
    return {
      text: `Die Kraft <b>F = ${Fv} N</b> greift unter <b>α = ${al}° zur Hebelrichtung</b> im Abstand <b>l = ${l} mm</b> vom Drehpunkt an. Zerlege F in die Komponente senkrecht zum Hebel (F⊥) und berechne M.`,
      given: [G('F', Fv, 'N'), G('l', l, 'mm'), G('α', al, '° zum Hebel')], vars: { F: Fv, l, alpha: al },
      wanted: [W('Fs', 'F⊥ (senkrecht zum Hebel)', 'N', Fy, [A(Fv * cos(al), 'Winkel zum Hebel ⇒ senkrechte Komponente = F · sin α.')]), W('M', 'M', 'Nm', M, [A(Fv * l / 1000, 'Nur die senkrechte Komponente dreht.'), A(Fv * cos(al) * l / 1000, 'sin/cos vertauscht.'), A(Fy * l, 'mm → m.')])],
      steps: [`F⊥ = F · sin α = ${Fv} · sin ${al}° = ${F(Fy)} N; F∥ = F · cos α dreht nicht (Hebelarm 0)`, `M = F⊥ · l = ${F(Fy)} N · ${l / 1000} m = ${F(M)} Nm`],
      sketch: () => S.sketchDrehmoment(90 - al),
    };
  } });

// ---------------------------------------------------------------- Hebel
ex({ id: 'hebelgesetz', topic: 'hebel', level: 1, title: 'Hebelgesetz',
  gen(r) {
    const F1 = r.int(50, 600, 10); const l1 = r.int(200, 900, 50); const l2 = r.int(100, 400, 50);
    const F2 = F1 * l1 / l2;
    return {
      text: `Zweiseitiger Hebel: Auf der einen Seite drückt <b>F1 = ${F1} N</b> im Abstand <b>l1 = ${l1} mm</b> vom Drehpunkt. Auf der anderen Seite ist der Hebelarm <b>l2 = ${l2} mm</b>. Welche Kraft F2 hält das Gleichgewicht?`,
      given: [G('F1', F1, 'N'), G('l1', l1, 'mm'), G('l2', l2, 'mm')], vars: { F1, l1, l2 },
      wanted: [W('F2', 'F2', 'N', F2, [A(F1 * l2 / l1, 'Hebelarme vertauscht: F1 · l1 = F2 · l2 ⇒ F2 = F1 · l1 / l2.')])],
      steps: [`ΣM = 0: F1 · l1 − F2 · l2 = 0`, `F2 = F1 · l1 / l2 = ${F1} · ${l1} / ${l2} = ${F(F2)} N`, `Übersetzung i = l1 / l2 = ${F(l1 / l2)}`],
      sketch: () => S.sketchHebel(F1, l1, F2, l2),
    };
  } });
ex({ id: 'hebel-stuetz', topic: 'hebel', level: 2, title: 'Hebel mit Stützkraft',
  gen(r) {
    const F1 = r.int(2, 30) * 0.5; const i = r.pick([1.5, 2, 2.5, 2.75, 3, 4]);
    const F2 = F1 * i; const Sv = F1 + F2;
    return {
      text: `Ein Hebel hat die Übersetzung <b>i = ${F(i)} : 1</b>. Er wird mit <b>F1 = ${F(F1)} kN</b> belastet; die Gegenkraft F2 wirkt am kurzen Arm in gleicher Richtung wie F1 (DM10, Hebel 1). Berechne F2 und die Stützkraft S im Drehpunkt.`,
      given: [G('F1', F1, 'kN'), G('i', i, '')], vars: { F1, i },
      wanted: [W('F2', 'F2', 'kN', F2, [A(F1 / i, 'i = F2 / F1 ⇒ F2 = F1 · i.')]), W('S', 'Stützkraft S', 'kN', Sv, [A(F2 - F1, 'Beide Kräfte wirken in dieselbe Richtung ⇒ ΣFy = 0 liefert S = F1 + F2.'), A(F2, 'Die Stütze trägt beide Kräfte: S = F1 + F2.')])],
      steps: [`F2 = F1 · i = ${F(F1)} · ${F(i)} = ${F(F2)} kN (aus F1·l1 − F2·l2 = 0)`, `ΣFy = 0 = F1 − S + F2 ⇒ S = F1 + F2 = ${F(Sv)} kN`],
    };
  } });
ex({ id: 'hydraulik-hebel', topic: 'hebel', level: 3, title: 'Zylinder und Hebel (Hebel 1)',
  gen(r) {
    const d = r.pick([12, 16, 18, 20]); const p = r.pick([5, 6, 6.5, 8]); const i = r.pick([2, 2.5, 2.75, 3]);
    const Aa = d * d * Math.PI / 4; const F1 = Aa * p * 10 / 1000; const F2 = F1 * i; const Sv = F1 + F2;
    return {
      text: `Ein Zylinder (<b>d = ${d} cm</b>, <b>p = ${F(p)} bar</b>) drückt mit F1 auf einen Hebel mit der Übersetzung <b>${F(i)} : 1</b> (DM10, Hebel 1). Berechne F1, F2 und die Stützkraft S (alles in kN).`,
      given: [G('d', d, 'cm'), G('p', p, 'bar'), G('i', i, '')], vars: { d, p, i },
      wanted: [W('F1', 'F1', 'kN', F1, [A(Aa * p / 1000, '1 bar = 10 N/cm² (Faktor 10 fehlt).'), A(Aa * p * 10, 'Ergebnis in kN verlangt (÷ 1000).')]), W('F2', 'F2', 'kN', F2, [A(F1 / i, 'F2 = F1 · i.')]), W('S', 'S', 'kN', Sv, [A(F2 - F1, 'S = F1 + F2 (ΣFy = 0).')])],
      steps: [`A = d²·π/4 = ${F(Aa)} cm²; p = ${F(p * 10)} N/cm²`, `F1 = A · p = ${F(Aa)} · ${F(p * 10)} = ${F(Aa * p * 10)} N = ${F(F1)} kN`, `F2 = F1 · i = ${F(F2)} kN`, `S = F1 + F2 = ${F(Sv)} kN`],
    };
  } });
ex({ id: 'hebel-schraeg', topic: 'hebel', level: 3, title: 'Hebel mit schräger Kraft und Lagerkraft',
  gen(r) {
    const F1 = r.int(200, 500, 20); const F2 = r.int(150, 400, 10); const al = r.pick([30, 45, 60]);
    const a1 = r.pick([100, 115, 150]); const a2 = a1 + r.pick([100, 115, 150]); const a3 = a2 + r.pick([30, 60, 100]);
    const F2x = F2 * cos(al), F2y = F2 * sin(al);
    const F3 = (F1 * a1 + F2y * a2) / a3; const Ay = F1 + F2y - F3; const Ax = F2x; const Am = Math.hypot(Ax, Ay);
    return {
      text: `Ein waagrechter Hebel ist bei A gelagert. Nach unten wirken <b>F1 = ${F1} N</b> (senkrecht, Abstand <b>${a1} mm</b>) und <b>F2 = ${F2} N</b> unter <b>${al}° zum Hebel</b> (Abstand <b>${a2} mm</b>, zieht nach rechts unten). Am Ende (<b>${a3} mm</b>) hält F3 senkrecht nach oben (DM10, Hebel 2). Berechne F3, Ax, Ay und die Lagerkraft A.`,
      given: [G('F1', F1, 'N'), G('F2', F2, 'N'), G('α', al, '°'), G('a1', a1, 'mm'), G('a2', a2, 'mm'), G('a3', a3, 'mm')], vars: { F1, F2, alpha: al, a1, a2, a3 },
      wanted: [W('F3', 'F3', 'N', F3, [A((F1 * a1 + F2 * a2) / a3, 'F2 muss zerlegt werden: nur F2y dreht (F2x geht durch die Hebelachse).'), A((F1 * a1 + F2x * a2) / a3, 'sin/cos vertauscht: F2y = F2 · sin α.')]), W('Ay', 'Ay', 'N', Ay, [A(F3 - F1 - F2y, 'Vorzeichen: ΣFy = 0 = Ay + F3 − F1 − F2y.')]), W('Ax', 'Ax', 'N', Ax, [A(F2y, 'Ax gleicht die waagrechte Komponente F2x = F2 · cos α aus.')]), W('A', 'Lagerkraft A', 'N', Am, [])],
      steps: [`Zerlegen: F2x = ${F2}·cos ${al}° = ${F(F2x)} N, F2y = ${F2}·sin ${al}° = ${F(F2y)} N`, `ΣM(A) = 0: F3·${a3} − F1·${a1} − F2y·${a2} = 0 ⇒ F3 = ${F(F3)} N`, `ΣFy = 0: Ay = F1 + F2y − F3 = ${F(Ay)} N (${Ay >= 0 ? 'nach oben' : 'nach unten'})`, `ΣFx = 0: Ax = F2x = ${F(Ax)} N`, `A = √(Ax² + Ay²) = ${F(Am)} N`],
    };
  } });

// ---------------------------------------------------------------- Allgemeines Kraftsystem (Verständnisfragen + Grundaufgabe)
const MC = [
  { q: 'Wie viele unbekannte Kraftkomponenten hat ein <b>Loslager</b>?', options: ['Eine (senkrecht zur Lagerfläche)', 'Zwei (x und y)', 'Drei (x, y und ein Moment)', 'Keine'], correct: 0, why: 'Das Loslager kann nur senkrecht zur Lagerfläche drücken. Das Festlager hat zwei Komponenten.' },
  { q: 'Welche Gleichgewichtsbedingungen gelten im <b>allgemeinen</b> Kraftsystem?', options: ['ΣFx = 0 und ΣFy = 0', 'ΣFx = 0, ΣFy = 0 und ΣM = 0', 'nur ΣM = 0', 'ΣF = 0 und ΣFx = ΣFy'], correct: 1, why: 'Weil sich die Kräfte nicht in einem Punkt schneiden, können sie drehen: ΣM = 0 kommt dazu.' },
  { q: 'Du suchst die Auflagerkraft B eines Trägers. Um welchen Punkt bildest du am besten ΣM = 0?', options: ['Um die Trägermitte', 'Um das Lager A', 'Um das Lager B', 'Um den Angriffspunkt der größten Last'], correct: 1, why: 'Um A fällt die unbekannte Kraft A heraus (Hebelarm 0), und nur B bleibt als Unbekannte.' },
  { q: 'Eine Auflagerkraft ergibt sich zu A = −280 N. Was bedeutet das?', options: ['Rechenfehler, Kräfte sind nie negativ', 'A wirkt entgegen der angenommenen Richtung (nach unten)', 'Der Träger ist überlastet', 'B muss ebenfalls negativ sein'], correct: 1, why: 'Negativ heißt: Die Annahme der Richtung stimmt nicht. Das Lager müsste den Träger nach unten halten (T10, Nr. 3).' },
  { q: 'Vorzeichenkonvention im Kurs: Welche Aussage stimmt?', options: ['Drehmoment nach rechts (Uhrzeigersinn) = +, y nach oben = +, x nach rechts = +', 'Drehmoment nach links = +, y nach unten = +', 'Vorzeichen spielen bei Momenten keine Rolle', 'x nach links = +'], correct: 0, why: 'So steht es auf jeder Folie von T10/T20/DM20. Wichtig ist nur: eine Vereinbarung treffen und durchhalten.' },
  { q: 'Wann ist ein Kraftsystem <b>zentral</b>?', options: ['Wenn alle Kräfte gleich groß sind', 'Wenn sich alle Wirkungslinien in einem Punkt schneiden', 'Wenn alle Kräfte parallel sind', 'Wenn nur zwei Kräfte wirken'], correct: 1, why: 'Zentral = gemeinsamer Schnittpunkt der Wirkungslinien. Dann gibt es kein Drehmoment um diesen Punkt.' },
  { q: 'Eine waagrechte Kraft greift 150 mm über der Trägerachse an. Welches Moment erzeugt sie um das Lager A auf der Achse?', options: ['Keines, sie wirkt ja nicht nach unten', 'F · 150 mm (Normalabstand)', 'F · Abstand zum Lager B', 'F · Trägerlänge'], correct: 1, why: 'Jede Kraft, deren Wirkungslinie nicht durch den Drehpunkt geht, erzeugt ein Moment: Kraft mal Normalabstand (T10, Nr. 5).' },
];
ex({ id: 'statik-mc', topic: 'allgemeines-kraftsystem', level: 1, title: 'Verständnisfrage Statik',
  gen(r) {
    const q = r.pick(MC);
    return { text: q.q, given: [], vars: {}, wanted: [], mc: { options: q.options, correct: q.correct, why: q.why }, steps: [q.why] };
  } });
ex({ id: 'traeger-einzellast', topic: 'allgemeines-kraftsystem', level: 2, title: 'Träger mit einer Einzellast',
  gen(r) {
    const L = r.pick([1000, 1200, 1500, 1800, 2000]); const a = r.int(200, L - 200, 100); const Fv = r.int(200, 2000, 100);
    const Av = Fv * (L - a) / L, Bv = Fv * a / L;
    return {
      text: `Ein Träger (Loslager A links, Festlager B rechts, Stützweite <b>L = ${L} mm</b>) trägt <b>F = ${Fv} N</b> im Abstand <b>a = ${a} mm</b> von A (T10, Nr. 1). Berechne die Auflagerkräfte A und B.`,
      given: [G('L', L, 'mm'), G('a', a, 'mm'), G('F', Fv, 'N')], vars: { L, a, F: Fv },
      wanted: [W('A', 'A', 'N', Av, [A(Bv, 'A und B vertauscht: Das Lager näher an der Last trägt mehr.'), A(Fv / 2, 'Halbe Last gilt nur, wenn F in der Mitte steht.')]), W('B', 'B', 'N', Bv, [A(Av, 'A und B vertauscht.')])],
      steps: [`ΣM(A) = 0: F·a − B·L = 0 ⇒ B = F·a/L = ${Fv}·${a}/${L} = ${F(Bv)} N`, `ΣFy = 0: A − F + B = 0 ⇒ A = F − B = ${F(Av)} N`, `Probe ΣM(B): A·L − F·(L − a) = ${F(Av * L - Fv * (L - a), 0)} ≈ 0 ✓`],
      sketch: () => S.sketchTraeger(L, [{ x: a, F: Fv, name: 'F' }]),
    };
  } });

// ---------------------------------------------------------------- Träger
ex({ id: 'traeger-zwei', topic: 'traeger', level: 2, title: 'Träger mit zwei Lasten',
  gen(r) {
    const L = r.pick([1500, 1800, 2000, 2400]); const a1 = r.int(200, L / 2, 100); const a2 = r.int(a1 + 200, L - 200, 100);
    const F1 = r.int(200, 1200, 100), F2 = r.int(200, 1600, 100);
    const Bv = (F1 * a1 + F2 * a2) / L, Av = F1 + F2 - Bv;
    return {
      text: `Träger auf zwei Stützen, <b>L = ${L} mm</b>. Lasten: <b>F1 = ${F1} N</b> bei <b>${a1} mm</b>, <b>F2 = ${F2} N</b> bei <b>${a2} mm</b> (von A). Berechne A und B (T10, Nr. 2).`,
      given: [G('L', L, 'mm'), G('F1', F1, 'N'), G('a1', a1, 'mm'), G('F2', F2, 'N'), G('a2', a2, 'mm')], vars: { L, F1, a1, F2, a2 },
      wanted: [W('B', 'B', 'N', Bv, [A((F1 * (L - a1) + F2 * (L - a2)) / L, 'Das ist A (Abstände von B gemessen). Für B: Momente um A mit Abständen von A.')]), W('A', 'A', 'N', Av, [A(Bv, 'A und B vertauscht.'), A((F1 + F2) / 2, 'Halbe Summe gilt nur bei symmetrischer Belastung.')])],
      steps: [`Drehpunkt A: ΣM(A) = 0 = F1·${a1} + F2·${a2} − B·${L}`, `B = (${F1}·${a1} + ${F2}·${a2}) / ${L} = ${F(Bv)} N`, `ΣFy = 0: A = F1 + F2 − B = ${F(Av)} N`, `Probe: ΣM(B) = A·${L} − F1·${L - a1} − F2·${L - a2} ≈ 0 ✓`],
      sketch: () => S.sketchTraeger(L, [{ x: a1, F: F1, name: 'F1' }, { x: a2, F: F2, name: 'F2' }]),
    };
  } });
ex({ id: 'kragarm', topic: 'traeger', level: 3, title: 'Träger mit Kragarm',
  gen(r) {
    const L = r.pick([1000, 1200, 1500]); const a1 = r.int(300, L - 300, 100); const lk = r.pick([300, 400, 500]); const a2 = L + lk;
    const F1 = r.int(300, 900, 100), F2 = r.int(800, 2000, 100);
    const Bv = (F1 * a1 + F2 * a2) / L, Av = F1 + F2 - Bv;
    return {
      text: `Lager A bei 0, Lager B bei <b>${L} mm</b>. <b>F1 = ${F1} N</b> bei <b>${a1} mm</b>, <b>F2 = ${F2} N</b> auf dem Kragarm bei <b>${a2} mm</b> (T10, Nr. 3). Berechne B und A. Achte auf das Vorzeichen von A.`,
      given: [G('L', L, 'mm'), G('F1', F1, 'N'), G('a1', a1, 'mm'), G('F2', F2, 'N'), G('a2', a2, 'mm')], vars: { L, F1, a1, F2, a2 },
      wanted: [W('B', 'B', 'N', Bv, [A((F1 * a1 - F2 * lk) / L, 'F2 dreht um A im selben Sinn wie F1 (beide nach unten, rechts von A) ⇒ gleiches Vorzeichen.')]), W('A', 'A (mit Vorzeichen)', 'N', Av, [A(-Av, 'Vorzeichen: A = F1 + F2 − B. Negativ bedeutet nach unten.'), A(F1 + F2 + Bv, 'ΣFy: A − F1 − F2 + B = 0 ⇒ A = F1 + F2 − B.')])],
      steps: [`ΣM(A) = 0: F1·${a1} + F2·${a2} − B·${L} = 0 ⇒ B = ${F(Bv)} N`, `ΣFy = 0: A = F1 + F2 − B = ${F1} + ${F2} − ${F(Bv)} = ${F(Av)} N`, Av < 0 ? `A ist negativ: Das Lager A müsste den Träger nach unten halten, sonst kippt er um B.` : `A ist positiv: Der Träger drückt noch auf A.`, `Probe mit Drehpunkt B: A·${L} − F1·${L - a1} + F2·${lk} = 0 ⇒ A = ${F((F1 * (L - a1) - F2 * lk) / L)} N ✓`],
      sketch: () => S.sketchTraeger(L, [{ x: a1, F: F1, name: 'F1' }, { x: a2, F: F2, name: 'F2' }]),
    };
  } });
ex({ id: 'traeger-schraeg', topic: 'traeger', level: 3, title: 'Träger mit schräger Last',
  gen(r) {
    const L = r.pick([1100, 1500, 2000]); const a = r.int(300, L - 300, 100); const Fv = r.int(300, 1500, 100); const be = r.pick([30, 45, 60]);
    const Fx = Fv * cos(be), Fy = Fv * sin(be);
    const By = Fy * a / L, Av = Fy - By, Bx = Fx, Bm = Math.hypot(Bx, By), al = atan(By / Bx);
    return {
      text: `Auf den Träger (Loslager A, Festlager B, <b>L = ${L} mm</b>) wirkt bei <b>${a} mm</b> die Kraft <b>F = ${Fv} N</b> schräg nach rechts unten unter <b>${be}° zur Waagrechten</b>, Angriff auf der Trägerachse (T10, Nr. 7). Berechne By, A, Bx und die resultierende Lagerkraft B.`,
      given: [G('L', L, 'mm'), G('a', a, 'mm'), G('F', Fv, 'N'), G('β', be, '°')], vars: { L, a, F: Fv, beta: be },
      wanted: [W('By', 'By', 'N', By, [A(Fv * a / L, 'Nur die senkrechte Komponente Fy = F · sin β dreht um A (Fx geht durch die Achse).'), A(Fx * a / L, 'sin/cos vertauscht: Fy = F · sin β.')]), W('A', 'A', 'N', Av, [A(Fv - By, 'A = Fy − By mit Fy = F · sin β.')]), W('Bx', 'Bx', 'N', Bx, [A(Fy, 'Bx gleicht die waagrechte Komponente Fx = F · cos β aus.')]), W('B', 'B (resultierend)', 'N', Bm, [])],
      steps: [`Zerlegen: Fx = ${Fv}·cos ${be}° = ${F(Fx)} N, Fy = ${Fv}·sin ${be}° = ${F(Fy)} N`, `ΣM(A) = 0: Fy·${a} − By·${L} = 0 ⇒ By = ${F(By)} N`, `ΣFy = 0: A = Fy − By = ${F(Av)} N`, `ΣFx = 0: Bx = Fx = ${F(Bx)} N (nur das Festlager nimmt x auf)`, `B = √(Bx² + By²) = ${F(Bm)} N, α = arctan(By/Bx) = ${F(al)}°`],
      sketch: () => S.sketchTraeger(L, [{ x: a, F: Fv, name: 'F', angle: 180 - be }]),
    };
  } });

// ---------------------------------------------------------------- Tür / Kran
ex({ id: 'tuer', topic: 'auflager-anwendungen', level: 2, title: 'Türblatt',
  gen(r) {
    const h = r.pick([1600, 1750, 1900, 2000]); const b = r.pick([400, 450, 500, 550, 600]); const FG = r.int(250, 700, 50);
    const Ax = FG * b / h, Bm = Math.hypot(Ax, FG), al = atan(Ax / FG);
    return {
      text: `Ein Türblatt mit <b>FG = ${FG} N</b> hängt an zwei Bändern im Abstand <b>${h} mm</b> (oben Loslager A, unten Festlager B). Der Schwerpunkt liegt <b>${b} mm</b> von den Bändern entfernt (DM20, Tür 1). Berechne Ax, By, Bx und die resultierende Kraft B.`,
      given: [G('FG', FG, 'N'), G('h', h, 'mm'), G('b', b, 'mm')], vars: { FG, h, b },
      wanted: [W('Ax', 'Ax', 'N', Ax, [A(FG * h / b, 'ΣM(B) = 0: Ax·h = FG·b ⇒ Ax = FG·b/h.'), A(FG, 'Das obere Band trägt kein Gewicht, nur die seitliche Kraft aus dem Kippmoment.')]), W('By', 'By', 'N', FG, [A(FG / 2, 'Nur das untere Festlager trägt senkrecht: By = FG.')]), W('Bx', 'Bx', 'N', Ax, [A(0, 'ΣFx = 0 ⇒ Bx = Ax.')]), W('B', 'B', 'N', Bm, [])],
      steps: [`ΣM(B) = 0: Ax·${h} − FG·${b} = 0 ⇒ Ax = ${FG}·${b}/${h} = ${F(Ax)} N`, `ΣFx = 0: Bx = Ax = ${F(Ax)} N`, `ΣFy = 0: By = FG = ${FG} N`, `B = √(Bx² + By²) = ${F(Bm)} N; α = arctan(Bx/By) = ${F(al)}°`],
      sketch: () => S.sketchKran(h, b, FG, 'N'),
    };
  } });
ex({ id: 'kran-eigengewicht', topic: 'auflager-anwendungen', level: 3, title: 'Wandkran mit Eigengewicht',
  gen(r) {
    const h = r.pick([1200, 1500, 1800]); const a = r.pick([1800, 2000, 2500, 3000]); const FG = r.int(3, 10); const FE = r.pick([0.5, 0.7, 0.9, 1.2]); const aE = a / 2;
    const Ax = (FG * a + FE * aE) / h, By = FG + FE, Bm = Math.hypot(Ax, By), al = atan(By / Ax);
    return {
      text: `Wandkran: Lagerabstand <b>${h} mm</b>, Last <b>FG = ${FG} kN</b> am Auslegerende (<b>${a} mm</b>), Eigengewicht des Auslegers <b>FE = ${F(FE)} kN</b> in der Mitte (<b>${aE} mm</b>) (DM20, Kran 2). Berechne Ax, By, B und den Winkel α von B zur Waagrechten.`,
      given: [G('h', h, 'mm'), G('FG', FG, 'kN'), G('a', a, 'mm'), G('FE', FE, 'kN'), G('aE', aE, 'mm')], vars: { h, FG, a, FE, aE },
      wanted: [W('Ax', 'Ax = Bx', 'kN', Ax, [A(FG * a / h, 'Das Eigengewicht erzeugt ebenfalls ein Kippmoment FE·aE.'), A((FG * a + FE * a) / h, 'FE greift in der Mitte an (aE = a/2), nicht am Ende.')]), W('By', 'By', 'kN', By, [A(FG, 'By trägt auch das Eigengewicht: FG + FE.')]), W('B', 'B', 'kN', Bm, []), W('alpha', 'α', '°', al, [A(atan(Ax / By), 'α zur Waagrechten: tan α = By / Bx.')])],
      steps: [`ΣM(B) = 0: Ax·${h} − FG·${a} − FE·${aE} = 0 ⇒ Ax = (${FG}·${a} + ${F(FE)}·${aE}) / ${h} = ${F(Ax)} kN`, `ΣFx = 0: Bx = Ax`, `ΣFy = 0: By = FG + FE = ${F(By)} kN`, `B = √(${F(Ax)}² + ${F(By)}²) = ${F(Bm)} kN; α = arctan(By/Bx) = ${F(al)}°`],
      sketch: () => S.sketchKran(h, a, FG, 'kN', FE, aE),
    };
  } });

// ---------------------------------------------------------------- Biegemoment
ex({ id: 'mb-einzellast', topic: 'biegemoment', level: 2, title: 'Maximales Biegemoment bei Einzellast',
  gen(r) {
    const L = r.pick([1200, 1500, 2000, 2400]); const a = r.int(300, L - 300, 100); const Fv = r.int(400, 3000, 100);
    const Bv = Fv * a / L, Av = Fv - Bv; const Mb = Av * a / 1000;
    return {
      text: `Träger <b>L = ${L} mm</b>, Einzellast <b>F = ${Fv} N</b> bei <b>a = ${a} mm</b> von A. Berechne A, B und das maximale Biegemoment Mb max (in Nm).`,
      given: [G('L', L, 'mm'), G('a', a, 'mm'), G('F', Fv, 'N')], vars: { L, a, F: Fv },
      wanted: [W('A', 'A', 'N', Av, [A(Bv, 'A und B vertauscht.')]), W('B', 'B', 'N', Bv, [A(Av, 'A und B vertauscht.')]), W('Mb', 'Mb max', 'Nm', Mb, [A(Av * a, 'mm → m (÷ 1000).'), A(Fv * a / 1000, 'Mb unter der Last = A · a (Auflagerkraft mal Abstand), nicht F · a.'), A(Fv * L / 4000, 'F·L/4 gilt nur für die Last in Feldmitte.')])],
      steps: [`B = F·a/L = ${F(Bv)} N; A = F − B = ${F(Av)} N`, `Maximum unter der Last (Nulldurchgang der Querkraft): Mb = A · a = ${F(Av)} · ${a / 1000} m = ${F(Mb)} Nm`, `Probe von rechts: B · (L − a) = ${F(Bv)} · ${(L - a) / 1000} = ${F(Bv * (L - a) / 1000)} Nm ✓`],
      sketch: () => S.sketchMomentenverlauf(L, [{ x: 0, M: 0 }, { x: a, M: Mb, label: `${F(Mb)} Nm` }, { x: L, M: 0 }]),
    };
  } });
ex({ id: 'mb-zwei', topic: 'biegemoment', level: 3, title: 'Momentenverlauf bei zwei Lasten',
  gen(r) {
    const L = r.pick([1800, 2000, 2400]); const a1 = r.int(300, L / 2 - 100, 100); const a2 = r.int(L / 2 + 100, L - 300, 100);
    const F1 = r.int(300, 1200, 100), F2 = r.int(300, 1200, 100);
    const Bv = (F1 * a1 + F2 * a2) / L, Av = F1 + F2 - Bv;
    const M1 = Av * a1 / 1000, M2 = Bv * (L - a2) / 1000;
    return {
      text: `Träger <b>L = ${L} mm</b>, <b>F1 = ${F1} N</b> bei <b>${a1} mm</b>, <b>F2 = ${F2} N</b> bei <b>${a2} mm</b> (T20, Nr. 2). Berechne die Auflagerkräfte sowie die Biegemomente unter F1 und unter F2.`,
      given: [G('L', L, 'mm'), G('F1', F1, 'N'), G('a1', a1, 'mm'), G('F2', F2, 'N'), G('a2', a2, 'mm')], vars: { L, F1, a1, F2, a2 },
      wanted: [W('A', 'A', 'N', Av, []), W('B', 'B', 'N', Bv, []), W('M1', 'Mb unter F1', 'Nm', M1, [A(Av * a1, 'mm → m.'), A(F1 * a1 / 1000, 'Links der Stelle wirkt nur A: Mb = A · a1.')]), W('M2', 'Mb unter F2', 'Nm', M2, [A(Bv * (L - a2), 'mm → m.'), A(Bv * a2 / 1000, 'Von rechts gerechnet: Abstand von B ist L − a2.'), A(Av * a2 / 1000, 'Von links musst du F1 mitnehmen: A·a2 − F1·(a2 − a1).')])],
      steps: [`B = (F1·${a1} + F2·${a2})/${L} = ${F(Bv)} N; A = F1 + F2 − B = ${F(Av)} N`, `Mb(F1) links = A·${a1 / 1000} = ${F(M1)} Nm; rechts = B·${(L - a1) / 1000} − F2·${(a2 - a1) / 1000} = ${F(Bv * (L - a1) / 1000 - F2 * (a2 - a1) / 1000)} Nm ✓`, `Mb(F2) rechts = B·${(L - a2) / 1000} = ${F(M2)} Nm; links = A·${a2 / 1000} − F1·${(a2 - a1) / 1000} = ${F(Av * a2 / 1000 - F1 * (a2 - a1) / 1000)} Nm ✓`, `Mb max = ${F(Math.max(M1, M2))} Nm unter ${M1 >= M2 ? 'F1' : 'F2'}`],
      sketch: () => S.sketchMomentenverlauf(L, [{ x: 0, M: 0 }, { x: a1, M: M1, label: `${F(M1)}` }, { x: a2, M: M2, label: `${F(M2)}` }, { x: L, M: 0 }]),
    };
  } });
ex({ id: 'mb-kragarm', topic: 'biegemoment', level: 3, title: 'Biegemoment über dem Lager (Kragarm)',
  gen(r) {
    const L = r.pick([1000, 1200, 1500]); const a1 = r.int(300, L - 300, 100); const lk = r.pick([300, 400, 500]);
    const F1 = r.int(300, 900, 100), F2 = r.int(600, 1800, 100);
    const Bv = (F1 * a1 + F2 * (L + lk)) / L, Av = F1 + F2 - Bv; const MB = -F2 * lk / 1000; const M1 = Av * a1 / 1000;
    return {
      text: `Kragträger: Lager A bei 0, B bei <b>${L} mm</b>; <b>F1 = ${F1} N</b> bei <b>${a1} mm</b>, <b>F2 = ${F2} N</b> am Kragarmende (<b>${lk} mm</b> hinter B) (T20, Nr. 3). Berechne A, B, das Biegemoment über B und unter F1 (mit Vorzeichen; Zug unten = positiv).`,
      given: [G('L', L, 'mm'), G('F1', F1, 'N'), G('a1', a1, 'mm'), G('F2', F2, 'N'), G('lk', lk, 'mm')], vars: { L, F1, a1, F2, lk },
      wanted: [W('B', 'B', 'N', Bv, []), W('A', 'A', 'N', Av, [A(-Av, 'Vorzeichen prüfen: A = F1 + F2 − B.')]), W('MB', 'Mb über B', 'Nm', MB, [A(-MB, 'Vorzeichen: Über dem Lager wird der Träger nach oben gebogen (negativ).'), A(-F2 * lk, 'mm → m.')]), W('M1', 'Mb unter F1', 'Nm', M1, [A(Av * a1, 'mm → m.'), A(-M1, 'Vorzeichen: Mb = A · a1 mit dem Vorzeichen von A.')])],
      steps: [`ΣM(A) = 0: B = (F1·${a1} + F2·${L + lk})/${L} = ${F(Bv)} N`, `ΣFy = 0: A = F1 + F2 − B = ${F(Av)} N${Av < 0 ? ' (nach unten)' : ''}`, `Mb über B von rechts: −F2·${lk / 1000} = ${F(MB)} Nm (Maximum dem Betrag nach)`, `Probe von links: A·${L / 1000} − F1·${(L - a1) / 1000} = ${F(Av * L / 1000 - F1 * (L - a1) / 1000)} Nm ✓`, `Mb unter F1 von links: A·${a1 / 1000} = ${F(M1)} Nm`],
      sketch: () => S.sketchMomentenverlauf(L + lk, [{ x: 0, M: 0 }, { x: a1, M: M1, label: `${F(M1)}` }, { x: L, M: MB, label: `${F(MB)}` }, { x: L + lk, M: 0 }]),
    };
  } });

// ---------------------------------------------------------------- Reibung
ex({ id: 'reibung-horizontal', topic: 'reibung', level: 1, title: 'Reibungskraft auf ebener Fläche',
  gen(r) {
    const m = r.pick([20, 35, 50, 80, 120, 200]); const mu = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4]);
    const FN = m * g, FR = mu * FN;
    return {
      text: `Eine Kiste mit <b>m = ${m} kg</b> soll auf ebenem Boden verschoben werden, Reibungszahl <b>μ = ${F(mu)}</b>. Berechne Normalkraft und Reibungskraft.`,
      given: [G('m', m, 'kg'), G('μ', mu, '')], vars: { m, mu, g },
      wanted: [W('FN', 'Normalkraft FN', 'N', FN, [A(m, 'Normalkraft = Gewichtskraft = m · g (nicht die Masse).')]), W('FR', 'Reibungskraft FR', 'N', FR, [A(mu * m, 'FR = μ · FN mit FN = m · g.'), A(FN / mu, 'FR = μ · FN (multiplizieren).')])],
      steps: [`FN = FG = m · g = ${m} · 9,81 = ${F(FN)} N`, `FR = μ · FN = ${F(mu)} · ${F(FN)} = ${F(FR)} N`],
    };
  } });
ex({ id: 'schiefe-ebene', topic: 'reibung', level: 2, title: 'Kräfte auf der schiefen Ebene',
  gen(r) {
    const m = r.pick([40, 60, 80, 120, 150]); const al = r.pick([10, 15, 20, 25, 30]); const mu = r.pick([0.15, 0.2, 0.25, 0.3]);
    const Gv = m * g, FH = Gv * sin(al), FN = Gv * cos(al), FR = mu * FN;
    return {
      text: `Ein Körper mit <b>m = ${m} kg</b> liegt auf einer um <b>α = ${al}°</b> geneigten Ebene, <b>μ = ${F(mu)}</b>. Berechne Hangabtriebskraft FH, Normalkraft FN und Reibungskraft FR. Rutscht er?`,
      given: [G('m', m, 'kg'), G('α', al, '°'), G('μ', mu, '')], vars: { m, alpha: al, mu, g },
      wanted: [W('FH', 'FH', 'N', FH, [A(Gv * cos(al), 'sin/cos vertauscht: FH = G · sin α (bei 0° kein Hangabtrieb).'), A(m * sin(al), 'Mit der Masse statt der Gewichtskraft gerechnet.')]), W('FN', 'FN', 'N', FN, [A(Gv, 'Auf der Ebene ist FN = G · cos α, kleiner als G.'), A(Gv * sin(al), 'sin/cos vertauscht.')]), W('FR', 'FR', 'N', FR, [A(mu * Gv, 'FR = μ · FN mit FN = G · cos α, nicht μ · G.')])],
      steps: [`G = ${m} · 9,81 = ${F(Gv)} N`, `FH = G · sin α = ${F(FH)} N; FN = G · cos α = ${F(FN)} N`, `FR = μ · FN = ${F(mu)} · ${F(FN)} = ${F(FR)} N`, FH > FR ? `FH > FR ⇒ der Körper rutscht (tan α = ${F(tan(al), 3)} > μ).` : `FH ≤ FR ⇒ der Körper bleibt liegen (tan α = ${F(tan(al), 3)} ≤ μ).`],
      sketch: () => S.sketchSchiefeEbene(al),
    };
  } });
ex({ id: 'reibungswinkel', topic: 'reibung', level: 2, title: 'Reibungswinkel und Selbsthemmung',
  gen(r) {
    const mu = r.pick([0.1, 0.12, 0.15, 0.18, 0.2, 0.25, 0.3, 0.35]);
    const rho = atan(mu);
    return {
      text: `Für eine Werkstoffpaarung gilt die Haftreibungszahl <b>μ0 = ${F(mu)}</b>. Bis zu welchem Neigungswinkel ρ bleibt ein Körper auf der Ebene liegen (Reibungswinkel)?`,
      given: [G('μ0', mu, '')], vars: { mu0: mu },
      wanted: [W('rho', 'Reibungswinkel ρ', '°', rho, [A(asin(mu), 'tan ρ = μ0 ⇒ ρ = arctan(μ0), nicht arcsin.'), A(mu * 100, 'μ0 ist kein Prozentwert; ρ = arctan(μ0).')])],
      steps: [`Grenze: FH = FR ⇒ G·sin ρ = μ0·G·cos ρ ⇒ tan ρ = μ0`, `ρ = arctan(${F(mu)}) = ${F(rho)}°`],
    };
  } });
ex({ id: 'ebene-ziehen', topic: 'reibung', level: 3, title: 'Last die Rampe hinaufziehen',
  gen(r) {
    const m = r.pick([80, 120, 150, 200, 300]); const al = r.pick([10, 15, 20, 25]); const mu = r.pick([0.15, 0.2, 0.25, 0.3]);
    const Gv = m * g, FH = Gv * sin(al), FN = Gv * cos(al), FR = mu * FN, Fup = FH + FR, Fhold = FH - FR;
    return {
      text: `Eine Last <b>m = ${m} kg</b> soll parallel zur Rampe (<b>α = ${al}°</b>, <b>μ = ${F(mu)}</b>) gleichmäßig <b>hinaufgezogen</b> werden. Welche Zugkraft F ist nötig? Welche Kraft genügt, um sie gegen Abrutschen zu <b>halten</b>?`,
      given: [G('m', m, 'kg'), G('α', al, '°'), G('μ', mu, '')], vars: { m, alpha: al, mu, g },
      wanted: [W('Fup', 'Zugkraft hinauf', 'N', Fup, [A(FH, 'Die Reibung wirkt beim Hinaufziehen zusätzlich bremsend: F = FH + FR.'), A(Fhold, 'Beim Hinaufziehen wirkt FR gegen die Bewegung, also talwärts: F = FH + FR.')]), W('Fhold', 'Haltekraft', 'N', Math.max(0, Fhold), [A(Fup, 'Beim Halten hilft die Reibung mit (zeigt hangaufwärts): F = FH − FR.'), A(FH, 'Reibung berücksichtigen: F = FH − FR.')])],
      steps: [`G = ${F(Gv)} N; FH = G·sin α = ${F(FH)} N; FN = G·cos α = ${F(FN)} N; FR = μ·FN = ${F(FR)} N`, `Hinaufziehen (Reibung bremst): F = FH + FR = ${F(Fup)} N`, Fhold > 0 ? `Halten (Reibung hilft): F = FH − FR = ${F(Fhold)} N` : `Halten: FH ≤ FR ⇒ die Last bleibt von selbst liegen (Selbsthemmung), F = 0.`],
      sketch: () => S.sketchSchiefeEbene(al),
    };
  } });

// ---------------------------------------------------------------- Einfache Maschinen
ex({ id: 'flaschenzug', topic: 'einfache-maschinen', level: 1, title: 'Flaschenzug ohne Reibung',
  gen(r) {
    const m = r.pick([60, 120, 200, 240, 350, 500]); const n = r.pick([2, 3, 4, 6]); const hh = r.pick([1, 1.5, 2, 2.5]);
    const Gv = m * g, Fv = Gv / n, s = n * hh;
    return {
      text: `Eine Last <b>m = ${m} kg</b> hängt an einem Flaschenzug mit <b>n = ${n}</b> tragenden Seilsträngen. Sie soll um <b>h = ${F(hh)} m</b> gehoben werden. Berechne die Zugkraft F und den Seilweg s (ohne Reibung).`,
      given: [G('m', m, 'kg'), G('n', n, ''), G('h', hh, 'm')], vars: { m, n, h: hh, g },
      wanted: [W('F', 'Zugkraft F', 'N', Fv, [A(m / n, 'Erst Gewichtskraft bilden: G = m · g.'), A(Gv, 'Der Flaschenzug teilt die Last auf n Stränge.')]), W('s', 'Seilweg s', 'm', s, [A(hh / n, 'Kraft wird gespart, Weg zugelegt: s = n · h.')])],
      steps: [`G = ${m} · 9,81 = ${F(Gv)} N`, `F = G / n = ${F(Gv)} / ${n} = ${F(Fv)} N`, `s = n · h = ${n} · ${F(hh)} = ${F(s)} m (goldene Regel: F·s = G·h)`],
    };
  } });
ex({ id: 'flaschenzug-eta', topic: 'einfache-maschinen', level: 2, title: 'Flaschenzug mit Wirkungsgrad',
  gen(r) {
    const m = r.pick([150, 240, 400, 600, 800]); const n = r.pick([3, 4, 5, 6]); const eta = r.pick([0.8, 0.85, 0.9, 0.92]);
    const Gv = m * g, Fv = Gv / (n * eta);
    return {
      text: `Flaschenzug mit <b>n = ${n}</b> tragenden Strängen und Wirkungsgrad <b>η = ${F(eta)}</b>. Last <b>m = ${m} kg</b>. Welche Zugkraft ist nötig?`,
      given: [G('m', m, 'kg'), G('n', n, ''), G('η', eta, '')], vars: { m, n, eta, g },
      wanted: [W('F', 'Zugkraft F', 'N', Fv, [A(Gv / n, 'Reibung vergessen: F = G / (n · η).'), A(Gv * eta / n, 'Mit Verlusten wird die Kraft größer: durch η dividieren.')])],
      steps: [`G = ${F(Gv)} N`, `F = G / (n · η) = ${F(Gv)} / (${n} · ${F(eta)}) = ${F(Fv)} N`],
    };
  } });
ex({ id: 'rampe-maschine', topic: 'einfache-maschinen', level: 2, title: 'Schiefe Ebene als Kraftwandler',
  gen(r) {
    const Gv = r.pick([800, 1200, 2000, 3500, 5000]); const hh = r.pick([0.5, 0.8, 1, 1.2]); const l = hh * r.pick([3, 4, 5, 6]);
    const Fv = Gv * hh / l;
    return {
      text: `Ein Fass mit <b>G = ${Gv} N</b> wird über eine Rampe der Länge <b>l = ${F(l)} m</b> auf die Höhe <b>h = ${F(hh)} m</b> gerollt (reibungsfrei). Welche Kraft parallel zur Rampe ist nötig?`,
      given: [G('G', Gv, 'N'), G('l', l, 'm'), G('h', hh, 'm')], vars: { G: Gv, l, h: hh },
      wanted: [W('F', 'Kraft F', 'N', Fv, [A(Gv * l / hh, 'F · l = G · h ⇒ F = G · h / l (kleiner als G).')])],
      steps: [`Goldene Regel: F · l = G · h`, `F = G · h / l = ${Gv} · ${F(hh)} / ${F(l)} = ${F(Fv)} N`, `Probe: sin α = h/l = ${F(hh / l, 3)} ⇒ F = G · sin α ✓`],
    };
  } });

// ---------------------------------------------------------------- Arbeit, Leistung
ex({ id: 'hubarbeit', topic: 'arbeit-leistung', level: 1, title: 'Hubarbeit',
  gen(r) {
    const m = r.pick([50, 120, 300, 500, 800, 1500]); const hh = r.pick([2, 3.5, 5, 8, 12]);
    const Wv = m * g * hh;
    return {
      text: `Ein Kran hebt <b>m = ${m} kg</b> um <b>h = ${F(hh)} m</b>. Welche Arbeit wird verrichtet (in kJ)?`,
      given: [G('m', m, 'kg'), G('h', hh, 'm')], vars: { m, h: hh, g },
      wanted: [W('W', 'Arbeit W', 'kJ', Wv / 1000, [A(Wv, 'Ergebnis in kJ verlangt (÷ 1000).'), A(m * hh / 1000, 'W = m · g · h, g vergessen.')])],
      steps: [`W = F · s = m · g · h`, `W = ${m} · 9,81 · ${F(hh)} = ${F(Wv)} J = ${F(Wv / 1000)} kJ`],
    };
  } });
ex({ id: 'leistung', topic: 'arbeit-leistung', level: 1, title: 'Leistung aus Kraft und Geschwindigkeit',
  gen(r) {
    const Fv = r.pick([200, 450, 800, 1200, 2500]); const v = r.pick([0.5, 0.8, 1.2, 1.5, 2, 3]);
    const P = Fv * v;
    return {
      text: `Ein Förderband zieht mit <b>F = ${Fv} N</b> bei einer Geschwindigkeit von <b>v = ${F(v)} m/s</b>. Welche Leistung ist dafür nötig?`,
      given: [G('F', Fv, 'N'), G('v', v, 'm/s')], vars: { F: Fv, v },
      wanted: [W('P', 'Leistung P', 'W', P, [A(Fv / v, 'P = F · v (multiplizieren).')])],
      steps: [`P = W / t = F · s / t = F · v`, `P = ${Fv} · ${F(v)} = ${F(P)} W${P >= 1000 ? ` = ${F(P / 1000)} kW` : ''}`],
    };
  } });
ex({ id: 'drehleistung', topic: 'arbeit-leistung', level: 2, title: 'Leistung aus Drehmoment und Drehzahl',
  gen(r) {
    const M = r.pick([12, 25, 50, 80, 120, 250]); const n = r.pick([750, 960, 1450, 2900, 3000]);
    const P = 2 * Math.PI * (n / 60) * M;
    return {
      text: `Ein Motor liefert <b>M = ${M} Nm</b> bei <b>n = ${n} 1/min</b>. Welche Leistung gibt er ab (in kW)?`,
      given: [G('M', M, 'Nm'), G('n', n, '1/min')], vars: { M, n },
      wanted: [W('P', 'Leistung P', 'kW', P / 1000, [A(2 * Math.PI * n * M / 1000, 'n in 1/s einsetzen (÷ 60) oder Faustformel M·n/9550.'), A(P, 'Ergebnis in kW (÷ 1000).'), A(M * n / 1000, '2π vergessen: P = 2π · n · M.')])],
      steps: [`ω = 2π · n = 2π · ${n}/60 = ${F(2 * Math.PI * n / 60)} 1/s`, `P = M · ω = ${M} · ${F(2 * Math.PI * n / 60)} = ${F(P)} W = ${F(P / 1000)} kW`, `Faustformel: P = M · n / 9550 = ${M} · ${n} / 9550 = ${F(M * n / 9550)} kW ✓`],
    };
  } });
ex({ id: 'wirkungsgrad', topic: 'arbeit-leistung', level: 2, title: 'Wirkungsgrad',
  gen(r) {
    const Pab = r.pick([1.5, 3, 4, 5.5, 7.5, 11]); const eta = r.pick([0.75, 0.8, 0.85, 0.9]);
    const Pzu = Pab / eta;
    return {
      text: `Eine Pumpe gibt <b>P_ab = ${F(Pab)} kW</b> ab, der Wirkungsgrad des Antriebs beträgt <b>η = ${F(eta)}</b>. Welche Leistung muss zugeführt werden, und wie groß ist die Verlustleistung?`,
      given: [G('P_ab', Pab, 'kW'), G('η', eta, '')], vars: { Pab, eta },
      wanted: [W('Pzu', 'P_zu', 'kW', Pzu, [A(Pab * eta, 'Zugeführte Leistung ist größer: P_zu = P_ab / η.')]), W('Pv', 'Verlustleistung', 'kW', Pzu - Pab, [A(Pab * (1 - eta), 'Verlust = P_zu − P_ab, mit P_zu = P_ab / η.')])],
      steps: [`η = P_ab / P_zu ⇒ P_zu = P_ab / η = ${F(Pab)} / ${F(eta)} = ${F(Pzu)} kW`, `P_V = P_zu − P_ab = ${F(Pzu - Pab)} kW`],
    };
  } });
ex({ id: 'aufzug', topic: 'arbeit-leistung', level: 3, title: 'Aufzugmotor auslegen',
  gen(r) {
    const m = r.pick([400, 630, 800, 1000, 1250]); const hh = r.pick([9, 12, 15, 20]); const t = r.pick([10, 15, 20, 25]); const eta = r.pick([0.7, 0.75, 0.8, 0.85]);
    const Wv = m * g * hh, Pn = Wv / t, Pz = Pn / eta;
    return {
      text: `Ein Aufzug hebt <b>m = ${m} kg</b> in <b>t = ${t} s</b> um <b>h = ${hh} m</b>. Gesamtwirkungsgrad <b>η = ${F(eta)}</b>. Berechne Hubarbeit, Nutzleistung und die nötige Motorleistung (kW).`,
      given: [G('m', m, 'kg'), G('h', hh, 'm'), G('t', t, 's'), G('η', eta, '')], vars: { m, h: hh, t, eta, g },
      wanted: [W('W', 'Hubarbeit W', 'kJ', Wv / 1000, [A(Wv, 'kJ verlangt.')]), W('Pn', 'Nutzleistung', 'kW', Pn / 1000, [A(Pn, 'kW verlangt.')]), W('Pm', 'Motorleistung', 'kW', Pz / 1000, [A(Pn * eta / 1000, 'P_zu = P_nutz / η.')])],
      steps: [`W = m·g·h = ${m}·9,81·${hh} = ${F(Wv)} J = ${F(Wv / 1000)} kJ`, `P_nutz = W / t = ${F(Wv)} / ${t} = ${F(Pn)} W = ${F(Pn / 1000)} kW`, `P_Motor = P_nutz / η = ${F(Pn / 1000)} / ${F(eta)} = ${F(Pz / 1000)} kW`],
    };
  } });

// ---------------------------------------------------------------- Energie
ex({ id: 'epot', topic: 'energie', level: 1, title: 'Lageenergie',
  gen(r) {
    const m = r.pick([2, 15, 40, 250, 600]); const hh = r.pick([1.5, 3, 6, 10, 25]);
    return {
      text: `Welche Lageenergie hat ein Körper mit <b>m = ${m} kg</b> in <b>h = ${F(hh)} m</b> Höhe?`,
      given: [G('m', m, 'kg'), G('h', hh, 'm')], vars: { m, h: hh, g },
      wanted: [W('E', 'E_pot', 'J', m * g * hh, [A(m * hh, 'g vergessen: E = m · g · h.')])],
      steps: [`E_pot = m · g · h = ${m} · 9,81 · ${F(hh)} = ${F(m * g * hh)} J`],
    };
  } });
ex({ id: 'ekin', topic: 'energie', level: 1, title: 'Bewegungsenergie',
  gen(r) {
    const m = r.pick([900, 1200, 1500, 2000, 7500]); const vk = r.pick([36, 50, 72, 90, 108, 130]);
    const v = vk / 3.6, E = 0.5 * m * v * v;
    return {
      text: `Ein Fahrzeug mit <b>m = ${m} kg</b> fährt <b>${vk} km/h</b>. Wie groß ist seine Bewegungsenergie (in kJ)?`,
      given: [G('m', m, 'kg'), G('v', vk, 'km/h')], vars: { m, v, vkmh: vk },
      wanted: [W('E', 'E_kin', 'kJ', E / 1000, [A(0.5 * m * vk * vk / 1000, 'km/h in m/s umrechnen (÷ 3,6).'), A(m * v * v / 1000, 'Die ½ fehlt.'), A(E, 'kJ verlangt.')])],
      steps: [`v = ${vk} / 3,6 = ${F(v)} m/s`, `E_kin = ½ · m · v² = 0,5 · ${m} · ${F(v)}² = ${F(E)} J = ${F(E / 1000)} kJ`],
    };
  } });
ex({ id: 'fall', topic: 'energie', level: 2, title: 'Auftreffgeschwindigkeit aus der Höhe',
  gen(r) {
    const hh = r.pick([1.2, 1.8, 2.5, 4, 5, 8, 12]);
    const v = Math.sqrt(2 * g * hh);
    return {
      text: `Ein Fallhammer fällt aus <b>h = ${F(hh)} m</b> Höhe (ohne Reibung). Mit welcher Geschwindigkeit trifft er auf?`,
      given: [G('h', hh, 'm')], vars: { h: hh, g },
      wanted: [W('v', 'v', 'm/s', v, [A(Math.sqrt(g * hh), 'Faktor 2 vergessen: v = √(2·g·h).'), A(2 * g * hh, 'Wurzel vergessen.')])],
      steps: [`Energieerhaltung: m·g·h = ½·m·v² ⇒ v = √(2·g·h)`, `v = √(2 · 9,81 · ${F(hh)}) = ${F(v)} m/s (unabhängig von der Masse)`],
    };
  } });
ex({ id: 'bremsweg', topic: 'energie', level: 3, title: 'Bremsweg aus der Energie',
  gen(r) {
    const vk = r.pick([30, 50, 70, 90, 100, 130]); const mu = r.pick([0.3, 0.5, 0.7, 0.8]);
    const v = vk / 3.6, s = v * v / (2 * mu * g);
    return {
      text: `Ein Fahrzeug fährt <b>${vk} km/h</b>. Zwischen Reifen und Straße gilt <b>μ = ${F(mu)}</b>. Wie lang ist der Bremsweg (Vollbremsung, Reibungsarbeit = Bewegungsenergie)?`,
      given: [G('v', vk, 'km/h'), G('μ', mu, '')], vars: { v, vkmh: vk, mu, g },
      wanted: [W('s', 'Bremsweg s', 'm', s, [A(vk * vk / (2 * mu * g), 'km/h → m/s (÷ 3,6).'), A(v * v / (mu * g), 'Faktor 2 aus ½·m·v² fehlt.'), A(v / (mu * g), 'v geht quadratisch ein.')])],
      steps: [`v = ${vk} / 3,6 = ${F(v)} m/s`, `½·m·v² = FR · s = μ·m·g·s ⇒ s = v² / (2·μ·g)`, `s = ${F(v)}² / (2 · ${F(mu)} · 9,81) = ${F(s)} m`],
    };
  } });

export const EXERCISES = EX;
export function exercisesFor(topicId, level = null) {
  return EX.filter((e) => e.topic === topicId && (level === null || e.level === level));
}
/** Aufgabe für Thema und Stufe erzeugen. Fällt auf Nachbarstufen zurück, wenn es keine passende gibt. */
export function makeExercise(topicId, level, seed, excludeId = null) {
  let pool = exercisesFor(topicId, level);
  if (!pool.length) pool = exercisesFor(topicId, level - 1);
  if (!pool.length) pool = exercisesFor(topicId, level + 1);
  if (!pool.length) pool = exercisesFor(topicId);
  if (!pool.length) return null;
  const rng = makeRng(seed);
  let candidates = pool.filter((e) => e.id !== excludeId);
  if (!candidates.length) candidates = pool;
  const def = rng.pick(candidates);
  const data = def.gen(rng);
  return { ...data, id: def.id, seed, topic: def.topic, level: def.level, title: data.title || def.title };
}
