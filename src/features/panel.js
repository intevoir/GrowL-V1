'use strict';

const fs = require('node:fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
  PANEL_CHANNEL_ID,
  START_FARMING_CUSTOM_ID,
  FIST_EMOJI,
} = require('../config/constants');
const { PANEL_PATH } = require('../lib/account');
const { buildWelcomeEmbed } = require('../ui/embeds');
const { client } = require('../bot/client');

async function cleanupOldPanel(channel) {
  let saved = null;
  try {
    if (fs.existsSync(PANEL_PATH)) saved = JSON.parse(fs.readFileSync(PANEL_PATH, 'utf8'));
  } catch {
    saved = null;
  }

  if (saved?.messageId) {
    try {
      const old = await channel.messages.fetch(saved.messageId).catch(() => null);
      if (old) await old.delete().catch(() => {});
    } catch {
      /* abaikan */
    }
  }

  try {
    const msgs = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    if (msgs) {
      for (const m of msgs.values()) {
        if (m.author.id === client.user.id && m.components?.length) {
          let isPanel = false;
          for (const row of m.components) {
            for (const c of row.components ?? []) {
              if (c.customId === START_FARMING_CUSTOM_ID) isPanel = true;
            }
          }
          if (isPanel && m.id !== saved?.messageId) await m.delete().catch(() => {});
        }
      }
    }
  } catch {
    /* abaikan */
  }
}

async function ensurePanel() {
  const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.warn('[GROWL] Panel channel tidak ditemukan.');
    return;
  }
  await cleanupOldPanel(channel);

  const embed = buildWelcomeEmbed();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(START_FARMING_CUSTOM_ID)
      .setLabel('Start Farming')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(FIST_EMOJI),
  );
  const sent = await channel.send({ embeds: [embed], components: [row] });
  fs.writeFileSync(
    PANEL_PATH,
    JSON.stringify({ channelId: PANEL_CHANNEL_ID, messageId: sent.id }, null, 2),
  );
  console.log('[GROWL] Panel welcome terkirim.');
}

module.exports = { ensurePanel, cleanupOldPanel };
