import { test } from 'node:test';
import assert from 'node:assert/strict';
import { automatischZeigen, monatsabschlussTag, monatsStatistik, naechsteStatistik, StatZeile } from './statistik';

const z = (datum: string, eintragId: string, kat: string, hitze: number, staub: number, ergebnis: StatZeile['ergebnis'] = 'ok'): StatZeile =>
  ({ datum, eintragId, name: `Gerät ${eintragId}`, kategorieId: kat, kategorieName: `Gebiet ${kat}`, farbe: null, ergebnis, hitze, staub });

test('Monatsabschluss: letzter Tag, Wochenende -> Freitag', () => {
  assert.equal(monatsabschlussTag(2026, 10), '2026-11-30'); // Mo
  assert.equal(monatsabschlussTag(2026, 9), '2026-10-30');  // 31.10. = Sa -> Fr 30.10.
  assert.equal(monatsabschlussTag(2026, 4), '2026-05-29');  // 31.05. = So -> Fr 29.05.
});

test('Nächste Statistik-Benachrichtigung', () => {
  const n = naechsteStatistik(new Date(2026, 10, 18, 9, 0));
  assert.equal(n.wann.getDate(), 30); assert.equal(n.wann.getHours(), 15); assert.equal(n.monat, 10);
  const n2 = naechsteStatistik(new Date(2026, 10, 30, 16, 0)); // schon vorbei -> Dezember
  assert.equal(n2.monat, 11); assert.equal(n2.wann.getDate(), 31); // 31.12.2026 = Do
});

test('Automatisch zeigen', () => {
  assert.deepEqual(automatischZeigen(new Date(2026, 10, 30, 15, 30), '2026-10'), { jahr: 2026, monat: 10 });
  assert.equal(automatischZeigen(new Date(2026, 10, 30, 15, 30), '2026-11'), null);
  assert.equal(automatischZeigen(new Date(2026, 10, 30, 10, 0), '2026-10'), null);   // noch vor 15 Uhr
  assert.deepEqual(automatischZeigen(new Date(2026, 11, 2, 8, 0), '2026-10'), { jahr: 2026, monat: 10 }); // Vormonat nachholen
  assert.equal(automatischZeigen(new Date(2026, 11, 12, 8, 0), '2026-10'), null);
});

test('Statistik: Summen, Ranglisten, Wochentage', () => {
  const s = monatsStatistik([
    z('2026-11-02', 'a', 'h', 2, 0),              // Mo
    z('2026-11-02', 'b', 'h', 0, 1.5),            // Mo
    z('2026-11-04', 'a', 'h', 1, 0, 'maengel'),   // Mi
    z('2026-11-10', 'c', 'm', 0, 0),              // Di
  ]);
  assert.equal(s.hitze, 3); assert.equal(s.staub, 1.5); assert.equal(s.stunden, 4.5);
  assert.equal(s.arbeiten, 4); assert.equal(s.arbeitstage, 3);
  assert.equal(s.tageHitze, 2); assert.equal(s.tageStaub, 1);
  assert.deepEqual(s.ergebnisse, { ok: 3, maengel: 1, ausser_betrieb: 0 });
  assert.equal(s.proEintrag[0].id, 'a'); assert.equal(s.proEintrag[0].stunden, 3); assert.equal(s.proEintrag[0].arbeiten, 2);
  assert.equal(s.proGebiet[0].id, 'h'); assert.equal(s.proGebiet[0].arbeiten, 3);
  assert.deepEqual(s.proWochentag, [2, 1, 1, 0, 0, 0, 0]);
  assert.deepEqual(s.staerksterTag, { datum: '2026-11-02', stunden: 3.5 });
  assert.equal(monatsStatistik([]).staerksterTag, null);
});

import { alsBaum, geschwister, mitUnterkategorien } from './kategorien';

test('Statistik: Stunden über die Zulagen-Taste zählen mit', () => {
  const s = monatsStatistik([z('2026-11-02', 'a', 'h', 1, 0)], [
    { datum: '2026-11-02', hitze: 2, staub: 0 },
    { datum: '2026-11-05', hitze: 0, staub: 1.5 },
  ]);
  assert.equal(s.hitze, 3); assert.equal(s.staub, 1.5); assert.equal(s.stunden, 4.5);
  assert.equal(s.direktStunden, 3.5);
  assert.equal(s.arbeiten, 1);                 // Zulagen-Taste ist keine Arbeit
  assert.equal(s.proTag.length, 2);
  assert.equal(s.tageStaub, 1);
  assert.deepEqual(s.staerksterTag, { datum: '2026-11-02', stunden: 3 });
});

test('Unterkategorien: Baum, Filter, Geschwister', () => {
  const l = [
    { id: 'h', eltern_id: null, sortierung: 1, name: 'Heizung' },
    { id: 'b', eltern_id: null, sortierung: 0, name: 'Brandschutz' },
    { id: 't', eltern_id: 'h', sortierung: 1, name: 'Thermen' },
    { id: 'k', eltern_id: 'h', sortierung: 0, name: 'Kessel' },
    { id: 'f', eltern_id: 'b', sortierung: 0, name: 'Feuerlöscher' },
    { id: 'x', eltern_id: 'weg', sortierung: 5, name: 'Waise' },
  ];
  assert.deepEqual(alsBaum(l).map((k) => `${k.ebene}${k.id}`), ['0b', '1f', '0h', '1k', '1t', '0x']);
  assert.deepEqual([...mitUnterkategorien('h', l)].sort(), ['h', 'k', 't']);
  assert.deepEqual(geschwister('t', l).map((k) => k.id), ['k', 't']);
  assert.deepEqual(geschwister('h', l).map((k) => k.id), ['b', 'h']);
});
