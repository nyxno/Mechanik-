// NUR FÜR ENTWICKLUNG/SIMULATION: legt realistische Beispieldaten an.
// Wird in der fertigen App nicht angezeigt (nur wenn __DEV__ wahr ist).
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  durchfuehrungAnlegen, eintragAnlegen, kategorieAnlegen, kategorienLaden, materialSpeichern, prueferSpeichern, zulageSetzen,
} from '@/db/repo';
import { heute, plusTage } from '@/lib/datum';
import type { Intervall } from '@/lib/intervall';

const j: Intervall = { wert: 1, einheit: 'jahre' };
const m3: Intervall = { wert: 3, einheit: 'monate' };
const m6: Intervall = { wert: 6, einheit: 'monate' };
const w1: Intervall = { wert: 1, einheit: 'wochen' };

export async function testdatenAnlegen(db: SQLiteDatabase): Promise<void> {
  const h = heute();
  const kat = await kategorienLaden(db);
  const id = (name: string) => kat.find((k) => k.name === name)?.id ?? '';
  const thermen = await kategorieAnlegen(db, 'Thermen', id('Heizung'));
  const loescher = await kategorieAnlegen(db, 'Feuerlöscher', id('Brandschutz'));
  await prueferSpeichern(db, 'Max Muster');

  const neu = async (kategorie_id: string, name: string, aufgabe: string, intervall: Intervall, zusatzinfo = '', einmalig = false, naechster: string | null = null) =>
    eintragAnlegen(db, { kategorie_id, name, aufgabe, intervall, zusatzinfo, naechster_termin: naechster, uhrzeit: null, einmalig });
  const gemacht = (eintragId: string, tageZurueck: number, extra: Partial<Parameters<typeof durchfuehrungAnlegen>[1]> = {}) =>
    durchfuehrungAnlegen(db, { eintragId, datum: plusTage(h, -tageZurueck), beschreibung: 'Sichtprüfung ohne Befund', naechsterTermin: null, pruefer: 'Max Muster', ...extra });

  const t1 = await neu(thermen, 'Therme Halle 2', 'Brenner reinigen, Abgasmessung', j, 'Vaillant ecoTEC, SN 4711');
  await gemacht(t1, 350, { hitze: 2 });
  const t2 = await neu(thermen, 'Therme Keller', 'Wartung nach Herstellervorgabe', j, 'Buderus GB172');
  await gemacht(t2, 380, { hitze: 1.5, ergebnis: 'maengel', notiz: 'Dichtung undicht' });
  await gemacht(t2, 200, { ergebnis: 'maengel', notiz: 'Dichtung undicht', hitze: 1 });
  const k1 = await neu(id('Heizung'), 'Heizkessel Werkstatt', 'Kesselreinigung', m6, 'Halle 2');
  await gemacht(k1, 170, { hitze: 3, staub: 1 });
  const f1 = await neu(loescher, 'Feuerlöscher Halle 2 Tor', 'Prüfung nach ASR', { wert: 2, einheit: 'jahre' }, 'Standort: Halle 2');
  await gemacht(f1, 700);
  const f2 = await neu(loescher, 'Feuerlöscher Büro', 'Prüfung', { wert: 2, einheit: 'jahre' });
  await gemacht(f2, 300);
  const r1 = await neu(id('Brandschutz'), 'Rauchmelder Lager', 'Funktionstest', j, 'Lager');
  await gemacht(r1, 360);
  const l1 = await neu(id('Leitern'), 'Stehleiter 6 Stufen', 'Sichtprüfung Holme, Sprossen', j, 'Werkstatt');
  await gemacht(l1, 20);
  const l2 = await neu(id('Leitern'), 'Anlegeleiter Halle 2', 'Sichtprüfung', j);
  await gemacht(l2, 340);
  const a1 = await neu(id('Anschlagmittel'), 'Kettengehänge 2-strängig', 'Prüfung durch befähigte Person', j);
  await gemacht(a1, 100, { ergebnis: 'ausser_betrieb', notiz: 'Glied verformt' });
  await neu(id('Anschlagmittel'), 'Rundschlingen Satz', 'Sichtprüfung', j, '', false, plusTage(h, 3));
  const d1 = await neu(id('Druckbehälter'), 'Kompressor Werkstatt', 'Kondensat ablassen, Sicherheitsventil prüfen', m3, 'Werkstatt');
  await gemacht(d1, 80, { staub: 2 });
  const m1 = await neu(id('Maschinen'), 'Drehbank', 'Schmierung, Führungsbahnen reinigen', w1, 'Werkstatt');
  for (const t of [1, 8, 15, 22]) await gemacht(m1, t, { staub: 0.5, beschreibung: 'Geschmiert' });
  const m2 = await neu(id('Maschinen'), 'Bandsäge', 'Sägeband prüfen', m3, 'Halle 2');
  await gemacht(m2, 95, { staub: 1.5 });
  await neu(id('Maschinen'), 'Standbohrmaschine', 'Sichtprüfung', j);
  await neu(id('Heizung'), 'Ausdehnungsgefäß prüfen', 'Vordruck messen', j, '', true, plusTage(h, 5));

  for (const [t, hz, st] of [[0, 1, 0], [2, 2, 0.5], [3, 0, 1], [6, 1.5, 0], [9, 0.5, 2]] as const) {
    await zulageSetzen(db, plusTage(h, -t), hz, st);
  }
  await materialSpeichern(db, null, { name: 'Dichtung 1/2 Zoll', menge: 4, einheit: 'Stk', notiz: 'Art.-Nr. 12345', eintrag_id: t2 });
  await materialSpeichern(db, null, { name: 'Kompressoröl', menge: 1, einheit: 'l', notiz: '', eintrag_id: d1 });
  await materialSpeichern(db, null, { name: 'Sägeband 2750 mm', menge: 2, einheit: 'Stk', notiz: 'Lieferant Müller', eintrag_id: m2 });
}
