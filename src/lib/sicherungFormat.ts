// Aufbau und Prüfung einer Sicherungsdatei (ohne Handy-Funktionen, darum testbar).
/** Reihenfolge wichtig: zuerst "Eltern", dann abhängige Tabellen. */
export const TABELLEN = ['betriebe', 'kategorien', 'eintraege', 'durchfuehrungen', 'fotos', 'material', 'magazin', 'zulagen', 'einstellungen', 'vorschlaege'] as const;

export interface Sicherung {
  app: 'wartungsapp';
  dbVersion: number;
  erstellt: string;
  tabellen: Record<string, Record<string, unknown>[]>;
  /** Optional: Fotos als Base64, Schlüssel = Dateiname im Ordner "fotos". */
  fotos?: Record<string, string>;
}

/** Prüft eine Sicherungsdatei. Gibt eine Fehlermeldung oder null zurück. */
export function sicherungPruefen(s: unknown, aktuelleVersion: number): string | null {
  const x = s as Partial<Sicherung>;
  if (!x || x.app !== 'wartungsapp' || typeof x.tabellen !== 'object' || !x.tabellen) return 'Das ist keine Sicherung dieser App.';
  if (typeof x.dbVersion !== 'number' || x.dbVersion > aktuelleVersion) return 'Die Sicherung stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren.';
  if (!Array.isArray(x.tabellen.eintraege) || !Array.isArray(x.tabellen.kategorien)) return 'Die Sicherung ist unvollständig.';
  return null;
}

/** Unterkategorien nach ihren Hauptkategorien einfügen (wegen Verweis eltern_id). */
export function elternZuerst(zeilen: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...zeilen].sort((a, b) => (a.eltern_id ? 1 : 0) - (b.eltern_id ? 1 : 0));
}


/** Nur Tabellen ersetzen, die in der Sicherung auch vorkommen (ältere Sicherungen kennen z. B. das Magazin noch nicht). */
export function tabellenZumErsetzen(s: Pick<Sicherung, 'tabellen'>): (typeof TABELLEN)[number][] {
  return TABELLEN.filter((t) => Array.isArray(s.tabellen[t]));
}
