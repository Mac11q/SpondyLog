'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { getTodayId, saveDefault, dailyMaterialization, resetDay, saveManual } = require('../defaultValues');

function createState() {
  return {
    pain: {},
    stiffness: {},
    defaultSkipDates: { pain: {}, stiffness: {} },
    settings: {
      defaultLevels: { pain: 0, stiffness: 0 },
      defaultStartDates: { pain: null, stiffness: null },
      defaultTimeZones: { pain: null, stiffness: null }
    }
  };
}

test('S1 Auto si vide', () => {
  const state = createState();
  const tz = 'UTC';
  const today = new Date('2023-08-20T10:00:00Z');
  const id = getTodayId(tz, today);
  saveDefault(state, 'pain', 1, today, tz);
  assert.strictEqual(state.pain[id], 1);
});

test('S2 Reset bloque auto', () => {
  const state = createState();
  const tz = 'UTC';
  const today = new Date('2023-08-20T10:00:00Z');
  const id = getTodayId(tz, today);
  saveDefault(state, 'pain', 1, today, tz);
  resetDay(state, id, ['pain']);
  dailyMaterialization(state, today, tz);
  assert.strictEqual(state.pain[id], undefined);
});

test('S3 Revalidation explicite', () => {
  const state = createState();
  const tz = 'UTC';
  const today = new Date('2023-08-20T10:00:00Z');
  const id = getTodayId(tz, today);
  saveDefault(state, 'pain', 1, today, tz);
  resetDay(state, id, ['pain']);
  dailyMaterialization(state, today, tz);
  saveDefault(state, 'pain', 1, today, tz);
  assert.strictEqual(state.pain[id], 1);
});

test('S4 Futur OK', () => {
  const state = createState();
  const tz = 'UTC';
  const day0 = new Date('2023-08-20T10:00:00Z');
  const day1 = new Date('2023-08-21T00:02:00Z');
  saveDefault(state, 'pain', 1, day0, tz);
  dailyMaterialization(state, day1, tz);
  const id1 = getTodayId(tz, day1);
  assert.strictEqual(state.pain[id1], 1);
});

test('S5 Pas de rétroactivité', () => {
  const state = createState();
  const tz = 'UTC';
  const day15 = new Date('2023-08-15T10:00:00Z');
  const id15 = getTodayId(tz, day15);
  saveDefault(state, 'pain', 1, day15, tz);
  resetDay(state, id15, ['pain']);
  const day20 = new Date('2023-08-20T10:00:00Z');
  const id20 = getTodayId(tz, day20);
  saveDefault(state, 'pain', 2, day20, tz);
  assert.strictEqual(state.pain[id15], undefined);
  assert.strictEqual(state.pain[id20], 2);
  const day21 = new Date('2023-08-21T00:02:00Z');
  dailyMaterialization(state, day21, tz);
  const id21 = getTodayId(tz, day21);
  assert.strictEqual(state.pain[id21], 2);
});

test('S6 Manual > Default', () => {
  const state = createState();
  const tz = 'UTC';
  const today = new Date('2023-08-20T10:00:00Z');
  const id = getTodayId(tz, today);
  saveDefault(state, 'pain', 1, today, tz);
  saveManual(state, id, 'pain', 3);
  dailyMaterialization(state, today, tz);
  assert.strictEqual(state.pain[id], 3);
});

test('S7 Zéro = vide', () => {
  const state = createState();
  const tz = 'UTC';
  const today = new Date('2023-08-20T10:00:00Z');
  const id = getTodayId(tz, today);
  saveManual(state, id, 'pain', 0);
  assert.strictEqual(state.pain[id], undefined);
});

test('S8 Chgmt TZ', () => {
  const state = createState();
  const activation = new Date('2023-08-20T10:00:00Z');
  saveDefault(state, 'pain', 1, activation, 'Europe/Paris');
  const newZoneDate = new Date('2023-08-21T00:30:00Z');
  dailyMaterialization(state, newZoneDate, 'America/New_York');
  const idNY = getTodayId('America/New_York', newZoneDate);
  const idParis = getTodayId('Europe/Paris', newZoneDate);
  assert.strictEqual(state.pain[idNY], 1);
  assert.strictEqual(state.pain[idParis], undefined);
});

test('S9 Reset défaut à zéro efface la valeur du jour', () => {
  const state = createState();
  const tz = 'UTC';
  const today = new Date('2023-08-20T10:00:00Z');
  const id = getTodayId(tz, today);
  saveDefault(state, 'pain', 1, today, tz);
  assert.strictEqual(state.pain[id], 1);
  saveDefault(state, 'pain', 0, today, tz);
  assert.strictEqual(state.pain[id], undefined);
});
