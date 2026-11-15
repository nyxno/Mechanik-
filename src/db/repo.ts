// Alle Datenbank-Zugriffe an einem Ort. Die Bildschirme rufen nur diese Funktionen auf.
// Vorteil: Wenn später ein Server dazukommt, muss nur diese Datei (und ein Abgleich-Modul) angepasst werden.
import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { jetztIso } from '@/lib/datum';
import type { Intervall } from '@/lib/intervall';
import { LOKALER_BETRIEB_ID } from './schema';
import type { Durchfuehrung, Eintrag, EintragMitStatus, Foto, Kategorie } from './typen';

const neueId = () => Crypto.randomUUID();
const betrieb = () => LOKALER_BETRIEB_ID; // später: aktuell angemeldeter Betrieb

// ---------- Kategorien ----------

export async function kategorienLaden(db: SQLiteDatabase): Promise<Kategorie[]> {
  return db.getAllAsync<Kategorie>(
    `SELECT k.id, k.betrieb_id, k.name, k.sortierung,
            (SELECT COUNT(*) FROM eintraege e WHERE e.kategorie_id = k.id AND e.deleted_at IS NULL) AS anzahl
       FROM kategorien k
      WHERE k.betrieb_id = ? AND k.deleted_at IS NULL
      ORDER BY k.sortierung, k.name COLLATE NOCASE`,
    betrieb(),
  );
}

export async function kategorieAnlegen(db: SQLiteDatabase, name: string): Promise<string> {
  const id = neueId();
  const t = jetztIso();
  const max = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(sortierung) AS m FROM kategorien WHERE betrieb_id = ?', betrieb());
  await db.runAsync(
    'INSERT INTO kategorien (id, betrieb_id, name, sortierung, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, betrieb(), name.trim(), (max?.m ?? -1) + 1, t, t,
  );
  return id;
}

export async function kategorieUmbenennen(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  await db.runAsync('UPDATE kategorien SET name = ?, updated_at = ? WHERE id = ?', name.trim(), jetztIso(), id);
}

/** Löscht eine Kategorie samt Einträgen (Soft Delete). Gibt die Anzahl gelöschter Einträge zurück. */
export async function kategorieLoeschen(db: SQLiteDatabase, id: string): Promise<void> {
  const t = jetztIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE durchfuehrungen SET deleted_at = ?, updated_at = ?
        WHERE deleted_at IS NULL AND eintrag_id IN (SELECT id FROM eintraege WHERE kategorie_id = ?)`, t, t, id);
    await db.runAsync(
      `UPDATE fotos SET deleted_at = ?
        WHERE deleted_at IS NULL AND (eintrag_id IN (SELECT id FROM eintraege WHERE kategorie_id = ?)
           OR durchfuehrung_id IN (SELECT d.id FROM durchfuehrungen d JOIN eintraege e ON e.id = d.eintrag_id WHERE e.kategorie_id = ?))`,
      t, id, id);
    await db.runAsync('UPDATE eintraege SET deleted_at = ?, updated_at = ? WHERE kategorie_id = ? AND deleted_at IS NULL', t, t, id);
    await db.runAsync('UPDATE kategorien SET deleted_at = ?, updated_at = ? WHERE id = ?', t, t, id);
  });
}

// ---------- Einträge ----------

const EINTRAG_MIT_STATUS_SQL = `
  SELECT e.*, k.name AS kategorie_name,
         (SELECT MAX(d.datum) FROM durchfuehrungen d WHERE d.eintrag_id = e.id AND d.deleted_at IS NULL) AS letzte_durchfuehrung
    FROM eintraege e
    JOIN kategorien k ON k.id = e.kategorie_id
   WHERE e.betrieb_id = ? AND e.deleted_at IS NULL`;

export async function eintraegeLaden(db: SQLiteDatabase, kategorieId?: string | null): Promise<EintragMitStatus[]> {
  if (kategorieId) {
    return db.getAllAsync<EintragMitStatus>(`${EINTRAG_MIT_STATUS_SQL} AND e.kategorie_id = ? ORDER BY e.name COLLATE NOCASE`, betrieb(), kategorieId);
  }
  return db.getAllAsync<EintragMitStatus>(`${EINTRAG_MIT_STATUS_SQL} ORDER BY e.name COLLATE NOCASE`, betrieb());
}

export async function eintragLaden(db: SQLiteDatabase, id: string): Promise<EintragMitStatus | null> {
  return db.getFirstAsync<EintragMitStatus>(`${EINTRAG_MIT_STATUS_SQL} AND e.id = ?`, betrieb(), id);
}

export interface EintragDaten {
  kategorie_id: string;
  name: string;
  aufgabe: string;
  intervall: Intervall;
  zusatzinfo: string;
}

export async function eintragAnlegen(db: SQLiteDatabase, d: EintragDaten): Promise<string> {
  const id = neueId();
  const t = jetztIso();
  await db.runAsync(
    `INSERT INTO eintraege (id, betrieb_id, kategorie_id, name, aufgabe, intervall_wert, intervall_einheit, zusatzinfo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, betrieb(), d.kategorie_id, d.name.trim(), d.aufgabe.trim(), d.intervall.wert, d.intervall.einheit, d.zusatzinfo.trim(), t, t,
  );
  return id;
}

