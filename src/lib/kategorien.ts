// Kategorien mit Unterkategorien (eine Ebene): Reihenfolge und Zugehörigkeit.
export interface KatKnoten { id: string; eltern_id: string | null; sortierung: number; name: string }

/** Hauptkategorien in ihrer Reihenfolge, jeweils direkt gefolgt von ihren Unterkategorien. */
export function alsBaum<T extends KatKnoten>(liste: T[]): (T & { ebene: 0 | 1 })[] {
  const ids = new Set(liste.map((k) => k.id));
  const sortiert = (l: T[]) => [...l].sort((a, b) => a.sortierung - b.sortierung || a.name.localeCompare(b.name, 'de'));
  // Unterkategorie, deren Hauptkategorie fehlt, wird wie eine Hauptkategorie behandelt
  const haupt = sortiert(liste.filter((k) => !k.eltern_id || !ids.has(k.eltern_id)));
  const ergebnis: (T & { ebene: 0 | 1 })[] = [];
  for (const h of haupt) {
    ergebnis.push({ ...h, ebene: 0 });
    for (const u of sortiert(liste.filter((k) => k.eltern_id === h.id))) ergebnis.push({ ...u, ebene: 1 });
  }
  return ergebnis;
}

/** Ids einer Kategorie samt ihrer Unterkategorien (für den Filter). */
export function mitUnterkategorien(id: string, liste: KatKnoten[]): Set<string> {
  return new Set([id, ...liste.filter((k) => k.eltern_id === id).map((k) => k.id)]);
}

/** Geschwister (gleiche Hauptkategorie bzw. alle Hauptkategorien) – für ▲ ▼. */
export function geschwister<T extends KatKnoten>(id: string, liste: T[]): T[] {
  const k = liste.find((x) => x.id === id);
  if (!k) return [];
  return liste.filter((x) => (x.eltern_id ?? null) === (k.eltern_id ?? null))
    .sort((a, b) => a.sortierung - b.sortierung || a.name.localeCompare(b.name, 'de'));
}
