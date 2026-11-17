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

export const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** 0 = Sonntag … 6 = Samstag */
export function wochentag(iso: IsoDatum): number {
  return zuDate(iso).getDay();
}

/** "Mo, 17.11.2026" */
export function formatMitTag(iso: IsoDatum): string {
  return `${WOCHENTAGE_KURZ[wochentag(iso)]}, ${formatDeutsch(iso)}`;
}

/** Wochenend-Regel: Samstag -> Freitag davor, Sonntag -> Montag danach. Werktage bleiben. */
export function aufWerktag(iso: IsoDatum): IsoDatum {
  const t = wochentag(iso);
  if (t === 6) return plusTage(iso, -1);
  if (t === 0) return plusTage(iso, 1);
  return iso;
}

/** Schlummern: nächster Tag; fällt der auf Samstag oder Sonntag, dann Montag. */
export function schlummerZiel(heuteIso: IsoDatum): IsoDatum {
  let d = plusTage(heuteIso, 1);
  while (wochentag(d) === 6 || wochentag(d) === 0) d = plusTage(d, 1);
  return d;
}

/** Montag der Woche, in der das Datum liegt. */
export function montagDerWoche(iso: IsoDatum): IsoDatum {
  const t = wochentag(iso);
  return plusTage(iso, t === 0 ? -6 : 1 - t);
}

/** Heute, oder am Wochenende der nächste Montag (Standarddatum für "Einmalig"). */
export function heuteOderMontag(heuteIso: IsoDatum): IsoDatum {
  const t = wochentag(heuteIso);
  if (t === 6) return plusTage(heuteIso, 2);
  if (t === 0) return plusTage(heuteIso, 1);
  return heuteIso;
}
