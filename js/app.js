/**
 * VinhQuay Market — Core App
 * Pricing: platform fee (Admin) + shop ship/prices (Seller customizable)
 */

const STORAGE_KEYS = {
  cart: 'vq_cart_v2',
  token: 'vq_token',
  user: 'vq_user',
  orders: 'vq_orders_v1',
};

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

function formatPct(rate) {
  return (Number(rate || 0) * 100).toFixed(2).replace(/\.?0+$/, '') + '%';
}

function toast(message, type = 'info') {
  let box = document.querySelector('.toast-container');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toast-container';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function setSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const totalQty = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = totalQty;
    el.style.display = totalQty > 0 ? 'flex' : 'none';
  });
}

function addToCart(itemId) {
  const catalog = window.VQConfig.getCatalog();
  const item = catalog.find((x) => x.id === itemId);
  if (!item) return;
  const shop = window.VQConfig.loadShopSettings(item.shopId);
  if (shop.acceptOrders === false) {
    toast('Gian hàng đang tạm ngưng nhận đơn', 'error');
    return;
  }
  const cart = getCart();
  const existing = cart.find((c) => c.id === itemId);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
    // refresh price from catalog in case seller changed it
    existing.price = item.price;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
  toast(`Đã thêm “${item.name}” vào giỏ`, 'success');
  if (typeof renderCart === 'function') renderCart();
}

