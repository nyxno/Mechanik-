// Berechnet, wann welche Erinnerung kommen soll. Reine Rechnung, ohne Handy-Funktionen (darum testbar).
import { ausDate, formatDeutsch, formatMitTag, plusTage, wochentag } from './datum';
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
  einmalig?: boolean;
  /** Schlummern: Erinnerung erst an diesem Tag (JJJJ-MM-TT). Die Prüffrist selbst bleibt. */
  schlummernBis?: string | null;
}

export interface ErinnerungsEinstellungen {
  aktiv: boolean;
  uhrzeit: string;      // Standard-Uhrzeit "HH:MM"
  vorwarnTage: number;  // 0 = nur am Tag der Fälligkeit
  /** Morgen-Übersicht Mo–Fr zur Standard-Uhrzeit (ersetzt Einzelmeldungen zur selben Uhrzeit). */
  morgen?: boolean;
}

export interface Erinnerung {
  wann: Date;
  titel: string;
  text: string;
  eintragId: string | null; // null = Sammelmeldung
  art: 'vorwarnung' | 'faellig' | 'ueberfaellig' | 'schlummer' | 'morgen';
}

/** Android erlaubt nur eine begrenzte Zahl geplanter Wecker pro App – wir planen die nächsten N. */
export const MAX_ERINNERUNGEN = 60;

export function erinnerungsPlan(eintraege: PlanEintrag[], e: ErinnerungsEinstellungen, jetzt: Date): Erinnerung[] {
  if (!e.aktiv) return [];
  const heuteIso = ausDate(jetzt);
  const liste: Erinnerung[] = [];
  const ueberfaellig: PlanEintrag[] = [];

  for (const x of eintraege) {
    const f = berechneFaelligkeit({ letzte: x.letzte, intervall: x.intervall, festerTermin: x.festerTermin, einmalig: x.einmalig }, heuteIso);
    if (!f.naechster) continue; // erledigt oder kein Termin -> keine Erinnerung
    const uhr = x.uhrzeit || e.uhrzeit;
    const kurz = x.aufgabe ? x.aufgabe.split('\n')[0].slice(0, 80) : 'Prüfung / Wartung';

    // Geschlummert? Dann bis dahin Ruhe, und an dem Tag eine Erinnerung.
    const schlummerZeit = x.schlummernBis ? zeitpunkt(x.schlummernBis, uhr) : null;
    const schlummert = !!schlummerZeit && schlummerZeit > jetzt;
    const erlaubt = (wann: Date) => wann > jetzt && (!schlummert || wann > schlummerZeit!);
    if (schlummert) {
      const wann = f.naechster < x.schlummernBis! ? 'war fällig am' : 'fällig am';
      liste.push({ wann: schlummerZeit!, titel: `💤 Erinnerung: ${x.name}`, text: `${wann[0].toUpperCase()}${wann.slice(1)} ${formatDeutsch(f.naechster)} – ${kurz}`, eintragId: x.id, art: 'schlummer' });
    }

    const faelligAm = zeitpunkt(f.naechster, uhr);
    // Mit Morgen-Übersicht: keine eigene Meldung, wenn sie zur gleichen Uhrzeit käme
    const imMorgen = !!e.morgen && !x.uhrzeit;
    if (imMorgen) {
      // nichts – steht in der Morgen-Übersicht
    } else if (erlaubt(faelligAm)) {
      liste.push({ wann: faelligAm, titel: `🔧 Heute fällig: ${x.name}`, text: kurz, eintragId: x.id, art: 'faellig' });
    } else if (faelligAm <= jetzt && !schlummert) {
      ueberfaellig.push(x);
    }

    if (e.vorwarnTage > 0) {
      const vorwarnung = zeitpunkt(plusTage(f.naechster, -e.vorwarnTage), uhr);
      if (erlaubt(vorwarnung)) {
        const t = e.vorwarnTage === 1 ? 'morgen' : `in ${e.vorwarnTage} Tagen`;
        liste.push({ wann: vorwarnung, titel: `⏰ Bald fällig: ${x.name}`, text: `Fällig ${t} (${formatMitTag(f.naechster)}) – ${kurz}`, eintragId: x.id, art: 'vorwarnung' });
      }
    }
  }

  // Morgen-Übersicht: die nächsten 10 Werktage, je eine Meldung, wenn an dem Tag etwas fällig/überfällig ist
  if (e.morgen) {
    const termine = eintraege
      .filter((x) => !(x.schlummernBis && zeitpunkt(x.schlummernBis, x.uhrzeit || e.uhrzeit) > jetzt))
      .map((x) => ({ x, n: berechneFaelligkeit({ letzte: x.letzte, intervall: x.intervall, festerTermin: x.festerTermin, einmalig: x.einmalig }, heuteIso).naechster }))
      .filter((t): t is { x: PlanEintrag; n: string } => !!t.n);
    let gezaehlt = 0;
    for (let i = 0; gezaehlt < 10 && i < 20; i++) {
      const tag = plusTage(heuteIso, i);
      const wt = wochentag(tag);
      if (wt === 0 || wt === 6) continue;
      gezaehlt++;
      const wann = zeitpunkt(tag, e.uhrzeit);
      if (wann <= jetzt) continue;
      const heuteFaellig = termine.filter((t) => t.n === tag);
      const ueber = termine.filter((t) => t.n < tag);
      const anzahl = heuteFaellig.length + ueber.length;
      if (anzahl === 0) continue;
      const namen = [...ueber, ...heuteFaellig].slice(0, 4).map((t) => t.x.name).join(', ') + (anzahl > 4 ? ' …' : '');
      liste.push({
        wann,
        titel: `☀️ Heute: ${anzahl === 1 ? '1 Arbeit' : `${anzahl} Arbeiten`}${ueber.length ? `, ${ueber.length} überfällig` : ''}`,
        text: namen,
        eintragId: null,
        art: 'morgen',
      });
    }
  }

  // Überfälliges: eine Sammelmeldung zur nächsten Standard-Uhrzeit (heute, sonst morgen) – nicht nötig mit Morgen-Übersicht.
  if (ueberfaellig.length > 0 && !e.morgen) {
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
