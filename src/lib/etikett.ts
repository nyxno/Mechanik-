// Etikett lesen: aus dem erkannten Text Zeilen bilden und Bezeichnung / Artikelnummer vorschlagen.

const ARTNR = /(?:art(?:ikel)?\.?\s*-?\s*(?:nr|nummer|no)\.?|best(?:ell)?\.?\s*-?\s*(?:nr|nummer)\.?|bestellnummer|item\s*(?:no|nr)\.?|ref\.?|sku)\s*[:#.]?\s*([A-Za-z0-9][A-Za-z0-9.\-\/ ]{2,})/i;

/** Zeilen, die eine Nummer kennzeichnen (sind nie die Bezeichnung). */
const NUMMERWORT = /(art(ikel)?\.?\s*-?\s*(nr|nummer|no)|best(ell)?\.?\s*-?\s*(nr|nummer)|bestellnummer|item\s*(no|nr)|\bref\b|\bsku\b)/i;

/** Erkannte Textblöcke in einzelne, saubere Zeilen zerlegen (ohne Doppelte). */
export function zeilenAusTexten(texte: string[]): string[] {
  const gesehen = new Set<string>();
  const zeilen: string[] = [];
  for (const block of texte) {
    for (const roh of block.split(/\r?\n/)) {
      const z = roh.replace(/\s+/g, ' ').trim();
      if (z.length < 2 || gesehen.has(z.toLowerCase())) continue;
      gesehen.add(z.toLowerCase());
      zeilen.push(z);
    }
  }
  return zeilen;
}

/** Artikelnummer: Zeile mit "Art.-Nr." o. ä., sonst eine Zeile, die fast nur aus Ziffern besteht (mind. 5). */
export function artikelnummerVorschlag(zeilen: string[]): string | null {
  for (const z of zeilen) {
    const m = z.match(ARTNR);
    if (m) return m[1].trim();
  }
  for (const z of zeilen) {
    const ohne = z.replace(/[\s.\-\/]/g, '');
    if (/^\d{5,}$/.test(ohne)) return z.trim();
  }
  return null;
}

/** Bezeichnung: die erste Zeile mit mindestens 3 Buchstaben, die keine Artikelnummer ist. */
export function bezeichnungVorschlag(zeilen: string[]): string | null {
  for (const z of zeilen) {
    if (NUMMERWORT.test(z)) continue;
    if ((z.match(/[A-Za-zÄÖÜäöüß]/g) ?? []).length >= 3) return z;
  }
  return null;
}
