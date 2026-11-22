// Alle Datenbank-Zugriffe an einem Ort. Die Bildschirme rufen nur diese Funktionen auf.
// Vorteil: Wenn später ein Server dazukommt, muss nur diese Datei (und ein Abgleich-Modul) angepasst werden.
import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { heute, jetztIso } from '@/lib/datum';
import { berechneFaelligkeit } from '@/lib/faelligkeit';
import type { ErinnerungsEinstellungen, PlanEintrag } from '@/lib/erinnerungsplan';
import { istGueltigeUhrzeit, STANDARD_UHRZEIT } from '@/lib/uhrzeit';
import { freieFarbe } from '@/lib/farben';
import type { MangelEintrag } from '@/lib/muster';
import type { StatZeile, TagesZulage } from '@/lib/statistik';
import { Hinweis, hinweiseErstellen } from '@/lib/hinweise';
import { intervallInTagen, type Intervall } from '@/lib/intervall';
import { LOKALER_BETRIEB_ID } from './schema';
import type { Durchfuehrung, Eintrag, EintragMitStatus, Ergebnis, Foto, Kategorie, Material } from './typen';
import { geschwister } from '@/lib/kategorien';

const neueId = () => Crypto.randomUUID();
const betrieb = () => LOKALER_BETRIEB_ID; // später: aktuell angemeldeter Betrieb

// ---------- Kategorien ----------

export async function kategorienLaden(db: SQLiteDatabase): Promise<Kategorie[]> {
  return db.getAllAsync<Kategorie>(
    `SELECT k.id, k.betrieb_id, k.name, k.sortierung, k.farbe, k.eltern_id,
            (SELECT COUNT(*) FROM eintraege e WHERE e.kategorie_id = k.id AND e.deleted_at IS NULL) AS anzahl
       FROM kategorien k
      WHERE k.betrieb_id = ? AND k.deleted_at IS NULL
      ORDER BY k.sortierung, k.name COLLATE NOCASE`,
    betrieb(),
  );
}

export async function kategorieAnlegen(db: SQLiteDatabase, name: string, elternId: string | null = null): Promise<string> {
  const id = neueId();
  const t = jetztIso();
  const max = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(sortierung) AS m FROM kategorien WHERE betrieb_id = ? AND deleted_at IS NULL AND eltern_id IS ?', betrieb(), elternId);
  // Unterkategorie übernimmt die Farbe der Hauptkategorie, sonst eine freie Farbe
  const eltern = elternId ? await db.getFirstAsync<{ farbe: string | null }>('SELECT farbe FROM kategorien WHERE id = ?', elternId) : null;
  const belegt = await db.getAllAsync<{ farbe: string | null }>(
    'SELECT farbe FROM kategorien WHERE betrieb_id = ? AND deleted_at IS NULL AND eltern_id IS NULL', betrieb());
  await db.runAsync(
    'INSERT INTO kategorien (id, betrieb_id, name, sortierung, farbe, eltern_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id, betrieb(), name.trim(), (max?.m ?? -1) + 1, eltern?.farbe ?? freieFarbe(belegt.map((b) => b.farbe)), elternId, t, t,
  );
  return id;
}

export async function kategorieUmbenennen(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  await db.runAsync('UPDATE kategorien SET name = ?, updated_at = ? WHERE id = ?', name.trim(), jetztIso(), id);
}

export async function kategorieFarbeSetzen(db: SQLiteDatabase, id: string, farbe: string): Promise<void> {
  // Unterkategorien bekommen dieselbe Farbe
  await db.runAsync('UPDATE kategorien SET farbe = ?, updated_at = ? WHERE id = ? OR eltern_id = ?', farbe, jetztIso(), id, id);
}

