/**
 * Chợ Chất Lượng Online — platform + shop config
 * Brand: chochatluongonline · Chủ: Phan Quý Vinh
 */
const PLATFORM_CONFIG_KEY = 'ccl_platform_config_v1';
const SHOP_SETTINGS_KEY = 'ccl_shop_settings_v1';
const CATALOG_OVERRIDE_KEY = 'ccl_catalog_overrides_v1';

const DEFAULT_PLATFORM = {
  brandName: 'Chợ Chất Lượng Online',
  brandShort: 'CCL Online',
  domain: 'chochatluongonline',
  ownerName: 'Phan Quý Vinh',
  platformFeeRate: 0.01,
  defaultShipFeePerShop: 30000,
  defaultFreeShipThreshold: 500000,
  defaultShipFeeService: 0,
  minOrderAmount: 0,
  corporateTaxRate: 0.10,
  vatRate: 0.08,
  escrowHoldDays: 3,
  autoReleaseEnabled: true,
  returnWindowDays: 3,
  voucherEnabled: true,
  defaultVoucherCode: 'CCLONLINE10',
  defaultVoucherPercent: 0.10,
  defaultVoucherMaxDiscount: 50000,
  currency: 'VND',
  locale: 'vi-VN',
  supportHotline: '0975898828',
  supportEmail: 'phanquyvinh@gmail.com',
  heroImages: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80',
  ],
  heroTagline: 'Chợ linh kiện · dịch vụ kỹ thuật',
  version: 1,
  updatedAt: null,
  updatedBy: null,
};

const DEFAULT_SHOP_SETTINGS = {
  s101: {
    shopId: 's101', shopName: 'Điện Tử Bách Khoa',
    shipFeeProduct: 30000, freeShipThreshold: 400000,
    shipFeeService: 0, serviceCallOutFee: 0, minOrderAmount: 0, acceptOrders: true,
  },
  s102: {
    shopId: 's102', shopName: 'Điện Lạnh Hà Nội',
    shipFeeProduct: 35000, freeShipThreshold: 600000,
    shipFeeService: 0, serviceCallOutFee: 50000, minOrderAmount: 0, acceptOrders: true,
  },
  s103: {
    shopId: 's103', shopName: 'Kỹ Thuật Số Việt',
    shipFeeProduct: 25000, freeShipThreshold: 300000,
    shipFeeService: 0, serviceCallOutFee: 0, minOrderAmount: 100000, acceptOrders: true,
  },
};

function clamp(n, min, max) {
  n = Number(n);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function loadPlatformConfig() {
  try {
    const raw = localStorage.getItem(PLATFORM_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_PLATFORM };
    return { ...DEFAULT_PLATFORM, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PLATFORM };
  }
}

function savePlatformConfig(partial, updatedBy = 'admin') {
  const next = { ...loadPlatformConfig(), ...partial, updatedAt: new Date().toISOString(), updatedBy };
  next.platformFeeRate = clamp(next.platformFeeRate, 0, 0.3);
  next.corporateTaxRate = clamp(next.corporateTaxRate, 0, 0.5);
  next.vatRate = clamp(next.vatRate, 0, 0.2);
  next.defaultShipFeePerShop = Math.max(0, Math.round(Number(next.defaultShipFeePerShop) || 0));
  next.defaultFreeShipThreshold = Math.max(0, Math.round(Number(next.defaultFreeShipThreshold) || 0));
  next.defaultShipFeeService = Math.max(0, Math.round(Number(next.defaultShipFeeService) || 0));
  next.minOrderAmount = Math.max(0, Math.round(Number(next.minOrderAmount) || 0));
  next.escrowHoldDays = Math.max(0, Math.min(30, Math.round(Number(next.escrowHoldDays) || 0)));
  next.returnWindowDays = Math.max(0, Math.min(30, Math.round(Number(next.returnWindowDays) || 3)));
  next.defaultVoucherPercent = clamp(next.defaultVoucherPercent, 0, 0.5);
  next.defaultVoucherMaxDiscount = Math.max(0, Math.round(Number(next.defaultVoucherMaxDiscount) || 0));
  localStorage.setItem(PLATFORM_CONFIG_KEY, JSON.stringify(next));
  return next;
}

function resetPlatformConfig() {
  localStorage.removeItem(PLATFORM_CONFIG_KEY);
  return loadPlatformConfig();
}

function loadAllShopSettings() {
  try {
    const raw = localStorage.getItem(SHOP_SETTINGS_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SHOP_SETTINGS));
    return { ...JSON.parse(JSON.stringify(DEFAULT_SHOP_SETTINGS)), ...JSON.parse(raw) };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SHOP_SETTINGS));
  }
}

function loadShopSettings(shopId) {
  const all = loadAllShopSettings();
  const platform = loadPlatformConfig();
  if (all[shopId]) return all[shopId];
  return {
    shopId, shopName: shopId,
    shipFeeProduct: platform.defaultShipFeePerShop,
    freeShipThreshold: platform.defaultFreeShipThreshold,
    shipFeeService: platform.defaultShipFeeService,
    serviceCallOutFee: 0, minOrderAmount: 0, acceptOrders: true,
  };
}

