// Datensicherung: alle Daten als eine Datei speichern/teilen (z. B. Google Drive, E-Mail) und wieder einspielen.
// Fotos sind NICHT enthalten (zu groß) – nur die Daten.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import { heute } from './datum';
import { elternZuerst, Sicherung, TABELLEN } from './sicherungFormat';
export * from './sicherungFormat';

export async function sicherungErstellen(db: SQLiteDatabase): Promise<{ datei: string; anzahl: number }> {
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const tabellen: Sicherung['tabellen'] = {};
  let anzahl = 0;
  for (const t of TABELLEN) {
    tabellen[t] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
    anzahl += tabellen[t].length;
  }
  const s: Sicherung = { app: 'wartungsapp', dbVersion: v?.user_version ?? 0, erstellt: new Date().toISOString(), tabellen };
  const f = new File(Paths.cache, `Wartung-Sicherung-${heute()}.json`);
  if (f.exists) f.delete();
  f.create();
  await f.write(JSON.stringify(s));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Sicherung speichern oder senden' });
  }
  await db.runAsync("INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES ('letzte_sicherung', ?)", heute());
  return { datei: f.uri, anzahl };
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
  return anzahl;
}

export async function letzteSicherung(db: SQLiteDatabase): Promise<string | null> {
  const r = await db.getFirstAsync<{ wert: string }>("SELECT wert FROM einstellungen WHERE schluessel = 'letzte_sicherung'");
  return r?.wert ?? null;
}