/** Kategorie eine Position nach oben (-1) oder unten (+1) schieben. */
export async function kategorieVerschieben(db: SQLiteDatabase, id: string, richtung: -1 | 1): Promise<void> {
  const liste = geschwister(id, await kategorienLaden(db));
  const i = liste.findIndex((k) => k.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
  const t = jetztIso();
  await db.withTransactionAsync(async () => {
    for (let n = 0; n < liste.length; n++) {
      if (liste[n].sortierung !== n) {
        await db.runAsync('UPDATE kategorien SET sortierung = ?, updated_at = ? WHERE id = ?', n, t, liste[n].id);
      }
    }
  });
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
    // Unterkategorien bleiben erhalten und werden zu Hauptkategorien
    await db.runAsync('UPDATE kategorien SET eltern_id = NULL, updated_at = ? WHERE eltern_id = ?', t, id);
  });
}

// ---------- Einträge ----------

const EINTRAG_MIT_STATUS_SQL = `
  SELECT e.*, k.name AS kategorie_name, k.farbe AS kategorie_farbe, COALESCE(k.eltern_id, k.id) AS hauptkategorie_id,
         (SELECT MAX(d.datum) FROM durchfuehrungen d WHERE d.eintrag_id = e.id AND d.deleted_at IS NULL) AS letzte_durchfuehrung,
         (SELECT COUNT(*) FROM durchfuehrungen d WHERE d.eintrag_id = e.id AND d.deleted_at IS NULL
             AND d.ergebnis <> 'ok' AND d.mangel_behoben_am IS NULL) AS offene_maengel
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
  naechster_termin: string | null;
  uhrzeit: string | null;
  einmalig: boolean;
}

export async function eintragAnlegen(db: SQLiteDatabase, d: EintragDaten): Promise<string> {
  const id = neueId();
  const t = jetztIso();
  await db.runAsync(
    `INSERT INTO eintraege (id, betrieb_id, kategorie_id, name, aufgabe, intervall_wert, intervall_einheit, zusatzinfo, naechster_termin, uhrzeit, einmalig, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, betrieb(), d.kategorie_id, d.name.trim(), d.aufgabe.trim(), d.intervall.wert, d.intervall.einheit, d.zusatzinfo.trim(), d.naechster_termin, d.uhrzeit, d.einmalig ? 1 : 0, t, t,
  );
  await vorschlagLernen(db, 'aufgabe', d.aufgabe);
  return id;
}