function saveShopSettings(shopId, partial) {
  const all = loadAllShopSettings();
  const prev = all[shopId] || loadShopSettings(shopId);
  const next = {
    ...prev, ...partial, shopId,
    shipFeeProduct: Math.max(0, Math.round(Number(partial.shipFeeProduct ?? prev.shipFeeProduct) || 0)),
    freeShipThreshold: Math.max(0, Math.round(Number(partial.freeShipThreshold ?? prev.freeShipThreshold) || 0)),
    shipFeeService: Math.max(0, Math.round(Number(partial.shipFeeService ?? prev.shipFeeService) || 0)),
    serviceCallOutFee: Math.max(0, Math.round(Number(partial.serviceCallOutFee ?? prev.serviceCallOutFee) || 0)),
    minOrderAmount: Math.max(0, Math.round(Number(partial.minOrderAmount ?? prev.minOrderAmount) || 0)),
    acceptOrders: partial.acceptOrders !== undefined ? !!partial.acceptOrders : prev.acceptOrders,
    updatedAt: new Date().toISOString(),
  };
  all[shopId] = next;
  localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(all));
  return next;
}

function loadCatalogOverrides() {
  try { return JSON.parse(localStorage.getItem(CATALOG_OVERRIDE_KEY) || '{}'); }
  catch { return {}; }
}

function saveItemPrice(itemId, price, extra = {}) {
  const o = loadCatalogOverrides();
  o[itemId] = { ...(o[itemId] || {}), price: Math.max(0, Math.round(Number(price) || 0)), ...extra, updatedAt: new Date().toISOString() };
  localStorage.setItem(CATALOG_OVERRIDE_KEY, JSON.stringify(o));
  return o[itemId];
}

function calcShopShip(shopItems, shopSettings, platform) {
  if (!shopItems.length) return 0;
  const allService = shopItems.every((i) => i.type === 'service');
  const settings = shopSettings || loadShopSettings(shopItems[0].shopId);
  if (allService) {
    return (settings.shipFeeService || 0) + (settings.serviceCallOutFee || 0);
  }
  const subtotal = shopItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  const threshold = settings.freeShipThreshold != null ? settings.freeShipThreshold : (platform.defaultFreeShipThreshold || 0);
  if (threshold > 0 && subtotal >= threshold) return 0;
  return settings.shipFeeProduct != null ? settings.shipFeeProduct : (platform.defaultShipFeePerShop || 0);
}

function calcOrderTotals(cart, voucher) {
  const platform = loadPlatformConfig();
  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.shopId]) groups[item.shopId] = [];
    groups[item.shopId].push(item);
  });
  let totalItems = 0, totalShip = 0;
  const shopBreakdown = [];
  Object.keys(groups).forEach((shopId) => {
    const items = groups[shopId];
    const settings = loadShopSettings(shopId);
    const sub = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
    const ship = calcShopShip(items, settings, platform);
    totalItems += sub; totalShip += ship;
    shopBreakdown.push({
      shopId, shopName: items[0]?.shopName || settings.shopName, subtotal: sub, ship,
      freeShip: ship === 0 && sub > 0, minOrder: settings.minOrderAmount || 0,
      minOrderOk: sub >= (settings.minOrderAmount || 0), acceptOrders: settings.acceptOrders !== false,
    });
  });
  const platformFee = Math.round(totalItems * (platform.platformFeeRate || 0));
  let discount = 0, voucherApplied = null;
  if (voucher && voucher.code && platform.voucherEnabled) {
    const code = String(voucher.code).trim().toUpperCase();
    if (code === String(platform.defaultVoucherCode || '').toUpperCase()) {
      const raw = Math.round(totalItems * (platform.defaultVoucherPercent || 0));
      discount = Math.min(raw, platform.defaultVoucherMaxDiscount || raw);
      voucherApplied = code;
    }
  }
  const grandTotal = Math.max(0, totalItems + totalShip - discount);
  return {
    totalItems, totalShip, platformFee, discount, voucherApplied, grandTotal, shopBreakdown,
    feeRate: platform.platformFeeRate,
    platformMinOk: totalItems >= (platform.minOrderAmount || 0),
    allMinOk: shopBreakdown.every((s) => s.minOrderOk),
    allAccept: shopBreakdown.every((s) => s.acceptOrders),
    canCheckout: shopBreakdown.every((s) => s.minOrderOk && s.acceptOrders) && totalItems > 0,
  };
}

window.CCLConfig = {
  DEFAULT_PLATFORM, DEFAULT_SHOP_SETTINGS,
  loadPlatformConfig, savePlatformConfig, resetPlatformConfig,
  loadAllShopSettings, loadShopSettings, saveShopSettings,
  loadCatalogOverrides, saveItemPrice, calcShopShip, calcOrderTotals,
};
window.VQConfig = window.CCLConfig; // backward compat
