import type { IsoDatum } from '@/lib/datum';
import type { IntervallEinheit } from '@/lib/intervall';

export interface Kategorie {
  id: string;
  betrieb_id: string;
  name: string;
  sortierung: number;
  /** Hauptkategorie, wenn dies eine Unterkategorie ist (sonst null). */
  eltern_id: string | null;
  /** Farbe des Gebiets, z. B. "#EA580C". */
  farbe: string | null;
  anzahl?: number; // Anzahl Einträge (nur in Listen)
}

export interface Eintrag {
  id: string;
  betrieb_id: string;
  kategorie_id: string;
  name: string;
  aufgabe: string;
  intervall_wert: number;
  intervall_einheit: IntervallEinheit;
  zusatzinfo: string;
  /** Fest eingegebenes Fälligkeitsdatum. Hat Vorrang vor "letzte Durchführung + Intervall". */
  naechster_termin: IsoDatum | null;
  /** Uhrzeit "HH:MM" für die Erinnerung, null = Standard aus den Einstellungen. */
  uhrzeit: string | null;
  /** 1 = einmaliger Termin; nach der Durchführung "Erledigt". */
  einmalig: number;
  /** Schlummern: Erinnerung erst an diesem Tag. Die Prüffrist selbst bleibt. */
  schlummern_bis: IsoDatum | null;
  created_at: string;
  updated_at: string;
}

/** Eintrag inkl. Daten für die Übersicht. */
export interface EintragMitStatus extends Eintrag {
  kategorie_name: string;
  kategorie_farbe: string | null;
  /** Hauptkategorie (gleich kategorie_id, wenn der Eintrag direkt in einer Hauptkategorie liegt). */
  hauptkategorie_id: string;
  letzte_durchfuehrung: IsoDatum | null;
  /** Anzahl offener (nicht behobener) Mängel. */
  offene_maengel: number;
}

export type Ergebnis = 'ok' | 'maengel' | 'ausser_betrieb';

export interface Durchfuehrung {
  id: string;
  betrieb_id: string;
  eintrag_id: string;
  datum: IsoDatum;
  beschreibung: string;
  benutzer_id: string | null;
  ergebnis: Ergebnis;
  notiz: string | null;
  pruefer: string | null;
  mangel_behoben_am: IsoDatum | null;
  hitze_stunden: number;
  staub_stunden: number;
  created_at: string;
}

export interface Material {
  id: string;
  name: string;
  menge: number | null;
  einheit: string;
  notiz: string;
  eintrag_id: string | null;
  besorgt: number;
  created_at: string;
  updated_at: string;
  /** nur in Listen */
  eintrag_name?: string | null;
  erstes_foto?: string | null;
  fotos_anzahl?: number;
}

export interface Foto {
  id: string;
  betrieb_id: string;
  eintrag_id: string | null;
  durchfuehrung_id: string | null;
  material_id: string | null;
  datei: string;
  created_at: string;
}