export async function eintragAendern(db: SQLiteDatabase, id: string, d: EintragDaten): Promise<void> {
  await db.runAsync(
    `UPDATE eintraege SET kategorie_id = ?, name = ?, aufgabe = ?, intervall_wert = ?, intervall_einheit = ?, zusatzinfo = ?,
            naechster_termin = ?, uhrzeit = ?, einmalig = ?, updated_at = ?
      WHERE id = ?`,
    d.kategorie_id, d.name.trim(), d.aufgabe.trim(), d.intervall.wert, d.intervall.einheit, d.zusatzinfo.trim(),
    d.naechster_termin, d.uhrzeit, d.einmalig ? 1 : 0, jetztIso(), id,
  );
  await vorschlagLernen(db, 'aufgabe', d.aufgabe);
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

export interface NeueDurchfuehrung {
  eintragId: string;
  datum: string;
  beschreibung: string;
  /** Fest gewählter nächster Termin, oder null = ab jetzt aus Datum + Intervall berechnen. */
  naechsterTermin: string | null;
  ergebnis?: Ergebnis;
  notiz?: string | null;
  pruefer?: string | null;
  /** Zulagenstunden */
  hitze?: number;
  staub?: number;
}

/** Was nötig ist, um eine gerade gespeicherte Durchführung rückgängig zu machen. */
export interface Rueckgaengig {
  durchfuehrungId: string;
  eintragId: string;
  vorherTermin: string | null;
  vorherSchlummern: string | null;
  behobeneMaengel: string[];
}

/**
 * Durchführung speichern. Startet die neue Prüffrist (fester Termin wird ersetzt, Schlummern beendet).
 * Bei Ergebnis "in Ordnung" gelten offene Mängel dieses Eintrags als behoben.
 */
export async function durchfuehrungAnlegen(db: SQLiteDatabase, d: NeueDurchfuehrung): Promise<Rueckgaengig> {
  const id = neueId();
  const t = jetztIso();
  const ergebnis = d.ergebnis ?? 'ok';
  const vorher = await db.getFirstAsync<{ naechster_termin: string | null; schlummern_bis: string | null }>(
    'SELECT naechster_termin, schlummern_bis FROM eintraege WHERE id = ?', d.eintragId);
  let behobene: string[] = [];
  if (ergebnis === 'ok') {
    behobene = (await db.getAllAsync<{ id: string }>(
      `SELECT id FROM durchfuehrungen WHERE eintrag_id = ? AND deleted_at IS NULL AND ergebnis <> 'ok' AND mangel_behoben_am IS NULL`,
      d.eintragId)).map((r) => r.id);
  }
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO durchfuehrungen (id, betrieb_id, eintrag_id, datum, beschreibung, ergebnis, notiz, pruefer, hitze_stunden, staub_stunden, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, betrieb(), d.eintragId, d.datum, d.beschreibung.trim(), ergebnis, d.notiz?.trim() || null, d.pruefer?.trim() || null,
      Math.max(0, d.hitze ?? 0), Math.max(0, d.staub ?? 0), t, t,
    );
    await db.runAsync('UPDATE eintraege SET naechster_termin = ?, schlummern_bis = NULL, updated_at = ? WHERE id = ?', d.naechsterTermin, t, d.eintragId);
    for (const m of behobene) {
      await db.runAsync('UPDATE durchfuehrungen SET mangel_behoben_am = ?, updated_at = ? WHERE id = ?', d.datum, t, m);
    }
  });
  await vorschlagLernen(db, 'beschreibung', d.beschreibung, d.eintragId);
  if (d.notiz) await vorschlagLernen(db, 'mangel', d.notiz, d.eintragId);
  if (d.pruefer) await vorschlagLernen(db, 'pruefer', d.pruefer);
  return { durchfuehrungId: id, eintragId: d.eintragId, vorherTermin: vorher?.naechster_termin ?? null, vorherSchlummern: vorher?.schlummern_bis ?? null, behobeneMaengel: behobene };
}

/** Macht eine gerade gespeicherte Durchführung rückgängig (z. B. nach "Schnell abhaken"). */
export async function durchfuehrungRueckgaengig(db: SQLiteDatabase, r: Rueckgaengig): Promise<void> {
  const t = jetztIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM fotos WHERE durchfuehrung_id = ?', r.durchfuehrungId);
    await db.runAsync('DELETE FROM durchfuehrungen WHERE id = ?', r.durchfuehrungId);
    await db.runAsync('UPDATE eintraege SET naechster_termin = ?, schlummern_bis = ?, updated_at = ? WHERE id = ?', r.vorherTermin, r.vorherSchlummern, t, r.eintragId);
    for (const m of r.behobeneMaengel) {
      await db.runAsync('UPDATE durchfuehrungen SET mangel_behoben_am = NULL, updated_at = ? WHERE id = ?', t, m);
    }
  });
}

/** Mangel als behoben markieren. */
export async function mangelBehoben(db: SQLiteDatabase, durchfuehrungId: string, datum = heute()): Promise<void> {
  await db.runAsync('UPDATE durchfuehrungen SET mangel_behoben_am = ?, updated_at = ? WHERE id = ?', datum, jetztIso(), durchfuehrungId);
}

/** Alle Mängel (für die Mustererkennung). */
export async function alleMaengel(db: SQLiteDatabase): Promise<MangelEintrag[]> {
  return db.getAllAsync<MangelEintrag>(
    `SELECT d.eintrag_id AS eintragId, d.datum, d.notiz FROM durchfuehrungen d JOIN eintraege e ON e.id = d.eintrag_id
      WHERE d.deleted_at IS NULL AND e.deleted_at IS NULL AND d.ergebnis <> 'ok' AND d.betrieb_id = ?`, betrieb());
}

