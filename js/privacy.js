/**
 * Contact privacy — chống lộ SĐT/email/địa chỉ để giao dịch ngoài sàn.
 * Chỉ mở dần theo trạng thái đơn hoặc quyền admin.
 */
(function (global) {
  const PRE_PICKUP = new Set([
    'pending_confirm', 'preparing', 'ready_for_pickup', 'held', 'cancel_requested',
  ]);
  const WITH_SHIPPER = new Set([
    'picked_up', 'in_transit', 'out_for_delivery', 'shipping', 'delivery_failed', 'returning',
  ]);
  const DONE = new Set(['delivered', 'released', 'returned_to_seller', 'returned', 'cancelled']);

  function maskPhone(phone) {
    const p = String(phone || '').replace(/\D/g, '');
    if (p.length < 8) return p ? '***' : '—';
    return p.slice(0, 3) + '****' + p.slice(-3);
  }

  function maskEmail(email) {
    const e = String(email || '');
    const i = e.indexOf('@');
    if (i < 1) return e ? '***@***' : '—';
    const name = e.slice(0, i);
    const domain = e.slice(i + 1);
    const show = name.slice(0, Math.min(2, name.length));
    return show + '***@' + domain.replace(/^(.).+/, '$1***');
  }

  function maskAddress(addr) {
    const a = String(addr || '').trim();
    if (!a) return '—';
    if (a.length <= 12) return a.slice(0, 4) + '***';
    // Giữ phần quận/tỉnh cuối nếu có dấu phẩy
    const parts = a.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return '*** , ' + parts.slice(-2).join(', ');
    }
    return a.slice(0, 8) + '…***';
  }

  function session() {
    return global.CCLStore ? CCLStore.getSession() : null;
  }

  /** Admin luôn xem đầy đủ */
  function isAdmin() {
    const s = session();
    return s && s.role === 'admin';
  }

  /**
   * Buyer xem SĐT shop?
   * Chỉ khi có đơn với shop đó đã qua preparing trở lên, hoặc admin.
   */
  function canBuyerSeeShopContact(shopId, sellerEmail) {
    if (isAdmin()) return true;
    const s = session();
    if (!s || s.role !== 'buyer') return false;
    const orders = CCLStore.getOrdersForBuyer(s.email) || [];
    return orders.some((o) =>
      (o.packages || []).some((p) => {
        const match = p.shopId === shopId || p.sellerEmail === sellerEmail;
        if (!match) return false;
        return !PRE_PICKUP.has(p.status) || p.status === 'preparing' || p.status === 'ready_for_pickup';
      })
    );
  }

  /**
   * Shop xem SĐT/địa chỉ buyer?
   * Chỉ khi kiện đã xác nhận (preparing+) — cần để chuẩn bị giao / in phiếu.
   */
  function canShopSeeBuyerContact(order) {
    if (isAdmin()) return true;
    if (!order) return false;
    const pkgs = order.packages || [];
    if (!pkgs.length) return order.status !== 'pending_confirm' && order.status !== 'held';
    return pkgs.some((p) => p.status !== 'pending_confirm' && p.status !== 'held' && p.status !== 'cancelled');
  }

  /**
   * Shipper xem liên hệ buyer?
   * Chỉ khi đã claim kiện đó.
   */
  function canShipperSeeBuyerContact(pkg, shipperEmail) {
    if (isAdmin()) return true;
    if (!pkg || !shipperEmail) return false;
    return pkg.shipperEmail === shipperEmail && (
      WITH_SHIPPER.has(pkg.status) || DONE.has(pkg.status) || pkg.status === 'out_for_delivery'
    );
  }

  /** Shipper xem địa chỉ lấy hàng shop — khi đã claim hoặc kiện ready */
  function canShipperSeeShopContact(pkg, shipperEmail) {
    if (isAdmin()) return true;
    if (!pkg) return false;
    if (pkg.shipperEmail === shipperEmail) return true;
    return pkg.status === 'ready_for_pickup';
  }

  function revealPhone(raw, allowed) {
    if (!raw) return '—';
    return allowed ? String(raw) : maskPhone(raw);
  }

  function revealEmail(raw, allowed) {
    if (!raw) return '—';
    return allowed ? String(raw) : maskEmail(raw);
  }

  function revealAddress(raw, allowed) {
    if (!raw) return '—';
    return allowed ? String(raw) : maskAddress(raw);
  }

  /** Chặn chuỗi có vẻ là SĐT trong mô tả/public text */
  function scrubPublicText(text) {
    if (!text) return text;
    let t = String(text);
    // SĐT VN phổ biến
    t = t.replace(/(?:\+?84|0)\s*(?:\d[\s.\-]*){8,10}\d/g, '[liên hệ qua sàn]');
    // email
    t = t.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email ẩn]');
    // Zalo / telegram handle kiểu dẫn ra ngoài
    t = t.replace(/\b(zalo|telegram|viber|whatsapp)\s*[:：]?\s*[\w.+-]{3,}/gi, '[liên hệ qua sàn]');
    return t;
  }

  /**
   * Workspace UI prefs per role (banner, accent, menu order)
   * key: ccl_ui_<role>_<userId|email>
   */
  function uiKey(role, userKey) {
    return 'ccl_ui_' + (role || 'buyer') + '_' + (userKey || 'guest');
  }

  function loadWorkspaceUI(role, userKey) {
    try {
      const raw = localStorage.getItem(uiKey(role, userKey));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveWorkspaceUI(role, userKey, partial) {
    const prev = loadWorkspaceUI(role, userKey);
    const next = { ...prev, ...partial, updatedAt: new Date().toISOString() };
    localStorage.setItem(uiKey(role, userKey), JSON.stringify(next));
    return next;
  }

  global.CCLPrivacy = {
    maskPhone,
    maskEmail,
    maskAddress,
    canBuyerSeeShopContact,
    canShopSeeBuyerContact,
    canShipperSeeBuyerContact,
    canShipperSeeShopContact,
    revealPhone,
    revealEmail,
    revealAddress,
    scrubPublicText,
    loadWorkspaceUI,
    saveWorkspaceUI,
  };
})(typeof window !== 'undefined' ? window : globalThis);