function changeQty(itemId, delta) {
  let cart = getCart();
  const row = cart.find((c) => c.id === itemId);
  if (!row) return;
  row.qty = Math.max(0, (row.qty || 1) + delta);
  cart = cart.filter((c) => c.qty > 0);
  saveCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

function removeFromCart(itemId) {
  saveCart(getCart().filter((c) => c.id !== itemId));
  if (typeof renderCart === 'function') renderCart();
  toast('Đã xóa khỏi giỏ hàng', 'info');
}

function renderCatalog(filter = 'all', query = '') {
  const productsGrid = document.getElementById('productsGrid');
  const servicesGrid = document.getElementById('servicesGrid');
  if (!productsGrid || !servicesGrid) return;

  const catalog = window.VQConfig.getCatalog();
  const q = query.trim().toLowerCase();
  let items = catalog.filter((item) => {
    if (filter === 'product' && item.type !== 'product') return false;
    if (filter === 'service' && item.type !== 'service') return false;
    if (filter !== 'all' && filter !== 'product' && filter !== 'service' && item.category !== filter) return false;
    if (q) {
      const hay = `${item.name} ${item.shopName} ${item.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const products = items.filter((i) => i.type === 'product');
  const services = items.filter((i) => i.type === 'service');

  const cardHtml = (item) => {
    const shop = window.VQConfig.loadShopSettings(item.shopId);
    const shipHint = item.type === 'service'
      ? (shop.serviceCallOutFee > 0 ? `Phụ phí KT: ${formatVND(shop.serviceCallOutFee)}` : 'Thợ đến tận nơi')
      : (shop.freeShipThreshold > 0
          ? `Ship ${formatVND(shop.shipFeeProduct)} · Free từ ${formatVND(shop.freeShipThreshold)}`
          : `Ship ${formatVND(shop.shipFeeProduct)}`);
    return `
    <article class="card" data-id="${item.id}">
      <div class="card-img">
        ${item.emoji}
        <span class="card-badge ${item.type === 'product' ? 'badge-product' : 'badge-service'}">
          ${item.type === 'product' ? 'Sản phẩm' : 'Dịch vụ'}
        </span>
      </div>
      <div class="card-body">
        <div class="card-shop">🏪 ${item.shopName}</div>
        <h3 class="card-title">${item.name}</h3>
        <div class="card-meta">
          <span>★ ${item.rating}</span>
          <span>·</span>
          <span>Đã bán ${item.sold}</span>
        </div>
        <div class="card-meta" style="color:var(--primary);font-size:0.75rem">${shipHint}</div>
        <div class="card-price">
          <div class="price">${formatVND(item.price)}</div>
          <button class="btn btn-primary btn-sm" onclick="addToCart('${item.id}')">
            ${item.type === 'product' ? 'Thêm giỏ' : 'Đặt lịch'}
          </button>
        </div>
      </div>
    </article>`;
  };

  productsGrid.innerHTML = products.length
    ? products.map(cardHtml).join('')
    : '<p style="color:var(--text-muted);grid-column:1/-1;padding:20px 0;">Không tìm thấy sản phẩm phù hợp.</p>';
  servicesGrid.innerHTML = services.length
    ? services.map(cardHtml).join('')
    : '<p style="color:var(--text-muted);grid-column:1/-1;padding:20px 0;">Không tìm thấy dịch vụ phù hợp.</p>';
}

function renderCart() {
  const container = document.getElementById('cartContainer');
  const summary = document.getElementById('cartSummary');
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Giỏ hàng đang trống</p>
        <p style="font-size:0.85rem;margin-top:6px;">Thêm sản phẩm hoặc dịch vụ kỹ thuật để bắt đầu</p>
      </div>`;
    if (summary) summary.style.display = 'none';
    updateCartBadge();
    return;
  }

  // Sync prices from catalog (seller may have changed)
  const catalog = window.VQConfig.getCatalog();
  cart.forEach((c) => {
    const live = catalog.find((x) => x.id === c.id);
    if (live) c.price = live.price;
  });
  saveCart(cart);

  const voucherCode = document.getElementById('voucherInput')?.value || '';
  const totals = window.VQConfig.calcOrderTotals(cart, { code: voucherCode });
  const platform = window.VQConfig.loadPlatformConfig();

  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.shopId]) groups[item.shopId] = { name: item.shopName, items: [] };
    groups[item.shopId].items.push(item);
  });

  let html = '';
  totals.shopBreakdown.forEach((bd) => {
    const shopItems = groups[bd.shopId]?.items || [];
    const shipLabel = bd.freeShip
      ? 'Miễn ship'
      : `Ship: ${formatVND(bd.ship)}`;
    const minWarn = !bd.minOrderOk
      ? `<span style="color:var(--danger);font-size:0.75rem"> · Đơn tối thiểu ${formatVND(bd.minOrder)}</span>`
      : '';
    html += `
      <div class="shop-group">
        <div class="shop-header">
          <span>🏪 ${bd.shopName}${minWarn}</span>
          <span class="ship-badge">${shipLabel}</span>
        </div>`;
    shopItems.forEach((item) => {
      const line = item.price * (item.qty || 1);
      html += `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.type === 'product' ? '📦' : '🛠️'} ${item.name}</div>
            <div class="cart-item-type">${formatVND(item.price)} × ${item.qty || 1}</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
            <span class="qty-val">${item.qty || 1}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
          <div class="cart-item-price">${formatVND(line)}</div>
          <button class="btn btn-ghost btn-sm" onclick="removeFromCart('${item.id}')" title="Xóa">✕</button>
        </div>`;
    });
    html += '</div>';
  });

  container.innerHTML = html;

  if (summary) {
    summary.style.display = 'block';
    document.getElementById('sumItems').textContent = formatVND(totals.totalItems);
    document.getElementById('sumShip').textContent = formatVND(totals.totalShip);
    document.getElementById('sumFeeNote').textContent =
      `Phí sàn ${formatPct(totals.feeRate)} (thu từ đối tác khi giải ngân): ${formatVND(totals.platformFee)}`;
    const discRow = document.getElementById('sumDiscountRow');
    if (discRow) {
      if (totals.discount > 0) {
        discRow.style.display = 'flex';
        document.getElementById('sumDiscount').textContent = '−' + formatVND(totals.discount);
      } else {
        discRow.style.display = 'none';
      }
    }
    document.getElementById('sumTotal').textContent = formatVND(totals.grandTotal);

    const warn = document.getElementById('checkoutWarn');
    const btn = document.getElementById('checkoutBtn');
    if (!totals.canCheckout) {
      if (warn) {
        warn.style.display = 'block';
        warn.textContent = !totals.allAccept
          ? 'Một gian hàng đang tạm ngưng nhận đơn.'
          : 'Chưa đạt đơn tối thiểu của gian hàng.';
      }
      if (btn) btn.disabled = true;
    } else {
      if (warn) warn.style.display = 'none';
      if (btn) btn.disabled = false;
    }
  }
  updateCartBadge();
}

