'use strict';

const {
  loadAccount,
  saveAccount,
  withUserLock,
  isThreadOwner,
  defaultAccount,
} = require('../lib/account');
const { getItem } = require('../data/items');
const { buildInventoryEmbed, buildStatusEmbed } = require('../ui/embeds');
const { buildInventoryComponents, buildMainComponents } = require('../ui/components');
const { INVENTORY_EQUIP_PREFIX, INVENTORY_WEAR_PREFIX } = require('../config/constants');

async function handleInventoryOpen(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  await interaction
    .update({
      embeds: [buildInventoryEmbed(account, null)],
      components: buildInventoryComponents(account, null),
    })
    .catch(() => {});
}

async function handleInventoryBack(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  await interaction
    .update({ embeds: [buildStatusEmbed(account)], components: buildMainComponents() })
    .catch(() => {});
}

async function handleInventorySelect(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  const selectedId = interaction.values[0];
  await interaction
    .update({
      embeds: [buildInventoryEmbed(account, selectedId)],
      components: buildInventoryComponents(account, selectedId),
    })
    .catch(() => {});
}

async function handleInventoryEquip(interaction) {
  const user = interaction.user;
  await withUserLock(user.id, async () => {
    const account = loadAccount(user.id) ?? defaultAccount(user);
    if (!(await isThreadOwner(interaction, account))) return;
    const itemId = interaction.customId.slice(INVENTORY_EQUIP_PREFIX.length);
    const item = getItem(itemId);
    if (!item || item.type !== 'hand') {
      await interaction.reply({ content: '❌ Item tidak bisa di-equip.', ephemeral: true }).catch(() => {});
      return;
    }
    if ((account.inventory?.[itemId] ?? 0) <= 0) {
      await interaction.reply({ content: '❌ Tidak punya item ini.', ephemeral: true }).catch(() => {});
      return;
    }
    account.equippedItemId = account.equippedItemId === itemId ? 'fist' : itemId;
    saveAccount(account);
    await interaction
      .update({
        embeds: [buildInventoryEmbed(account, itemId)],
        components: buildInventoryComponents(account, itemId),
      })
      .catch(() => {});
  });
}

async function handleInventoryWear(interaction) {
  const user = interaction.user;
  await withUserLock(user.id, async () => {
    const account = loadAccount(user.id) ?? defaultAccount(user);
    if (!(await isThreadOwner(interaction, account))) return;
    const itemId = interaction.customId.slice(INVENTORY_WEAR_PREFIX.length);
    const item = getItem(itemId);
    if (!item || item.type !== 'wings') {
      await interaction.reply({ content: '❌ Item tidak bisa dipakai.', ephemeral: true }).catch(() => {});
      return;
    }
    if ((account.inventory?.[itemId] ?? 0) <= 0) {
      await interaction.reply({ content: '❌ Tidak punya item ini.', ephemeral: true }).catch(() => {});
      return;
    }
    account.clothesId = account.clothesId === itemId ? null : itemId;
    saveAccount(account);
    await interaction
      .update({
        embeds: [buildInventoryEmbed(account, itemId)],
        components: buildInventoryComponents(account, itemId),
      })
      .catch(() => {});
  });
}

module.exports = {
  handleInventoryOpen,
  handleInventoryBack,
  handleInventorySelect,
  handleInventoryEquip,
  handleInventoryWear,
};
