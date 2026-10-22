'use strict';

const { getFarmable } = require('../data/farmables');
const { getItem } = require('../data/items');

/**
 * EXP ke level berikutnya (Growtopia-style): (level + 1)^3 × 10
 */
function expToNext(level) {
  return (level + 1) ** 3 * 10;
}

/** Roll gems 1..rarity (uniform per hit). */
function rollGems(rarity) {
  const max = Math.max(1, rarity);
  return 1 + Math.floor(Math.random() * max);
}

/**
 * Proses 1x press [Farm] — mutate `account`.
 * gems = rollGems(rarity) × item.stats.gems
 * exp  = rarity × item.stats.exp
 */
function applyBreak(account) {
  const farmable = getFarmable(account.farmableId);
  let item = getItem(account.equippedItemId ?? 'fist');
  // ponytail: hanya type hand yang bisa dipakai farming; gacha/wings/lock fallback ke fist
  if (!item || item.type !== 'hand') {
    item = getItem('fist');
    account.equippedItemId = 'fist';
  }

  if (!farmable || !item) {
    return { broke: false, reason: 'Farmable / item tidak ditemukan.' };
  }

  const unlimited = Boolean(farmable.unlimited);
  account.farmables ??= {};
  const stock = unlimited ? Infinity : (account.farmables[farmable.id] ?? 0);

  if (!unlimited && stock <= 0) {
    return { broke: false, reason: 'Farmable habis! Belum bisa farming lagi.' };
  }

  const { range = 1, gems: gemsMult = 1, exp: expMult = 1, block: blockChance = 0 } = item.stats ?? {};
  // ponytail: placeholder efek clothes; upgrade ke sistem buff proper kalau ada banyak clothes
  const clothesBonus = account.clothesId === 'gang' ? 1.1 : 1;
  const hits = unlimited ? range : Math.min(range, stock);

  let gems = 0;
  let exp = 0;
  let blocksBack = 0;

  for (let hit = 0; hit < hits; hit++) {
    gems += Math.floor(rollGems(farmable.rarity) * gemsMult * clothesBonus);
    exp += Math.floor(farmable.rarity * expMult * clothesBonus);
    if (Math.random() * 100 < blockChance) blocksBack += 1;
  }

  if (!unlimited) {
    account.farmables[farmable.id] = stock - hits + blocksBack;
  }
  account.gems = (account.gems ?? 0) + gems;
  account.breakCount = (account.breakCount ?? 0) + hits;
  account.exp = (account.exp ?? 0) + exp;

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
