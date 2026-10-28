/**
 * chochatluongonline — data store (users, products, reviews, returns, blocks)
 * Ready to map to PostgreSQL later. Versioned keys preserve old data on upgrade.
 */
const K = {
  users: 'ccl_users_v1',
  products: 'ccl_products_v1',
  reviews: 'ccl_reviews_v1',
  orders: 'ccl_orders_v1',
  returns: 'ccl_returns_v1',
  blocks: 'ccl_blocks_v1',
  otps: 'ccl_otps_v1',
  session: 'ccl_session_v1',
  cart: 'ccl_cart_v2',
};

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- Seed products (first run only) ---------- */
const SEED_PRODUCTS = [
  {
    id: 'p1', shopId: 's101', shopName: 'Điện Tử Bách Khoa', sellerEmail: 'shop.dientu@example.com',
    type: 'product', name: 'Bo mạch điều khiển điều hòa Senko', price: 350000,
    emoji: '🔌', images: [], category: 'linh-kien', rating: 4.8, sold: 126, active: true,
    description: 'Bo mạch zin theo máy, kiểm tra trước khi gửi.',
    guide: 'Tắt nguồn → tháo vỏ → thay bo → đấu đúng jack → chạy thử 10 phút.',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 's1', shopId: 's101', shopName: 'Điện Tử Bách Khoa', sellerEmail: 'shop.dientu@example.com',
    type: 'service', name: 'Lắp đặt & đấu nối bo mạch tại nhà', price: 150000,
    emoji: '🛠️', images: [], category: 'sua-chua', rating: 4.9, sold: 89, active: true,
    description: 'Kỹ thuật viên đến tận nơi trong nội thành.',
    guide: 'Chuẩn bị vị trí máy, ổ điện ổn định. Hẹn giờ trước 2 giờ.',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'p2', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', sellerEmail: 'shop.dienlanh@example.com',
    type: 'product', name: 'Lốc máy nén tủ lạnh 750W', price: 1200000,
    emoji: '❄️', images: [], category: 'linh-kien', rating: 4.7, sold: 54, active: true,
    description: 'Lốc 750W, bảo hành 6 tháng.',
    guide: 'Chỉ lắp bởi thợ có chuyên môn gas lạnh.',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 's2', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', sellerEmail: 'shop.dienlanh@example.com',
    type: 'service', name: 'Bảo dưỡng bơm gas vệ sinh tủ lạnh trọn gói', price: 250000,
    emoji: '🧊', images: [], category: 'sua-chua', rating: 4.9, sold: 210, active: true,
    description: 'Vệ sinh dàn, kiểm tra gas, bổ sung nếu thiếu.',
    guide: 'Thời gian ~90 phút. Để trống ngăn đá trước khi thợ đến.',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'p3', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', sellerEmail: 'shop.kts@example.com',
    type: 'product', name: 'Module WiFi ESP32 cho thiết bị IoT', price: 185000,
    emoji: '📡', images: [], category: 'linh-kien', rating: 4.6, sold: 340, active: true,
    description: 'ESP32 gốc, flash sẵn firmware mẫu.',
    guide: 'Cấp 5V ổn định, kết nối UART để nạp code.',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 's3', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', sellerEmail: 'shop.kts@example.com',
    type: 'service', name: 'Lắp đặt camera an ninh 4 mắt + cấu hình app', price: 890000,
    emoji: '📹', images: [], category: 'lap-dat', rating: 4.8, sold: 67, active: true,
    description: 'Trọn gói 4 camera + đầu ghi + app điện thoại.',
    guide: 'Cần sẵn nguồn và hướng treo tường. Hỗ trợ trong 7 ngày sau lắp.',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'p4', shopId: 's101', shopName: 'Điện Tử Bách Khoa', sellerEmail: 'shop.dientu@example.com',
    type: 'product', name: 'Cảm biến nhiệt độ DHT22 chính hãng', price: 95000,
    emoji: '🌡️', images: [], category: 'linh-kien', rating: 4.5, sold: 412, active: true,
    description: 'DHT22 độ chính xác cao, có trở kéo.',
    guide: 'Nối VCC-5V, DATA-GPIO, GND. Thư viện Adafruit DHT.',
    createdAt: '2026-01-18T00:00:00.000Z',
  },
  {
    id: 's4', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', sellerEmail: 'shop.dienlanh@example.com',
    type: 'service', name: 'Sửa điều hòa không lạnh', price: 200000,
    emoji: '🔧', images: [], category: 'sua-chua', rating: 4.7, sold: 155, active: true,
    description: 'Kiểm tra miễn phí nếu sử dụng dịch vụ sửa.',
    guide: 'Ghi rõ model máy khi đặt lịch.',
    createdAt: '2026-01-18T00:00:00.000Z',
  },
];

