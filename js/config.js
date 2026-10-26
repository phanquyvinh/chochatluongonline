/**
 * VinhQuay Market — Platform + Shop configurable pricing
 * - Admin: phí sàn %, thuế, mặc định ship toàn sàn
 * - Seller: tự set giá SP/DV, phí ship shop, miễn ship, phụ phí dịch vụ
 * Data shape sẵn migrate sang bảng platform_settings + shop_settings
 */

const PLATFORM_CONFIG_KEY = 'vq_platform_config_v1';
const SHOP_SETTINGS_KEY = 'vq_shop_settings_v1';
const CATALOG_OVERRIDE_KEY = 'vq_catalog_overrides_v1';

const DEFAULT_PLATFORM = {
  platformFeeRate: 0.01,
  defaultShipFeePerShop: 30000,
  defaultFreeShipThreshold: 500000,
  defaultShipFeeService: 0,
  minOrderAmount: 0,
  corporateTaxRate: 0.10,
  vatRate: 0.08,
  escrowHoldDays: 3,
  autoReleaseEnabled: true,
  voucherEnabled: true,
  defaultVoucherCode: 'VINHQUAY10',
  defaultVoucherPercent: 0.10,
  defaultVoucherMaxDiscount: 50000,
  currency: 'VND',
  locale: 'vi-VN',
  supportHotline: '0975898828',
  supportEmail: 'phanquyvinh@gmail.com',
  version: 1,
  updatedAt: null,
  updatedBy: null,
};

/** Default catalog — base prices; seller overrides stored separately */
const BASE_CATALOG = [
  {
    id: 'p1', shopId: 's101', shopName: 'Điện Tử Bách Khoa', type: 'product',
    name: 'Bo mạch điều khiển điều hòa Senko', price: 350000,
    emoji: '🔌', rating: 4.8, sold: 126, category: 'linh-kien', active: true,
  },
  {
    id: 's1', shopId: 's101', shopName: 'Điện Tử Bách Khoa', type: 'service',
    name: 'Lắp đặt & đấu nối bo mạch tại nhà', price: 150000,
    emoji: '🛠️', rating: 4.9, sold: 89, category: 'sua-chua', active: true,
  },
  {
    id: 'p2', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', type: 'product',
    name: 'Lốc máy nén tủ lạnh 750W', price: 1200000,
    emoji: '❄️', rating: 4.7, sold: 54, category: 'linh-kien', active: true,
  },
  {
    id: 's2', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', type: 'service',
    name: 'Bảo dưỡng bơm gas vệ sinh tủ lạnh trọn gói', price: 250000,
    emoji: '🧊', rating: 4.9, sold: 210, category: 'sua-chua', active: true,
  },
  {
    id: 'p3', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', type: 'product',
    name: 'Module WiFi ESP32 cho thiết bị IoT', price: 185000,
    emoji: '📡', rating: 4.6, sold: 340, category: 'linh-kien', active: true,
  },
  {
    id: 's3', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', type: 'service',
    name: 'Lắp đặt camera an ninh 4 mắt + cấu hình app', price: 890000,
    emoji: '📹', rating: 4.8, sold: 67, category: 'lap-dat', active: true,
  },
  {
    id: 'p4', shopId: 's101', shopName: 'Điện Tử Bách Khoa', type: 'product',
    name: 'Cảm biến nhiệt độ DHT22 chính hãng', price: 95000,
    emoji: '🌡️', rating: 4.5, sold: 412, category: 'linh-kien', active: true,
  },
  {
    id: 's4', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', type: 'service',
    name: 'Sửa điều hòa không lạnh — kiểm tra miễn phí', price: 200000,
    emoji: '🔧', rating: 4.7, sold: 155, category: 'sua-chua', active: true,
  },
];

