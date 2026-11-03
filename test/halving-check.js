'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const STATE_PATH = path.join(__dirname, '..', 'account', 'halving.json');
fs.writeFileSync(STATE_PATH, JSON.stringify({ totalGemsHeld: 0 }, null, 2));

delete require.cache[require.resolve('../src/lib/halving')];
delete require.cache[require.resolve('../src/lib/effects')];

const {
  BASE_INTERVAL, INTERVAL_GROWTH, FLOOR_MULTIPLIER,
  getGemMultiplier, getHalvings, getNextHalvingAt, addGemsHeld, getState, round2,
} = require('../src/lib/halving');
const { rollGems, applyBreak } = require('../src/lib/effects');
const { defaultAccount } = require('../src/lib/account');

assert.strictEqual(BASE_INTERVAL, 10_000_000);
assert.strictEqual(INTERVAL_GROWTH, 2);
assert.strictEqual(FLOOR_MULTIPLIER, 0.01);

// Sebelum ambang pertama, multiplier 1.
assert.strictEqual(getGemMultiplier(), 1);
assert.strictEqual(getHalvings(), 0);

// Di ambang pertama (10 juta) -> 0.5.
addGemsHeld(10_000_000);
assert.strictEqual(getGemMultiplier(), 0.5);
assert.strictEqual(getHalvings(), 1);

// Selanjutnya ambang bertambah 20 juta (total 30 juta) -> 0.25.
addGemsHeld(20_000_000);
assert.strictEqual(getGemMultiplier(), 0.25);
assert.strictEqual(getHalvings(), 2);

// Selanjutnya ambang bertambah 40 juta (total 70 juta) -> 0.125.
addGemsHeld(40_000_000);
assert.strictEqual(getGemMultiplier(), 0.125);
assert.strictEqual(getHalvings(), 3);

// Floor tak pernah nol (pakai angka sangat besar; halving >= 7).
addGemsHeld(10_000_000_000);
assert.strictEqual(getGemMultiplier(), FLOOR_MULTIPLIER);

// rollGems dalam rentang.
for (let i = 0; i < 1000; i++) {
  const g = rollGems(1, 5);
  assert.ok(g >= 1 && g <= 5, `rollGems out of range: ${g}`);
}
assert.strictEqual(round2(5), 5);
assert.ok(round2(0.125) === 0.12 || round2(0.125) === 0.13, 'round2');

// applyBreak naikkan total held sebesar gems yang diterima.
const acc = defaultAccount({ id: 'u1', username: 't1' });
acc.farmableId = 'diamond';
acc.equippedItemId = 'fist';
acc.farmables = { diamond: 99999 };
const before = getState().totalGemsHeld;
const res = applyBreak(acc);
assert.ok(res.broke);
assert.ok(res.gems === round2(res.gems), `gems not 2-decimal: ${res.gems}`);
assert.strictEqual(acc.gems, res.gems);
assert.strictEqual(getState().totalGemsHeld, round2(before + res.gems));

console.log('self-check passed: long-term halving + floor + round2 OK');
console.log(JSON.stringify(getState(), null, 2));
