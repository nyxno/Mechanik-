// Monatsstatistik: Zulagenstunden (Hitze/Staub), erledigte Arbeiten, wo am meisten, Vergleich zum Vormonat.
import { IsoDatum, ausDate, plusTage, wochentag } from './datum';
import { monatsGrenzen } from './kalender';
import { zeitpunkt } from './uhrzeit';

export interface StatZeile {
  datum: IsoDatum;
  eintragId: string;
  name: string;
  kategorieId: string;
  kategorieName: string;
  farbe: string | null;
  ergebnis: 'ok' | 'maengel' | 'ausser_betrieb';
  hitze: number;
  staub: number;
}

export interface Rangplatz { id: string; name: string; farbe: string | null; hitze: number; staub: number; stunden: number; arbeiten: number }

export interface MonatsStatistik {
  hitze: number;
  staub: number;
  stunden: number;          // Hitze + Staub
  arbeiten: number;         // erledigte Durchführungen
  arbeitstage: number;      // Tage mit mindestens einer Durchführung
  tageHitze: number;
  tageStaub: number;
  ergebnisse: { ok: number; maengel: number; ausser_betrieb: number };
  proEintrag: Rangplatz[];  // sortiert nach Stunden, dann Arbeiten
  proGebiet: Rangplatz[];
  proWochentag: number[];   // Index 0 = Montag … 6 = Sonntag (Anzahl Arbeiten)
  proTag: { datum: IsoDatum; hitze: number; staub: number; arbeiten: number }[]; // nur Tage mit Einträgen
  staerksterTag: { datum: IsoDatum; stunden: number } | null;
}

const runden = (n: number) => Math.round(n * 100) / 100;

function rangliste(zeilen: StatZeile[], schluessel: (z: StatZeile) => { id: string; name: string; farbe: string | null }): Rangplatz[] {
  const m = new Map<string, Rangplatz>();
  for (const z of zeilen) {
    const k = schluessel(z);
    const r = m.get(k.id) ?? { ...k, hitze: 0, staub: 0, stunden: 0, arbeiten: 0 };
    r.hitze += z.hitze; r.staub += z.staub; r.stunden += z.hitze + z.staub; r.arbeiten += 1;
    m.set(k.id, r);
  }
  return [...m.values()]
    .map((r) => ({ ...r, hitze: runden(r.hitze), staub: runden(r.staub), stunden: runden(r.stunden) }))
    .sort((a, b) => b.stunden - a.stunden || b.arbeiten - a.arbeiten || a.name.localeCompare(b.name, 'de'));
}

export function monatsStatistik(zeilen: StatZeile[]): MonatsStatistik {
  const proTagMap = new Map<IsoDatum, { datum: IsoDatum; hitze: number; staub: number; arbeiten: number }>();
  const ergebnisse = { ok: 0, maengel: 0, ausser_betrieb: 0 };
  const proWochentag = [0, 0, 0, 0, 0, 0, 0];
  let hitze = 0, staub = 0;
  for (const z of zeilen) {
    hitze += z.hitze; staub += z.staub;
    ergebnisse[z.ergebnis]++;
    proWochentag[(wochentag(z.datum) + 6) % 7]++;
    const t = proTagMap.get(z.datum) ?? { datum: z.datum, hitze: 0, staub: 0, arbeiten: 0 };
    t.hitze += z.hitze; t.staub += z.staub; t.arbeiten++;
    proTagMap.set(z.datum, t);
  }
  const proTag = [...proTagMap.values()].sort((a, b) => a.datum.localeCompare(b.datum))
    .map((t) => ({ ...t, hitze: runden(t.hitze), staub: runden(t.staub) }));
  const staerkster = [...proTag].sort((a, b) => (b.hitze + b.staub) - (a.hitze + a.staub))[0];
  return {
    hitze: runden(hitze),
    staub: runden(staub),
    stunden: runden(hitze + staub),
    arbeiten: zeilen.length,
    arbeitstage: proTag.length,
    tageHitze: proTag.filter((t) => t.hitze > 0).length,
    tageStaub: proTag.filter((t) => t.staub > 0).length,
    ergebnisse,
    proEintrag: rangliste(zeilen, (z) => ({ id: z.eintragId, name: z.name, farbe: z.farbe })),
    proGebiet: rangliste(zeilen, (z) => ({ id: z.kategorieId, name: z.kategorieName, farbe: z.farbe })),
    proWochentag,
    proTag,
    staerksterTag: staerkster && staerkster.hitze + staerkster.staub > 0 ? { datum: staerkster.datum, stunden: runden(staerkster.hitze + staerkster.staub) } : null,
  };
}

/** Tag der Monatsübersicht: letzter Tag des Monats; Samstag oder Sonntag -> Freitag davor. */
export function monatsabschlussTag(jahr: number, monat: number): IsoDatum {
  let d = monatsGrenzen(jahr, monat).bis;
  while (wochentag(d) === 6 || wochentag(d) === 0) d = plusTage(d, -1);
  return d;
}

/** Uhrzeit der automatischen Monatsübersicht (nach Feierabend). */
export const STATISTIK_UHRZEIT = '15:00';

/** Nächster Zeitpunkt für die Monatsübersicht ab jetzt (dieser Monat, sonst nächster). */
export function naechsteStatistik(jetzt: Date): { wann: Date; jahr: number; monat: number } {
  for (let i = 0; i < 2; i++) {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth() + i, 1);
    const wann = zeitpunkt(monatsabschlussTag(d.getFullYear(), d.getMonth()), STATISTIK_UHRZEIT);
    if (wann > jetzt) return { wann, jahr: d.getFullYear(), monat: d.getMonth() };
  }
  const d = new Date(jetzt.getFullYear(), jetzt.getMonth() + 2, 1);
  return { wann: zeitpunkt(monatsabschlussTag(d.getFullYear(), d.getMonth()), STATISTIK_UHRZEIT), jahr: d.getFullYear(), monat: d.getMonth() };
}

/** "2026-11" */
export const monatsSchluessel = (jahr: number, monat: number) => ausDate(new Date(jahr, monat, 1)).slice(0, 7);

/**
 * Soll die Übersicht beim Öffnen der App automatisch erscheinen? Ja, wenn der Abschlusstag (ab 15 Uhr) erreicht ist
 * und dieser Monat noch nicht gezeigt wurde – oder in den ersten 7 Tagen eines Monats für den Vormonat.
 */
export function automatischZeigen(jetzt: Date, zuletztGezeigt: string | null): { jahr: number; monat: number } | null {
  const j = jetzt.getFullYear(), m = jetzt.getMonth();
  const abschluss = zeitpunkt(monatsabschlussTag(j, m), STATISTIK_UHRZEIT);
  if (jetzt >= abschluss && zuletztGezeigt !== monatsSchluessel(j, m)) return { jahr: j, monat: m };
  const vor = new Date(j, m - 1, 1);
  const vorSchluessel = monatsSchluessel(vor.getFullYear(), vor.getMonth());
  if (jetzt.getDate() <= 7 && (zuletztGezeigt ?? '') < vorSchluessel) return { jahr: vor.getFullYear(), monat: vor.getMonth() };
  return null;
}

/** Zahl als Stunden-Text: "3,5 h". */
export function stundenText(n: number): string {
  return `${n.toLocaleString('de-DE', { maximumFractionDigits: 2 })} h`;
}
