// Deterministischer Zufall (Mulberry32), damit eine Aufgabe über ihren Seed reproduzierbar ist.
export function makeRng(seed) {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next: rnd,
    /** ganze Zahl in [min, max], optional in Schritten */
    int(min, max, step = 1) {
      const n = Math.floor((max - min) / step);
      return min + step * Math.floor(rnd() * (n + 1));
    },
    pick(arr) { return arr[Math.floor(rnd() * arr.length)]; },
    /** Gleitkommazahl mit festen Nachkommastellen */
    num(min, max, decimals = 1) {
      const f = Math.pow(10, decimals);
      return Math.round((min + rnd() * (max - min)) * f) / f;
    },
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}
