// Datenbank-Aufbau. Alles liegt lokal am Handy in einer SQLite-Datei.
//
// Vorbereitung für später (Konten, mehrere Nutzer, mehrere Betriebe, Abgleich mit Server):
//  - Jede Zeile hat eine weltweit eindeutige ID (UUID) statt einer Zählnummer.
//    So kollidieren Daten von zwei Handys beim Abgleich nicht.
//  - Jede Tabelle hat betrieb_id: Daten sind immer einem Betrieb zugeordnet.
//  - created_at / updated_at: Zeitstempel für den Abgleich ("was ist neuer?").
//  - deleted_at statt echtem Löschen ("Soft Delete"): gelöschte Zeilen bleiben markiert,
//    damit das Löschen beim Abgleich auch auf andere Geräte übertragen werden kann.
//  - synced_at: wann die Zeile zuletzt zum Server übertragen wurde (noch unbenutzt).
import type { SQLiteDatabase } from 'expo-sqlite';

export const DB_NAME = 'wartungsapp.db';
const DB_VERSION = 2;

/** Der lokale Standard-Betrieb, solange es keine Konten gibt. */
export const LOKALER_BETRIEB_ID = 'lokal';

export async function migrieren(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DB_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS betriebe (
        id          TEXT PRIMARY KEY NOT NULL,
        name        TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        deleted_at  TEXT,
        synced_at   TEXT
      );

      CREATE TABLE IF NOT EXISTS kategorien (
        id          TEXT PRIMARY KEY NOT NULL,
        betrieb_id  TEXT NOT NULL REFERENCES betriebe(id),
        name        TEXT NOT NULL,
        sortierung  INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        deleted_at  TEXT,
        synced_at   TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_kategorien_betrieb ON kategorien(betrieb_id, deleted_at);

      CREATE TABLE IF NOT EXISTS eintraege (
        id                TEXT PRIMARY KEY NOT NULL,
        betrieb_id        TEXT NOT NULL REFERENCES betriebe(id),
        kategorie_id      TEXT NOT NULL REFERENCES kategorien(id),
        name              TEXT NOT NULL,
        aufgabe           TEXT NOT NULL DEFAULT '',
        intervall_wert    INTEGER NOT NULL,
        intervall_einheit TEXT NOT NULL CHECK (intervall_einheit IN ('tage','wochen','monate','jahre')),
        zusatzinfo        TEXT NOT NULL DEFAULT '',
        created_at        TEXT NOT NULL,
        updated_at        TEXT NOT NULL,
        deleted_at        TEXT,
        synced_at         TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_eintraege_kategorie ON eintraege(kategorie_id, deleted_at);

      CREATE TABLE IF NOT EXISTS durchfuehrungen (
        id            TEXT PRIMARY KEY NOT NULL,
        betrieb_id    TEXT NOT NULL REFERENCES betriebe(id),
        eintrag_id    TEXT NOT NULL REFERENCES eintraege(id),
        datum         TEXT NOT NULL,            -- "JJJJ-MM-TT"
        beschreibung  TEXT NOT NULL DEFAULT '',
        benutzer_id   TEXT,                     -- später: wer hat es gemacht
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL,
        deleted_at    TEXT,
        synced_at     TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_durchfuehrungen_eintrag ON durchfuehrungen(eintrag_id, deleted_at, datum);

      CREATE TABLE IF NOT EXISTS fotos (
        id                TEXT PRIMARY KEY NOT NULL,
        betrieb_id        TEXT NOT NULL REFERENCES betriebe(id),
        eintrag_id        TEXT REFERENCES eintraege(id),         -- Foto zum Eintrag ...
        durchfuehrung_id  TEXT REFERENCES durchfuehrungen(id),   -- ... oder zur Durchführung
        datei             TEXT NOT NULL,                         -- Dateiname im Ordner "fotos"
        created_at        TEXT NOT NULL,
        deleted_at        TEXT,
        synced_at         TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_fotos_eintrag ON fotos(eintrag_id, deleted_at);
      CREATE INDEX IF NOT EXISTS idx_fotos_durchfuehrung ON fotos(durchfuehrung_id, deleted_at);

      CREATE TABLE IF NOT EXISTS einstellungen (
        schluessel  TEXT PRIMARY KEY NOT NULL,
        wert        TEXT NOT NULL
      );
    `);

    const jetzt = new Date().toISOString();
    await db.runAsync(
      'INSERT OR IGNORE INTO betriebe (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      LOKALER_BETRIEB_ID, 'Mein Betrieb', jetzt, jetzt,
    );
    // Ein paar Startkategorien, damit die App nicht leer ist. Können gelöscht/umbenannt werden.
    const start = ['Heizung', 'Brandschutz', 'Leitern', 'Maschinen', 'Anschlagmittel', 'Druckbehälter'];
    for (let i = 0; i < start.length; i++) {
      await db.runAsync(
        'INSERT INTO kategorien (id, betrieb_id, name, sortierung, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        `start-${i}`, LOKALER_BETRIEB_ID, start[i], i, jetzt, jetzt,
      );
    }
    version = 1;
  }

  if (version === 1) {
    // Version 2: fester Fälligkeitstermin, Uhrzeit pro Eintrag, Einstellungen für Erinnerungen.
    await db.execAsync(`
      ALTER TABLE eintraege ADD COLUMN naechster_termin TEXT;  -- fest eingegebenes Fälligkeitsdatum (JJJJ-MM-TT) oder NULL
      ALTER TABLE eintraege ADD COLUMN uhrzeit TEXT;           -- "HH:MM" für die Erinnerung oder NULL = Standard
      INSERT OR IGNORE INTO einstellungen (schluessel, wert) VALUES ('erinnerung_aktiv', '1');
      INSERT OR IGNORE INTO einstellungen (schluessel, wert) VALUES ('erinnerung_uhrzeit', '07:00');
      INSERT OR IGNORE INTO einstellungen (schluessel, wert) VALUES ('vorwarnung_tage', '7');
    `);
    version = 2;
  }

  // Spätere Änderungen am Datenbank-Aufbau kommen hier als weitere "if (version === N)"-Blöcke.

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}
