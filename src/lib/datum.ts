// Hilfsfunktionen für Datumswerte.
// Alle Datumsangaben in der Datenbank sind Text im Format "JJJJ-MM-TT" (ISO), z. B. "2026-11-15".
// So lassen sie sich einfach sortieren und vergleichen.

export type IsoDatum = string; // "JJJJ-MM-TT"

function zweistellig(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Heutiges Datum als ISO-Text (lokale Zeitzone). */
export function heute(): IsoDatum {
  return ausDate(new Date());
}

/** Date-Objekt -> "JJJJ-MM-TT" (lokale Zeitzone). */
export function ausDate(d: Date): IsoDatum {
  return `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}`;
}

/** "JJJJ-MM-TT" -> Date-Objekt (Mitternacht, lokale Zeit). */
export function zuDate(iso: IsoDatum): Date {
  const [j, m, t] = iso.split('-').map(Number);
  return new Date(j, m - 1, t);
}

/** Prüft, ob ein Text ein gültiges ISO-Datum ist. */
export function istGueltigesIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = zuDate(iso);
  return !isNaN(d.getTime()) && ausDate(d) === iso;
}

/** "JJJJ-MM-TT" -> "TT.MM.JJJJ" für die Anzeige. */
export function formatDeutsch(iso: IsoDatum): string {
  if (!istGueltigesIso(iso)) return iso;
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

/** "TT.MM.JJJJ" (auch "1.2.2026") -> "JJJJ-MM-TT" oder null, wenn ungültig. */
export function parseDeutsch(text: string): IsoDatum | null {
  const m = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${zweistellig(Number(m[2]))}-${zweistellig(Number(m[1]))}`;
  return istGueltigesIso(iso) ? iso : null;
}

/** Tage addieren. */
export function plusTage(iso: IsoDatum, tage: number): IsoDatum {
  const d = zuDate(iso);
  d.setDate(d.getDate() + tage);
  return ausDate(d);
}

/**
 * Monate addieren. Wenn der Zieltag nicht existiert (z. B. 31. Februar),
 * wird der letzte Tag des Zielmonats genommen.
 */
export function plusMonate(iso: IsoDatum, monate: number): IsoDatum {
  const d = zuDate(iso);
  const tag = d.getDate();
  const ziel = new Date(d.getFullYear(), d.getMonth() + monate, 1);
  const letzterTag = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate();
  ziel.setDate(Math.min(tag, letzterTag));
  return ausDate(ziel);
}

/** Differenz in ganzen Tagen: b - a. */
export function tageZwischen(a: IsoDatum, b: IsoDatum): number {
  const ms = zuDate(b).getTime() - zuDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Aktueller Zeitstempel für created_at / updated_at. */
export function jetztIso(): string {
  return new Date().toISOString();
}
