// Berechnet, wann welche Erinnerung kommen soll. Reine Rechnung, ohne Handy-Funktionen (darum testbar).
import { ausDate, formatDeutsch, plusTage } from './datum';
import { berechneFaelligkeit } from './faelligkeit';
import type { Intervall } from './intervall';
import { zeitpunkt } from './uhrzeit';

export interface PlanEintrag {
  id: string;
  name: string;
  aufgabe: string;
  intervall: Intervall;
  letzte: string | null;
  festerTermin: string | null;
  uhrzeit: string | null;
}

export interface ErinnerungsEinstellungen {
  aktiv: boolean;
  uhrzeit: string;      // Standard-Uhrzeit "HH:MM"
  vorwarnTage: number;  // 0 = nur am Tag der Fälligkeit
}

export interface Erinnerung {
  wann: Date;
  titel: string;
  text: string;
  eintragId: string | null; // null = Sammelmeldung
  art: 'vorwarnung' | 'faellig' | 'ueberfaellig';
}

/** Android erlaubt nur eine begrenzte Zahl geplanter Wecker pro App – wir planen die nächsten N. */
export const MAX_ERINNERUNGEN = 60;

export function erinnerungsPlan(eintraege: PlanEintrag[], e: ErinnerungsEinstellungen, jetzt: Date): Erinnerung[] {
  if (!e.aktiv) return [];
  const heuteIso = ausDate(jetzt);
  const liste: Erinnerung[] = [];
  const ueberfaellig: PlanEintrag[] = [];

  for (const x of eintraege) {
    const f = berechneFaelligkeit(x.letzte, x.intervall, heuteIso, x.festerTermin);
    if (!f.naechster) continue; // kein Termin -> keine Erinnerung
    const uhr = x.uhrzeit || e.uhrzeit;
    const kurz = x.aufgabe ? x.aufgabe.split('\n')[0].slice(0, 80) : 'Prüfung / Wartung';

    const faelligAm = zeitpunkt(f.naechster, uhr);
    if (faelligAm > jetzt) {
      liste.push({ wann: faelligAm, titel: `🔧 Heute fällig: ${x.name}`, text: kurz, eintragId: x.id, art: 'faellig' });
    } else {
      ueberfaellig.push(x);
    }

    if (e.vorwarnTage > 0) {
      const vorwarnung = zeitpunkt(plusTage(f.naechster, -e.vorwarnTage), uhr);
      if (vorwarnung > jetzt) {
        const t = e.vorwarnTage === 1 ? 'morgen' : `in ${e.vorwarnTage} Tagen`;
        liste.push({ wann: vorwarnung, titel: `⏰ Bald fällig: ${x.name}`, text: `Fällig ${t} (${formatDeutsch(f.naechster)}) – ${kurz}`, eintragId: x.id, art: 'vorwarnung' });
      }
    }
  }

  // Überfälliges: eine Sammelmeldung zur nächsten Standard-Uhrzeit (heute, sonst morgen).
  if (ueberfaellig.length > 0) {
    let wann = zeitpunkt(heuteIso, e.uhrzeit);
    if (wann <= jetzt) wann = zeitpunkt(plusTage(heuteIso, 1), e.uhrzeit);
    const einer = ueberfaellig.length === 1;
    liste.push({
      wann,
      titel: einer ? `❗ Überfällig: ${ueberfaellig[0].name}` : `❗ ${ueberfaellig.length} Prüfungen überfällig`,
      text: einer ? 'Bitte erledigen und in der App abhaken.' : ueberfaellig.slice(0, 5).map((u) => u.name).join(', ') + (ueberfaellig.length > 5 ? ' …' : ''),
      eintragId: einer ? ueberfaellig[0].id : null,
      art: 'ueberfaellig',
    });
  }

  return liste.sort((a, b) => a.wann.getTime() - b.wann.getTime()).slice(0, MAX_ERINNERUNGEN);
}
