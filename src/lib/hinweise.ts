// Sammelt alle erkannten Muster als verständliche Hinweise.
import { formatDeutsch, IsoDatum } from './datum';
import { MangelEintrag, standortGruppen, StandortEintrag, ueblicheZeit, wiederkehrendeMaengel } from './muster';

export interface Hinweis {
  art: 'mangel' | 'standort' | 'zeit';
  titel: string;
  text: string;
  eintragIds: string[];
  /** Nur bei art 'zeit': vorgeschlagene Erinnerungs-Uhrzeit "HH:MM". */
  uhrzeit?: string;
}

export function hinweiseErstellen(p: {
  eintraege: (StandortEintrag & { name: string })[];
  maengel: MangelEintrag[];
  zeitpunkte: Date[];
  standardUhrzeit: string;
  heuteIso: IsoDatum;
}): Hinweis[] {
  const namen = new Map(p.eintraege.map((e) => [e.id, e.name]));
  const liste: Hinweis[] = [];

  for (const m of wiederkehrendeMaengel(p.maengel, p.heuteIso)) {
    const name = namen.get(m.eintragId);
    if (!name) continue;
    liste.push({
      art: 'mangel',
      titel: `⚠ ${name}: ${m.anzahl} Mängel in 12 Monaten`,
      text: m.haeufigste
        ? `${m.haeufigsteAnzahl}× „${m.haeufigste}“. Vielleicht Teil tauschen oder Intervall verkürzen?`
        : 'Wiederkehrende Mängel – Ursache prüfen oder Intervall verkürzen?',
      eintragIds: [m.eintragId],
    });
  }

  for (const g of standortGruppen(p.eintraege, p.heuteIso)) {
    liste.push({
      art: 'standort',
      titel: `📍 ${g.standort}: ${g.ids.length} Arbeiten bald fällig`,
      text: `Fällig zwischen ${formatDeutsch(g.von)} und ${formatDeutsch(g.bis)} – zusammen erledigen spart einen Weg.`,
      eintragIds: g.ids,
    });
  }

  const z = ueblicheZeit(p.zeitpunkte);
  if (z) {
    // Erinnerung eine Stunde vor dem üblichen Arbeitsbeginn (frühestens 5 Uhr)
    const h = Math.max(5, z.stunde - 1);
    const uhrzeit = `${h < 10 ? '0' : ''}${h}:00`;
    if (uhrzeit !== p.standardUhrzeit) {
      liste.push({
        art: 'zeit',
        titel: '🕒 Deine übliche Arbeitszeit',
        text: `${z.text} Erinnerungen um ${uhrzeit} Uhr wären passend (bisher ${p.standardUhrzeit} Uhr).`,
        eintragIds: [],
        uhrzeit,
      });
    }
  }
  return liste;
}
