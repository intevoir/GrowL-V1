'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Sistem halving gem gaya Bitcoin berdasarkan total gem yang dipebang
 * SEMUA PLAYER (sum account.gems di seluruh akun). Semakin besar total
 * gem tersimpan, semakin kecil multiplier hadiah gem per break —
 * mencegah oversupply di game grinding. State disimpan di
 * account/halving.json (totalGemsHeld).
 */
const STATE_DIR = path.join(__dirname, '..', '..', 'account');
const STATE_PATH = path.join(STATE_DIR, 'halving.json');
const HALVING_INTERVAL_GEMS = 100000;

let state = { totalGemsHeld: 0 };

function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

function loadState() {
  ensureStateDir();
  try {
    const saved = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    state.totalGemsHeld = Number(saved.totalGemsHeld ?? saved.totalGemsMined ?? 0) || 0;
  } catch {
    state.totalGemsHeld = 0;
  }
}

function saveState() {
  ensureStateDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

loadState();

/** Multiplier hadiah gem berdasarkan total gem yang dipebang semua pemain. */
function getGemMultiplier() {
  const halvings = Math.floor(state.totalGemsHeld / HALVING_INTERVAL_GEMS);
  return 0.5 ** halvings;
}

/** Tambah total gem yang dipebang (dipanggil saat account.gems bertambah). */
function addGemsHeld(amount) {
  state.totalGemsHeld = round2(state.totalGemsHeld + amount);
  saveState();
}

function getState() {
  return {
    ...state,
    halvings: Math.floor(state.totalGemsHeld / HALVING_INTERVAL_GEMS),
    multiplier: getGemMultiplier(),
  };
}

module.exports = {
  HALVING_INTERVAL_GEMS,
  getGemMultiplier,
  addGemsHeld,
  getState,
  round2,
};
