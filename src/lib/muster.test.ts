import { test } from 'node:test';
import assert from 'node:assert/strict';
import { standortGruppen, standortVon, ueblicheZeit, wiederkehrendeMaengel, woerter, zuordnungVorschlag } from './muster';
import { monatsRaster, termineImBereich } from './kalender';
import { freieFarbe, GEBIETSFARBEN } from './farben';

const j = { wert: 1, einheit: 'jahre' as const };
const kat = [{ id: 'h', name: 'Heizung' }, { id: 'b', name: 'Brandschutz' }, { id: 'l', name: 'Leitern' }, { id: 'a', name: 'Anschlagmittel' }];

test('Wörter ohne Zahlen und Füllwörter', () => {
  assert.deepEqual(woerter('Therme Halle 2 im Keller'), ['therme', 'halle', 'keller']);
});

test('Zuordnung: ähnlicher eigener Eintrag', () => {
  const v = zuordnungVorschlag('Therme Keller', [
    { name: 'Therme Halle 2', kategorie_id: 'h', intervall: j, einmalig: false, aufgabe: 'Wartung Brenner' },
    { name: 'Leiter Lager', kategorie_id: 'l', intervall: j, einmalig: false, aufgabe: '' },
  ], kat);
  assert.equal(v?.kategorie_id, 'h');
  assert.equal(v?.vorbild, 'Therme Halle 2');
  assert.equal(v?.aufgabe, 'Wartung Brenner');
  assert.deepEqual(v?.intervall, j);
});

test('Zuordnung: Wörterbuch, wenn noch nichts Ähnliches da ist', () => {
  assert.equal(zuordnungVorschlag('Feuerlöscher Büro', [], kat)?.kategorie_id, 'b');
  assert.equal(zuordnungVorschlag('Kettengehänge 2-strängig', [], kat)?.kategorie_id, 'a');
  assert.equal(zuordnungVorschlag('Stehleiter 6 Stufen', [], kat)?.kategorie_id, 'l');
  assert.equal(zuordnungVorschlag('xyz', [], kat), null);
});

test('Wiederkehrende Mängel in 12 Monaten', () => {
  const m = wiederkehrendeMaengel([
    { eintragId: 'a', datum: '2026-02-01', notiz: 'Dichtung undicht' },
    { eintragId: 'a', datum: '2026-06-01', notiz: 'dichtung undicht' },
    { eintragId: 'a', datum: '2026-09-01', notiz: 'Druck zu niedrig' },
    { eintragId: 'b', datum: '2026-05-01', notiz: 'X' },
    { eintragId: 'c', datum: '2024-01-01', notiz: 'alt' },
    { eintragId: 'c', datum: '2024-02-01', notiz: 'alt' },
  ], '2026-11-17');
  assert.equal(m.length, 1);
  assert.equal(m[0].eintragId, 'a');
  assert.equal(m[0].anzahl, 3);
  assert.equal(m[0].haeufigste, 'Dichtung undicht');
  assert.equal(m[0].haeufigsteAnzahl, 2);
});

test('Standort erkennen und gruppieren', () => {
  assert.equal(standortVon('Therme Halle 2'), 'Halle 2');
  assert.equal(standortVon('Feuerlöscher Keller links'), 'Keller');
  assert.equal(standortVon('Leiter'), null);
  const g = standortGruppen([
    { id: '1', name: 'Therme Halle 2', zusatzinfo: '', naechster: '2026-11-20' },
    { id: '2', name: 'Feuerlöscher', zusatzinfo: 'Standort: Halle 2, Tor', naechster: '2026-11-25' },
    { id: '3', name: 'Leiter Halle 2', zusatzinfo: '', naechster: '2027-05-01' },
    { id: '4', name: 'Kompressor Keller', zusatzinfo: '', naechster: '2026-11-19' },
  ], '2026-11-17');
  assert.equal(g.length, 1);
  assert.equal(g[0].standort, 'Halle 2');
  assert.deepEqual(g[0].ids, ['1', '2']);
});

test('Übliche Arbeitszeit', () => {
  const d = (tag: number, h: number) => new Date(2026, 10, tag, h, 15);
  // 17.11.2026 = Dienstag
  const z = ueblicheZeit([d(17, 7), d(17, 8), d(24, 8), d(10, 9), d(12, 8), d(3, 7)]);
  assert.equal(z?.stunde, 8);
  assert.equal(z?.wochentag, 2);
  assert.equal(ueblicheZeit([d(17, 7)]), null);
});