/** Wann Durchführungen erfasst wurden (für "übliche Arbeitszeit"). Übernommene Altdaten zählen nicht. */
export async function erfassungsZeitpunkte(db: SQLiteDatabase): Promise<Date[]> {
  const rows = await db.getAllAsync<{ created_at: string }>(
    `SELECT created_at FROM durchfuehrungen WHERE deleted_at IS NULL AND betrieb_id = ?
        AND beschreibung <> 'Übernommen beim Anlegen des Eintrags' ORDER BY created_at DESC LIMIT 200`, betrieb());
  return rows.map((r) => new Date(r.created_at)).filter((d) => !isNaN(d.getTime()));
}

async function ausgeblendeteHinweise(db: SQLiteDatabase): Promise<string[]> {
  const r = await db.getFirstAsync<{ wert: string }>("SELECT wert FROM einstellungen WHERE schluessel = 'hinweise_ausgeblendet'");
  try { return r ? (JSON.parse(r.wert) as string[]) : []; } catch { return []; }
}

/** Hinweis ausblenden (bis sich das Muster ändert). */
export async function hinweisAusblenden(db: SQLiteDatabase, schluessel: string): Promise<void> {
  const liste = [...new Set([...(await ausgeblendeteHinweise(db)), schluessel])].slice(-300);
  await db.runAsync("INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES ('hinweise_ausgeblendet', ?)", JSON.stringify(liste));
}

export async function hinweiseWiederZeigen(db: SQLiteDatabase): Promise<void> {
  await db.runAsync("DELETE FROM einstellungen WHERE schluessel = 'hinweise_ausgeblendet'");
}

/** Lädt alles Nötige und erstellt die Hinweise aus erkannten Mustern (ohne ausgeblendete). */
export async function hinweiseLaden(db: SQLiteDatabase): Promise<{ hinweise: Hinweis[]; eintraege: EintragMitStatus[]; ausgeblendet: number }> {
  const h = heute();
  const [eintraege, maengel, zeitpunkte, ein, weg] = await Promise.all([
    eintraegeLaden(db), alleMaengel(db), erfassungsZeitpunkte(db), einstellungenLaden(db), ausgeblendeteHinweise(db),
  ]);
  const offen = eintraege.map((e) => ({ ...e, naechster: eintragFaelligkeit(e, h).naechster, intervallTage: e.einmalig ? 9999 : intervallInTagen(eintragIntervall(e)) }));
  const alle = hinweiseErstellen({ eintraege: offen, maengel, zeitpunkte, standardUhrzeit: ein.uhrzeit, heuteIso: h });
  const hinweise = alle.filter((x) => !weg.includes(x.schluessel));
  return { hinweise, eintraege, ausgeblendet: alle.length - hinweise.length };
}

/** Zulagenstunden einer erledigten Arbeit nachträglich ändern. */
export async function durchfuehrungZulagenSetzen(db: SQLiteDatabase, id: string, hitze: number, staub: number): Promise<void> {
  await db.runAsync('UPDATE durchfuehrungen SET hitze_stunden = ?, staub_stunden = ?, updated_at = ? WHERE id = ?',
    Math.max(0, hitze), Math.max(0, staub), jetztIso(), id);
}

/** Alle Durchführungen in einem Zeitraum, mit Eintrag und Gebiet (für Statistik und Kalender). */
export async function durchfuehrungenImBereich(db: SQLiteDatabase, von: string, bis: string): Promise<StatZeile[]> {
  return db.getAllAsync<StatZeile>(
    `SELECT d.datum, d.eintrag_id AS eintragId, e.name, COALESCE(p.id, k.id) AS kategorieId,
            COALESCE(p.name, k.name) AS kategorieName, k.farbe, d.ergebnis, d.hitze_stunden AS hitze, d.staub_stunden AS staub
       FROM durchfuehrungen d
       JOIN eintraege e ON e.id = d.eintrag_id
       JOIN kategorien k ON k.id = e.kategorie_id
       LEFT JOIN kategorien p ON p.id = k.eltern_id
      WHERE d.betrieb_id = ? AND d.deleted_at IS NULL AND e.deleted_at IS NULL
        AND d.datum BETWEEN ? AND ?
        AND d.beschreibung <> 'Übernommen beim Anlegen des Eintrags'
      ORDER BY d.datum, d.created_at`,
    betrieb(), von, bis,
  );
}

