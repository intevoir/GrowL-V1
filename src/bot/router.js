'use strict';

const {
  START_FARMING_CUSTOM_ID,
  FARM_BREAK_CUSTOM_ID,
  INVENTORY_OPEN_CUSTOM_ID,
  INVENTORY_BACK_CUSTOM_ID,
  INVENTORY_SELECT_CUSTOM_ID,
  INVENTORY_EQUIP_PREFIX,
  INVENTORY_WEAR_PREFIX,
  FARMABLE_OPEN_CUSTOM_ID,
  FARMABLE_BACK_CUSTOM_ID,
  FARMABLE_SELECT_CUSTOM_ID,
  SHOP_OPEN_CUSTOM_ID,
  SHOP_BACK_CUSTOM_ID,
  SHOP_EXIT_CUSTOM_ID,
  SHOP_SELECT_CUSTOM_ID,
  GACHA_USE_PREFIX,
  GACHA_QTY_MODAL_PREFIX,
  SHOP_BUY_LOCK_MODAL_PREFIX,
  SHOP_BUY_FARMABLE_MODAL_PREFIX,
  SHOP_BUY_GACHA_MODAL,
} = require('../config/constants');
const { handleStartFarming } = require('../features/startFarming');
const { handleFarm } = require('../features/farming');
const {
  handleInventoryOpen,
  handleInventoryBack,
  handleInventorySelect,
  handleInventoryEquip,
  handleInventoryWear,
} = require('../features/inventory');
const {
  handleFarmableOpen,
  handleFarmableBack,
  handleFarmableSelect,
} = require('../features/farmable');
const {
  handleShopOpen,
  handleShopBack,
  handleShopExit,
  handleShopSelect,
  handleShopBuyLockModal,
  handleShopBuyFarmableModal,
  handleShopBuyGachaModal,
} = require('../features/shop');
const { handleGachaUse, handleGachaQtyModal } = require('../features/gacha');

async function routeInteraction(interaction) {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === START_FARMING_CUSTOM_ID) return handleStartFarming(interaction);
      if (interaction.customId === FARM_BREAK_CUSTOM_ID) return handleFarm(interaction);
      if (interaction.customId === INVENTORY_OPEN_CUSTOM_ID) return handleInventoryOpen(interaction);
      if (interaction.customId === INVENTORY_BACK_CUSTOM_ID) return handleInventoryBack(interaction);
      if (interaction.customId === FARMABLE_OPEN_CUSTOM_ID) return handleFarmableOpen(interaction);
      if (interaction.customId === FARMABLE_BACK_CUSTOM_ID) return handleFarmableBack(interaction);
      if (interaction.customId === SHOP_OPEN_CUSTOM_ID) return handleShopOpen(interaction);
      if (interaction.customId === SHOP_BACK_CUSTOM_ID) return handleShopBack(interaction);
      if (interaction.customId === SHOP_EXIT_CUSTOM_ID) return handleShopExit(interaction);
      if (interaction.customId.startsWith(INVENTORY_EQUIP_PREFIX)) return handleInventoryEquip(interaction);
      if (interaction.customId.startsWith(INVENTORY_WEAR_PREFIX)) return handleInventoryWear(interaction);
      if (interaction.customId.startsWith(GACHA_USE_PREFIX)) return handleGachaUse(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === INVENTORY_SELECT_CUSTOM_ID) return handleInventorySelect(interaction);
      if (interaction.customId === FARMABLE_SELECT_CUSTOM_ID) return handleFarmableSelect(interaction);
      if (interaction.customId === SHOP_SELECT_CUSTOM_ID) return handleShopSelect(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith(SHOP_BUY_LOCK_MODAL_PREFIX)) {
        return handleShopBuyLockModal(interaction);
      }
      if (interaction.customId.startsWith(SHOP_BUY_FARMABLE_MODAL_PREFIX)) {
        return handleShopBuyFarmableModal(interaction);
      }
      if (interaction.customId === SHOP_BUY_GACHA_MODAL) return handleShopBuyGachaModal(interaction);
      if (interaction.customId.startsWith(GACHA_QTY_MODAL_PREFIX)) {
        return handleGachaQtyModal(interaction);
      }
    }
  } catch (e) {
    console.warn('[GROWL] Interaction error:', e.message);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Terjadi error.', ephemeral: true });
      } else {
        await interaction.followUp({ content: '❌ Terjadi error.', ephemeral: true });
      }
    } catch {
      /* abaikan */
    }
  }
}

module.exports = { routeInteraction };