export async function eintragAendern(db: SQLiteDatabase, id: string, d: EintragDaten): Promise<void> {
  await db.runAsync(
    `UPDATE eintraege SET kategorie_id = ?, name = ?, aufgabe = ?, intervall_wert = ?, intervall_einheit = ?, zusatzinfo = ?, updated_at = ?
      WHERE id = ?`,
    d.kategorie_id, d.name.trim(), d.aufgabe.trim(), d.intervall.wert, d.intervall.einheit, d.zusatzinfo.trim(), jetztIso(), id,
  );
}

export async function eintragLoeschen(db: SQLiteDatabase, id: string): Promise<void> {
  const t = jetztIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE durchfuehrungen SET deleted_at = ?, updated_at = ? WHERE eintrag_id = ? AND deleted_at IS NULL', t, t, id);
    await db.runAsync(
      `UPDATE fotos SET deleted_at = ? WHERE deleted_at IS NULL AND (eintrag_id = ? OR durchfuehrung_id IN (SELECT id FROM durchfuehrungen WHERE eintrag_id = ?))`,
      t, id, id);
    await db.runAsync('UPDATE eintraege SET deleted_at = ?, updated_at = ? WHERE id = ?', t, t, id);
  });
}

// ---------- Durchführungen ----------

export async function durchfuehrungenLaden(db: SQLiteDatabase, eintragId: string): Promise<Durchfuehrung[]> {
  return db.getAllAsync<Durchfuehrung>(
    'SELECT * FROM durchfuehrungen WHERE eintrag_id = ? AND deleted_at IS NULL ORDER BY datum DESC, created_at DESC',
    eintragId,
  );
}

export async function durchfuehrungAnlegen(db: SQLiteDatabase, eintragId: string, datum: string, beschreibung: string): Promise<string> {
  const id = neueId();
  const t = jetztIso();
  await db.runAsync(
    `INSERT INTO durchfuehrungen (id, betrieb_id, eintrag_id, datum, beschreibung, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, betrieb(), eintragId, datum, beschreibung.trim(), t, t,
  );
  return id;
}

export async function durchfuehrungLoeschen(db: SQLiteDatabase, id: string): Promise<void> {
  const t = jetztIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE fotos SET deleted_at = ? WHERE durchfuehrung_id = ? AND deleted_at IS NULL', t, id);
    await db.runAsync('UPDATE durchfuehrungen SET deleted_at = ?, updated_at = ? WHERE id = ?', t, t, id);
  });
}

// ---------- Fotos ----------

export async function fotosZuEintrag(db: SQLiteDatabase, eintragId: string): Promise<Foto[]> {
  return db.getAllAsync<Foto>('SELECT * FROM fotos WHERE eintrag_id = ? AND deleted_at IS NULL ORDER BY created_at', eintragId);
}

export async function fotosZuDurchfuehrungen(db: SQLiteDatabase, eintragId: string): Promise<Foto[]> {
  return db.getAllAsync<Foto>(
    `SELECT f.* FROM fotos f JOIN durchfuehrungen d ON d.id = f.durchfuehrung_id
      WHERE d.eintrag_id = ? AND f.deleted_at IS NULL ORDER BY f.created_at`, eintragId);
}

export async function fotoSpeichern(
  db: SQLiteDatabase,
  ziel: { eintragId?: string; durchfuehrungId?: string },
  datei: string,
): Promise<string> {
  const id = neueId();
  await db.runAsync(
    'INSERT INTO fotos (id, betrieb_id, eintrag_id, durchfuehrung_id, datei, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, betrieb(), ziel.eintragId ?? null, ziel.durchfuehrungId ?? null, datei, jetztIso(),
  );
  return id;
}

export async function fotoLoeschen(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE fotos SET deleted_at = ? WHERE id = ?', jetztIso(), id);
}

// Hilfsfunktion für die Übersicht
export function eintragIntervall(e: Eintrag): Intervall {
  return { wert: e.intervall_wert, einheit: e.intervall_einheit };
}
