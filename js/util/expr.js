// Kleiner, sicherer Formel-Rechner für Eingaben wie "F*cos(30)" oder "FG/2 / sin(alpha)".
// Winkelfunktionen rechnen in GRAD (wie am Taschenrechner im DEG-Modus).
// Kein eval: eigener Tokenizer + Parser (Rekursiver Abstieg).

const FUNCS = {
  sin: (x) => Math.sin(rad(x)),
  cos: (x) => Math.cos(rad(x)),
  tan: (x) => Math.tan(rad(x)),
  asin: (x) => deg(Math.asin(x)),
  acos: (x) => deg(Math.acos(x)),
  atan: (x) => deg(Math.atan(x)),
  arcsin: (x) => deg(Math.asin(x)),
  arccos: (x) => deg(Math.acos(x)),
  arctan: (x) => deg(Math.atan(x)),
  sqrt: (x) => Math.sqrt(x),
  wurzel: (x) => Math.sqrt(x),
  abs: (x) => Math.abs(x),
  round: (x) => Math.round(x),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
};
const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, g: 9.81 };

function rad(d) { return (d * Math.PI) / 180; }
function deg(r) { return (r * 180) / Math.PI; }

export class ExprError extends Error {}

function tokenize(src) {
  const s = src.replace(/,/g, '.').replace(/·|×/g, '*').replace(/÷|:/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/°/g, '');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      if (/[eE]/.test(s[j] || '') && /[0-9+-]/.test(s[j + 1] || '')) {
        j++; if (/[+-]/.test(s[j])) j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      out.push({ t: 'num', v: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-zÄÖÜäöüß_πα-ω]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9ÄÖÜäöüß_πα-ω']/.test(s[j])) j++;
      out.push({ t: 'id', v: s.slice(i, j) });
      i = j; continue;
    }
    if ('+-*/^()'.includes(c)) { out.push({ t: c }); i++; continue; }
    throw new ExprError(`Unbekanntes Zeichen „${c}“ in der Formel.`);
  }
  return out;
}

/**
 * Berechnet einen Formelausdruck.
 * @param {string} src  z. B. "F * cos(alpha)"
 * @param {Record<string, number>} vars  Variablen, z. B. {F: 100, alpha: 30}
 * @returns {number}
 */
export function evaluate(src, vars = {}) {
  if (!src || !src.trim()) throw new ExprError('Bitte eine Formel eingeben.');
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const lookup = (name) => {
    if (name in vars && Number.isFinite(vars[name])) return vars[name];
    const lower = name.toLowerCase();
    for (const k of Object.keys(vars)) if (k.toLowerCase() === lower) return vars[k];
    if (lower in CONSTS) return CONSTS[lower];
    throw new ExprError(`Unbekannte Größe „${name}“. Verfügbar: ${Object.keys(vars).join(', ') || '–'}.`);
  };

  function parseExpr() {
    let v = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = next().t;
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    for (;;) {
      const t = peek();
      if (t && (t.t === '*' || t.t === '/')) {
        next();
        const r = parseFactor();
        if (t.t === '/' && r === 0) throw new ExprError('Division durch null.');
        v = t.t === '*' ? v * r : v / r;
      } else if (t && (t.t === '(' || t.t === 'id' || t.t === 'num')) {
        // implizite Multiplikation: 2(3+1), 2 F, F cos(30)
        const r = parseFactor();
        v = v * r;
      } else break;
    }
    return v;
  }
  function parseFactor() {
    const t = peek();
    if (!t) throw new ExprError('Die Formel endet unerwartet.');
    if (t.t === '-') { next(); return -parseFactor(); }
    if (t.t === '+') { next(); return parseFactor(); }
    let base = parsePrimary();
    if (peek() && peek().t === '^') {
      next();
      const ex = parseFactor();
      base = Math.pow(base, ex);
    }
    return base;
  }
  function parsePrimary() {
    const t = next();
    if (t.t === 'num') return t.v;
    if (t.t === '(') {
      const v = parseExpr();
      if (!peek() || peek().t !== ')') throw new ExprError('Klammer wurde nicht geschlossen.');
      next();
      return v;
    }
    if (t.t === 'id') {
      const name = t.v;
      const fn = FUNCS[name.toLowerCase()];
      if (fn) {
        if (peek() && peek().t === '(') {
          next();
          const arg = parseExpr();
          if (!peek() || peek().t !== ')') throw new ExprError(`Klammer nach ${name} nicht geschlossen.`);
          next();
          return fn(arg);
        }
        // sin 30 ohne Klammer
        const arg = parseFactor();
        return fn(arg);
      }
      return lookup(name);
    }
    throw new ExprError(`Unerwartetes Zeichen „${t.t}“.`);
  }

  const v = parseExpr();
  if (p < toks.length) throw new ExprError('Die Formel konnte nicht vollständig gelesen werden. Prüfe Klammern und Operatoren.');
  if (!Number.isFinite(v)) throw new ExprError('Das Ergebnis ist keine gültige Zahl (z. B. Wurzel aus negativer Zahl oder asin > 1).');
  return v;
}

/** Zahl hübsch formatieren (deutsches Komma, sinnvolle Stellen). */
export function fmt(v, digits) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  let d = digits;
  if (d === undefined) d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 2 : 3;
  let s = v.toFixed(d);
  if (d > 0) s = s.replace(/\.?0+$/, '');
  if (s === '-0') s = '0';
  return s.replace('.', ',');
}

/** Benutzereingabe "1.234,5" oder "1234.5" in Zahl wandeln. */
export function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return NaN;
  let s = String(str).trim().replace(/\s/g, '');
  if (/,\d+$/.test(s) && /\./.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  const v = Number(s);
  return Number.isFinite(v) ? v : NaN;
}