test('Kalender: Wiederholungen und Überfälliges', () => {
  const r = monatsRaster(2026, 10); // November 2026
  assert.equal(r.length, 42);
  assert.equal(r[0], '2026-10-26'); // Montag vor dem 1.11.
  const k = termineImBereich([
    { id: 'm', letzte: '2026-10-05', intervall: { wert: 1, einheit: 'monate' } }, // 5.11., 5.12. ...
    { id: 'u', letzte: null, intervall: j, festerTermin: '2026-11-10' },           // überfällig
    { id: 'w', letzte: null, intervall: { wert: 1, einheit: 'wochen' }, festerTermin: '2026-11-21' }, // Sa -> Fr 20.11., dann wöchentlich
    { id: 'e', letzte: null, intervall: j, festerTermin: '2026-11-30', einmalig: true },
  ], '2026-11-01', '2026-12-31', '2026-11-17');
  assert.deepEqual(k.get('2026-11-10'), [{ id: 'u', ueberfaellig: true }]);
  assert.deepEqual(k.get('2026-11-05'), [{ id: 'm', ueberfaellig: true }]); // monatlich, schon vorbei -> überfällig
  assert.deepEqual(k.get('2026-11-20'), [{ id: 'w', ueberfaellig: false }]); // Sa 21.11. -> Fr 20.11.
  assert.deepEqual(k.get('2026-11-27')?.map((x) => x.id), ['w']);
  assert.deepEqual(k.get('2026-11-30')?.map((x) => x.id), ['e']);
  assert.deepEqual(k.get('2026-12-04')?.map((x) => x.id).sort(), ['m', 'w']); // Sa 5.12. -> Fr 4.12.
  assert.equal([...k.values()].flat().filter((x) => x.id === 'e').length, 1); // einmalig nur einmal
});

test('Farben: freie Farbe', () => {
  assert.equal(freieFarbe([]), GEBIETSFARBEN[0]);
  assert.equal(freieFarbe([GEBIETSFARBEN[0]]), GEBIETSFARBEN[1]);
});

import { textFarbe, ALTE_FARBEN } from './farben';
import { heuteOderMontag } from './datum';

test('Grelle Farben: 24 Stück, alle verschieden, alte Farben abgebildet', () => {
  assert.equal(GEBIETSFARBEN.length, 24);
  assert.equal(new Set(GEBIETSFARBEN).size, 24);
  for (const neu of Object.values(ALTE_FARBEN)) assert.ok(GEBIETSFARBEN.includes(neu));
});

test('Lesbare Schrift auf Farben', () => {
  assert.equal(textFarbe('#FFD600'), '#111827'); // Gelb -> dunkle Schrift
  assert.equal(textFarbe('#76FF03'), '#111827'); // Neongrün -> dunkle Schrift
  assert.equal(textFarbe('#304FFE'), '#FFFFFF'); // Königsblau -> weiße Schrift
  assert.equal(textFarbe('#6200EA'), '#FFFFFF');
});

test('Einmalig: heute, am Wochenende Montag', () => {
  assert.equal(heuteOderMontag('2026-11-18'), '2026-11-18'); // Mi
  assert.equal(heuteOderMontag('2026-11-21'), '2026-11-23'); // Sa -> Mo
  assert.equal(heuteOderMontag('2026-11-22'), '2026-11-23'); // So -> Mo
});

import { hinweiseErstellen } from './hinweise';

test('Hinweis-Schlüssel ändert sich bei neuem Mangel (ausgeblendet -> kommt wieder)', () => {
  const basis = { eintraege: [{ id: 'a', name: 'Therme', zusatzinfo: '', naechster: null }], zeitpunkte: [], standardUhrzeit: '07:00', heuteIso: '2026-11-22' };
  const zwei = hinweiseErstellen({ ...basis, maengel: [{ eintragId: 'a', datum: '2026-10-01', notiz: 'x' }, { eintragId: 'a', datum: '2026-11-01', notiz: 'x' }] });
  const drei = hinweiseErstellen({ ...basis, maengel: [{ eintragId: 'a', datum: '2026-09-01', notiz: 'x' }, { eintragId: 'a', datum: '2026-10-01', notiz: 'x' }, { eintragId: 'a', datum: '2026-11-01', notiz: 'x' }] });
  assert.equal(zwei[0].schluessel, 'mangel:a:2');
  assert.notEqual(zwei[0].schluessel, drei[0].schluessel);
});

test('Zuordnung: Ortsangaben zählen nicht (Therme Büro ist keine Feuerlöscher-Sache)', () => {
  const v = zuordnungVorschlag('Therme Büro', [
    { name: 'Feuerlöscher Büro', kategorie_id: 'b', intervall: j, einmalig: false, aufgabe: '' },
    { name: 'Therme Halle 2', kategorie_id: 'h', intervall: j, einmalig: false, aufgabe: '' },
  ], kat);
  assert.equal(v?.kategorie_id, 'h');
  assert.equal(zuordnungVorschlag('Keller', [{ name: 'Therme Keller', kategorie_id: 'h', intervall: j, einmalig: false, aufgabe: '' }], kat), null);
});

test('Standort: häufige (wöchentliche) Arbeiten zählen nicht', () => {
  const g = standortGruppen([
    { id: '1', name: 'Drehbank Werkstatt', zusatzinfo: '', naechster: '2026-11-20', intervallTage: 7 },
    { id: '2', name: 'Kompressor Werkstatt', zusatzinfo: '', naechster: '2026-11-25', intervallTage: 91 },
    { id: '3', name: 'Heizkessel Werkstatt', zusatzinfo: '', naechster: '2026-11-28', intervallTage: 183 },
  ], '2026-11-17');
  assert.deepEqual(g[0].ids, ['2', '3']);
});