/** Default per-shop pricing rules (seller editable) */
const DEFAULT_SHOP_SETTINGS = {
  s101: {
    shopId: 's101',
    shopName: 'Điện Tử Bách Khoa',
    shipFeeProduct: 30000,
    freeShipThreshold: 400000,
    shipFeeService: 0,
    serviceCallOutFee: 0,
    minOrderAmount: 0,
    acceptOrders: true,
  },
  s102: {
    shopId: 's102',
    shopName: 'Điện Lạnh Hà Nội',
    shipFeeProduct: 35000,
    freeShipThreshold: 600000,
    shipFeeService: 0,
    serviceCallOutFee: 50000,
    minOrderAmount: 0,
    acceptOrders: true,
  },
  s103: {
    shopId: 's103',
    shopName: 'Kỹ Thuật Số Việt',
    shipFeeProduct: 25000,
    freeShipThreshold: 300000,
    shipFeeService: 0,
    serviceCallOutFee: 0,
    minOrderAmount: 100000,
    acceptOrders: true,
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
  const next = {
    ...loadPlatformConfig(),
    ...partial,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  next.platformFeeRate = clamp(next.platformFeeRate, 0, 0.3);
  next.corporateTaxRate = clamp(next.corporateTaxRate, 0, 0.5);
  next.vatRate = clamp(next.vatRate, 0, 0.2);
  next.defaultShipFeePerShop = Math.max(0, Math.round(Number(next.defaultShipFeePerShop) || 0));
  next.defaultFreeShipThreshold = Math.max(0, Math.round(Number(next.defaultFreeShipThreshold) || 0));
  next.defaultShipFeeService = Math.max(0, Math.round(Number(next.defaultShipFeeService) || 0));
  next.minOrderAmount = Math.max(0, Math.round(Number(next.minOrderAmount) || 0));
  next.escrowHoldDays = Math.max(0, Math.min(30, Math.round(Number(next.escrowHoldDays) || 0)));
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
  const shop = all[shopId];
  if (shop) return shop;
  // Fallback for unknown shop → platform defaults
  return {
    shopId,
    shopName: shopId,
    shipFeeProduct: platform.defaultShipFeePerShop,
    freeShipThreshold: platform.defaultFreeShipThreshold,
    shipFeeService: platform.defaultShipFeeService,
    serviceCallOutFee: 0,
    minOrderAmount: 0,
    acceptOrders: true,
  };
}

function saveShopSettings(shopId, partial) {
  const all = loadAllShopSettings();
  const prev = all[shopId] || loadShopSettings(shopId);
  const next = {
    ...prev,
    ...partial,
    shopId,
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

/** Price overrides by item id (seller edits price) */
function loadCatalogOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CATALOG_OVERRIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveItemPrice(itemId, price, extra = {}) {
  const o = loadCatalogOverrides();
  o[itemId] = {
    ...(o[itemId] || {}),
    price: Math.max(0, Math.round(Number(price) || 0)),
    ...extra,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CATALOG_OVERRIDE_KEY, JSON.stringify(o));
  return o[itemId];
}

function getCatalog() {
  const overrides = loadCatalogOverrides();
  return BASE_CATALOG.map((item) => {
    const ov = overrides[item.id];
    if (!ov) return { ...item };
    return {
      ...item,
      price: ov.price !== undefined ? ov.price : item.price,
      active: ov.active !== undefined ? ov.active : item.active,
      name: ov.name || item.name,
    };
  }).filter((i) => i.active !== false);
}

function getCatalogByShop(shopId) {
  return getCatalog().filter((i) => i.shopId === shopId);
}

/**
 * Ship for one shop group
 */
function calcShopShip(shopItems, shopSettings, platform) {
  if (!shopItems.length) return 0;
  const allService = shopItems.every((i) => i.type === 'service');
  const settings = shopSettings || loadShopSettings(shopItems[0].shopId);

  if (allService) {
    // Dịch vụ: phí ship/call-out do seller set
    const callOut = settings.serviceCallOutFee || 0;
    const base = settings.shipFeeService != null ? settings.shipFeeService : (platform.defaultShipFeeService || 0);
    return base + callOut;
  }

  const subtotal = shopItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  const threshold = settings.freeShipThreshold != null
    ? settings.freeShipThreshold
    : (platform.defaultFreeShipThreshold || 0);
  if (threshold > 0 && subtotal >= threshold) return 0;

  return settings.shipFeeProduct != null
    ? settings.shipFeeProduct
    : (platform.defaultShipFeePerShop || 0);
}

/**
 * Full order totals using per-shop rules + platform fee
 */
function calcOrderTotals(cart, voucher) {
  const platform = loadPlatformConfig();
  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.shopId]) groups[item.shopId] = [];
    groups[item.shopId].push(item);
  });

  let totalItems = 0;
  let totalShip = 0;
  const shopBreakdown = [];

  Object.keys(groups).forEach((shopId) => {
    const items = groups[shopId];
    const settings = loadShopSettings(shopId);
    const sub = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
    const ship = calcShopShip(items, settings, platform);
    totalItems += sub;
    totalShip += ship;
    shopBreakdown.push({
      shopId,
      shopName: items[0]?.shopName || settings.shopName,
      subtotal: sub,
      ship,
      freeShip: ship === 0 && sub > 0,
      minOrder: settings.minOrderAmount || 0,
      minOrderOk: sub >= (settings.minOrderAmount || 0),
      acceptOrders: settings.acceptOrders !== false,
    });
  });

  const platformFee = Math.round(totalItems * (platform.platformFeeRate || 0));

  let discount = 0;
  let voucherApplied = null;
  if (voucher && voucher.code && platform.voucherEnabled) {
    const code = String(voucher.code).trim().toUpperCase();
    if (code === String(platform.defaultVoucherCode || '').toUpperCase()) {
      const raw = Math.round(totalItems * (platform.defaultVoucherPercent || 0));
      discount = Math.min(raw, platform.defaultVoucherMaxDiscount || raw);
      voucherApplied = code;
    }
  }

  const grandTotal = Math.max(0, totalItems + totalShip - discount);
  const allMinOk = shopBreakdown.every((s) => s.minOrderOk);
  const allAccept = shopBreakdown.every((s) => s.acceptOrders);

  return {
    totalItems,
    totalShip,
    platformFee,
    discount,
    voucherApplied,
    grandTotal,
    shopBreakdown,
    feeRate: platform.platformFeeRate,
    platformMinOk: totalItems >= (platform.minOrderAmount || 0),
    allMinOk,
    allAccept,
    canCheckout: allMinOk && allAccept && totalItems > 0,
  };
}

window.VQConfig = {
  DEFAULT_PLATFORM,
  DEFAULT_SHOP_SETTINGS,
  BASE_CATALOG,
  loadPlatformConfig,
  savePlatformConfig,
  resetPlatformConfig,
  loadAllShopSettings,
  loadShopSettings,
  saveShopSettings,
  loadCatalogOverrides,
  saveItemPrice,
  getCatalog,
  getCatalogByShop,
  calcShopShip,
  calcOrderTotals,
};
