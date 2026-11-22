// Muster erkennen – alles nur am Handy, ohne Internet und ohne KI-Dienst.
//  1. Neuer Eintrag: passendes Gebiet + Intervall anhand ähnlicher Namen vorschlagen
//  2. Wiederkehrende Mängel am selben Gerät
//  3. Mehrere Arbeiten am selben Standort bald fällig -> zusammenlegen
//  4. Übliche Arbeitszeit erkennen -> als Erinnerungs-Uhrzeit vorschlagen
import { IsoDatum, WOCHENTAGE_KURZ, plusTage, tageZwischen } from './datum';
import type { Intervall } from './intervall';

// ---------- Hilfen ----------

const FUELLWOERTER = new Set(['und', 'der', 'die', 'das', 'den', 'dem', 'mit', 'von', 'vom', 'für', 'fuer', 'im', 'in', 'am', 'an', 'auf', 'nr', 'neu', 'alt', 'groß', 'klein']);

/** Wörter eines Textes, klein geschrieben, ohne Zahlen und Füllwörter. */
export function woerter(text: string): string[] {
  return text.toLowerCase().split(/[^a-zäöüß]+/).filter((w) => w.length >= 3 && !FUELLWOERTER.has(w));
}

/** Ortsangaben zählen bei der Zuordnung nicht ("Therme Büro" ist eine Therme, kein Büro-Gerät). */
const ORTSWOERTER = new Set(['halle', 'gebäude', 'gebaeude', 'haus', 'bau', 'keller', 'werkstatt', 'lager', 'büro', 'buero',
  'raum', 'etage', 'stockwerk', 'hof', 'garage', 'kunde', 'filiale', 'werk', 'technikraum', 'heizraum', 'links', 'rechts',
  'oben', 'unten', 'tor', 'eingang', 'standort', 'nord', 'süd', 'ost', 'west']);
const sachWoerter = (text: string) => woerter(text).filter((w) => !ORTSWOERTER.has(w));

/** Wortstamm (grob): die ersten 5 Buchstaben – "Thermen" und "Therme" passen so zusammen. */
const stamm = (w: string) => w.slice(0, 5);

// ---------- 1. Zuordnung ----------

export interface VorbildEintrag {
  name: string;
  kategorie_id: string;
  intervall: Intervall;
  einmalig: boolean;
  aufgabe: string;
}

export interface KategorieKurz { id: string; name: string }

export interface ZuordnungsVorschlag {
  kategorie_id: string;
  intervall: Intervall | null;
  einmalig: boolean;
  aufgabe: string;
  /** Name des ähnlichen Eintrags, oder null wenn aus dem Wörterbuch. */
  vorbild: string | null;
}

/** Eingebautes Grundwissen, solange es noch wenige eigene Einträge gibt. Stichwort-Stamm -> Kategoriename. */
const WOERTERBUCH: Record<string, string[]> = {
  heizung: ['therm', 'heizu', 'kesse', 'brenn', 'gaste', 'boile', 'puffe', 'wärme', 'warmw', 'pumpe', 'speic'],
  brandschutz: ['feuer', 'lösch', 'loesc', 'rauch', 'brand', 'spri', 'notau', 'fluch', 'notbe'],
  leitern: ['leite', 'tritt', 'gerüs', 'stehl', 'anleg', 'podes'],
  anschlagmittel: ['ansch', 'kette', 'gurt', 'hebeb', 'rundsc', 'schäk', 'seil', 'hake', 'lasth', 'traverse', 'trave'],
  druckbehälter: ['druck', 'kompr', 'ausde', 'gefäß', 'kesse', 'lufts'],
  maschinen: ['masch', 'säge', 'saege', 'bohr', 'dreh', 'fräs', 'fraes', 'schle', 'press', 'stapl', 'hubwa', 'krann', 'kran'],
  elektrik: ['elekt', 'kabel', 'steck', 'verte', 'fi-sc', 'leitu'],
};

export function zuordnungVorschlag(name: string, eintraege: VorbildEintrag[], kategorien: KategorieKurz[]): ZuordnungsVorschlag | null {
  const neu = sachWoerter(name).map(stamm);
  if (neu.length === 0) return null;

  // a) Ähnlichster eigener Eintrag (gemeinsame Wortstämme)
  let bester: VorbildEintrag | null = null;
  let besterWert = 0;
  for (const e of eintraege) {
    const alt = new Set(sachWoerter(e.name).map(stamm));
    const treffer = neu.filter((w) => alt.has(w)).length;
    if (treffer > besterWert) { besterWert = treffer; bester = e; }
  }
  if (bester && kategorien.some((k) => k.id === bester!.kategorie_id)) {
    return { kategorie_id: bester.kategorie_id, intervall: bester.einmalig ? null : bester.intervall, einmalig: bester.einmalig, aufgabe: bester.aufgabe, vorbild: bester.name };
  }

  // b) Eingebautes Wörterbuch -> vorhandene Kategorie mit passendem Namen
  for (const k of kategorien) {
    const schluessel = Object.keys(WOERTERBUCH).find((s) => k.name.toLowerCase().startsWith(s.slice(0, 6)));
    const liste = schluessel ? WOERTERBUCH[schluessel] : [stamm(k.name.toLowerCase())];
    if (neu.some((w) => liste.some((s) => w.startsWith(s) || s.startsWith(w)))) {
      return { kategorie_id: k.id, intervall: null, einmalig: false, aufgabe: '', vorbild: null };
    }
  }
  return null;
}

