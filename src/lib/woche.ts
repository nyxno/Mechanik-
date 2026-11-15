// Einteilung für die Liste "Diese Woche / Nächste Woche" (Montag bis Sonntag).
import { IsoDatum, montagDerWoche, plusTage } from './datum';
import type { Faelligkeit } from './faelligkeit';

export interface Wochen {
  dieseVon: IsoDatum; dieseBis: IsoDatum;
  naechsteVon: IsoDatum; naechsteBis: IsoDatum;
}

export function wochenGrenzen(heuteIso: IsoDatum): Wochen {
  const mo = montagDerWoche(heuteIso);
  return { dieseVon: mo, dieseBis: plusTage(mo, 6), naechsteVon: plusTage(mo, 7), naechsteBis: plusTage(mo, 13) };
}

export type WochenGruppe = 'ueberfaellig' | 'diese' | 'naechste' | null;

/** In welche Gruppe gehört ein Eintrag? null = später oder ohne Termin. */
export function wochenGruppe(f: Faelligkeit, heuteIso: IsoDatum): WochenGruppe {
  if (!f.naechster) return null;
  if (f.naechster < heuteIso) return 'ueberfaellig';
  const w = wochenGrenzen(heuteIso);
  if (f.naechster <= w.dieseBis) return 'diese';
  if (f.naechster <= w.naechsteBis) return 'naechste';
  return null;
}
