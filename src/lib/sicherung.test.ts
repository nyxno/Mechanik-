import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elternZuerst, sicherungPruefen } from './sicherungFormat';

test('Sicherung prüfen', () => {
  assert.match(sicherungPruefen({ foo: 1 }, 7)!, /keine Sicherung/);
  assert.match(sicherungPruefen({ app: 'wartungsapp', dbVersion: 9, tabellen: { eintraege: [], kategorien: [] } }, 7)!, /neueren/);
  assert.match(sicherungPruefen({ app: 'wartungsapp', dbVersion: 7, tabellen: {} }, 7)!, /unvollständig/);
  assert.equal(sicherungPruefen({ app: 'wartungsapp', dbVersion: 6, erstellt: 'x', tabellen: { eintraege: [], kategorien: [] } }, 7), null);
});

test('Unterkategorien nach Hauptkategorien', () => {
  const r = elternZuerst([{ id: 't', eltern_id: 'h' }, { id: 'h', eltern_id: null }]);
  assert.deepEqual(r.map((x) => x.id), ['h', 't']);
});
