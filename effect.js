'use strict';

const { getFarmable } = require('./farmable.js');
const { getItem } = require('./item.js');


/**
 * EXP yang dibutuhkan untuk naik dari `level` ke `level + 1`.
 * Rumus Growtopia: (target level)^3 x 10
 *   Level   1 ->  2 : 2^3   x 10 = 80
 *   Level   2 ->  3 : 3^3   x 10 = 270
 *   Level   9 -> 10 : 10^3  x 10 = 10.000
 *   Level  49 -> 50 : 50^3  x 10 = 1.250.000
 *   Level 124 ->125 : 125^3 x 10 = 19.531.250  (MAX)
 */
function expToNext(level) {
  return (level + 1) ** 3 * 10;
}

/**
 * Roll gems yang dijatuhkan sebuah block berdasarkan rarity (Variant A).
 * Range: 1..rarity - random uniform PER HIT.
 */
function rollGems(rarity) {
  const max = Math.max(1, rarity);
  return 1 + Math.floor(Math.random() * max);
}

/**
 * Proses 1x press [Farm] untuk akun `account` (mutate langsung).
 *
 * Formula per hit:
 *   gems_gained = rollGems(farmable.rarity) x item.stats.gems   (random 1..rarity)
 *   exp_gained  = farmable.rarity x item.stats.exp              (deterministik)
 *   block_back  = roll(0-100) < item.stats.block                (persen per hit)
 *
 * result:
 *   { broke:boolean, hits, gems, exp, blocksBack, levelUps }
 */
function applyBreak(account) {
  const farmable = getFarmable(account.farmableId);
  const item = getItem(account.equippedItemId ?? 'fist');

  if (!farmable || !item) {
    return { broke: false, reason: 'Farmable / item tidak ditemukan.' };
  }

  const unlimited = Boolean(farmable.unlimited);

  // Stok per farmable (map); dirt unlimited gak disimpan
  account.farmables ??= {};
  const stock = unlimited ? Infinity : (account.farmables[farmable.id] ?? 0);

  if (!unlimited && stock <= 0) {
    return { broke: false, reason: 'Farmable habis! Belum bisa farming lagi.' };
  }

  const { range = 1, gems: gemsMult = 1, exp: expMult = 1, block: blockChance = 0 } = item.stats;
  const hits = unlimited ? range : Math.min(range, stock);

  let gems = 0;
  let exp = 0;
  let blocksBack = 0;

  for (let hit = 0; hit < hits; hit++) {
    gems += rollGems(farmable.rarity) * gemsMult;
    exp += farmable.rarity * expMult;
    if (Math.random() * 100 < blockChance) blocksBack += 1;
  }

  if (!unlimited) {
    account.farmables[farmable.id] = stock - hits + blocksBack;
  }
  account.gems += gems;
  account.breakCount += hits;
  account.exp += exp;

  let levelUps = 0;
  while (account.exp >= expToNext(account.level)) {
    account.exp -= expToNext(account.level);
    account.level += 1;
    levelUps += 1;
  }

  account.lastBreak = { hits, gems, exp, blocksBack };
  account.updatedAt = new Date().toISOString();

  return { broke: true, hits, gems, exp, blocksBack, levelUps };
}

module.exports = { expToNext, rollGems, applyBreak };