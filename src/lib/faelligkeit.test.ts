import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechneFaelligkeit, warnTage } from './faelligkeit';
import { plusMonate, parseDeutsch, formatDeutsch, tageZwischen } from './datum';
import { intervallText } from './intervall';

test('Monate addieren klemmt auf Monatsende', () => {
  assert.equal(plusMonate('2026-01-31', 1), '2026-02-28');
  assert.equal(plusMonate('2026-11-15', 3), '2027-02-15');
  assert.equal(plusMonate('2024-02-29', 12), '2025-02-28');
});

test('deutsches Datum lesen und schreiben', () => {
  assert.equal(parseDeutsch('1.2.2026'), '2026-02-01');
  assert.equal(parseDeutsch('31.02.2026'), null);
  assert.equal(formatDeutsch('2026-11-15'), '15.11.2026');
  assert.equal(tageZwischen('2026-11-15', '2026-11-20'), 5);
});

test('Status: nie, überfällig, bald, ok', () => {
  const jaehrlich = { wert: 1, einheit: 'jahre' as const };
  assert.equal(berechneFaelligkeit(null, jaehrlich, '2026-11-15').status, 'nie');
  assert.equal(berechneFaelligkeit('2025-01-01', jaehrlich, '2026-11-15').status, 'ueberfaellig');
  assert.equal(berechneFaelligkeit('2025-11-20', jaehrlich, '2026-11-15').status, 'bald');
  assert.equal(berechneFaelligkeit('2026-06-01', jaehrlich, '2026-11-15').status, 'ok');
  const f = berechneFaelligkeit('2025-11-20', jaehrlich, '2026-11-15');
  assert.equal(f.naechster, '2026-11-20');
  assert.equal(f.tage, 5);
});

test('Vorwarnzeit ist bei kurzen Intervallen kürzer', () => {
  assert.equal(warnTage({ wert: 1, einheit: 'jahre' }), 14);
  assert.equal(warnTage({ wert: 1, einheit: 'wochen' }), 2);
  assert.equal(warnTage({ wert: 1, einheit: 'tage' }), 1);
});

test('Intervall-Text', () => {
  assert.equal(intervallText({ wert: 1, einheit: 'jahre' }), 'jährlich');
  assert.equal(intervallText({ wert: 3, einheit: 'monate' }), 'alle 3 Monate');
});

import { naechsterTermin } from './faelligkeit';
import { erinnerungsPlan, PlanEintrag } from './erinnerungsplan';
import { zeitpunkt, istGueltigeUhrzeit } from './uhrzeit';

test('fester Termin hat Vorrang vor Intervall', () => {
  const j = { wert: 1, einheit: 'jahre' as const };
  assert.equal(naechsterTermin('2026-01-10', j, null), '2027-01-10');
  assert.equal(naechsterTermin('2026-01-10', j, '2026-12-01'), '2026-12-01');
  assert.equal(naechsterTermin(null, j, '2026-12-01'), '2026-12-01');
  assert.equal(naechsterTermin(null, j, null), null);
  // Neuer Eintrag ohne Durchführung, aber mit Termin: nicht mehr "noch nie", sondern nach Datum
  assert.equal(berechneFaelligkeit(null, j, '2026-11-15', '2026-11-20').status, 'bald');
  assert.equal(berechneFaelligkeit(null, j, '2026-11-15', '2027-03-01').status, 'ok');
});

test('Uhrzeit', () => {
  assert.ok(istGueltigeUhrzeit('07:30'));
  assert.ok(!istGueltigeUhrzeit('24:00'));
  assert.ok(!istGueltigeUhrzeit('7:30'));
  const d = zeitpunkt('2026-11-20', '14:45');
  assert.equal(d.getHours(), 14);
  assert.equal(d.getMinutes(), 45);
});

test('Erinnerungsplan: Vorwarnung, Fälligkeit, Überfällig-Sammelmeldung', () => {
  const j = { wert: 1, einheit: 'jahre' as const };
  const basis = { aufgabe: 'Sichtprüfung', intervall: j, letzte: null, uhrzeit: null };
  const eintraege: PlanEintrag[] = [
    { ...basis, id: 'a', name: 'Therme', festerTermin: '2026-11-25', uhrzeit: '09:15' },
    { ...basis, id: 'b', name: 'Leiter', festerTermin: '2026-11-01' },
    { ...basis, id: 'c', name: 'Löscher', festerTermin: '2026-10-01' },
    { ...basis, id: 'd', name: 'Ohne Termin', festerTermin: null },
  ];
  const jetzt = new Date(2026, 10, 15, 12, 0); // 15.11.2026 12:00
  const plan = erinnerungsPlan(eintraege, { aktiv: true, uhrzeit: '07:00', vorwarnTage: 7 }, jetzt);
  assert.equal(plan.length, 3);
  // Vorwarnung 18.11. 09:15, Fälligkeit 25.11. 09:15, Sammelmeldung 16.11. 07:00 (heute 07:00 schon vorbei)
  const [ueber, vor, faellig] = plan;
  assert.equal(ueber.art, 'ueberfaellig');
  assert.equal(ueber.wann.getDate(), 16);
  assert.equal(ueber.titel, '❗ 2 Prüfungen überfällig');
  assert.equal(vor.art, 'vorwarnung');
  assert.equal(vor.wann.getDate(), 18);
  assert.equal(vor.wann.getHours(), 9);
  assert.equal(faellig.art, 'faellig');
  assert.equal(faellig.wann.getDate(), 25);
  assert.equal(faellig.eintragId, 'a');

  assert.equal(erinnerungsPlan(eintraege, { aktiv: false, uhrzeit: '07:00', vorwarnTage: 7 }, jetzt).length, 0);
});
