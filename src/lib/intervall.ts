// Ein Intervall besteht aus einer Zahl und einer Einheit, z. B. 3 Monate.
import { IsoDatum, plusMonate, plusTage } from './datum';

export type IntervallEinheit = 'tage' | 'wochen' | 'monate' | 'jahre';

export interface Intervall {
  wert: number;
  einheit: IntervallEinheit;
}

export const EINHEITEN: { key: IntervallEinheit; einzahl: string; mehrzahl: string }[] = [
  { key: 'tage', einzahl: 'Tag', mehrzahl: 'Tage' },
  { key: 'wochen', einzahl: 'Woche', mehrzahl: 'Wochen' },
  { key: 'monate', einzahl: 'Monat', mehrzahl: 'Monate' },
  { key: 'jahre', einzahl: 'Jahr', mehrzahl: 'Jahre' },
];

/** Schnellauswahl für häufige Intervalle. */
export const INTERVALL_VORLAGEN: { label: string; intervall: Intervall }[] = [
  { label: 'Wöchentlich', intervall: { wert: 1, einheit: 'wochen' } },
  { label: 'Monatlich', intervall: { wert: 1, einheit: 'monate' } },
  { label: 'Alle 3 Monate', intervall: { wert: 3, einheit: 'monate' } },
  { label: 'Halbjährlich', intervall: { wert: 6, einheit: 'monate' } },
  { label: 'Jährlich', intervall: { wert: 1, einheit: 'jahre' } },
  { label: 'Alle 2 Jahre', intervall: { wert: 2, einheit: 'jahre' } },
];

/** Text wie "alle 3 Monate" oder "jährlich". */
export function intervallText(i: Intervall): string {
  const e = EINHEITEN.find((x) => x.key === i.einheit)!;
  if (i.wert === 1) {
    switch (i.einheit) {
      case 'tage': return 'täglich';
      case 'wochen': return 'wöchentlich';
      case 'monate': return 'monatlich';
      case 'jahre': return 'jährlich';
    }
  }
  return `alle ${i.wert} ${e.mehrzahl}`;
}

/** Ungefähre Länge des Intervalls in Tagen (für die Gelb-Warnung). */
export function intervallInTagen(i: Intervall): number {
  switch (i.einheit) {
    case 'tage': return i.wert;
    case 'wochen': return i.wert * 7;
    case 'monate': return Math.round(i.wert * 30.44);
    case 'jahre': return Math.round(i.wert * 365.25);
  }
}

/** Datum + Intervall. */
export function intervallAddieren(datum: IsoDatum, i: Intervall): IsoDatum {
  switch (i.einheit) {
    case 'tage': return plusTage(datum, i.wert);
    case 'wochen': return plusTage(datum, i.wert * 7);
    case 'monate': return plusMonate(datum, i.wert);
    case 'jahre': return plusMonate(datum, i.wert * 12);
  }
}

export function istGueltigesIntervall(i: Intervall): boolean {
  return Number.isInteger(i.wert) && i.wert >= 1 && i.wert <= 1000 && EINHEITEN.some((e) => e.key === i.einheit);
}
