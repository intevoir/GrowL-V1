'use strict';

require('dotenv').config();

const { Events } = require('discord.js');
const { client } = require('./bot/client');
const { routeInteraction } = require('./bot/router');
const { ensurePanel } = require('./features/panel');
const { startThreadSweeper } = require('./features/threadSweeper');

client.once(Events.ClientReady, async () => {
  console.log(`[GROWVIA] Login sebagai ${client.user.tag}`);
  startThreadSweeper(client);
  await ensurePanel().catch((e) => console.warn('[GROWVIA] ensurePanel gagal:', e.message));
});

client.on(Events.InteractionCreate, (interaction) => {
  routeInteraction(interaction);
});

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('[GROWVIA] BOT_TOKEN kosong di .env');
  process.exit(1);
}

client.login(token).catch((e) => {
  console.error('[GROWVIA] Login gagal:', e.message);
  process.exit(1);
});
