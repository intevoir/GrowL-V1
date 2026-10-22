'use strict';

const {
  loadAccount,
  saveAccount,
  withUserLock,
  isThreadOwner,
  defaultAccount,
} = require('../lib/account');
const { getFarmable } = require('../data/farmables');
const { buildFarmableEmbed, buildStatusEmbed } = require('../ui/embeds');
const { buildFarmableComponents, buildMainComponents } = require('../ui/components');

async function handleFarmableOpen(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  await interaction
    .update({
      embeds: [buildFarmableEmbed(account)],
      components: buildFarmableComponents(account),
    })
    .catch(() => {});
}

async function handleFarmableBack(interaction) {
  const account = loadAccount(interaction.user.id) ?? defaultAccount(interaction.user);
  if (!(await isThreadOwner(interaction, account))) return;
  await interaction
    .update({ embeds: [buildStatusEmbed(account)], components: buildMainComponents() })
    .catch(() => {});
}

async function handleFarmableSelect(interaction) {
  const user = interaction.user;
  await withUserLock(user.id, async () => {
    const account = loadAccount(user.id) ?? defaultAccount(user);
    if (!(await isThreadOwner(interaction, account))) return;
    const fid = interaction.values[0];
    const f = getFarmable(fid);
    if (!f) {
      await interaction.reply({ content: '❌ Farmable tidak ditemukan.', ephemeral: true }).catch(() => {});
      return;
    }
    if (!f.unlimited && (account.farmables?.[fid] ?? 0) <= 0) {
      await interaction
        .update({
          embeds: [buildFarmableEmbed(account)],
          components: buildFarmableComponents(account),
        })
        .catch(() => {});
      await interaction.followUp({ content: '❌ Stok farmable habis!', ephemeral: true }).catch(() => {});
      return;
    }
    account.farmableId = fid;
    saveAccount(account);
    await interaction
      .update({ embeds: [buildStatusEmbed(account)], components: buildMainComponents() })
      .catch(() => {});
  });
}

module.exports = {
  handleFarmableOpen,
  handleFarmableBack,
  handleFarmableSelect,
};
