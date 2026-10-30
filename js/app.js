/**
 * chochatluongonline — UI helpers & marketplace logic
 */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}
/** Format số tiền khi gõ: 1000000 → 1.000.000 */
function formatPriceTyping(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function parseVNDInput(str) {
  return Number(String(str || '').replace(/[^\d]/g, '')) || 0;
}
function bindPriceInput(el) {
  if (!el || el.dataset.priceBound) return;
  el.dataset.priceBound = '1';
  el.addEventListener('input', () => {
    const start = el.selectionStart;
    const before = el.value;
    const digitsBefore = before.slice(0, start).replace(/[^\d]/g, '').length;
    el.value = formatPriceTyping(el.value);
    // restore cursor roughly after same digit count
    let pos = 0, count = 0;
    while (pos < el.value.length && count < digitsBefore) {
      if (/\d/.test(el.value[pos])) count++;
      pos++;
    }
    try { el.setSelectionRange(pos, pos); } catch (_) {}
  });
  el.addEventListener('blur', () => {
    el.value = formatPriceTyping(el.value);
  });
}
function formatPct(rate) {
  return (Number(rate || 0) * 100).toFixed(2).replace(/\.?0+$/, '') + '%';
}
function stars(n) {
  const r = Math.round(Number(n) || 0);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function toast(message, type = 'info') {
  let box = $('.toast-container');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toast-container';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
}

function getSession() {
  return window.CCLStore ? CCLStore.getSession() : null;
}

function requireAuth(roles) {
  const s = getSession();
  if (!s) {
    toast('Vui lòng đăng nhập', 'error');
    setTimeout(() => (location.href = '/login.html'), 600);
    return null;
  }
  if (roles && !roles.includes(s.role)) {
    toast('Không có quyền truy cập', 'error');
    setTimeout(() => (location.href = '/'), 600);
    return null;
  }
  if (CCLStore.isBlocked(s.email)) {
    toast('Tài khoản đã bị khóa', 'error');
    CCLStore.clearSession();
    setTimeout(() => (location.href = '/login.html'), 800);
    return null;
  }
  return s;
}

function logout() {
  if (window.CCLStore) CCLStore.clearSession();
  toast('Đã đăng xuất', 'info');
  setTimeout(() => (location.href = '/'), 400);
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('ccl_cart_v2') || '[]'); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem('ccl_cart_v2', JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const cart = getCart();
  const q = cart.reduce((s, i) => s + (i.qty || 1), 0);
  $$('[data-cart-count]').forEach((el) => {
    el.textContent = q;
    el.style.display = q > 0 ? 'flex' : 'none';
  });
}

function addToCart(itemId) {
  const item = CCLStore.getProductById(itemId);
  if (!item) return;
  const shop = CCLConfig.loadShopSettings(item.shopId);
  if (shop.acceptOrders === false) {
    toast('Gian hàng tạm ngưng nhận đơn', 'error');
    return;
  }
  const cart = getCart();
  const ex = cart.find((c) => c.id === itemId);
  if (ex) { ex.qty = (ex.qty || 1) + 1; ex.price = item.price; }
  else cart.push({ ...item, qty: 1 });
  saveCart(cart);
  toast('Đã thêm vào giỏ', 'success');
  if (typeof renderCart === 'function') renderCart();
}

function changeQty(id, d) {
  let cart = getCart();
  const row = cart.find((c) => c.id === id);
  if (!row) return;
  row.qty = Math.max(0, (row.qty || 1) + d);
  cart = cart.filter((c) => c.qty > 0);
  saveCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

function removeFromCart(id) {
  saveCart(getCart().filter((c) => c.id !== id));
  if (typeof renderCart === 'function') renderCart();
}


function syncHeroAuth() {
  const box = document.getElementById('heroAuth');
  if (!box) return;
  const s = getSession();
  box.classList.toggle('is-hidden', !!s);
}

function renderUserNav() {
  const el = $('#userNav');
  if (!el) return;
  const s = getSession();
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  if (s) {
    const initial = (s.name || s.email || 'U').charAt(0).toUpperCase();
    const name = s.name || s.email || '';
    let items = '';
    if (s.role === 'admin') items += '<a href="/admin.html">' + tt('admin', 'Quản trị') + '</a>';
    if (s.role === 'seller') items += '<a href="/seller.html">' + tt('seller', 'Gian hàng') + '</a>';
    if (s.role === 'shipper') items += '<a href="/shipper.html">Vận chuyển</a>';
    if (s.role === 'buyer' || s.role === 'admin') items += '<a href="/orders.html">' + tt('orders', 'Đơn hàng') + '</a>';
    items += '<a href="/profile.html">' + tt('profile', 'Hồ sơ') + '</a>';
    items += '<button type="button" onclick="logout()">' + tt('logout', 'Thoát') + '</button>';

    // Desktop: full links | Mobile: avatar menu
    let desk = '';
    if (s.role === 'admin') desk += '<a href="/admin.html" class="btn btn-ghost btn-sm">' + tt('admin', 'Quản trị') + '</a>';
    if (s.role === 'seller') desk += '<a href="/seller.html" class="btn btn-ghost btn-sm">' + tt('seller', 'Gian hàng') + '</a>';
    if (s.role === 'shipper') desk += '<a href="/shipper.html" class="btn btn-ghost btn-sm">Vận chuyển</a>';
    if (s.role === 'buyer' || s.role === 'admin') desk += '<a href="/orders.html" class="btn btn-ghost btn-sm">' + tt('orders', 'Đơn hàng') + '</a>';
    desk += '<a href="/profile.html" class="btn btn-ghost btn-sm">' + tt('profile', 'Hồ sơ') + '</a>';
    desk += '<button class="btn btn-outline btn-sm" onclick="logout()">' + tt('logout', 'Thoát') + '</button>';

    el.innerHTML =
      '<div class="nav-user nav-user-desktop">' +
        '<div class="avatar">' + initial + '</div>' +
        '<span class="nav-name">' + name + '</span>' + desk +
      '</div>' +
      '<button type="button" class="account-menu-btn" id="accountMenuBtn" aria-label="Menu">' +
        '<div class="avatar">' + initial + '</div><span>' + (name.split(' ').pop() || name).slice(0, 10) + '</span>' +
      '</button>' +
      '<div class="account-dropdown" id="accountDropdown">' + items + '</div>';

    const btn = document.getElementById('accountMenuBtn');
    const dd = document.getElementById('accountDropdown');
    if (btn && dd) {
      btn.onclick = (e) => {
        e.stopPropagation();
        dd.classList.toggle('open');
      };
      document.addEventListener('click', () => dd.classList.remove('open'), { once: true });
    }
  } else {
    // Nút ĐN/ĐK chỉ trên banner — header để trống khi chưa login
    el.innerHTML = '';
  }
  const sel = document.getElementById('langSelect');
  if (sel && typeof getLang === 'function') sel.value = getLang();
  syncHeroAuth();
}

function productCard(item) {
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const img = (item.images && item.images[0])
    ? '<img src="' + item.images[0] + '" alt="" style="width:100%;height:100%;object-fit:cover">'
    : '<span style="font-size:2.4rem">' + (item.emoji || '📦') + '</span>';
  const rc = item.reviewsCount || 0;
  const badge = item.type === 'product' ? tt('product', 'Sản phẩm') : tt('service', 'Dịch vụ');
  const badgeClass = item.type === 'product' ? 'badge-product' : 'badge-service';
  return (
    '<article class="card">' +
      '<a href="/product.html?id=' + item.id + '" class="card-img">' + img +
        '<span class="card-badge ' + badgeClass + '">' + badge + '</span></a>' +
      '<div class="card-body">' +
        '<a href="/shop.html?id=' + item.shopId + '" class="card-shop">🏪 ' + (item.shopName || '') + '</a>' +
        '<a href="/product.html?id=' + item.id + '" class="card-title">' + item.name + '</a>' +
        '<div class="card-meta"><span>' + stars(item.rating) + ' ' + (item.rating || 0) + '</span><span>·</span><span>' + rc + ' ' + tt('reviews', 'đánh giá') + '</span></div>' +
        '<div class="card-price">' +
          '<div class="price">' + formatVND(item.price) + '</div>' +
          '<button class="btn btn-primary btn-sm" onclick="event.preventDefault();addToCart(\'' + item.id + '\')">' + tt('add', 'Thêm') + '</button>' +
        '</div></div></article>'
  );
}

let currentFilter = 'all';
function setFilter(f) {
  currentFilter = f;
  $$('.chip').forEach((c) => c.classList.toggle('active', c.dataset.filter === f));
  renderCatalog();
}
function getSearchQuery() {
  const a = ($('#searchInput')?.value || '').trim();
  const b = ($('#searchInputMobile')?.value || '').trim();
  return (a || b).toLowerCase();
}

function renderCatalog() {
  const pg = $('#productsGrid'), sg = $('#servicesGrid');
  if (!pg || !sg) return;
  const q = getSearchQuery();
  const minPrice = parseVNDInput($('#filterMinPrice')?.value) || 0;
  const maxPrice = parseVNDInput($('#filterMaxPrice')?.value) || 0;
  const minRating = Number($('#filterMinRating')?.value) || 0;
  const sortBy = $('#filterSort')?.value || 'default';

  let items = CCLStore.getProducts();
  items = items.filter((item) => {
    if (currentFilter === 'product' && item.type !== 'product') return false;
    if (currentFilter === 'service' && item.type !== 'service') return false;
    if (!['all', 'product', 'service'].includes(currentFilter) && item.category !== currentFilter) return false;
    if (q) {
      const hay = `${item.name} ${item.shopName || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      if (!words.every((w) => hay.includes(w))) return false;
    }
    const price = Number(item.price) || 0;
    if (minPrice > 0 && price < minPrice) return false;
    if (maxPrice > 0 && price > maxPrice) return false;
    if (minRating > 0 && (Number(item.rating) || 0) < minRating) return false;
    return true;
  });

  if (sortBy === 'price_asc') items.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sortBy === 'price_desc') items.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (sortBy === 'rating') items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sortBy === 'sold') items.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  else if (sortBy === 'newest') items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const products = items.filter((i) => i.type === 'product');
  const services = items.filter((i) => i.type === 'service');
  const empty = '<p class="empty-msg">' + (typeof t==='function'?t('noResults'):'Không tìm thấy kết quả phù hợp') + '</p>';
  pg.innerHTML = products.length ? products.map(productCard).join('') : empty;
  sg.innerHTML = services.length ? services.map(productCard).join('') : empty;
  const countEl = $('#resultCount');
  if (countEl) countEl.textContent = items.length ? `${items.length} kết quả` : '';
}

function renderCart() {
  const container = $('#cartContainer');
  const summary = $('#cartSummary');
  if (!container) return;
  const cart = getCart();
  if (!cart.length) {
    container.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>${typeof t==='function'?t('emptyCart'):'Giỏ hàng trống'}</p></div>`;
    if (summary) summary.style.display = 'none';
    updateCartBadge();
    return;
  }
  cart.forEach((c) => {
    const live = CCLStore.getProductById(c.id);
    if (live) c.price = live.price;
  });
  saveCart(cart);
  const voucherCode = $('#voucherInput')?.value || '';
  const totals = CCLConfig.calcOrderTotals(cart, { code: voucherCode });
  const groups = {};
  cart.forEach((item) => {
    if (!groups[item.shopId]) groups[item.shopId] = [];
    groups[item.shopId].push(item);
  });
  let html = '';
  totals.shopBreakdown.forEach((bd) => {
    const items = groups[bd.shopId] || [];
    html += `<div class="shop-group"><div class="shop-header"><span>🏪 ${bd.shopName}</span><span class="ship-badge">${bd.freeShip ? (typeof t==='function'?t('freeShip'):'Miễn ship') : ('Ship ' + formatVND(bd.ship))}</span></div>`;
    items.forEach((item) => {
      html += `<div class="cart-item">
        <div class="cart-item-info"><div class="cart-item-name">${item.name}</div>
        <div class="cart-item-type">${formatVND(item.price)} × ${item.qty || 1}</div></div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
          <span class="qty-val">${item.qty || 1}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
        </div>
        <div class="cart-item-price">${formatVND(item.price * (item.qty || 1))}</div>
        <button class="btn btn-ghost btn-sm" onclick="removeFromCart('${item.id}')">✕</button>
      </div>`;
    });
    html += '</div>';
  });
  container.innerHTML = html;
  if (summary) {
    summary.style.display = 'block';
    $('#sumItems').textContent = formatVND(totals.totalItems);
    $('#sumShip').textContent = formatVND(totals.totalShip);
    $('#sumFeeNote').textContent = `Phí sàn ${formatPct(totals.feeRate)} (trừ khi giải ngân): ${formatVND(totals.platformFee)}`;
    const discRow = $('#sumDiscountRow');
    if (discRow) {
      if (totals.discount > 0) {
        discRow.style.display = 'flex';
        $('#sumDiscount').textContent = '−' + formatVND(totals.discount);
      } else discRow.style.display = 'none';
    }
    $('#sumTotal').textContent = formatVND(totals.grandTotal);
    const btn = $('#checkoutBtn');
    if (btn) btn.disabled = !totals.canCheckout;
  }
  updateCartBadge();
}

function applyVoucher() { renderCart(); }

async function checkoutOrder() {
  const s = getSession();
  if (!s) {
    toast('Vui lòng đăng nhập', 'error');
    setTimeout(() => (location.href = '/login.html'), 600);
    return;
  }
  if (s.role === 'seller') {
    toast('Tài khoản bán hàng không đặt đơn mua', 'error');
    return;
  }
  if (CCLStore.isBlocked(s.email)) {
    toast('Tài khoản bị khóa', 'error');
    return;
  }
  const cart = getCart();
  if (!cart.length) return;
  const totals = CCLConfig.calcOrderTotals(cart, { code: $('#voucherInput')?.value || '' });
  if (!totals.canCheckout) {
    toast('Không thể đặt hàng', 'error');
    return;
  }
  const bank = $('#bankSelect')?.value || 'Vietcombank';
  const user = CCLStore.findUserByEmail(s.email) || {};
  const order = CCLStore.createOrder({
    buyerEmail: s.email,
    buyerName: s.name || user.name || '',
    buyerPhone: s.phone || user.phone || '',
    buyerAddress: user.address || '',
    cart,
    totals,
    bank,
  });
  saveCart([]);
  renderCart();
  toast('Đặt hàng thành công — tiền đang tạm giữ escrow. Mã: ' + order.id, 'success');
}


function applyHero() {
  if (!window.CCLConfig) return;
  const c = CCLConfig.loadPlatformConfig();
  const imgs = c.heroImages || [];
  ['heroImg1','heroImg2','heroImg3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && imgs[i]) { el.src = imgs[i]; el.style.display = ''; }
    else if (el && !imgs[i]) el.style.display = 'none';
  });
  const tag = document.querySelector('.logo-tagline');
  if (tag && c.heroTagline) tag.textContent = c.heroTagline;
  const desc = document.querySelector('.hero-desc');
  if (desc && c.heroTagline) desc.textContent = c.heroTagline;
}

function renderShops() {
  const el = document.getElementById('shopsGrid');
  if (!el || !window.CCLStore) return;
  const products = CCLStore.getProducts().filter((p) => p.active !== false);
  const map = {};
  products.forEach((p) => {
    const id = p.shopId || 'unknown';
    if (!map[id]) {
      map[id] = {
        shopId: id,
        shopName: p.shopName || id,
        count: 0,
        sold: 0,
        ratingSum: 0,
        ratingN: 0,
        emoji: p.emoji || '🏪',
      };
    }
    map[id].count += 1;
    map[id].sold += Number(p.sold) || 0;
    if (p.rating) {
      map[id].ratingSum += Number(p.rating) || 0;
      map[id].ratingN += 1;
    }
  });
  const shops = Object.values(map).sort((a, b) => b.sold - a.sold);
  if (!shops.length) {
    el.innerHTML = '<p class="empty-msg">Chưa có gian hàng</p>';
    return;
  }
  el.innerHTML = shops.map((s) => {
    const rating = s.ratingN ? (s.ratingSum / s.ratingN).toFixed(1) : '—';
    return (
      '<a class="shop-tile" href="/shop.html?id=' + encodeURIComponent(s.shopId) + '">' +
        '<div class="shop-tile-icon">' + (s.emoji || '🏪') + '</div>' +
        '<div class="shop-tile-body">' +
          '<div class="shop-tile-name">' + s.shopName + '</div>' +
          '<div class="shop-tile-meta">' + s.count + ' SP/DV · ★ ' + rating + ' · Đã bán ' + s.sold + '</div>' +
        '</div>' +
      '</a>'
    );
  }).join('');
}

function initHome() {
  CCLStore.ensureProducts();
  applyHero();
  renderUserNav();
  if (typeof applyI18n === 'function') applyI18n();
  renderCatalog();
  renderShops();
  renderCart();
  updateCartBadge();
  // Ẩn link đăng nhập trên quicknav nếu đã login
  const s = getSession();
  document.querySelectorAll('.qnav-muted').forEach((a) => {
    if (s) a.style.display = 'none';
  });
  const search = $('#searchInput');
  if (search) search.addEventListener('input', () => { renderCatalog(); renderShops(); });
  const searchM = $('#searchInputMobile');
  if (searchM) searchM.addEventListener('input', () => {
    if (search) search.value = searchM.value;
    renderCatalog();
    renderShops();
  });
  ['filterMinPrice','filterMaxPrice'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      bindPriceInput(el);
      el.addEventListener('change', () => renderCatalog());
      el.addEventListener('input', () => renderCatalog());
    }
  });
  ['filterMinRating','filterSort'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => renderCatalog());
  });
}

window.formatVND = formatVND;
window.formatPriceTyping = formatPriceTyping;
window.parseVNDInput = parseVNDInput;
window.bindPriceInput = bindPriceInput;
window.formatPct = formatPct;
window.stars = stars;
window.toast = toast;
window.logout = logout;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.setFilter = setFilter;
window.renderCart = renderCart;
window.applyVoucher = applyVoucher;
window.checkoutOrder = checkoutOrder;
window.initHome = initHome;
window.applyHero = applyHero;
window.getSession = getSession;
window.requireAuth = requireAuth;
window.renderUserNav = renderUserNav;
window.syncHeroAuth = syncHeroAuth;