// ---------- Zulagen-Taste (Hitze / Staub pro Tag) ----------

export async function zulageLaden(db: SQLiteDatabase, datum: string): Promise<TagesZulage> {
  const r = await db.getFirstAsync<TagesZulage>(
    'SELECT datum, hitze, staub FROM zulagen WHERE betrieb_id = ? AND datum = ? AND deleted_at IS NULL', betrieb(), datum);
  return r ?? { datum, hitze: 0, staub: 0 };
}

export async function zulageSetzen(db: SQLiteDatabase, datum: string, hitze: number, staub: number): Promise<void> {
  const t = jetztIso();
  await db.runAsync(
    `INSERT INTO zulagen (id, betrieb_id, datum, hitze, staub, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (betrieb_id, datum) DO UPDATE SET hitze = excluded.hitze, staub = excluded.staub, updated_at = excluded.updated_at, deleted_at = NULL`,
    neueId(), betrieb(), datum, Math.max(0, hitze), Math.max(0, staub), t, t,
  );
}

export async function zulagenImBereich(db: SQLiteDatabase, von: string, bis: string): Promise<TagesZulage[]> {
  return db.getAllAsync<TagesZulage>(
    'SELECT datum, hitze, staub FROM zulagen WHERE betrieb_id = ? AND deleted_at IS NULL AND datum BETWEEN ? AND ? ORDER BY datum',
    betrieb(), von, bis);
}

// ---------- Materialliste ----------

const MATERIAL_SQL = `
  SELECT m.*, e.name AS eintrag_name,
         (SELECT f.datei FROM fotos f WHERE f.material_id = m.id AND f.deleted_at IS NULL ORDER BY f.created_at LIMIT 1) AS erstes_foto,
         (SELECT COUNT(*) FROM fotos f WHERE f.material_id = m.id AND f.deleted_at IS NULL) AS fotos_anzahl
    FROM material m LEFT JOIN eintraege e ON e.id = m.eintrag_id AND e.deleted_at IS NULL
   WHERE m.betrieb_id = ? AND m.deleted_at IS NULL`;

export async function materialLaden(db: SQLiteDatabase, eintragId?: string): Promise<Material[]> {
  if (eintragId) return db.getAllAsync<Material>(`${MATERIAL_SQL} AND m.eintrag_id = ? ORDER BY m.besorgt, m.name COLLATE NOCASE`, betrieb(), eintragId);
  return db.getAllAsync<Material>(`${MATERIAL_SQL} ORDER BY m.besorgt, m.updated_at DESC`, betrieb());
}

export async function materialEinzeln(db: SQLiteDatabase, id: string): Promise<Material | null> {
  return db.getFirstAsync<Material>(`${MATERIAL_SQL} AND m.id = ?`, betrieb(), id);
}

export interface MaterialDaten { name: string; menge: number | null; einheit: string; notiz: string; eintrag_id: string | null }

export async function materialSpeichern(db: SQLiteDatabase, id: string | null, d: MaterialDaten): Promise<string> {
  const t = jetztIso();
  if (id) {
    await db.runAsync('UPDATE material SET name = ?, menge = ?, einheit = ?, notiz = ?, eintrag_id = ?, updated_at = ? WHERE id = ?',
      d.name.trim(), d.menge, d.einheit, d.notiz.trim(), d.eintrag_id, t, id);
  } else {
    id = neueId();
    await db.runAsync(
      'INSERT INTO material (id, betrieb_id, name, menge, einheit, notiz, eintrag_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, betrieb(), d.name.trim(), d.menge, d.einheit, d.notiz.trim(), d.eintrag_id, t, t);
  }
  await vorschlagLernen(db, 'material', d.name);
  return id;
}

export async function materialBesorgt(db: SQLiteDatabase, id: string, besorgt: boolean): Promise<void> {
  await db.runAsync('UPDATE material SET besorgt = ?, updated_at = ? WHERE id = ?', besorgt ? 1 : 0, jetztIso(), id);
}

export async function materialLoeschen(db: SQLiteDatabase, id: string): Promise<void> {
  const t = jetztIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE fotos SET deleted_at = ? WHERE material_id = ? AND deleted_at IS NULL', t, id);
    await db.runAsync('UPDATE material SET deleted_at = ?, updated_at = ? WHERE id = ?', t, t, id);
  });
}

