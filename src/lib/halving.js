'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Sistem halving gem gaya Bitcoin untuk grinding jangka panjang (ratusan tahun).
 *
 * totalGemsHeld = jumlah gem yang dipebang SEMUA PLAYER (sum account.gems).
 * Setiap kali total held melewati ambang, multiplier hadiah per break
 * ditambah setengah. Ambang berkali lipat setelah setiap halving sehingga
 * jeda halving makin lama. Multiplier tak pernah nol (ada floor), jadi
 * pemain selalu mendapat hadiah kecil meski sudah lama grind — ekonomi
 * dan supply stabil, tidak mati sepi.
 *
 * State disimpan di account/halving.json (hanya totalGemsHeld; sisa
 * diturunkan secara deterministik).
 */
const STATE_DIR = path.join(__dirname, '..', '..', 'account');
const STATE_PATH = path.join(STATE_DIR, 'halving.json');

const BASE_INTERVAL = 10_000_000; // 10 juta gem held sebelum halving pertama
const INTERVAL_GROWTH = 2;       // ambang berikutnya x2 setiap halving
const FLOOR_MULTIPLIER = 0.01;   // minimal 1% hadiah, tak pernah nol

let state = { totalGemsHeld: 0 };
let dirty = false;
let writeTimer = null;

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

function scheduleSave() {
  if (writeTimer) return;
  dirty = true;
  writeTimer = setTimeout(flush, 5000);
  if (writeTimer.unref) writeTimer.unref();
}

function flush() {
  writeTimer = null;
  if (!dirty) return;
  dirty = false;
  saveState();
}

process.on('exit', flush);

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

loadState();

/** Hitung halving dan multiplier saat ini dari total held (deterministik). */
function getHalvingInfo() {
  let remaining = state.totalGemsHeld;
  let halvings = 0;
  let interval = BASE_INTERVAL;
  while (remaining >= interval) {
    halvings += 1;
    remaining -= interval;
    interval *= INTERVAL_GROWTH;
  }
  let mult = 0.5 ** halvings;
  if (mult < FLOOR_MULTIPLIER) mult = FLOOR_MULTIPLIER;
  return { halvings, interval, remaining, multiplier: mult };
}

/** Multiplier hadiah gem saat ini (0.01 s/d 1.0). */
function getGemMultiplier() {
  return getHalvingInfo().multiplier;
}

/** Jumlah halving yang telah terjadi. */
function getHalvings() {
  return getHalvingInfo().halvings;
}

/** Total held yang diperlukan untuk halwing berikutnya. */
function getNextHalvingAt() {
  const info = getHalvingInfo();
  return state.totalGemsHeld + (info.interval - info.remaining);
}

/** Catat gem baru yang ditambang ke total held. */
function addGemsHeld(amount) {
  state.totalGemsHeld = round2(state.totalGemsHeld + amount);
  scheduleSave();
}

function getState() {
  const info = getHalvingInfo();
  return {
    ...state,
    halvings: info.halvings,
    multiplier: info.multiplier,
    nextHalvingAt: getNextHalvingAt(),
  };
}

module.exports = {
  BASE_INTERVAL,
  INTERVAL_GROWTH,
  FLOOR_MULTIPLIER,
  getGemMultiplier,
  getHalvings,
  getNextHalvingAt,
  addGemsHeld,
  getState,
  round2,
};
