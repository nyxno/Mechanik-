// Berechnet den nächsten Termin und die Ampelfarbe eines Eintrags.
import { IsoDatum, aufWerktag, formatDeutsch, tageZwischen } from './datum';
import { Intervall, intervallAddieren, intervallInTagen } from './intervall';

export type Status = 'ueberfaellig' | 'bald' | 'ok' | 'nie' | 'erledigt';

export interface Faelligkeit {
  status: Status;
  /** Nächster Termin (schon auf Werktag verschoben), null wenn keiner. */
  naechster: IsoDatum | null;
  /** Termin vor der Wochenend-Verschiebung (nur gesetzt, wenn verschoben wurde). */
  verschobenVon: IsoDatum | null;
  /** Tage bis zum Termin (negativ = überfällig). null wenn kein Termin. */
  tage: number | null;
  /** Kurztext für die Anzeige, z. B. "Fällig in 12 Tagen" oder "5 Tage überfällig". */
  text: string;
}

export interface TerminDaten {
  letzte: IsoDatum | null;
  intervall: Intervall;
  festerTermin?: IsoDatum | null;
  einmalig?: boolean;
}

/** Standard: ab so vielen Tagen vor dem Termin wird es gelb. */
export const WARNUNG_TAGE_STANDARD = 14;

/**
 * Vorwarnzeit für Gelb: höchstens WARNUNG_TAGE_STANDARD, bei kurzen Intervallen ein Drittel des Intervalls
 * (sonst wäre eine wöchentliche Prüfung immer gelb).
 */
export function warnTage(intervall: Intervall, standard = WARNUNG_TAGE_STANDARD): number {
  const drittel = Math.floor(intervallInTagen(intervall) / 3);
  return Math.max(1, Math.min(standard, drittel));
}

/** Ein einmaliger Eintrag ist erledigt, sobald er einmal durchgeführt wurde. */
export function istErledigt(t: TerminDaten): boolean {
  return !!t.einmalig && !!t.letzte;
}

/**
 * Termin vor der Wochenend-Regel: fester Termin hat Vorrang, sonst letzte Durchführung + Intervall.
 * Einmalige Einträge haben nur den festen Termin.
 */
export function rohTermin(t: TerminDaten): IsoDatum | null {
  if (istErledigt(t)) return null;
  if (t.festerTermin) return t.festerTermin;
  if (t.einmalig) return null;
  if (t.letzte) return intervallAddieren(t.letzte, t.intervall);
  return null;
}

/** Nächster Termin mit Wochenend-Regel (Sa -> Fr, So -> Mo). */
export function naechsterTermin(t: TerminDaten): IsoDatum | null {
  const roh = rohTermin(t);
  return roh ? aufWerktag(roh) : null;
}

export function berechneFaelligkeit(t: TerminDaten, heuteIso: IsoDatum, warnStandard = WARNUNG_TAGE_STANDARD): Faelligkeit {
  if (istErledigt(t)) {
    return { status: 'erledigt', naechster: null, verschobenVon: null, tage: null, text: `Erledigt am ${formatDeutsch(t.letzte!)}` };
  }
  const roh = rohTermin(t);
  if (!roh) {
    return { status: 'nie', naechster: null, verschobenVon: null, tage: null, text: t.einmalig ? 'Kein Termin eingetragen' : 'Noch nie durchgeführt' };
  }
  const naechster = aufWerktag(roh);
  const tage = tageZwischen(heuteIso, naechster);
  const warn = t.einmalig ? warnStandard : warnTage(t.intervall, warnStandard);
  let status: Status;
  if (tage < 0) status = 'ueberfaellig';
  else if (tage <= warn) status = 'bald';
  else status = 'ok';

  let text: string;
  if (tage < 0) text = tage === -1 ? '1 Tag überfällig' : `${-tage} Tage überfällig`;
  else if (tage === 0) text = 'Heute fällig';
  else if (tage === 1) text = 'Morgen fällig';
  else text = `Fällig in ${tage} Tagen (${formatDeutsch(naechster)})`;

  return { status, naechster, verschobenVon: roh !== naechster ? roh : null, tage, text };
}

/** Sortierreihenfolge der Übersicht: dringendstes zuerst. */
export function sortierWert(f: Faelligkeit): number {
  // "nie" kommt ganz oben (muss erstmals gemacht werden), danach nach Tagen aufsteigend.
  if (f.tage === null) return Number.NEGATIVE_INFINITY;
  return f.tage;
}