export async function fotosZuMaterial(db: SQLiteDatabase, materialId: string): Promise<Foto[]> {
  return db.getAllAsync<Foto>('SELECT * FROM fotos WHERE material_id = ? AND deleted_at IS NULL ORDER BY created_at', materialId);
}

export async function statistikGezeigtLaden(db: SQLiteDatabase): Promise<string | null> {
  const r = await db.getFirstAsync<{ wert: string }>("SELECT wert FROM einstellungen WHERE schluessel = 'statistik_gezeigt'");
  return r?.wert ?? null;
}

export async function statistikGezeigtSpeichern(db: SQLiteDatabase, monat: string): Promise<void> {
  await db.runAsync("INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES ('statistik_gezeigt', ?)", monat);
}

/** Erinnerung bis zu einem Tag schlummern lassen (null = Schlummern beenden). Die Prüffrist bleibt. */
export async function eintragSchlummern(db: SQLiteDatabase, id: string, bis: string | null): Promise<void> {
  await db.runAsync('UPDATE eintraege SET schlummern_bis = ?, updated_at = ? WHERE id = ?', bis, jetztIso(), id);
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
  ziel: { eintragId?: string; durchfuehrungId?: string; materialId?: string },
  datei: string,
): Promise<string> {
  const id = neueId();
  await db.runAsync(
    'INSERT INTO fotos (id, betrieb_id, eintrag_id, durchfuehrung_id, material_id, datei, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, betrieb(), ziel.eintragId ?? null, ziel.durchfuehrungId ?? null, ziel.materialId ?? null, datei, jetztIso(),
  );
  return id;
}

export async function fotoLoeschen(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE fotos SET deleted_at = ? WHERE id = ?', jetztIso(), id);
}

// ---------- Einstellungen ----------

export async function einstellungenLaden(db: SQLiteDatabase): Promise<ErinnerungsEinstellungen> {
  const rows = await db.getAllAsync<{ schluessel: string; wert: string }>('SELECT schluessel, wert FROM einstellungen');
  const m = new Map(rows.map((r) => [r.schluessel, r.wert]));
  const uhr = m.get('erinnerung_uhrzeit');
  const tage = parseInt(m.get('vorwarnung_tage') ?? '7', 10);
  return {
    aktiv: (m.get('erinnerung_aktiv') ?? '1') === '1',
    uhrzeit: istGueltigeUhrzeit(uhr) ? uhr : STANDARD_UHRZEIT,
    vorwarnTage: isNaN(tage) ? 7 : tage,
  };
}

export async function einstellungenSpeichern(db: SQLiteDatabase, e: ErinnerungsEinstellungen): Promise<void> {
  const sql = 'INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES (?, ?)';
  await db.withTransactionAsync(async () => {
    await db.runAsync(sql, 'erinnerung_aktiv', e.aktiv ? '1' : '0');
    await db.runAsync(sql, 'erinnerung_uhrzeit', e.uhrzeit);
    await db.runAsync(sql, 'vorwarnung_tage', String(e.vorwarnTage));
  });
}

export async function schriftFaktorSpeichern(db: SQLiteDatabase, faktor: number): Promise<void> {
  await db.runAsync("INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES ('schrift_faktor', ?)", String(faktor));
}

