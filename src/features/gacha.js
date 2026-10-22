'use strict';

const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const {
  GACHA_USE_PREFIX,
  GACHA_QTY_MODAL_PREFIX,
  GACHA_CHANCE,
  GACHA_NOTIFY_CHANNEL,
  GACHA_NOTIFY_ROLE,
} = require('../config/constants');
const { getItem } = require('../data/items');
const {
  loadAccount,
  saveAccount,
  withUserLock,
  isThreadOwner,
  defaultAccount,
} = require('../lib/account');
const {
  buildGachaResultEmbed,
  buildInventoryEmbed,
} = require('../ui/embeds');
const { buildInventoryComponents } = require('../ui/components');
const { client } = require('../bot/client');

async function handleGachaUse(interaction) {
  const user = interaction.user;
  const account = loadAccount(user.id) ?? defaultAccount(user);
  if (!(await isThreadOwner(interaction, account))) return;

  const itemId = interaction.customId.slice(GACHA_USE_PREFIX.length);
  const item = getItem(itemId);
  if (!item || item.type !== 'gacha') {
    await interaction.reply({ content: '❌ Item tidak ditemukan.', ephemeral: true }).catch(() => {});
    return;
  }

  const owned = account.inventory?.[itemId] ?? 0;
  if (owned <= 0) {
    await interaction.reply({ content: '❌ Tidak punya item ini.', ephemeral: true }).catch(() => {});
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`${GACHA_QTY_MODAL_PREFIX}${itemId}`)
    .setTitle(`Use ${item.name}`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('qty')
        .setLabel(`Jumlah (punya ${owned})`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(10),
    ),
  );
  await interaction.showModal(modal).catch(() => {});
}

async function handleGachaQtyModal(interaction) {
  const user = interaction.user;
  const itemId = interaction.customId.slice(GACHA_QTY_MODAL_PREFIX.length);
  const qty = parseInt(interaction.fields.getTextInputValue('qty'), 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    await interaction.reply({ content: '❌ Jumlah tidak valid.', ephemeral: true }).catch(() => {});
    return;
  }
  // ponytail: gacha unlimited sekaligus, batas = stok milikmu (dicek di runGachaRoll)
  const account = loadAccount(user.id) ?? defaultAccount(user);
  if (!(await isThreadOwner(interaction, account))) return;
  await runGachaRoll(interaction, user, account, itemId, qty);
}

async function runGachaRoll(interaction, user, account, itemId, qty) {
  await withUserLock(user.id, async () => {
    const fresh = loadAccount(user.id) ?? account;
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }
    if ((fresh.inventory?.[itemId] ?? 0) < qty) {
      await interaction
        .editReply({
          embeds: [buildInventoryEmbed(fresh, itemId)],
          components: buildInventoryComponents(fresh, itemId),
        })
        .catch(() => {});
      return;
    }

    let wins = 0;
    for (let i = 0; i < qty; i++) {
      const roll = 1 + Math.floor(Math.random() * GACHA_CHANCE);
      if (roll === 1) wins += 1;
    }
    const empties = qty - wins;

    fresh.inventory[itemId] -= qty;
    if (fresh.inventory[itemId] <= 0) delete fresh.inventory[itemId];
    if (wins > 0) {
      fresh.inventory ??= {};
      fresh.inventory.gang = (fresh.inventory.gang ?? 0) + wins;
    }
    saveAccount(fresh);

    await interaction
      .editReply({
        embeds: [buildGachaResultEmbed(fresh, itemId, qty, wins, empties)],
        components: buildInventoryComponents(fresh, itemId),
      })
      .catch(async () => {
        await interaction
          .update({
            embeds: [buildGachaResultEmbed(fresh, itemId, qty, wins, empties)],
            components: buildInventoryComponents(fresh, itemId),
          })
          .catch(() => {});
      });

    if (wins > 0) {
      try {
        const channel = await client.channels.fetch(GACHA_NOTIFY_CHANNEL);
        if (channel && channel.isTextBased()) {
          await channel.send({
            content: `<@&${GACHA_NOTIFY_ROLE}> <@${user.id}> found **${wins}x** Golden Angel Wings inside a Golden Booty Chest!`,
          });
        }
      } catch (e) {
        console.warn('[GROWL] Notifikasi gagal:', e.message);
      }
    }
  });
}

module.exports = {
  handleGachaUse,
  handleGachaQtyModal,
  runGachaRoll,
};
