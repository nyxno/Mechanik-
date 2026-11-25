import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechneFaelligkeit, naechsterTermin, warnTage } from './faelligkeit';
import { aufWerktag, formatDeutsch, montagDerWoche, parseDeutsch, plusMonate, schlummerZiel, tageZwischen } from './datum';
import { intervallText } from './intervall';
import { erinnerungsPlan, PlanEintrag } from './erinnerungsplan';
import { istGueltigeUhrzeit, zeitpunkt } from './uhrzeit';
import { wochenGrenzen, wochenGruppe } from './woche';

const jaehrlich = { wert: 1, einheit: 'jahre' as const };
const f = (letzte: string | null, heute: string, festerTermin: string | null = null, einmalig = false) =>
  berechneFaelligkeit({ letzte, intervall: jaehrlich, festerTermin, einmalig }, heute);

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
  assert.equal(f(null, '2026-11-15').status, 'nie');
  assert.equal(f('2025-01-01', '2026-11-15').status, 'ueberfaellig');
  assert.equal(f('2025-11-20', '2026-11-15').status, 'bald');
  assert.equal(f('2026-06-01', '2026-11-15').status, 'ok');
  const x = f('2025-11-20', '2026-11-15');
  assert.equal(x.naechster, '2026-11-20');
  assert.equal(x.tage, 5);
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

test('fester Termin hat Vorrang vor Intervall', () => {
  assert.equal(naechsterTermin({ letzte: '2026-01-12', intervall: jaehrlich }), '2027-01-12');
  assert.equal(naechsterTermin({ letzte: '2026-01-12', intervall: jaehrlich, festerTermin: '2026-12-01' }), '2026-12-01');
  assert.equal(naechsterTermin({ letzte: null, intervall: jaehrlich, festerTermin: '2026-12-01' }), '2026-12-01');
  assert.equal(naechsterTermin({ letzte: null, intervall: jaehrlich }), null);
  assert.equal(f(null, '2026-11-15', '2026-11-20').status, 'bald');
  assert.equal(f(null, '2026-11-15', '2027-03-01').status, 'ok');
});

test('Wochenende: Samstag -> Freitag, Sonntag -> Montag', () => {
  assert.equal(aufWerktag('2026-11-21'), '2026-11-20'); // Sa -> Fr
  assert.equal(aufWerktag('2026-11-22'), '2026-11-23'); // So -> Mo
  assert.equal(aufWerktag('2026-11-18'), '2026-11-18'); // Mi bleibt
  const x = f('2025-11-21', '2026-11-01'); // +1 Jahr = Sa 21.11.2026
  assert.equal(x.naechster, '2026-11-20');
  assert.equal(x.verschobenVon, '2026-11-21');
  assert.equal(f(null, '2026-11-01', '2026-11-22').naechster, '2026-11-23'); // auch feste Termine
});

test('Einmalig: Termin nur aus festem Datum, nach Durchführung erledigt', () => {
  assert.equal(f(null, '2026-11-15', '2026-11-30', true).status, 'ok');
  assert.equal(f(null, '2026-11-15', null, true).status, 'nie');
  const erl = f('2026-11-14', '2026-11-15', '2026-11-30', true);
  assert.equal(erl.status, 'erledigt');
  assert.equal(erl.naechster, null);
  assert.equal(erl.text, 'Erledigt am 14.11.2026');
});

test('Schlummern: nächster Tag, Wochenende -> Montag', () => {
  assert.equal(schlummerZiel('2026-11-17'), '2026-11-18'); // Di -> Mi
  assert.equal(schlummerZiel('2026-11-20'), '2026-11-23'); // Fr -> Mo
  assert.equal(schlummerZiel('2026-11-21'), '2026-11-23'); // Sa -> Mo
  assert.equal(schlummerZiel('2026-11-15'), '2026-11-16'); // So -> Mo
});

test('Wochen: Montag bis Sonntag', () => {
  assert.equal(montagDerWoche('2026-11-15'), '2026-11-09'); // Sonntag gehört zur alten Woche
  const w = wochenGrenzen('2026-11-18');
  assert.deepEqual(w, { dieseVon: '2026-11-16', dieseBis: '2026-11-22', naechsteVon: '2026-11-23', naechsteBis: '2026-11-29' });
  const g = (fest: string) => wochenGruppe(f(null, '2026-11-18', fest), '2026-11-18');
  assert.equal(g('2026-11-10'), 'ueberfaellig');
  assert.equal(g('2026-11-20'), 'diese');
  assert.equal(g('2026-11-26'), 'naechste');
  assert.equal(g('2026-12-15'), null);
});