export async function prueferLaden(db: SQLiteDatabase): Promise<string> {
  const r = await db.getFirstAsync<{ wert: string }>("SELECT wert FROM einstellungen WHERE schluessel = 'pruefer_name'");
  return r?.wert ?? '';
}

export async function prueferSpeichern(db: SQLiteDatabase, name: string): Promise<void> {
  await db.runAsync("INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES ('pruefer_name', ?)", name.trim());
}

// ---------- Lernende Vorschläge ----------
// Die App merkt sich, was geschrieben/gesucht wird, und schlägt es wieder vor. Alles nur am Handy.

export type VorschlagFeld = 'beschreibung' | 'mangel' | 'aufgabe' | 'pruefer' | 'suche' | 'material';

const NICHT_LERNEN = new Set(['', 'durchgeführt', 'übernommen beim anlegen des eintrags']);

export async function vorschlagLernen(db: SQLiteDatabase, feld: VorschlagFeld, text: string | null | undefined, eintragId?: string): Promise<void> {
  const t = (text ?? '').trim();
  if (t.length < 2 || t.length > 300 || NICHT_LERNEN.has(t.toLowerCase())) return;
  const z = jetztIso();
  const sql = `INSERT INTO vorschlaege (feld, text, eintrag_id, anzahl, zuletzt) VALUES (?, ?, ?, 1, ?)
               ON CONFLICT (feld, text, eintrag_id) DO UPDATE SET anzahl = anzahl + 1, zuletzt = excluded.zuletzt`;
  await db.runAsync(sql, feld, t, '', z);
  if (eintragId) await db.runAsync(sql, feld, t, eintragId, z);
}

/**
 * Passende Vorschläge: zuerst was bei diesem Eintrag geschrieben wurde, dann die häufigsten allgemein.
 * Bei leerer Eingabe die häufigsten; sonst alles, was die Eingabe enthält.
 */
export async function vorschlaegeLaden(db: SQLiteDatabase, feld: VorschlagFeld, eingabe: string, eintragId?: string, anzahl = 6): Promise<string[]> {
  const e = eingabe.trim();
  const rows = await db.getAllAsync<{ text: string }>(
    `SELECT text, MAX(eintrag_id = ?) AS passend, MAX(anzahl) AS n, MAX(zuletzt) AS z
       FROM vorschlaege
      WHERE feld = ? AND (eintrag_id = '' OR eintrag_id = ?) AND (? = '' OR text LIKE '%' || ? || '%') AND text <> ?
      GROUP BY text
      ORDER BY passend DESC, n DESC, z DESC
      LIMIT ?`,
    eintragId ?? '', feld, eintragId ?? '', e, e, e, anzahl,
  );
  return rows.map((r) => r.text);
}

export async function vorschlagLoeschen(db: SQLiteDatabase, feld: VorschlagFeld, text: string): Promise<void> {
  await db.runAsync('DELETE FROM vorschlaege WHERE feld = ? AND text = ?', feld, text);
}

// ---------- Hilfsfunktionen ----------

export function eintragIntervall(e: Eintrag): Intervall {
  return { wert: e.intervall_wert, einheit: e.intervall_einheit };
}

/** Fälligkeit eines Eintrags für heute. */
export function eintragFaelligkeit(e: EintragMitStatus, heuteIso: string) {
  return berechneFaelligkeit(
    { letzte: e.letzte_durchfuehrung, intervall: eintragIntervall(e), festerTermin: e.naechster_termin, einmalig: !!e.einmalig },
    heuteIso,
  );
}

/** Einträge in die Form bringen, die der Erinnerungsplan braucht. */
export function zuPlanEintraegen(liste: EintragMitStatus[]): PlanEintrag[] {
  return liste.map((e) => ({
    id: e.id, name: e.name, aufgabe: e.aufgabe, intervall: eintragIntervall(e),
    letzte: e.letzte_durchfuehrung, festerTermin: e.naechster_termin, uhrzeit: e.uhrzeit,
    einmalig: !!e.einmalig, schlummernBis: e.schlummern_bis,
  }));
}
