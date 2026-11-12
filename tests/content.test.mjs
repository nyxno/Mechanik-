// node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, parseNumber, fmt } from '../js/util/expr.js';
import { EXERCISES, makeExercise } from '../js/content/exercises.js';
import { TOPICS, MODULES, topicById } from '../js/content/topics.js';
import { checkValue } from '../js/engine/checker.js';

test('Formel-Rechner rechnet in Grad und mit Variablen', () => {
  assert.ok(Math.abs(evaluate('F*cos(30)', { F: 100 }) - 86.60254) < 1e-3);
  assert.ok(Math.abs(evaluate('F * sin 30', { F: 100 }) - 50) < 1e-6);
  assert.ok(Math.abs(evaluate('sqrt(3^2+4^2)') - 5) < 1e-9);
  assert.ok(Math.abs(evaluate('(FG/2)/sin(alpha)', { FG: 400, alpha: 15 }) - 772.74) < 0.1);
  assert.ok(Math.abs(evaluate('atan(52/10)') - 79.11) < 0.05);
  assert.ok(Math.abs(evaluate('2 F', { F: 3 }) - 6) < 1e-9);
  assert.ok(Math.abs(evaluate('1,5*2') - 3) < 1e-9);
  assert.throws(() => evaluate('F*cos(30', { F: 1 }));
  assert.throws(() => evaluate('X*2', { F: 1 }));
  assert.equal(parseNumber('1.234,5'), 1234.5);
  assert.equal(parseNumber('86,6'), 86.6);
  assert.equal(fmt(86.60254), '86,6');
});

test('Lernplan ist vollständig verknüpft', () => {
  assert.equal(TOPICS.length, 16);
  assert.equal(MODULES.length, 3);
  for (const t of TOPICS) {
    for (const p of t.prereq || []) assert.ok(topicById(p), `Voraussetzung ${p} von ${t.id} fehlt`);
    assert.ok(t.steps.length >= 3, `${t.id} hat zu wenige Lernschritte`);
    assert.ok(t.formulas.length >= 2);
    for (const s of t.steps) if (s.sketch) assert.match(s.sketch(), /^<svg/);
  }
});

test('Jedes Thema hat Aufgaben, alle Generatoren liefern endliche Werte', () => {
  for (const t of TOPICS) {
    const n = EXERCISES.filter((e) => e.topic === t.id).length;
    assert.ok(n >= 1, `Keine Aufgaben für ${t.id}`);
  }
  for (const def of EXERCISES) {
    for (let seed = 1; seed <= 25; seed++) {
      const x = makeExercise(def.topic, def.level, seed * 7919 + def.id.length);
      assert.ok(x, def.id);
      assert.ok(x.text.length > 20);
      for (const w of x.wanted) {
        assert.ok(Number.isFinite(w.value), `${def.id}: ${w.key} nicht endlich (seed ${seed})`);
        assert.ok(Math.abs(w.value) < 1e9, `${def.id}: ${w.key} unplausibel groß`);
      }
      if (x.sketch) assert.match(x.sketch(), /^<svg/);
      assert.ok(x.steps.length >= 1);
      if (x.mc) assert.ok(x.mc.options.length >= 2);
    }
  }
});

test('Prüfung erkennt richtige Werte und typische Fehler', () => {
  const w = { key: 'S', label: 'S', unit: 'N', value: 772.74, alts: [{ value: 200, hint: 'F/2 Fehler' }] };
  assert.equal(checkValue(w, '773').ok, true);
  assert.equal(checkValue(w, '772,7').ok, true);
  assert.equal(checkValue(w, '200').hint, 'F/2 Fehler');
  assert.match(checkValue(w, '772740').hint, /Einheitenfehler/);
  assert.match(checkValue(w, '-773').hint, /Vorzeichen/);
  assert.equal(checkValue(w, '').state, 'empty');
});
