'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { LOCK_WL_VALUE } = require('../config/constants');
const { getItem } = require('../data/items');

const ACCOUNT_DIR = path.join(__dirname, '..', '..', 'account');
const PANEL_PATH = path.join(__dirname, '..', '..', 'panel.json');
const locks = new Map();

function ensureAccountDir() {
  if (!fs.existsSync(ACCOUNT_DIR)) fs.mkdirSync(ACCOUNT_DIR, { recursive: true });
}

function accountPath(userId) {
  return path.join(ACCOUNT_DIR, `${userId}.json`);
}

function defaultAccount(user) {
  return {
    userId: user.id,
    username: user.username,
    threadId: null,
    guildId: null,
    level: 1,
    exp: 0,
    gems: 0,
    breakCount: 0,
    farmableId: 'dirt',
    equippedItemId: 'fist',
    clothesId: null,
    inventory: { fist: 1 },
    buffs: [],
    statusMsgId: null,
    createdAt: new Date().toISOString(),
    locks: 0,
    farmables: {},
    lastThreadActivity: null,
    updatedAt: new Date().toISOString(),
  };
}

function loadAccount(userId) {
  ensureAccountDir();
  const p = accountPath(userId);
  if (!fs.existsSync(p)) return null;
  try {
    const acc = JSON.parse(fs.readFileSync(p, 'utf8'));
    // ponytail: migrasi equip lama (mis. gbc type gacha ke-save sebagai equipped) -> reset ke fist; hapus field clothes legacy
    const eq = acc.equippedItemId ? getItem(acc.equippedItemId) : null;
    if (acc.equippedItemId && (!eq || eq.type !== 'hand')) acc.equippedItemId = 'fist';
    if ('clothes' in acc) delete acc.clothes;
    return acc;
  } catch {
    return null;
  }
}

function saveAccount(account) {
  ensureAccountDir();
  if ('clothes' in account) delete account.clothes; // ponytail: field legacy, gbc itu type gacha bukan clothes
  account.updatedAt = new Date().toISOString();
  fs.writeFileSync(accountPath(account.userId), JSON.stringify(account, null, 2));
}

async function withUserLock(userId, fn) {
  const prev = locks.get(userId) ?? Promise.resolve();
  let release;
  const cur = new Promise((res) => {
    release = res;
  });
  locks.set(userId, prev.then(() => cur));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(userId) === cur) locks.delete(userId);
  }
}

function formatNumber(n) {
  return Number(n ?? 0).toLocaleString('en-US');
}

function countLocksWL(account) {
  const inv = account.inventory ?? {};
  let total = 0;
  for (const [id, qty] of Object.entries(inv)) {
    const item = getItem(id);
    if (item && item.type === 'lock') total += (LOCK_WL_VALUE[id] ?? 0) * qty;
  }
  return total;
}

/** Potong nilai WL dari inventory lock (rebalance sisa ke BGL/DL/WL). */
function consumeWL(account, needWL) {
  if (countLocksWL(account) < needWL) return false;
  let remaining = countLocksWL(account) - needWL;
  const inv = { ...(account.inventory ?? {}) };
  delete inv.wl;
  delete inv.dl;
  delete inv.bgl;
  const bgl = Math.floor(remaining / 10000);
  remaining %= 10000;
  const dl = Math.floor(remaining / 100);
  remaining %= 100;
  if (bgl) inv.bgl = bgl;
  if (dl) inv.dl = dl;
  if (remaining) inv.wl = remaining;
  account.inventory = inv;
  return true;
}

async function isThreadOwner(interaction, account) {
  if (!account || !account.threadId) return true;
  if (interaction.channelId !== account.threadId) {
    await interaction.reply({ content: 'Gunakan thread farm milikmu sendiri!', ephemeral: true }).catch(() => {});
    return false;
  }
  if (interaction.user.id !== account.userId) {
    await interaction.reply({ content: 'Ini bukan farm milikmu!', ephemeral: true }).catch(() => {});
    return false;
  }
  account.lastThreadActivity = new Date().toISOString();
  saveAccount(account);
  return true;
}

module.exports = {
  ACCOUNT_DIR,
  PANEL_PATH,
  ensureAccountDir,
  defaultAccount,
  loadAccount,
  saveAccount,
  withUserLock,
  formatNumber,
  countLocksWL,
  consumeWL,
  isThreadOwner,
};