function ensureProducts() {
  let list = read(K.products, null);
  if (!list || !list.length) {
    list = SEED_PRODUCTS;
    write(K.products, list);
  }
  return list;
}

function getProducts(filterFn) {
  let list = ensureProducts();
  // Apply price overrides from config if any
  const ov = (window.CCLConfig && window.CCLConfig.loadCatalogOverrides)
    ? window.CCLConfig.loadCatalogOverrides() : {};
  list = list.map((p) => {
    const o = ov[p.id];
    if (!o) return p;
    return { ...p, price: o.price != null ? o.price : p.price, active: o.active != null ? o.active : p.active, name: o.name || p.name };
  });
  if (filterFn) list = list.filter(filterFn);
  return list.filter((p) => p.active !== false);
}

function getProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

function getProductsByShop(shopId) {
  return getProducts((p) => p.shopId === shopId);
}

function saveProduct(product) {
  const list = ensureProducts();
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...product, updatedAt: new Date().toISOString() };
  else list.push({ ...product, id: product.id || uid('p'), createdAt: new Date().toISOString(), active: true, rating: 0, sold: 0, reviewsCount: 0 });
  write(K.products, list);
  return list.find((p) => p.id === (product.id || list[list.length - 1].id));
}

function hardDeleteProduct(id, sellerEmail) {
  let list = ensureProducts();
  const p = list.find((x) => x.id === id);
  if (!p) return false;
  if (sellerEmail && p.sellerEmail && p.sellerEmail !== sellerEmail) return false;
  list = list.filter((x) => x.id !== id);
  write(K.products, list);
  return true;
}

function deleteProduct(id, sellerEmail) {
  const list = ensureProducts();
  const p = list.find((x) => x.id === id);
  if (!p) return false;
  if (sellerEmail && p.sellerEmail && p.sellerEmail !== sellerEmail) return false;
  p.active = false;
  p.updatedAt = new Date().toISOString();
  write(K.products, list);
  return true;
}

/* ---------- Users ---------- */
function getUsers() { return read(K.users, []); }
function saveUsers(list) { write(K.users, list); }

function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

function createUser(data) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { error: 'Email đã được đăng ký' };
  }
  const user = {
    id: uid('u'),
    email: data.email.trim().toLowerCase(),
    password: data.password, // production: bcrypt hash
    name: data.name.trim(),
    role: data.role || 'buyer', // buyer | seller | shipper
    phone: data.phone || '',
    address: data.address || '',
    shopId: data.role === 'seller' ? uid('s') : null,
    shopName: data.role === 'seller' ? (data.shopName || data.name) : null,
    verified: false,
    blocked: false,
    blockReason: null,
    bombCount: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  if (user.role === 'seller' && window.CCLConfig) {
    window.CCLConfig.saveShopSettings(user.shopId, {
      shopId: user.shopId,
      shopName: user.shopName,
      shipFeeProduct: 30000,
      freeShipThreshold: 500000,
      shipFeeService: 0,
      serviceCallOutFee: 0,
      minOrderAmount: 0,
      acceptOrders: true,
    });
  }
  return { user };
}

