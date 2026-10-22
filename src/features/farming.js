'use strict';

const { loadAccount, saveAccount, withUserLock, isThreadOwner, defaultAccount } = require('../lib/account');
const { applyBreak } = require('../lib/effects');
const { buildStatusEmbed } = require('../ui/embeds');
const { buildMainComponents } = require('../ui/components');

async function refreshStatus(interactionOrChannel, account) {
  const embed = buildStatusEmbed(account);
  const components = buildMainComponents();

  try {
    if (interactionOrChannel.isRepliable && interactionOrChannel.isRepliable()) {
      if (interactionOrChannel.replied || interactionOrChannel.deferred) {
        await interactionOrChannel.editReply({ embeds: [embed], components });
      } else {
        await interactionOrChannel.update({ embeds: [embed], components });
      }
      return;
    }
  } catch {
    /* fallback ke message edit */
  }

  try {
    const ch = interactionOrChannel.channel ?? interactionOrChannel;
    if (account.statusMsgId) {
      const msg = await ch.messages.fetch(account.statusMsgId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed], components });
        return;
      }
    }
    const sent = await ch.send({ embeds: [embed], components });
    account.statusMsgId = sent.id;
    saveAccount(account);
  } catch (e) {
    console.warn('[GROWL] refreshStatus gagal:', e.message);
  }
}

async function handleFarm(interaction) {
  const user = interaction.user;
  await withUserLock(user.id, async () => {
    let account = loadAccount(user.id);
    if (!account) {
      account = defaultAccount(user);
      saveAccount(account);
    }
    if (!(await isThreadOwner(interaction, account))) return;
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }
    const res = applyBreak(account);
    saveAccount(account);
    if (!res.broke) {
      await interaction
        .followUp({ content: `❌ ${res.reason ?? 'Gagal farming.'}`, ephemeral: true })
        .catch(() => {});
      return;
    }
    await refreshStatus(interaction, account);
  });
}

module.exports = { refreshStatus, handleFarm };
