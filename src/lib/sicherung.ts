// Datensicherung: alle Daten als eine Datei speichern/teilen (z. B. Google Drive, E-Mail) und wieder einspielen.
// Wahlweise mit Fotos (Datei wird dann deutlich größer).
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import { heute } from './datum';
import { elternZuerst, Sicherung, TABELLEN } from './sicherungFormat';
export * from './sicherungFormat';

export async function sicherungErstellen(db: SQLiteDatabase, mitFotos = false): Promise<{ datei: string; anzahl: number; fotos: number }> {
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const tabellen: Sicherung['tabellen'] = {};
  let anzahl = 0;
  for (const t of TABELLEN) {
    tabellen[t] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
    anzahl += tabellen[t].length;
  }
  const s: Sicherung = { app: 'wartungsapp', dbVersion: v?.user_version ?? 0, erstellt: new Date().toISOString(), tabellen };
  const f = new File(Paths.cache, `Wartung-Sicherung-${heute()}${mitFotos ? '-mit-Fotos' : ''}.json`);
  if (f.exists) f.delete();
  f.create();
  // Stückweise schreiben, damit auch viele Fotos nicht den Speicher sprengen
  const kopf = JSON.stringify(s);
  let fotos = 0;
  if (!mitFotos) {
    await f.write(kopf);
  } else {
    await f.write(kopf.slice(0, -1) + ',"fotos":{');
    const dateien = await db.getAllAsync<{ datei: string }>('SELECT DISTINCT datei FROM fotos WHERE deleted_at IS NULL');
    for (const { datei } of dateien) {
      const bild = new File(Paths.document, 'fotos', datei);
      if (!bild.exists) continue;
      await f.write(`${fotos ? ',' : ''}${JSON.stringify(datei)}:"${await bild.base64()}"`, { append: true });
      fotos++;
    }
    await f.write('}}', { append: true });
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Sicherung speichern oder senden' });
  }
  await db.runAsync("INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES ('letzte_sicherung', ?)", heute());
  return { datei: f.uri, anzahl, fotos };
}

/** Datei auswählen und lesen. null = abgebrochen. */
export async function sicherungAuswaehlen(): Promise<unknown | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return null;
  const text = await new File(r.assets[0].uri).text();
  return JSON.parse(text);
}

/** Ersetzt ALLE aktuellen Daten durch die Sicherung. */
export async function sicherungEinspielen(db: SQLiteDatabase, s: Sicherung): Promise<number> {
  let anzahl = 0;
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const t of [...TABELLEN].reverse()) await tx.runAsync(`DELETE FROM ${t}`);
    for (const t of TABELLEN) {
      const spalten = new Set((await tx.getAllAsync<{ name: string }>(`PRAGMA table_info(${t})`)).map((c) => c.name));
      const zeilen = t === 'kategorien' ? elternZuerst(s.tabellen[t] ?? []) : (s.tabellen[t] ?? []);
      for (const z of zeilen) {
        const namen = Object.keys(z).filter((k) => spalten.has(k));
        if (!namen.length) continue;
        await tx.runAsync(
          `INSERT OR REPLACE INTO ${t} (${namen.join(', ')}) VALUES (${namen.map(() => '?').join(', ')})`,
          ...namen.map((k) => z[k] as string | number | null),
        );
        anzahl++;
      }
    }
  });
  // Fotos zurückschreiben
  if (s.fotos) {
    const ordner = new Directory(Paths.document, 'fotos');
    ordner.create({ intermediates: true, idempotent: true });
    for (const [datei, b64] of Object.entries(s.fotos)) {
      if (!/^[\w.-]+$/.test(datei)) continue; // nur einfache Dateinamen
      const bild = new File(ordner, datei);
      if (bild.exists) bild.delete();
      bild.create();
      await bild.write(b64, { encoding: 'base64' });
    }
  }
  return anzahl;
}

export async function letzteSicherung(db: SQLiteDatabase): Promise<string | null> {
  const r = await db.getFirstAsync<{ wert: string }>("SELECT wert FROM einstellungen WHERE schluessel = 'letzte_sicherung'");
  return r?.wert ?? null;
}
