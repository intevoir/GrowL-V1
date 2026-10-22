# GrowL 🌱 — Discord Bot Game

Farming idler game bot untuk Discord (discord.js v14).

## Status
**Milestone 1 ✅** Welcome panel + private farming thread per user.
**Milestone 2 ✅** Farming gameplay — tombol `[👊 Farm]`, break farmable, EXP Growtopia-style, gems, level-up.

## Setup
```bash
npm install
```

Pastikan file `.env` ada:
```
BOT_TOKEN=<token bot kamu>
```

## Jalankan
```bash
npm start
```

## Alur bot
1. Saat bot start/restart:
   - **Panel lama dihapus otomatis** (anti double panel — track di `panel.json` + scan pesan)
   - **Semua thread farming lama dihapus** (progress akun TETAP disimpan)
   - Bot mengirim **panel** baru ke channel `1548772334167523338`:
     - Embed **"Welcome To GrowL"** + tombol **[👊 Start Farming]** (`<:fist:1548772885265518662>`)
2. Klik tombol → reply `Your farm is ready: <#thread>` + bot membuat **private thread** `farm-<username>` (hanya user tsb yang bisa akses)
3. Di dalam thread → **1 embed status** (+ tombol **[👊 Farm]**):
```
<@user> (Level: 1)             ← mention biru
EXP: 0/80

Clothes:
- :fist: Fist (Hand)
Buff:
- none

Farmable: :dirt: Dirt (Unlimited)
Inventory: none
Gems: 0 :gems:
```
- Baris **Break** hanya muncul setelah user pernah break, contoh: `Break: 1 Block / +1 Gems / +1 Exp / +1 Block`
- **Clothes** menampilkan item yang dipakai (akun baru selalu dapat **Fist (Hand)**, type `hand`)
4. Klik **[👊 Farm]** → break farmable (per hit):
   - `gems = rollGems(rarity) × item.stats.gems` — **random 1..rarity** (Variant A) per hit
   - `exp = rarity × item.stats.exp` — deterministik
   - `block` = % chance block kembali per hit
   - `range` = jumlah hit per press (fist: 1) — tiap hit roll random sendiri
   - Status embed di-edit (live update), **tanpa reply visible**
5. **Inventori** 🎒:
   - Klik **[🎒 Inventori]** → embed ganti jadi daftar **item + lock** yang dipunya + **dropdown** pilih item (hanya yang bisa di-equip)
   - Setelah pilih item → muncul tombol **[⬅ Back]** + **[⚔ Equip]** (jika belum di-pake) / **[⛓ Unequip]** (jika sedang di-pake)
   - **Equip** → item dipasang; jika type **sama** (misal `hand`) dengan yang dipakai, item lama **otomatis lepas** diganti yang baru
   - **Unequip** → kembali ke bare hand (`fist`)
   - **Back** → kembali ke status embed utama
6. **Farmable** 🌱 (ganti farmable):
   - Klik **[🌱 Farmable]** → daftar farmable yang dipunya + tombol **(Farming)** untuk yang aktif
   - Pilih di dropdown → **langsung ganti** farmable yang di-break
   - Farmable terbatas (POG) menampilkan stok `(×N)` / `(habis!)`
7. **Shop** 🛒 (mata uang = **Lock**):
   | Lock | Harga |
   |---|---|
   | <:wl:> World Lock | 2.000 Gems |
   | <:dl:> Diamond Lock | 200.000 Gems (100 WL) |
   | <:bgl:> Blue Gem Lock | 20.000.000 Gems (100 DL) |
   - Dropdown kategori: **Buy Lock** (bayar gems) / **Buy Farmable** (bayar WL)
   - **Buy Lock** → gems dipotong, lock masuk inventory
   - **Buy Farmable** → **Pot O' Gems** (rarity 420): **1 WL → +10 POG** (WL item di-consume)
   - Dana kurang → muncul `❌ Gems/WL tidak cukup!` di embed

## EXP formula (Growtopia-style)
```
expToNext(level) = (level + 1)³ × 10
```
| Level | Need |
|---|---|
| 1→2 | 80 |
| 2→3 | 270 |
| 9→10 | 10.000 |
| 49→50 | 1.250.000 |
| 124→125 | 19.531.250 (MAX, cap di sana) |

## Struktur
```
GrowL/
├── index.js                 <- entry point
├── src/
│   ├── index.js             <- client login + event wiring
│   ├── bot/                 <- Discord client & interaction router
│   ├── config/              <- constants (IDs, harga, emoji)
│   ├── data/                <- items & farmables definitions
│   ├── lib/                 <- account I/O, locks, EXP/break effects
│   ├── ui/                  <- embeds & components builders
│   └── features/            <- farming, inventory, shop, gacha, panel
├── account/                 <- save 1 user per file
└── panel.json               <- last welcome panel message id
```

## Item & Farmable
| Item | Type | Keterangan |
|---|---|---|
| ✊ Fist | hand | starter, gems×1 exp×1 block 0 range 1 |
| 🥊 Rayman's Fist | hand | gems×1 exp×1 block 0 **range 3** |
| 🔒 World Lock | lock | mata uang (2.000 gems) |
| 💎 Diamond Lock | lock | 100 WL |
| 💙 Blue Gem Lock | lock | 100 DL |

| Farmable | Rarity | Stok |
|---|---|---|
| Dirt | 1 | Unlimited |
| Pot O' Gems | 420 | Terbatas (beli: 1 WL / 10 POG) |

## Catatan
- Channel panel harus punya permission **Create Private Threads** (ideal **Forum channel**).
- Tombol Farm hanya bisa dipakai di thread milik user itu sendiri.
- Data `account/`, `.env`, dan `node_modules/` di-ignore oleh git.