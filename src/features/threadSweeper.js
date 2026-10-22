'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { THREAD_IDLE_CLOSE_MS } = require('../config/constants');
const { ACCOUNT_DIR, loadAccount, saveAccount } = require('../lib/account');

// ponytail: interval 60s cukup; kalau butuh presisi detik pakai per-interaction check di startFarming
function startThreadSweeper(client, ms = 60 * 1000) {
  const timer = setInterval(async () => {
    let files = [];
    try {
      files = fs.readdirSync(ACCOUNT_DIR).filter((f) => f.endsWith('.json'));
    } catch {
      return;
    }
    for (const f of files) {
      const userId = path.basename(f, '.json');
      let account;
      try {
        account = loadAccount(userId);
      } catch {
        continue;
      }
      if (!account?.threadId) continue;
      if (!account.lastThreadActivity) {
        account.lastThreadActivity = new Date().toISOString();
        try {
          saveAccount(account);
        } catch {
          /* abaikan */
        }
        continue;
      }
      if (Date.now() - new Date(account.lastThreadActivity).getTime() <= THREAD_IDLE_CLOSE_MS) continue;
      try {
        const thread = await client.channels.fetch(account.threadId).catch(() => null);
        if (thread) await thread.delete().catch(() => {});
      } catch {
        /* abaikan */
      }
      account.threadId = null;
      account.statusMsgId = null;
      try {
        saveAccount(account);
      } catch {
        /* abaikan */
      }
    }
  }, ms);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { startThreadSweeper };