// ---------- 2. Wiederkehrende Mängel ----------

export interface MangelEintrag { eintragId: string; datum: IsoDatum; notiz: string | null }
export interface MangelMuster { eintragId: string; anzahl: number; haeufigste: string | null; haeufigsteAnzahl: number }

/** Geräte mit mindestens `ab` Mängeln in den letzten 12 Monaten. */
export function wiederkehrendeMaengel(maengel: MangelEintrag[], heuteIso: IsoDatum, ab = 2): MangelMuster[] {
  const grenze = plusTage(heuteIso, -365);
  const proEintrag = new Map<string, MangelEintrag[]>();
  for (const m of maengel) {
    if (m.datum < grenze) continue;
    proEintrag.set(m.eintragId, [...(proEintrag.get(m.eintragId) ?? []), m]);
  }
  const ergebnis: MangelMuster[] = [];
  for (const [eintragId, liste] of proEintrag) {
    if (liste.length < ab) continue;
    const zaehler = new Map<string, { text: string; n: number }>();
    for (const m of liste) {
      const t = (m.notiz ?? '').trim();
      if (!t) continue;
      const k = t.toLowerCase();
      zaehler.set(k, { text: zaehler.get(k)?.text ?? t, n: (zaehler.get(k)?.n ?? 0) + 1 });
    }
    const top = [...zaehler.values()].sort((a, b) => b.n - a.n)[0];
    ergebnis.push({ eintragId, anzahl: liste.length, haeufigste: top && top.n >= 2 ? top.text : null, haeufigsteAnzahl: top?.n ?? 0 });
  }
  return ergebnis.sort((a, b) => b.anzahl - a.anzahl);
}

// ---------- 3. Gleicher Standort ----------

const STANDORT = /\b(halle|gebäude|gebaeude|geb\.|haus|bau|keller|werkstatt|lager|büro|buero|raum|etage|stockwerk|og|eg|ug|dg|hof|garage|kunde|filiale|werk|technikraum|heizraum)\s*([a-z0-9äöü]{1,4}\b)?/i;

/** Standort aus Name/Zusatzinfo lesen, z. B. "Halle 2", "Keller". Null wenn keiner erkennbar. */
export function standortVon(text: string): string | null {
  const m = text.match(STANDORT);
  if (!m) return null;
  const wort = m[1].toLowerCase().replace('gebaeude', 'gebäude').replace('geb.', 'gebäude').replace('buero', 'büro');
  const zusatz = m[2] ? ` ${m[2].toUpperCase()}` : '';
  return `${wort[0].toUpperCase()}${wort.slice(1)}${zusatz}`;
}

export interface StandortEintrag { id: string; name: string; zusatzinfo: string; naechster: IsoDatum | null; intervallTage?: number }
export interface StandortGruppe { standort: string; ids: string[]; von: IsoDatum; bis: IsoDatum }

/** Standorte mit mindestens 2 Arbeiten, die in den nächsten `tage` Tagen (oder schon) fällig sind. */
export function standortGruppen(eintraege: StandortEintrag[], heuteIso: IsoDatum, tage = 14): StandortGruppe[] {
  const bis = plusTage(heuteIso, tage);
  const gruppen = new Map<string, StandortEintrag[]>();
  for (const e of eintraege) {
    if (!e.naechster || e.naechster > bis) continue;
    if (e.intervallTage !== undefined && e.intervallTage < 21) continue; // Wöchentliches ist sowieso ständig fällig
    const s = standortVon(`${e.name} ${e.zusatzinfo}`);
    if (!s) continue;
    gruppen.set(s, [...(gruppen.get(s) ?? []), e]);
  }
  return [...gruppen.entries()]
    .filter(([, l]) => l.length >= 2)
    .map(([standort, l]) => {
      const daten = l.map((e) => e.naechster!).sort();
      return { standort, ids: l.map((e) => e.id), von: daten[0], bis: daten[daten.length - 1] };
    })
    .sort((a, b) => b.ids.length - a.ids.length);
}

// ---------- 4. Übliche Arbeitszeit ----------

export interface UeblicheZeit { wochentag: number | null; stunde: number; anzahl: number; text: string }

/** Aus Zeitpunkten der Durchführungen: üblicher Wochentag (wenn deutlich) und übliche Stunde. Ab 5 Durchführungen. */
export function ueblicheZeit(zeitpunkte: Date[], mindestens = 5): UeblicheZeit | null {
  if (zeitpunkte.length < mindestens) return null;
  const stunden = zeitpunkte.map((d) => d.getHours()).sort((a, b) => a - b);
  const stunde = stunden[Math.floor((stunden.length - 1) / 2)]; // Median
  const tage = new Array(7).fill(0);
  zeitpunkte.forEach((d) => tage[d.getDay()]++);
  const max = Math.max(...tage);
  const wochentag = max / zeitpunkte.length >= 0.4 ? tage.indexOf(max) : null;
  const tagText = wochentag === null ? '' : `meistens ${['sonntags', 'montags', 'dienstags', 'mittwochs', 'donnerstags', 'freitags', 'samstags'][wochentag]}, `;
  return { wochentag, stunde, anzahl: zeitpunkte.length, text: `Du arbeitest ${tagText}meistens ab etwa ${stunde} Uhr.` };
}

/** Kurztext für einen Wochentag, für Anzeigen. */
export const tagKurz = (t: number) => WOCHENTAGE_KURZ[t];
export const tageBis = (heuteIso: IsoDatum, iso: IsoDatum) => tageZwischen(heuteIso, iso);