function applyVoucher() {
  renderCart();
  const cart = getCart();
  const code = document.getElementById('voucherInput')?.value || '';
  const totals = window.VQConfig.calcOrderTotals(cart, { code });
  if (code && totals.voucherApplied) {
    toast(`Áp dụng mã ${totals.voucherApplied}: giảm ${formatVND(totals.discount)}`, 'success');
  } else if (code) {
    toast('Mã giảm giá không hợp lệ', 'error');
  }
}

async function checkoutOrder() {
  const token = getToken();
  if (!token) {
    toast('Vui lòng đăng nhập trước khi thanh toán', 'error');
    setTimeout(() => (window.location.href = '/login.html'), 800);
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    toast('Giỏ hàng trống', 'error');
    return;
  }

  const voucherCode = document.getElementById('voucherInput')?.value || '';
  const totals = window.VQConfig.calcOrderTotals(cart, { code: voucherCode });
  if (!totals.canCheckout) {
    toast('Không thể đặt hàng — kiểm tra đơn tối thiểu / gian hàng tạm ngưng', 'error');
    return;
  }

  const bank = document.getElementById('bankSelect')?.value || 'Vietcombank';
  const btn = document.getElementById('checkoutBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';
  }

  const platform = window.VQConfig.loadPlatformConfig();

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cart,
        bank,
        platformFeeRate: platform.platformFeeRate,
        totals,
        shopSettingsSnapshot: totals.shopBreakdown,
      }),
    });
    const data = await res.json();
    if (data.success) {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || '[]');
      orders.unshift({
        id: data.orderId || `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        cart,
        bank,
        totals,
        message: data.message,
        status: 'held',
      });
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders.slice(0, 50)));
      saveCart([]);
      renderCart();
      toast(data.message || 'Đặt hàng thành công!', 'success');
    } else {
      toast(data.error || data.message || 'Không thể đặt hàng', 'error');
    }
  } catch (err) {
    toast('Lỗi kết nối. Vui lòng thử lại.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Đặt hàng & Thanh toán';
    }
  }
}

function renderUserNav() {
  const el = document.getElementById('userNav');
  if (!el) return;
  const user = getUser();
  if (user) {
    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
    el.innerHTML = `
      <div class="nav-user">
        <div class="avatar">${initial}</div>
        <span style="font-size:0.9rem;font-weight:600;">${user.name || user.email}</span>
        ${user.role === 'admin' ? '<a href="/admin.html" class="btn btn-ghost btn-sm">Admin</a>' : ''}
        ${user.role === 'seller' || user.role === 'admin' ? '<a href="/seller.html" class="btn btn-ghost btn-sm">Gian hàng</a>' : ''}
        <button class="btn btn-outline btn-sm" onclick="logout()">Đăng xuất</button>
      </div>`;
  } else {
    el.innerHTML = `<a href="/login.html" class="btn btn-primary btn-sm">Đăng nhập</a>`;
  }
}

function logout() {
  clearSession();
  toast('Đã đăng xuất', 'info');
  setTimeout(() => (window.location.href = '/'), 400);
}

let currentFilter = 'all';

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.filter === f);
  });
  const q = document.getElementById('searchInput')?.value || '';
  renderCatalog(f, q);
}

function onSearch() {
  const q = document.getElementById('searchInput')?.value || '';
  renderCatalog(currentFilter, q);
}

function initHome() {
  renderUserNav();
  renderCatalog();
  renderCart();
  updateCartBadge();
  const search = document.getElementById('searchInput');
  if (search) search.addEventListener('input', onSearch);

  // Show live platform fee in hero if present
  const feeEl = document.getElementById('liveFeeRate');
  if (feeEl) {
    const p = window.VQConfig.loadPlatformConfig();
    feeEl.textContent = formatPct(p.platformFeeRate);
  }
}

window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.checkoutOrder = checkoutOrder;
window.applyVoucher = applyVoucher;
window.logout = logout;
window.setFilter = setFilter;
window.initHome = initHome;
window.formatVND = formatVND;
window.formatPct = formatPct;
window.toast = toast;
window.getUser = getUser;
window.getToken = getToken;
window.setSession = setSession;
window.clearSession = clearSession;
window.renderCart = renderCart;
window.getCart = getCart;
