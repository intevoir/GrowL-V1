'use strict';

const { ChannelType } = require('discord.js');
const {
  PANEL_CHANNEL_ID,
  THREAD_AUTO_ARCHIVE_DURATION,
  THREAD_IDLE_CLOSE_MS,
} = require('../config/constants');
const {
  loadAccount,
  saveAccount,
  withUserLock,
  defaultAccount,
} = require('../lib/account');
const { buildStatusEmbed } = require('../ui/embeds');
const { buildMainComponents } = require('../ui/components');
const { client } = require('../bot/client');

function isIdle(account) {
  if (!account.lastThreadActivity) return false; // no timestamp = assume just started, not idle
  return Date.now() - new Date(account.lastThreadActivity).getTime() > THREAD_IDLE_CLOSE_MS;
}

async function handleStartFarming(interaction) {
  const user = interaction.user;
  await withUserLock(user.id, async () => {
    let account = loadAccount(user.id);
    if (!account) {
      account = defaultAccount(user);
      account.guildId = interaction.guildId;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: '❌ Hanya bisa di server.', ephemeral: true }).catch(() => {});
      return;
    }

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    // ponytail: 1 discordId = max 1 thread; reuse kalau masih aktif, buat baru kalau idle >5 mnt / hilang
    if (account.threadId) {
      const existing = await client.channels.fetch(account.threadId).catch(() => null);
      if (existing && !existing.archived) {
        if (!isIdle(account)) {
          account.lastThreadActivity = new Date().toISOString();
          saveAccount(account);
          await interaction.editReply({ content: `Farm kamu sudah ada: <#${account.threadId}>` }).catch(() => {});
          return;
        }
        await existing.delete().catch(() => {});
      } else if (existing && existing.archived) {
        const unarchived = await existing.setArchived(false).catch(() => null);
        if (unarchived) {
          account.lastThreadActivity = new Date().toISOString();
          saveAccount(account);
          await interaction.editReply({ content: `Farm kamu sudah ada: <#${account.threadId}>` }).catch(() => {});
          return;
        }
      }
      account.threadId = null;
      account.statusMsgId = null;
    }

    const panelChannel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
    const parent = panelChannel && 'threads' in panelChannel ? panelChannel : interaction.channel;

    let thread = null;
    try {
      thread = await parent.threads.create({
        name: `farm-${user.username}`.slice(0, 100),
        type: ChannelType.PrivateThread,
        autoArchiveDuration: THREAD_AUTO_ARCHIVE_DURATION,
        reason: 'GrowL farm',
      });
      await thread.members.add(user.id).catch(() => {});
    } catch (e) {
      console.warn('[GROWL] Gagal buat thread:', e.message);
      await interaction
        .editReply({ content: '❌ Gagal buat thread. Pastikan channel mengizinkan private thread.' })
        .catch(() => {});
      return;
    }

    account.threadId = thread.id;
    account.guildId = interaction.guildId;
    account.lastThreadActivity = new Date().toISOString();
    saveAccount(account);

    const embed = buildStatusEmbed(account);
    const sent = await thread.send({ embeds: [embed], components: buildMainComponents() }).catch(() => null);
    if (sent) {
      account.statusMsgId = sent.id;
      saveAccount(account);
    }

    await interaction.editReply({ content: `Your farm is ready: <#${thread.id}>` }).catch(() => {});
  });
}

module.exports = { handleStartFarming, isIdle };
