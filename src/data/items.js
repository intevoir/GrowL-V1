'use strict';

/**
 * Definisi data item GrowL.
 *
 * stats (semua PERKALIAN kecuali block/range):
 * - gems   : perkalian gems per break
 * - exp    : perkalian exp per break
 * - block  : persen chance block kembali per hit
 * - range  : jumlah hit per 1x press Farm
 *
 * type: hand | lock | gacha | wings
 */
const items = [
  {
    id: 'fist',
    name: 'Fist',
    emote: '<:fist:1548772885265518662>',
    type: 'hand',
    description: 'Kepalan tangan kosong. Senjata awal seorang petani GrowL.',
    stats: { gems: 1, exp: 1, block: 0, range: 1 },
  },
  {
    id: 'rayman',
    name: "Rayman's Fist",
    emote: '<:rayman:1548801140622229644>',
    type: 'hand',
    description: 'Kepalan legendaris milik Lantas.',
    stats: { gems: 1000, exp: 1000, block: 50, range: 10 },
  },
  {
    id: 'wl',
    name: 'World Lock',
    emote: '<:wl:1548815818928816238>',
    type: 'lock',
    description: 'Mata uang dasar GrowL (2.000 gems).',
  },
  {
    id: 'dl',
    name: 'Diamond Lock',
    emote: '<:dl:1548815833721995405>',
    type: 'lock',
    description: 'Mata uang tingkat 2 (100 WL / 200.000 gems).',
  },
  {
    id: 'bgl',
    name: 'Blue Gem Lock',
    emote: '<:bgl:1548815846669946930>',
    type: 'lock',
    description: 'Mata uang tertinggi (100 DL / 20.000.000 gems).',
  },
  {
    id: 'gbc',
    name: 'Golden Booty Chest',
    emote: '<:gbc:1548918010905890886>',
    type: 'gacha',
    description: 'Peti harta karun berisi sayap malaikat legendaris! (1:100.000)',
  },
  {
    id: 'gang',
    name: 'Golden Angel Wings',
    emote: '<:gang:1548918400288301186>',
    type: 'wings',
    description: 'Sayap malaikat emas yang memukau. Koleksi langka!',
  },
];

function getItem(id) {
  return items.find((item) => item.id === id) ?? null;
}

module.exports = { items, getItem };
