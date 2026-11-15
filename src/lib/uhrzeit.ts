// Uhrzeiten werden als Text "HH:MM" gespeichert, z. B. "07:30".

export const STANDARD_UHRZEIT = '07:00';

export function istGueltigeUhrzeit(text: string | null | undefined): text is string {
  if (!text) return false;
  const m = text.match(/^(\d{2}):(\d{2})$/);
  return !!m && Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

export function uhrzeitAusDate(d: Date): string {
  const z = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${z(d.getHours())}:${z(d.getMinutes())}`;
}

/** Datum ("JJJJ-MM-TT") + Uhrzeit ("HH:MM") -> Date (lokale Zeit). */
export function zeitpunkt(isoDatum: string, uhrzeit: string): Date {
  const [j, m, t] = isoDatum.split('-').map(Number);
  const [h, min] = (istGueltigeUhrzeit(uhrzeit) ? uhrzeit : STANDARD_UHRZEIT).split(':').map(Number);
  return new Date(j, m - 1, t, h, min, 0, 0);
}
