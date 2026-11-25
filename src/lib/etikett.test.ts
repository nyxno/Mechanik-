import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artikelnummerVorschlag, bezeichnungVorschlag, zeilenAusTexten } from './etikett';

test('Etikett: Zeilen, Artikelnummer, Bezeichnung', () => {
  const z = zeilenAusTexten(['LOCTITE 243\nSchraubensicherung mittelfest', 'Art.-Nr.: 1335884', '50 ml', 'LOCTITE 243']);
  assert.deepEqual(z, ['LOCTITE 243', 'Schraubensicherung mittelfest', 'Art.-Nr.: 1335884', '50 ml']);
  assert.equal(artikelnummerVorschlag(z), '1335884');
  assert.equal(bezeichnungVorschlag(z), 'LOCTITE 243');
});

test('Etikett: Artikelnummer ohne Kennzeichnung (nur Ziffern)', () => {
  assert.equal(artikelnummerVorschlag(['Kabelbinder 300 mm', '0502 300 100']), '0502 300 100');
  assert.equal(artikelnummerVorschlag(['Bestell-Nr. AB-1234/5']), 'AB-1234/5');
  assert.equal(artikelnummerVorschlag(['nur Text']), null);
  assert.equal(bezeichnungVorschlag(['12345', 'Art.-Nr. 1']), null);
});
