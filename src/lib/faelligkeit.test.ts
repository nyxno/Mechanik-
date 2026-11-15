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
