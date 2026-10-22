'use strict';

const { EmbedBuilder } = require('discord.js');
const {
  GROWL_GREEN,
  GEMS_EMOJI,
  LOCK_PRICES,
  SHOP_GACHA_PRICE,
} = require('../config/constants');
const { getItem } = require('../data/items');
const { farmables, getFarmable } = require('../data/farmables');
const { expToNext } = require('../lib/effects');
const { formatNumber, countLocksWL } = require('../lib/account');

function buildStatusEmbed(account) {
  const equipped = getItem(account.equippedItemId ?? 'fist');
  const clothes = account.clothesId ? getItem(account.clothesId) : null;
  const farmable = getFarmable(account.farmableId);
  const need = expToNext(account.level);
  const last = account.lastBreak;
  const lines = [
    `<@${account.userId}> (Level: ${account.level})`,
    `EXP: ${formatNumber(account.exp)}/${formatNumber(need)}`,
    '',
    'Equipped:',
    `- ${equipped?.emote ?? ''} ${equipped?.name ?? 'Fist'} (${equipped?.type ?? 'hand'})`,
    `Clothes: ${clothes ? `${clothes.emote ?? ''} ${clothes.name}` : '- none'}`,
    'Buff:',
    '- none',
    '',
    `Farmable: ${farmable?.emote ?? ''} ${farmable?.name ?? '-'}${farmable?.unlimited ? ' (Unlimited)' : ''}`,
    `Gems: ${formatNumber(account.gems)} ${GEMS_EMOJI}`,
  ];
  if (last) {
    lines.push(
      `Break: ${last.hits} Block / +${formatNumber(last.gems)} Gems / +${formatNumber(last.exp)} Exp / +${last.blocksBack} Block`,
    );
  }

  return new EmbedBuilder()
    .setTitle('GrowL Farm')
    .setColor(GROWL_GREEN)
    .setDescription(lines.join('\n'));
}

function buildInventoryEmbed(account, selectedId) {
  const inv = account.inventory ?? {};
  const lines = ['**Inventory**', ''];
  const ids = Object.keys(inv).filter((id) => (inv[id] ?? 0) > 0);
  if (!ids.length) lines.push('_(kosong)_');

  for (const id of ids) {
    const it = getItem(id);
    if (!it) continue;
    const mark = id === account.equippedItemId ? ' (dipakai)' : id === account.clothesId ? ' (dipakai)' : '';
    lines.push(`${it.emote ?? ''} ${it.name} x${inv[id]}${mark} — ${it.type}`);
  }

  if (selectedId) {
    const it = getItem(selectedId);
    if (it) lines.push('', `Dipilih: ${it.emote ?? ''} **${it.name}**`);
  }

  return new EmbedBuilder()
    .setTitle('Inventori')
    .setColor(GROWL_GREEN)
    .setDescription(lines.join('\n'));
}

function buildFarmableEmbed(account) {
  const stocks = account.farmables ?? {};
  const lines = ['**Pilih Farmable**', ''];

  for (const f of farmables) {
    const active = account.farmableId === f.id ? ' **(Farming)**' : '';
    if (f.unlimited) {
      lines.push(`${f.emote} ${f.name} (Unlimited)${active}`);
    } else {
      const s = stocks[f.id] ?? 0;
      const stockLabel = s > 0 ? `(×${s})` : '(habis!)';
      lines.push(`${f.emote} ${f.name} ${stockLabel}${active}`);
    }
  }

  return new EmbedBuilder()
    .setTitle('Farmable')
    .setColor(GROWL_GREEN)
    .setDescription(lines.join('\n'));
}

function buildShopEmbed(account, mode, notice) {
  const wl = getItem('wl');
  const dl = getItem('dl');
  const bgl = getItem('bgl');
  const gbc = getItem('gbc');
  const lines = [
    '**Shop GrowL**',
    `Gems: ${formatNumber(account.gems)} ${GEMS_EMOJI}`,
    `Locks (WL value): ${formatNumber(countLocksWL(account))}`,
    '',
    '**Harga Lock:**',
    `- ${wl?.emote ?? ''} World Lock: ${formatNumber(LOCK_PRICES.wl)} gems`,
    `- ${dl?.emote ?? ''} Diamond Lock: ${formatNumber(LOCK_PRICES.dl)} gems (100 WL)`,
    `- ${bgl?.emote ?? ''} Blue Gem Lock: ${formatNumber(LOCK_PRICES.bgl)} gems (100 DL)`,
    '',
    "**Farmable:** Pot O' Gems — 1 WL = 10 POG",
    `**Gacha:** ${gbc?.emote ?? ''} Golden Booty Chest — ${SHOP_GACHA_PRICE} WL each`,
  ];
  if (mode) lines.push('', `Mode: \`${mode}\``);
  if (notice) lines.push('', notice);

  return new EmbedBuilder()
    .setTitle('Shop')
    .setColor(GROWL_GREEN)
    .setDescription(lines.join('\n'));
}

function buildGachaResultEmbed(account, itemId, qty, wins, empties) {
  const item = getItem(itemId);
  const gang = getItem('gang');
  const lines = [
    `${item?.emote ?? ''} Kamu membuka **${qty}x ${item?.name ?? 'Chest'}**...`,
    '',
  ];
  if (wins > 0) {
    lines.push(
      `**JACKPOT!** ${gang?.emote ?? ''} Kamu dapat **${wins}x ${gang?.name ?? 'Golden Angel Wings'}**!`,
    );
  } else {
    lines.push('Zonk... tidak dapat wings kali ini.');
  }
  lines.push(`Rincian: ${wins} jackpot / ${empties} kosong`, '');
  lines.push(`Sisa ${item?.name ?? 'chest'}: **${account.inventory?.[itemId] ?? 0}**`);
  lines.push(`Total wings: **${account.inventory?.gang ?? 0}**`);

  return new EmbedBuilder()
    .setTitle(wins > 0 ? 'GACHA — MENANG!' : 'GACHA — Zonk')
    .setColor(wins > 0 ? 0xffd700 : GROWL_GREEN)
    .setDescription(lines.join('\n'));
}

function buildWelcomeEmbed() {
  return new EmbedBuilder()
    .setTitle('Welcome To GrowL')
    .setColor(GROWL_GREEN)
    .setDescription(
      'Game farming Discord!\nKlik tombol di bawah untuk mulai farming di thread pribadimu.',
    );
}

module.exports = {
  buildStatusEmbed,
  buildInventoryEmbed,
  buildFarmableEmbed,
  buildShopEmbed,
  buildGachaResultEmbed,
  buildWelcomeEmbed,
};
