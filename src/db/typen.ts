import type { IsoDatum } from '@/lib/datum';
import type { IntervallEinheit } from '@/lib/intervall';

export interface Kategorie {
  id: string;
  betrieb_id: string;
  name: string;
  sortierung: number;
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
  created_at: string;
  updated_at: string;
}

/** Eintrag inkl. Daten für die Übersicht. */
export interface EintragMitStatus extends Eintrag {
  kategorie_name: string;
  letzte_durchfuehrung: IsoDatum | null;
}

export interface Durchfuehrung {
  id: string;
  betrieb_id: string;
  eintrag_id: string;
  datum: IsoDatum;
  beschreibung: string;
  benutzer_id: string | null;
  created_at: string;
}

export interface Foto {
  id: string;
  betrieb_id: string;
  eintrag_id: string | null;
  durchfuehrung_id: string | null;
  datei: string;
  created_at: string;
}
