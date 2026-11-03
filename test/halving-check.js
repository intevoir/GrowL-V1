'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const STATE_PATH = path.join(__dirname, '..', 'account', 'halving.json');
fs.writeFileSync(STATE_PATH, JSON.stringify({ totalGemsHeld: 0 }, null, 2));

delete require.cache[require.resolve('../src/lib/halving')];
delete require.cache[require.resolve('../src/lib/effects')];

const { getGemMultiplier, addGemsHeld, getState, round2, HALVING_INTERVAL_GEMS } = require('../src/lib/halving');
const { rollGems, applyBreak } = require('../src/lib/effects');
const { defaultAccount } = require('../src/lib/account');

assert.strictEqual(HALVING_INTERVAL_GEMS, 100000);
assert.strictEqual(getGemMultiplier(), 1);

addGemsHeld(99999);
assert.strictEqual(getGemMultiplier(), 1);
addGemsHeld(1);
assert.strictEqual(getState().totalGemsHeld, 100000);
assert.strictEqual(getGemMultiplier(), 0.5);
addGemsHeld(100000);
assert.strictEqual(getGemMultiplier(), 0.25);

for (let i = 0; i < 1000; i++) {
  const g = rollGems(1, 5);
  assert.ok(g >= 1 && g <= 5, `rollGems out of range: ${g}`);
}

assert.strictEqual(round2(5), 5);
assert.ok(round2(0.125) === 0.12 || round2(0.125) === 0.13, 'round2');

// applyBreak: total held naik sebesar gems yang didapat, multiplier dari total held.
const acc = defaultAccount({ id: 'u1', username: 't1' });
acc.farmableId = 'diamond';
acc.equippedItemId = 'fist';
acc.farmables = { diamond: 99999 };
const beforeHeld = getState().totalGemsHeld;
const res = applyBreak(acc);
assert.ok(res.broke);
assert.ok(Number.isFinite(res.gems));
assert.ok(res.gems === round2(res.gems), `gems not 2-decimal: ${res.gems}`);
assert.strictEqual(acc.gems, res.gems);
assert.strictEqual(getState().totalGemsHeld, round2(beforeHeld + res.gems));

// Dengan multiplier 0.25, diamond max 250 -> 62.5.
const maxExpected = 250 * getGemMultiplier();
assert.ok(res.gems <= maxExpected + 1e-9, `gems ${res.gems} > expected max ${maxExpected}`);

console.log('self-check passed: total-held halving + gem range + round2 OK');
console.log(JSON.stringify(getState(), null, 2));
