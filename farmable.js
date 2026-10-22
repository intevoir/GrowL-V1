'use strict';

/**
 * farmable.js - Definisi item farmable (block) GrowL.
 *
 * fields:
 * - rarity : basis EXP yang didapat saat break (perkalian dengan item.exp)
 * - gems   : jumlah gems yang didapat saat break (perkalian dengan item.gems)
 */
const farmables = [
  {
    id: 'dirt',
    name: 'Dirt',
    emote: '<:dirt:1548787946922975422>',
    rarity: 1,       // basis EXP & roll gems maks (gems random 1..rarity)
    unlimited: true, // stok tidak terbatas (dirt)
  },
  {
    id: 'pog',
    name: "Pot O' Gems",
    emote: '<:pog:1548813729846534314>',
    rarity: 420, // farmable kelas atas - dibeli di shop (10 POG = 1 WL), terbatas
  },
];

/** Ambil farmable berdasarkan id. */
function getFarmable(id) {
  return farmables.find((f) => f.id === id) ?? null;
}

module.exports = { farmables, getFarmable };