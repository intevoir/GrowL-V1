'use strict';

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const {
  FARM_BREAK_CUSTOM_ID,
  INVENTORY_OPEN_CUSTOM_ID,
  INVENTORY_BACK_CUSTOM_ID,
  INVENTORY_SELECT_CUSTOM_ID,
  INVENTORY_EQUIP_PREFIX,
  INVENTORY_WEAR_PREFIX,
  FARMABLE_OPEN_CUSTOM_ID,
  FARMABLE_SELECT_CUSTOM_ID,
  FARMABLE_BACK_CUSTOM_ID,
  SHOP_OPEN_CUSTOM_ID,
  SHOP_SELECT_CUSTOM_ID,
  SHOP_BACK_CUSTOM_ID,
  SHOP_BUY_FARMABLE_SELECT,
  SHOP_BUY_GACHA_SELECT,
  GACHA_USE_PREFIX,
  FIST_EMOJI,
  LOCK_PRICES,
  SHOP_GACHA_PRICE,
} = require('../config/constants');
const { getItem } = require('../data/items');
const { farmables } = require('../data/farmables');

function buildMainComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(FARM_BREAK_CUSTOM_ID)
        .setLabel('Farm')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(FIST_EMOJI),
      new ButtonBuilder()
        .setCustomId(INVENTORY_OPEN_CUSTOM_ID)
        .setLabel('Inventori')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎒'),
      new ButtonBuilder()
        .setCustomId(FARMABLE_OPEN_CUSTOM_ID)
        .setLabel('Farmable')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🌱'),
      new ButtonBuilder()
        .setCustomId(SHOP_OPEN_CUSTOM_ID)
        .setLabel('Shop')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🛒'),
    ),
  ];
}

function buildInventoryComponents(account, selectedId) {
  const rows = [];
  const cInv = account.inventory ?? {};
  const usableIds = Object.keys(cInv).filter((cid) => {
    const it = getItem(cid);
    return it && (it.type === 'hand' || it.type === 'gacha' || it.type === 'wings') && (cInv[cid] ?? 0) > 0;
  });

  if (usableIds.length) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(INVENTORY_SELECT_CUSTOM_ID)
      .setPlaceholder('Pilih item...');
    for (const sid of usableIds.slice(0, 25)) {
      const sit = getItem(sid);
      const opt = new StringSelectMenuOptionBuilder()
        .setLabel(`${sit.name} (x${cInv[sid]})`)
        .setValue(sid)
        .setDescription(sit.type);
      if (sit.emote) {
        const m = sit.emote.match(/<(?:a)?:(\w+):(\d+)>/);
        if (m) opt.setEmoji({ name: m[1], id: m[2] });
      }
      select.addOptions(opt);
    }
    rows.push(new ActionRowBuilder().addComponents(select));
  }

  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(INVENTORY_BACK_CUSTOM_ID)
      .setLabel('Back')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️'),
  );

  if (selectedId) {
    const sel = getItem(selectedId);
    if (sel && sel.type === 'hand') {
      const isEq = account.equippedItemId === selectedId;
      btnRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`${INVENTORY_EQUIP_PREFIX}${selectedId}`)
          .setLabel(isEq ? 'Unequip' : 'Equip')
          .setStyle(isEq ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(isEq ? '⛓️' : '⚔️'),
      );
    }
    if (sel && sel.type === 'gacha') {
      btnRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`${GACHA_USE_PREFIX}${selectedId}`)
          .setLabel('Use')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎰'),
      );
    }
    if (sel && sel.type === 'wings') {
      const isWorn = account.clothesId === selectedId;
      btnRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`${INVENTORY_WEAR_PREFIX}${selectedId}`)
          .setLabel(isWorn ? 'Take Off' : 'Wear')
          .setStyle(isWorn ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(isWorn ? '👕' : '🪽'),
      );
    }
  }

  rows.push(btnRow);
  return rows;
}

function buildFarmableComponents(account) {
  const stocks = account.farmables ?? {};
  const select = new StringSelectMenuBuilder()
    .setCustomId(FARMABLE_SELECT_CUSTOM_ID)
    .setPlaceholder('Pilih farmable...');

  for (const f of farmables.slice(0, 25)) {
    const stockLabel = f.unlimited ? 'Unlimited' : `×${stocks[f.id] ?? 0}`;
    const active = account.farmableId === f.id ? ' · Farming' : '';
    const opt = new StringSelectMenuOptionBuilder()
      .setLabel(`${f.name}${active}`)
      .setValue(f.id)
      .setDescription(stockLabel);
    if (f.emote) {
      const m = f.emote.match(/<(?:a)?:(\w+):(\d+)>/);
      if (m) opt.setEmoji({ name: m[1], id: m[2] });
    }
    select.addOptions(opt);
  }

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(FARMABLE_BACK_CUSTOM_ID)
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
    ),
  ];
}

function buildShopComponents() {
  const wl = getItem('wl');
  const dl = getItem('dl');
  const bgl = getItem('bgl');
  const pog = require('../data/farmables').getFarmable('pog');
  const gbc = getItem('gbc');

  function parseEmoji(emote) {
    if (!emote) return undefined;
    const m = emote.match(/<(?:a)?:(\w+):(\d+)>/);
    return m ? { name: m[1], id: m[2] } : undefined;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(SHOP_SELECT_CUSTOM_ID)
    .setPlaceholder('Pilih pembelian...');

  const wlOpt = new StringSelectMenuOptionBuilder()
    .setLabel('Buy World Lock')
    .setValue('lock:wl')
    .setDescription(`${LOCK_PRICES.wl.toLocaleString('en-US')} gems`);
  const wlE = parseEmoji(wl?.emote);
  if (wlE) wlOpt.setEmoji(wlE);
  select.addOptions(wlOpt);

  const dlOpt = new StringSelectMenuOptionBuilder()
    .setLabel('Buy Diamond Lock')
    .setValue('lock:dl')
    .setDescription(`${LOCK_PRICES.dl.toLocaleString('en-US')} gems`);
  const dlE = parseEmoji(dl?.emote);
  if (dlE) dlOpt.setEmoji(dlE);
  select.addOptions(dlOpt);

  const bglOpt = new StringSelectMenuOptionBuilder()
    .setLabel('Buy Blue Gem Lock')
    .setValue('lock:bgl')
    .setDescription(`${LOCK_PRICES.bgl.toLocaleString('en-US')} gems`);
  const bglE = parseEmoji(bgl?.emote);
  if (bglE) bglOpt.setEmoji(bglE);
  select.addOptions(bglOpt);

  const pogOpt = new StringSelectMenuOptionBuilder()
    .setLabel("Buy Pot O' Gems")
    .setValue(SHOP_BUY_FARMABLE_SELECT)
    .setDescription('1 WL = 10 POG');
  const pogE = parseEmoji(pog?.emote);
  if (pogE) pogOpt.setEmoji(pogE);
  select.addOptions(pogOpt);

  const gbcOpt = new StringSelectMenuOptionBuilder()
    .setLabel('Buy Golden Booty Chest')
    .setValue(SHOP_BUY_GACHA_SELECT)
    .setDescription(`${SHOP_GACHA_PRICE} WL each`);
  const gbcE = parseEmoji(gbc?.emote);
  if (gbcE) gbcOpt.setEmoji(gbcE);
  select.addOptions(gbcOpt);

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(SHOP_BACK_CUSTOM_ID)
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
    ),
  ];
}

module.exports = {
  buildMainComponents,
  buildInventoryComponents,
  buildFarmableComponents,
  buildShopComponents,
};
