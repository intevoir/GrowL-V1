'use strict';

const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const {
  SHOP_BUY_FARMABLE_SELECT,
  SHOP_BUY_GACHA_SELECT,
  SHOP_BUY_LOCK_MODAL_PREFIX,
  SHOP_BUY_FARMABLE_MODAL_PREFIX,
  SHOP_BUY_GACHA_MODAL,
  LOCK_PRICES,
  SHOP_FARMABLE_PACKS,
  SHOP_GACHA_PRICE,
} = require('../config/constants');
const { getItem } = require('../data/items');
const {
  loadAccount,
  saveAccount,
  withUserLock,
  isThreadOwner,
  defaultAccount,
  countLocksWL,
  consumeWL,
} = require('../lib/account');
const { buildShopEmbed, buildStatusEmbed } = require('../ui/embeds');
const { buildShopComponents, buildMainComponents } = require('../ui/components');

async function handleShopOpen(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  await interaction
    .update({ embeds: [buildShopEmbed(account, null, null)], components: buildShopComponents() })
    .catch(() => {});
}

async function handleShopBack(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  await interaction
    .update({ embeds: [buildStatusEmbed(account)], components: buildMainComponents() })
    .catch(() => {});
}

async function handleShopExit(interaction) {
  return handleShopBack(interaction);
}

async function handleShopSelect(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  const mode = interaction.values[0];

  if (mode.startsWith('lock:')) {
    const lockId = mode.split(':')[1];
    const modal = new ModalBuilder()
      .setCustomId(`${SHOP_BUY_LOCK_MODAL_PREFIX}${lockId}`)
      .setTitle(`Buy ${getItem(lockId)?.name ?? lockId}`);
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('qty')
          .setLabel('Jumlah')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );
    await interaction.showModal(modal).catch(() => {});
    return;
  }

  if (mode === SHOP_BUY_FARMABLE_SELECT) {
    const modal = new ModalBuilder()
      .setCustomId(`${SHOP_BUY_FARMABLE_MODAL_PREFIX}pog`)
      .setTitle('Buy POG');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('qty')
          .setLabel('Jumlah pack (1 pack = 10 POG = 1 WL)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );
    await interaction.showModal(modal).catch(() => {});
    return;
  }

  if (mode === SHOP_BUY_GACHA_SELECT) {
    const modal = new ModalBuilder().setCustomId(SHOP_BUY_GACHA_MODAL).setTitle('Buy Gacha');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('qty')
          .setLabel(`Jumlah chest (${SHOP_GACHA_PRICE} WL each)`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );
    await interaction.showModal(modal).catch(() => {});
    return;
  }

  await interaction
    .update({ embeds: [buildShopEmbed(account, mode, null)], components: buildShopComponents() })
    .catch(() => {});
}

async function handleShopBuyLockModal(interaction) {
  const user = interaction.user;
  const lockId = interaction.customId.slice(SHOP_BUY_LOCK_MODAL_PREFIX.length) || 'wl';
  const qty = parseInt(interaction.fields.getTextInputValue('qty'), 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    await interaction.reply({ content: '❌ Jumlah tidak valid.', ephemeral: true }).catch(() => {});
    return;
  }
  await withUserLock(user.id, async () => {
    const account = loadAccount(user.id) ?? defaultAccount(user);
    const cost = (LOCK_PRICES[lockId] ?? 0) * qty;
    if (account.gems < cost) {
      await interaction.reply({ content: '❌ Gems tidak cukup!', ephemeral: true }).catch(() => {});
      return;
    }
    account.gems -= cost;
    account.inventory ??= {};
    account.inventory[lockId] = (account.inventory[lockId] ?? 0) + qty;
    saveAccount(account);
    await interaction
      .reply({ content: `✅ Beli ${qty}x ${getItem(lockId)?.name}.`, ephemeral: true })
      .catch(() => {});
  });
}

async function handleShopBuyFarmableModal(interaction) {
  const user = interaction.user;
  const qty = parseInt(interaction.fields.getTextInputValue('qty'), 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    await interaction.reply({ content: '❌ Jumlah tidak valid.', ephemeral: true }).catch(() => {});
    return;
  }
  await withUserLock(user.id, async () => {
    const account = loadAccount(user.id) ?? defaultAccount(user);
    const needWL = (SHOP_FARMABLE_PACKS.pog.wl ?? 1) * qty;
    if (countLocksWL(account) < needWL || !consumeWL(account, needWL)) {
      await interaction.reply({ content: '❌ WL tidak cukup!', ephemeral: true }).catch(() => {});
      return;
    }
    account.farmables ??= {};
    account.farmables.pog = (account.farmables.pog ?? 0) + SHOP_FARMABLE_PACKS.pog.qty * qty;
    saveAccount(account);
    await interaction
      .reply({
        content: `✅ Beli ${qty} pack (+${SHOP_FARMABLE_PACKS.pog.qty * qty} POG).`,
        ephemeral: true,
      })
      .catch(() => {});
  });
}

async function handleShopBuyGachaModal(interaction) {
  const user = interaction.user;
  const qty = parseInt(interaction.fields.getTextInputValue('qty'), 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    await interaction.reply({ content: '❌ Jumlah tidak valid.', ephemeral: true }).catch(() => {});
    return;
  }
  await withUserLock(user.id, async () => {
    const account = loadAccount(user.id) ?? defaultAccount(user);
    const needWL = SHOP_GACHA_PRICE * qty;
    if (countLocksWL(account) < needWL || !consumeWL(account, needWL)) {
      await interaction.reply({ content: '❌ WL tidak cukup!', ephemeral: true }).catch(() => {});
      return;
    }
    account.inventory ??= {};
    account.inventory.gbc = (account.inventory.gbc ?? 0) + qty;
    saveAccount(account);
    await interaction
      .reply({ content: `✅ Beli ${qty}x Golden Booty Chest.`, ephemeral: true })
      .catch(() => {});
  });
}

module.exports = {
  handleShopOpen,
  handleShopBack,
  handleShopExit,
  handleShopSelect,
  handleShopBuyLockModal,
  handleShopBuyFarmableModal,
  handleShopBuyGachaModal,
};
