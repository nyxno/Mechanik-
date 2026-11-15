// Berechnet aus letzter Durchführung + Intervall den nächsten Termin und die Ampelfarbe.
import { IsoDatum, formatDeutsch, tageZwischen } from './datum';
import { Intervall, intervallAddieren, intervallInTagen } from './intervall';

export type Status = 'ueberfaellig' | 'bald' | 'ok' | 'nie';

export interface Faelligkeit {
  status: Status;
  /** Nächster Termin, null wenn noch nie durchgeführt. */
  naechster: IsoDatum | null;
  /** Tage bis zum Termin (negativ = überfällig). null wenn noch nie durchgeführt. */
  tage: number | null;
  /** Kurztext für die Anzeige, z. B. "in 12 Tagen" oder "5 Tage überfällig". */
  text: string;
}

/** Standard: ab so vielen Tagen vor dem Termin wird es gelb. */
export const WARNUNG_TAGE_STANDARD = 14;

/**
 * Vorwarnzeit: höchstens WARNUNG_TAGE_STANDARD, bei kurzen Intervallen aber nur ein Drittel des Intervalls
 * (sonst wäre eine wöchentliche Prüfung immer gelb).
 */
export function warnTage(intervall: Intervall, standard = WARNUNG_TAGE_STANDARD): number {
  const drittel = Math.floor(intervallInTagen(intervall) / 3);
  return Math.max(1, Math.min(standard, drittel));
}

/**
 * Nächster Termin: ein fest eingegebenes Datum hat Vorrang,
 * sonst letzte Durchführung + Intervall, sonst null (noch nie gemacht, kein Termin).
 */
export function naechsterTermin(
  letzteDurchfuehrung: IsoDatum | null,
  intervall: Intervall,
  festerTermin: IsoDatum | null = null,
): IsoDatum | null {
  if (festerTermin) return festerTermin;
  if (letzteDurchfuehrung) return intervallAddieren(letzteDurchfuehrung, intervall);
  return null;
}

export function berechneFaelligkeit(
  letzteDurchfuehrung: IsoDatum | null,
  intervall: Intervall,
  heuteIso: IsoDatum,
  festerTermin: IsoDatum | null = null,
  warnStandard = WARNUNG_TAGE_STANDARD,
): Faelligkeit {
  const naechster = naechsterTermin(letzteDurchfuehrung, intervall, festerTermin);
  if (!naechster) {
    return { status: 'nie', naechster: null, tage: null, text: 'Noch nie durchgeführt' };
  }
  const tage = tageZwischen(heuteIso, naechster);
  let status: Status;
  if (tage < 0) status = 'ueberfaellig';
  else if (tage <= warnTage(intervall, warnStandard)) status = 'bald';
  else status = 'ok';

  let text: string;
  if (tage < 0) text = tage === -1 ? '1 Tag überfällig' : `${-tage} Tage überfällig`;
  else if (tage === 0) text = 'Heute fällig';
  else if (tage === 1) text = 'Morgen fällig';
  else text = `Fällig in ${tage} Tagen (${formatDeutsch(naechster)})`;

  return { status, naechster, tage, text };
}

/** Sortierreihenfolge der Übersicht: dringendstes zuerst. */
export function sortierWert(f: Faelligkeit): number {
  // "nie" kommt ganz oben (muss erstmals gemacht werden), danach nach Tagen aufsteigend.
  if (f.tage === null) return Number.NEGATIVE_INFINITY;
  return f.tage;
}