test('Uhrzeit', () => {
  assert.ok(istGueltigeUhrzeit('07:30'));
  assert.ok(!istGueltigeUhrzeit('24:00'));
  assert.ok(!istGueltigeUhrzeit('7:30'));
  const d = zeitpunkt('2026-11-20', '14:45');
  assert.equal(d.getHours(), 14);
  assert.equal(d.getMinutes(), 45);
});

const basis = { aufgabe: 'Sichtprüfung', intervall: jaehrlich, letzte: null, uhrzeit: null };
const einst = { aktiv: true, uhrzeit: '07:00', vorwarnTage: 7 };

test('Erinnerungsplan: Vorwarnung, Fälligkeit, Überfällig-Sammelmeldung', () => {
  const eintraege: PlanEintrag[] = [
    { ...basis, id: 'a', name: 'Therme', festerTermin: '2026-11-25', uhrzeit: '09:15' },
    { ...basis, id: 'b', name: 'Leiter', festerTermin: '2026-11-03' },
    { ...basis, id: 'c', name: 'Löscher', festerTermin: '2026-10-01' },
    { ...basis, id: 'd', name: 'Ohne Termin', festerTermin: null },
    { ...basis, id: 'e', name: 'Einmalig erledigt', festerTermin: '2026-12-01', einmalig: true, letzte: '2026-11-10' },
  ];
  const jetzt = new Date(2026, 10, 15, 12, 0); // So 15.11.2026 12:00
  const plan = erinnerungsPlan(eintraege, einst, jetzt);
  assert.equal(plan.length, 3);
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
  assert.equal(erinnerungsPlan(eintraege, { ...einst, aktiv: false }, jetzt).length, 0);
});

test('Erinnerungsplan: Schlummern verschiebt nur die Erinnerung', () => {
  const jetzt = new Date(2026, 10, 15, 12, 0);
  const plan = erinnerungsPlan([
    { ...basis, id: 'a', name: 'Therme', festerTermin: '2026-11-10', schlummernBis: '2026-11-16' },
  ], einst, jetzt);
  assert.equal(plan.length, 1); // keine Überfällig-Sammelmeldung, nur die Schlummer-Erinnerung
  assert.equal(plan[0].art, 'schlummer');
  assert.equal(plan[0].wann.getDate(), 16);
  assert.ok(plan[0].text.includes('10.11.2026')); // echte Prüffrist bleibt sichtbar

  // Abgelaufenes Schlummern wird ignoriert
  const alt = erinnerungsPlan([
    { ...basis, id: 'a', name: 'Therme', festerTermin: '2026-11-10', schlummernBis: '2026-11-12' },
  ], einst, jetzt);
  assert.equal(alt[0].art, 'ueberfaellig');
});

test('Morgen-Übersicht: Mo–Fr, ersetzt Einzelmeldungen zur Standard-Uhrzeit', () => {
  const jetzt = new Date(2026, 10, 25, 22, 0); // Mi 25.11.2026 22:00
  const plan = erinnerungsPlan([
    { ...basis, id: 'a', name: 'Pumpe 1', festerTermin: '2026-11-26' },            // Do
    { ...basis, id: 'b', name: 'Kühlturm', festerTermin: '2026-11-20' },           // überfällig
    { ...basis, id: 'c', name: 'Eigene Zeit', festerTermin: '2026-11-27', uhrzeit: '13:00' }, // Fr, eigene Uhrzeit
  ], { ...einst, vorwarnTage: 0, morgen: true }, jetzt);
  const morgen = plan.filter((p) => p.art === 'morgen');
  assert.equal(morgen[0].wann.getDate(), 26);
  assert.equal(morgen[0].titel, '☀️ Heute: 2 Arbeiten, 1 überfällig');
  assert.ok(!morgen.some((m) => [28, 29].includes(m.wann.getDate()))); // kein Sa/So
  assert.ok(!plan.some((p) => p.art === 'faellig' && p.eintragId === 'a')); // keine doppelte Einzelmeldung
  assert.ok(plan.some((p) => p.art === 'faellig' && p.eintragId === 'c'));  // eigene Uhrzeit bleibt
  assert.ok(!plan.some((p) => p.art === 'ueberfaellig'));
});