function updateUser(email, patch) {
  const users = getUsers();
  const i = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (i < 0) return null;
  users[i] = { ...users[i], ...patch, updatedAt: new Date().toISOString() };
  saveUsers(users);
  return users[i];
}

/* ---------- OTP (email verification) ---------- */
function setOtp(email, purpose = 'register') {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otps = read(K.otps, {});
  otps[email.toLowerCase()] = {
    code,
    purpose,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  write(K.otps, otps);
  return code; // caller sends via email service; never display on public UI
}

function verifyOtp(email, code) {
  const otps = read(K.otps, {});
  const rec = otps[email.toLowerCase()];
  if (!rec) return { ok: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn' };
  if (Date.now() > rec.expiresAt) return { ok: false, message: 'Mã OTP đã hết hạn' };
  if (String(code).trim() !== String(rec.code)) return { ok: false, message: 'Mã OTP không đúng' };
  delete otps[email.toLowerCase()];
  write(K.otps, otps);
  return { ok: true };
}

/* ---------- Session ---------- */
function getSession() { return read(K.session, null); }
function setSession(user) {
  const s = { email: user.email, name: user.name, role: user.role, shopId: user.shopId, shopName: user.shopName, id: user.id };
  write(K.session, s);
  localStorage.setItem('vq_token', 'local-' + user.id);
  localStorage.setItem('vq_user', JSON.stringify(s));
  return s;
}
function clearSession() {
  localStorage.removeItem(K.session);
  localStorage.removeItem('vq_token');
  localStorage.removeItem('vq_user');
  localStorage.removeItem('ccl_session_v1');
}

/* ---------- Reviews (buyer + admin can edit/delete) ---------- */
function getReviews(filterFn) {
  let list = read(K.reviews, []);
  if (filterFn) list = list.filter(filterFn);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function addReview({ productId, shopId, userEmail, userName, rating, content }) {
  const session = getSession();
  if (!session || session.role === 'seller') {
    return { error: 'Chỉ người mua đã đăng nhập mới đánh giá được' };
  }
  if (rating < 1 || rating > 5) return { error: 'Số sao từ 1 đến 5' };
  const list = read(K.reviews, []);
  const review = {
    id: uid('rv'),
    productId, shopId,
    userEmail: userEmail || session.email,
    userName: userName || session.name,
    rating: Number(rating),
    content: String(content || '').trim(),
    createdAt: new Date().toISOString(),
  };
  list.push(review);
  write(K.reviews, list);
  recalcProductRating(productId);
  return { review };
}

function updateReview(id, patch, actor) {
  const list = read(K.reviews, []);
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return { error: 'Không tìm thấy' };
  const r = list[i];
  const isOwner = actor.email === r.userEmail;
  const isAdmin = actor.role === 'admin';
  if (!isOwner && !isAdmin) return { error: 'Không có quyền sửa' };
  if (patch.rating != null) r.rating = Math.min(5, Math.max(1, Number(patch.rating)));
  if (patch.content != null) r.content = String(patch.content).trim();
  r.updatedAt = new Date().toISOString();
  list[i] = r;
  write(K.reviews, list);
  recalcProductRating(r.productId);
  return { review: r };
}

function deleteReview(id, actor) {
  const list = read(K.reviews, []);
  const r = list.find((x) => x.id === id);
  if (!r) return { error: 'Không tìm thấy' };
  const isOwner = actor.email === r.userEmail;
  const isAdmin = actor.role === 'admin';
  if (!isOwner && !isAdmin) return { error: 'Không có quyền xóa' };
  const next = list.filter((x) => x.id !== id);
  write(K.reviews, next);
  recalcProductRating(r.productId);
  return { ok: true };
}

function recalcProductRating(productId) {
  const revs = getReviews((r) => r.productId === productId);
  const list = ensureProducts();
  const p = list.find((x) => x.id === productId);
  if (!p) return;
  if (!revs.length) { p.rating = 0; p.reviewsCount = 0; }
  else {
    p.rating = Math.round((revs.reduce((s, r) => s + r.rating, 0) / revs.length) * 10) / 10;
    p.reviewsCount = revs.length;
  }
  write(K.products, list);
}

function getShopRating(shopId) {
  const revs = getReviews((r) => r.shopId === shopId);
  if (!revs.length) return { avg: 0, count: 0 };
  return {
    avg: Math.round((revs.reduce((s, r) => s + r.rating, 0) / revs.length) * 10) / 10,
    count: revs.length,
  };
}

/* ---------- Orders & returns (escrow window) ---------- */
function getOrders() { return read(K.orders, []); }
function saveOrder(order) {
  const list = getOrders();
  list.unshift(order);
  write(K.orders, list.slice(0, 200));
  return order;
}

function requestReturn(orderId, reason, userEmail) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  if (order.buyerEmail && order.buyerEmail !== userEmail) return { error: 'Không phải đơn của bạn' };
  if (order.status === 'released') return { error: 'Đơn đã giải ngân — không hoàn qua kênh escrow' };
  if (order.status === 'returned') return { error: 'Đơn đã hoàn' };
  const platform = window.CCLConfig ? window.CCLConfig.loadPlatformConfig() : { returnWindowDays: 3 };
  const created = new Date(order.createdAt).getTime();
  const windowMs = (platform.returnWindowDays || 3) * 24 * 60 * 60 * 1000;
  if (Date.now() - created > windowMs && order.status !== 'held') {
    // still allow if still held
  }
  if (order.status !== 'held' && order.status !== 'shipping') {
    return { error: 'Chỉ hoàn khi đơn còn tạm giữ escrow' };
  }
  order.status = 'return_requested';
  order.returnReason = reason;
  order.returnAt = new Date().toISOString();
  write(K.orders, orders);

  const returns = read(K.returns, []);
  returns.unshift({
    id: uid('rt'), orderId, reason, userEmail,
    status: 'pending', createdAt: new Date().toISOString(),
  });
  write(K.returns, returns);
  return { ok: true, order };
}

/* ---------- Blocks (fraud sellers / bomb buyers) ---------- */
function getBlocks() { return read(K.blocks, []); }

function blockUser(email, reason, type, adminEmail) {
  // type: fraud_seller | bomb_buyer | other
  const blocks = getBlocks();
  blocks.push({
    id: uid('bl'), email: email.toLowerCase(), reason, type,
    by: adminEmail, createdAt: new Date().toISOString(),
  });
  write(K.blocks, blocks);
  updateUser(email, { blocked: true, blockReason: reason });
  return { ok: true };
}

function unblockUser(email) {
  let blocks = getBlocks().filter((b) => b.email !== email.toLowerCase());
  write(K.blocks, blocks);
  updateUser(email, { blocked: false, blockReason: null });
  return { ok: true };
}

function isBlocked(email) {
  const u = findUserByEmail(email);
  if (u && u.blocked) return true;
  return getBlocks().some((b) => b.email === email.toLowerCase());
}

function reportBomb(email) {
  const u = findUserByEmail(email);
  if (!u) return;
  const bombCount = (u.bombCount || 0) + 1;
  updateUser(email, { bombCount });
  if (bombCount >= 3) {
    blockUser(email, 'Bom hàng nhiều lần (tự động)', 'bomb_buyer', 'system');
  }
}

window.CCLStore = {
  K, uid, ensureProducts, getProducts, getProductById, getProductsByShop,
  saveProduct, deleteProduct, hardDeleteProduct,
  getUsers, findUserByEmail, createUser, updateUser,
  setOtp, verifyOtp,
  getSession, setSession, clearSession,
  getReviews, addReview, updateReview, deleteReview, getShopRating,
  getOrders, saveOrder, requestReturn,
  getBlocks, blockUser, unblockUser, isBlocked, reportBomb,
};
