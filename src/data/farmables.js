'use strict';

/**
 * Definisi farmable (block) GrowL.
 * - rarity : basis EXP & roll gems maks (1..rarity)
 * - unlimited : stok tidak terbatas
 */
const farmables = [
  {
    id: 'dirt',
    name: 'Dirt',
    emote: '<:dirt:1548787946922975422>',
    rarity: 1,
    unlimited: true,
  },
  {
    id: 'pog',
    name: "Pot O' Gems",
    emote: '<:pog:1548813729846534314>',
    rarity: 420,
  },
];

function getFarmable(id) {
  return farmables.find((f) => f.id === id) ?? null;
}

module.exports = { farmables, getFarmable };
