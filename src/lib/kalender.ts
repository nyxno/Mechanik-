// Kalender: an welchen Tagen eines Monats welche Arbeiten anstehen.
// Wiederkehrende Arbeiten werden in die Zukunft fortgeschrieben (z. B. monatlich -> jeden Monat).
import { IsoDatum, aufWerktag, ausDate, montagDerWoche, plusTage } from './datum';
import { rohTermin, TerminDaten } from './faelligkeit';
import { intervallAddieren } from './intervall';

export interface KalenderEintrag extends TerminDaten { id: string }
export interface KalenderTermin { id: string; ueberfaellig: boolean }

/** Erster und letzter Tag eines Monats (monat 0–11). */
export function monatsGrenzen(jahr: number, monat: number): { von: IsoDatum; bis: IsoDatum } {
  return { von: ausDate(new Date(jahr, monat, 1)), bis: ausDate(new Date(jahr, monat + 1, 0)) };
}

/** 42 Tage (6 Wochen, Montag zuerst) für das Monatsraster. */
export function monatsRaster(jahr: number, monat: number): IsoDatum[] {
  const start = montagDerWoche(monatsGrenzen(jahr, monat).von);
  return Array.from({ length: 42 }, (_, i) => plusTage(start, i));
}

/** Alle Termine im Bereich von–bis, als Map Datum -> Termine. */
export function termineImBereich(eintraege: KalenderEintrag[], von: IsoDatum, bis: IsoDatum, heuteIso: IsoDatum): Map<IsoDatum, KalenderTermin[]> {
  const karte = new Map<IsoDatum, KalenderTermin[]>();
  const add = (tag: IsoDatum, t: KalenderTermin) => {
    if (tag < von || tag > bis) return;
    const l = karte.get(tag) ?? [];
    if (!l.some((x) => x.id === t.id)) l.push(t);
    karte.set(tag, l);
  };
  for (const e of eintraege) {
    const roh = rohTermin(e);
    if (!roh) continue;
    const erster = aufWerktag(roh);
    if (erster < heuteIso) add(erster, { id: e.id, ueberfaellig: true });
    // Wiederholungen ab dem Termin: roh + n × Intervall (immer vom Ausgangsdatum, damit sich nichts verschiebt)
    for (let n = 0; n < 500; n++) {
      if (n > 0 && e.einmalig) break;
      const r = n === 0 ? roh : intervallAddieren(roh, { wert: e.intervall.wert * n, einheit: e.intervall.einheit });
      const tag = aufWerktag(r);
      if (tag > bis) break;
      if (tag >= heuteIso) add(tag, { id: e.id, ueberfaellig: false });
    }
  }
  return karte;
}
