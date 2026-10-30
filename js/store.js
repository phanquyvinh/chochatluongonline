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
  chats: 'ccl_chats_v1',
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
    emoji: '🔌', images: [], videos: [], category: 'linh-kien', rating: 4.8, sold: 126, active: true, isDemo: true,
    description: 'Bo mạch zin theo máy, kiểm tra trước khi gửi.',
    guide: 'Tắt nguồn → tháo vỏ → thay bo → đấu đúng jack → chạy thử 10 phút.',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 's1', shopId: 's101', shopName: 'Điện Tử Bách Khoa', sellerEmail: 'shop.dientu@example.com',
    type: 'service', name: 'Lắp đặt & đấu nối bo mạch tại nhà', price: 150000,
    emoji: '🛠️', images: [], videos: [], category: 'sua-chua', rating: 4.9, sold: 89, active: true, isDemo: true,
    description: 'Kỹ thuật viên đến tận nơi trong nội thành.',
    guide: 'Chuẩn bị vị trí máy, ổ điện ổn định. Hẹn giờ trước 2 giờ.',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'p2', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', sellerEmail: 'shop.dienlanh@example.com',
    type: 'product', name: 'Lốc máy nén tủ lạnh 750W', price: 1200000,
    emoji: '❄️', images: [], videos: [], category: 'linh-kien', rating: 4.7, sold: 54, active: true, isDemo: true,
    description: 'Lốc 750W, bảo hành 6 tháng.',
    guide: 'Chỉ lắp bởi thợ có chuyên môn gas lạnh.',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 's2', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', sellerEmail: 'shop.dienlanh@example.com',
    type: 'service', name: 'Bảo dưỡng bơm gas vệ sinh tủ lạnh trọn gói', price: 250000,
    emoji: '🧊', images: [], videos: [], category: 'sua-chua', rating: 4.9, sold: 210, active: true, isDemo: true,
    description: 'Vệ sinh dàn, kiểm tra gas, bổ sung nếu thiếu.',
    guide: 'Thời gian ~90 phút. Để trống ngăn đá trước khi thợ đến.',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'p3', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', sellerEmail: 'shop.kts@example.com',
    type: 'product', name: 'Module WiFi ESP32 cho thiết bị IoT', price: 185000,
    emoji: '📡', images: [], videos: [], category: 'linh-kien', rating: 4.6, sold: 340, active: true, isDemo: true,
    description: 'ESP32 gốc, flash sẵn firmware mẫu.',
    guide: 'Cấp 5V ổn định, kết nối UART để nạp code.',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 's3', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', sellerEmail: 'shop.kts@example.com',
    type: 'service', name: 'Lắp đặt camera an ninh 4 mắt + cấu hình app', price: 890000,
    emoji: '📹', images: [], videos: [], category: 'lap-dat', rating: 4.8, sold: 67, active: true, isDemo: true,
    description: 'Trọn gói 4 camera + đầu ghi + app điện thoại.',
    guide: 'Cần sẵn nguồn và hướng treo tường. Hỗ trợ trong 7 ngày sau lắp.',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'p4', shopId: 's101', shopName: 'Điện Tử Bách Khoa', sellerEmail: 'shop.dientu@example.com',
    type: 'product', name: 'Cảm biến nhiệt độ DHT22 chính hãng', price: 95000,
    emoji: '🌡️', images: [], videos: [], category: 'linh-kien', rating: 4.5, sold: 412, active: true, isDemo: true,
    description: 'DHT22 độ chính xác cao, có trở kéo.',
    guide: 'Nối VCC-5V, DATA-GPIO, GND. Thư viện Adafruit DHT.',
    createdAt: '2026-01-18T00:00:00.000Z',
  },
  {
    id: 's4', shopId: 's102', shopName: 'Điện Lạnh Hà Nội', sellerEmail: 'shop.dienlanh@example.com',
    type: 'service', name: 'Sửa điều hòa không lạnh', price: 200000,
    emoji: '🔧', images: [], videos: [], category: 'sua-chua', rating: 4.7, sold: 155, active: true, isDemo: true,
    description: 'Kiểm tra miễn phí nếu sử dụng dịch vụ sửa.',
    guide: 'Ghi rõ model máy khi đặt lịch.',
    createdAt: '2026-01-18T00:00:00.000Z',
  },
  // —— Ăn uống ——
  {
    id: 'f1', shopId: 's201', shopName: 'Bếp Nhà CCL', sellerEmail: 'shop.bepnha@example.com',
    type: 'product', name: 'Cơm gà xối mỡ phần', price: 55000,
    emoji: '🍗', images: [], videos: [], category: 'an-uong', rating: 4.8, sold: 320, active: true, isDemo: true,
    description: 'Cơm gà xối mỡ, kèm dưa chua. Đặt qua sàn — giao bằng mạng ship CCL hoặc shop tự giao.',
    guide: 'Ghi chú: ít cay / không hành. Thời gian chuẩn bị ~20 phút.',
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'f2', shopId: 's201', shopName: 'Bếp Nhà CCL', sellerEmail: 'shop.bepnha@example.com',
    type: 'product', name: 'Trà đào cam sả size M', price: 35000,
    emoji: '🍑', images: [], videos: [], category: 'an-uong', rating: 4.6, sold: 210, active: true, isDemo: true,
    description: 'Trà đào cam sả tươi, ít đường theo yêu cầu.',
    guide: 'Bảo quản mát, dùng trong ngày.',
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'f3', shopId: 's202', shopName: 'Phở Gió Hà Nội', sellerEmail: 'shop.phogio@example.com',
    type: 'product', name: 'Phở bò tái nạm', price: 65000,
    emoji: '🍜', images: [], videos: [], category: 'an-uong', rating: 4.9, sold: 480, active: true, isDemo: true,
    description: 'Phở bò truyền thống, nước dùng ninh xương. Giao nóng trong nội thành.',
    guide: 'Ghi chú: tái / chín / nạm. Không để quá 45 phút khi giao xa.',
    createdAt: '2026-03-02T00:00:00.000Z',
  },
  {
    id: 'f4', shopId: 's202', shopName: 'Phở Gió Hà Nội', sellerEmail: 'shop.phogio@example.com',
    type: 'service', name: 'Đặt tiệc phở tại văn phòng (10 phần trở lên)', price: 600000,
    emoji: '🍱', images: [], videos: [], category: 'an-uong', rating: 4.7, sold: 42, active: true, isDemo: true,
    description: 'Suất tiệc phở mang đến văn phòng, kèm bát đũa dùng một lần.',
    guide: 'Đặt trước ít nhất 2 giờ. Ghi số suất và địa chỉ chi tiết trong đơn.',
    createdAt: '2026-03-02T00:00:00.000Z',
  },
  // —— Hàng hóa mẫu ——
  {
    id: 'g1', shopId: 's103', shopName: 'Kỹ Thuật Số Việt', sellerEmail: 'shop.kts@example.com',
    type: 'product', name: 'Bộ dụng cụ sửa chữa 16 món', price: 189000,
    emoji: '🧰', images: [], videos: [], category: 'hang-hoa', rating: 4.5, sold: 95, active: true, isDemo: true,
    description: 'Bộ dụng cụ đa năng cho thợ và gia đình.',
    guide: 'Kiểm tra đủ món khi nhận hàng.',
    createdAt: '2026-03-08T00:00:00.000Z',
  },
];

/**
 * Phân loại chợ:
 * - hang-hoa: hàng hóa / sản phẩm
 * - linh-kien: linh kiện
 * - sua-chua / lap-dat: dịch vụ kỹ thuật
 * - an-uong: ăn uống giao tận nơi
 */
const CATALOG_CATEGORIES = [
  { id: 'hang-hoa', label: 'Hàng hóa', emoji: '📦', group: 'product' },
  { id: 'linh-kien', label: 'Linh kiện', emoji: '🔌', group: 'product' },
  { id: 'sua-chua', label: 'Sửa chữa', emoji: '🛠️', group: 'service' },
  { id: 'lap-dat', label: 'Lắp đặt', emoji: '📹', group: 'service' },
  { id: 'an-uong', label: 'Ăn uống', emoji: '🍜', group: 'product' },
  { id: 'khac', label: 'Khác', emoji: '📎', group: 'product' },
];


function ensureProducts() {
  let list = read(K.products, null);
  if (!list || !list.length) {
    list = SEED_PRODUCTS.slice();
    write(K.products, list);
    return list;
  }
  // Merge seed mới (ăn uống, ship tư vấn) nếu chưa có theo id
  const ids = new Set(list.map((p) => p.id));
  let added = false;
  SEED_PRODUCTS.forEach((seed) => {
    if (!ids.has(seed.id)) {
      list.push(seed);
      ids.add(seed.id);
      added = true;
    }
  });
  if (added) write(K.products, list);
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
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...product, updatedAt: new Date().toISOString() };
    if (product.isDemo === undefined) list[idx].isDemo = false;
  } else {
    list.push({
      ...product,
      id: product.id || uid('p'),
      createdAt: new Date().toISOString(),
      active: true,
      rating: 0,
      sold: 0,
      reviewsCount: 0,
      isDemo: false,
    });
  }
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

function getAllProductsAdmin() {
  return ensureProducts().slice().sort((a, b) => {
    const ta = a.createdAt || '';
    const tb = b.createdAt || '';
    return tb.localeCompare(ta);
  });
}

function clearDemoProducts() {
  const demoShopIds = new Set(['s101', 's102', 's103']);
  const demoEmails = new Set([
    'shop.dientu@example.com',
    'shop.dienlanh@example.com',
    'shop.kts@example.com',
  ]);
  let list = ensureProducts();
  const before = list.length;
  list = list.filter((p) => {
    if (p.isDemo) return false;
    if (demoShopIds.has(p.shopId)) return false;
    if (p.sellerEmail && demoEmails.has(String(p.sellerEmail).toLowerCase())) return false;
    return true;
  });
  write(K.products, list);
  return before - list.length;
}

function adminDeleteProduct(id) {
  let list = ensureProducts();
  const before = list.length;
  list = list.filter((x) => x.id !== id);
  write(K.products, list);
  return before !== list.length;
}

/* ---------- Users ---------- */
function getUsers() { return read(K.users, []); }
function saveUsers(list) { write(K.users, list); }

function findUserByEmail(email) {
  if (!email) return null;
  return getUsers().find((u) => u.email && u.email.toLowerCase() === String(email).toLowerCase());
}

function normalizePhone(phone) {
  let p = String(phone || '').replace(/[\s.\-()]/g, '');
  if (p.startsWith('+84')) p = '0' + p.slice(3);
  if (p.startsWith('84') && p.length >= 10) p = '0' + p.slice(2);
  return p;
}

function findUserByPhone(phone) {
  const n = normalizePhone(phone);
  if (!n || n.length < 9) return null;
  return getUsers().find((u) => u.phone && normalizePhone(u.phone) === n);
}

function findUserByLogin(login) {
  const s = String(login || '').trim();
  if (!s) return null;
  if (s.includes('@')) return findUserByEmail(s);
  const byPhone = findUserByPhone(s);
  if (byPhone) return byPhone;
  return findUserByEmail(s);
}

function createUser(data) {
  const users = getUsers();
  const email = (data.email || '').trim().toLowerCase();
  const phone = normalizePhone(data.phone || '');
  if (email && users.some((u) => u.email && u.email.toLowerCase() === email)) {
    return { error: 'Email đã được đăng ký' };
  }
  if (phone && users.some((u) => u.phone && normalizePhone(u.phone) === phone)) {
    return { error: 'Số điện thoại đã được đăng ký' };
  }
  if (!email && !phone) {
    return { error: 'Cần email hoặc số điện thoại' };
  }
  const user = {
    id: uid('u'),
    email: email || '',
    password: data.password,
    name: (data.name || '').trim(),
    role: data.role || 'buyer',
    phone: phone || (data.phone || '').trim(),
    address: data.address || '',
    shopId: data.role === 'seller' ? uid('s') : (data.role === 'shipper' ? uid('ship') : null),
    shopName: data.role === 'seller' || data.role === 'shipper'
      ? (data.shopName || data.name)
      : null,
    // Shipper profile
    shipperType: data.role === 'shipper' ? (data.shipperType || 'individual') : null, // individual | company
    vehicle: data.role === 'shipper' ? (data.vehicle || '') : null,
    coverage: data.role === 'shipper' ? (data.coverage || '') : null,
    // Shipper: phí tháng sàn + thế chấp hàng hóa
    shipMonthlyFee: data.role === 'shipper' ? (Number(data.shipMonthlyFee) || 0) : null,
    shipFeePaidUntil: data.role === 'shipper' ? null : null,
    shipDepositBalance: data.role === 'shipper' ? (Number(data.shipDepositBalance) || 0) : 0,
    shipDepositRequired: data.role === 'shipper' ? (Number(data.shipDepositRequired) || 0) : 0,
    shipPriority: data.role === 'shipper' ? false : false, // true khi đã đóng phí tháng còn hạn
    verified: !!data.verified,
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

function updateUser(key, patch) {
  const users = getUsers();
  const k = String(key || '').toLowerCase();
  const i = users.findIndex((u) =>
    (u.email && u.email.toLowerCase() === k) ||
    u.id === key ||
    (u.phone && normalizePhone(u.phone) === normalizePhone(key))
  );
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
  const s = {
    email: user.email || '',
    name: user.name,
    role: user.role,
    shopId: user.shopId,
    shopName: user.shopName,
    phone: user.phone || '',
    id: user.id,
  };
  write(K.session, s);
  localStorage.setItem('vq_token', 'local-' + (user.id || user.email || user.phone || 'x'));
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

function addReview({ productId, shopId, userEmail, userName, rating, content, images, videos }) {
  const session = getSession();
  if (!session || session.role === 'seller') {
    return { error: 'Chỉ người mua đã đăng nhập mới đánh giá được' };
  }
  if (rating < 1 || rating > 5) return { error: 'Số sao từ 1 đến 5' };
  const imgs = Array.isArray(images) ? images.filter(Boolean).slice(0, 6) : [];
  const vids = Array.isArray(videos) ? videos.filter(Boolean).slice(0, 2) : [];
  const list = read(K.reviews, []);
  const review = {
    id: uid('rv'),
    productId, shopId,
    userEmail: userEmail || session.email,
    userName: userName || session.name,
    rating: Number(rating),
    content: String(content || '').trim(),
    images: imgs,
    videos: vids,
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
  if (patch.images != null) r.images = Array.isArray(patch.images) ? patch.images.filter(Boolean).slice(0, 6) : [];
  if (patch.videos != null) r.videos = Array.isArray(patch.videos) ? patch.videos.filter(Boolean).slice(0, 2) : [];
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

/* ---------- Orders & Logistics (full lifecycle) ---------- */
/**
 * Status machine (per package / order):
 * pending_confirm → preparing → ready_for_pickup → picked_up →
 * in_transit → out_for_delivery → delivered
 *                                      ↘ delivery_failed → returning → returned_to_seller
 * cancel_requested → cancelled (only before picked_up or via recall)
 *
 * Legacy map: held≈pending_confirm/preparing, shipping≈in_transit, released≈delivered+released
 */
const ORDER_STATUS = {
  PENDING_CONFIRM: 'pending_confirm',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  DELIVERY_FAILED: 'delivery_failed',
  RETURNING: 'returning',
  RETURNED_TO_SELLER: 'returned_to_seller',
  CANCEL_REQUESTED: 'cancel_requested',
  CANCELLED: 'cancelled',
  // legacy kept for old records
  HELD: 'held',
  SHIPPING: 'shipping',
  RELEASED: 'released',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
};

const STATUS_LABEL = {
  pending_confirm: 'Chờ xác nhận',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Chờ lấy hàng',
  picked_up: 'Ship đã nhận',
  in_transit: 'Đang vận chuyển',
  out_for_delivery: 'Đang giao',
  delivered: 'Giao thành công',
  delivery_failed: 'Giao thất bại',
  returning: 'Đang hoàn về shop',
  returned_to_seller: 'Đã hoàn về shop',
  cancel_requested: 'Yêu cầu hủy',
  cancelled: 'Đã hủy',
  held: 'Tạm giữ (cũ)',
  shipping: 'Đang giao (cũ)',
  released: 'Đã giải ngân',
  return_requested: 'Yêu cầu hoàn',
  returned: 'Đã hoàn',
};

const PRE_PICKUP = new Set([
  'pending_confirm', 'preparing', 'ready_for_pickup', 'held',
]);
const ACTIVE_SHIP = new Set([
  'picked_up', 'in_transit', 'out_for_delivery', 'shipping',
]);
const TERMINAL = new Set([
  'delivered', 'cancelled', 'returned_to_seller', 'released', 'returned',
]);

function getOrders() { return read(K.orders, []); }

function _writeOrders(list) {
  write(K.orders, list.slice(0, 300));
}

function saveOrder(order) {
  const list = getOrders();
  list.unshift(order);
  _writeOrders(list);
  return order;
}

function findOrder(orderId) {
  return getOrders().find((o) => o.id === orderId) || null;
}

function _pushTimeline(pkg, event, note, byRole, byId, byName) {
  if (!pkg.timeline) pkg.timeline = [];
  pkg.timeline.push({
    at: new Date().toISOString(),
    event,
    note: note || '',
    byRole: byRole || 'system',
    byId: byId || null,
    byName: byName || 'Hệ thống',
  });
}

/** Group cart by shop → packages */
function buildPackagesFromCart(cart, totals) {
  const groups = {};
  (cart || []).forEach((item) => {
    const sid = item.shopId || 'unknown';
    if (!groups[sid]) {
      groups[sid] = {
        shopId: sid,
        shopName: item.shopName || sid,
        sellerEmail: item.sellerEmail || null,
        items: [],
        shipFee: 0,
      };
    }
    groups[sid].items.push({ ...item });
  });
  const breakdown = (totals && totals.shopBreakdown) || [];
  breakdown.forEach((bd) => {
    if (groups[bd.shopId]) {
      groups[bd.shopId].shipFee = Number(bd.ship) || 0;
      if (bd.shopName) groups[bd.shopId].shopName = bd.shopName;
    }
  });
  return Object.values(groups).map((g) => ({
    packageId: uid('pkg'),
    shopId: g.shopId,
    shopName: g.shopName,
    sellerEmail: g.sellerEmail,
    items: g.items,
    shipFee: g.shipFee,
    status: ORDER_STATUS.PENDING_CONFIRM,
    trackingNumber: null,
    carrier: 'internal', // internal shipper network
    carrierName: 'Mạng lưới Ship CCL',
    shipperId: null,
    shipperEmail: null,
    shipperName: null,
    shipperPhone: null,
    timeline: [{
      at: new Date().toISOString(),
      event: 'order_created',
      note: 'Đơn hàng được tạo, chờ shop xác nhận',
      byRole: 'system',
      byId: null,
      byName: 'Hệ thống',
    }],
  }));
}

/** Create full order from checkout */
function createOrder({ buyerEmail, buyerName, buyerPhone, buyerAddress, cart, totals, bank }) {
  const packages = buildPackagesFromCart(cart, totals);
  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    buyerEmail,
    buyerName: buyerName || '',
    buyerPhone: buyerPhone || '',
    buyerAddress: buyerAddress || '',
    cart: cart || [],
    totals: totals || {},
    bank: bank || '',
    status: ORDER_STATUS.PENDING_CONFIRM, // aggregate
    paymentStatus: 'escrow_held',
    packages,
    cancelRequest: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveOrder(order);
}

function _recomputeOrderStatus(order) {
  if (!order.packages || !order.packages.length) return order.status;
  const sts = order.packages.map((p) => p.status);
  if (sts.every((s) => s === 'cancelled')) return 'cancelled';
  if (sts.every((s) => s === 'delivered' || s === 'cancelled')) return 'delivered';
  if (sts.some((s) => s === 'out_for_delivery')) return 'out_for_delivery';
  if (sts.some((s) => ['picked_up', 'in_transit', 'shipping'].includes(s))) return 'in_transit';
  if (sts.some((s) => s === 'ready_for_pickup')) return 'ready_for_pickup';
  if (sts.some((s) => s === 'preparing')) return 'preparing';
  if (sts.some((s) => s === 'cancel_requested')) return 'cancel_requested';
  if (sts.some((s) => s === 'delivery_failed' || s === 'returning')) return 'returning';
  if (sts.every((s) => s === 'returned_to_seller' || s === 'cancelled')) return 'returned_to_seller';
  return sts[0] || order.status;
}

function updatePackageStatus(orderId, packageId, newStatus, meta = {}) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện hàng' };

  const note = meta.note || STATUS_LABEL[newStatus] || newStatus;
  pkg.status = newStatus;
  if (meta.trackingNumber) pkg.trackingNumber = meta.trackingNumber;
  if (meta.carrierName) pkg.carrierName = meta.carrierName;
  if (meta.carrier) pkg.carrier = meta.carrier;
  if (meta.shipperId) {
    pkg.shipperId = meta.shipperId;
    pkg.shipperEmail = meta.shipperEmail || null;
    pkg.shipperName = meta.shipperName || null;
    pkg.shipperPhone = meta.shipperPhone || null;
  }
  // Delivery / pickup proof images (base64 or URL)
  if (meta.proofImages && Array.isArray(meta.proofImages) && meta.proofImages.length) {
    if (!pkg.proofImages) pkg.proofImages = [];
    pkg.proofImages = pkg.proofImages.concat(meta.proofImages).slice(0, 8);
    pkg.proofAt = new Date().toISOString();
  }
  if (meta.failReason) pkg.failReason = meta.failReason;
  _pushTimeline(pkg, newStatus, note, meta.byRole, meta.byId, meta.byName);

  order.status = _recomputeOrderStatus(order);
  order.updatedAt = new Date().toISOString();

  if (order.status === 'delivered' && order.paymentStatus === 'escrow_held') {
    order.paymentStatus = 'ready_to_release';
  }

  _writeOrders(orders);

  // Hoàn thế chấp 100% khi giao thành công hoặc hàng đã về shop
  if (newStatus === 'delivered' || newStatus === 'returned_to_seller') {
    try {
      releasePackageDepositHold(orderId, packageId,
        newStatus === 'delivered' ? 'Giao thành công — hàng đến tay khách' : 'Hàng đã hoàn về shop');
    } catch (e) { /* non-fatal */ }
  }

  // re-read after possible hold release
  const orderFinal = findOrder(orderId) || order;
  const pkgFinal = (orderFinal.packages || []).find((p) => p.packageId === packageId) || pkg;
  return { ok: true, order: orderFinal, package: pkgFinal };
}

/** Shop: confirm order package */
function shopConfirmPackage(orderId, packageId, sellerEmail) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (pkg.status !== 'pending_confirm' && pkg.status !== 'held') {
    return { error: 'Kiện không ở trạng thái chờ xác nhận' };
  }
  return updatePackageStatus(orderId, packageId, 'preparing', {
    note: 'Shop đã xác nhận đơn, đang chuẩn bị hàng',
    byRole: 'seller',
    byId: sellerEmail,
    byName: pkg.shopName,
  });
}

/** Shop: mark ready for platform shipper pickup */
function shopReadyForPickup(orderId, packageId, sellerEmail) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (pkg.status !== 'preparing') return { error: 'Chỉ đánh dấu sẵn sàng khi đang chuẩn bị' };
  const tracking = 'CCL' + Date.now().toString(36).toUpperCase().slice(-8);
  return updatePackageStatus(orderId, packageId, 'ready_for_pickup', {
    note: 'Hàng đã đóng gói, chờ đơn vị vận chuyển sàn đến lấy',
    trackingNumber: tracking,
    carrier: 'internal',
    carrierName: 'Mạng lưới Ship CCL',
    byRole: 'seller',
    byId: sellerEmail,
    byName: pkg.shopName,
  });
}

/**
 * Shop tự ship ngoài quy trình sàn.
 * Chuyển thẳng sang out_for_delivery (shop đang giao).
 */
function shopSelfShipStart(orderId, packageId, sellerEmail, note) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (pkg.status !== 'preparing' && pkg.status !== 'ready_for_pickup') {
    return { error: 'Chỉ tự ship khi đang chuẩn bị hoặc chờ lấy' };
  }
  if (pkg.shipperId && pkg.carrier !== 'self') {
    return { error: 'Kiện đã có shipper sàn nhận — không thể chuyển sang tự ship' };
  }
  const platform = window.CCLConfig ? window.CCLConfig.loadPlatformConfig() : {};
  if (platform.allowShopSelfShip === false) {
    return { error: 'Sàn đang tắt chức năng shop tự ship' };
  }
  const settings = window.CCLConfig ? window.CCLConfig.loadShopSettings(pkg.shopId) : {};
  if (settings.selfShipEnabled === false) {
    return { error: 'Gian hàng chưa bật tùy chọn tự ship' };
  }
  const tracking = 'SELF' + Date.now().toString(36).toUpperCase().slice(-8);
  return updatePackageStatus(orderId, packageId, 'out_for_delivery', {
    note: note || 'Shop tự giao hàng (ngoài mạng lưới sàn)',
    trackingNumber: tracking,
    carrier: 'self',
    carrierName: 'Shop tự giao',
    shipperId: sellerEmail,
    shipperEmail: sellerEmail,
    shipperName: pkg.shopName || 'Shop',
    shipperPhone: '',
    byRole: 'seller',
    byId: sellerEmail,
    byName: pkg.shopName,
  });
}

/** Shop tự ship: xác nhận đã giao (bắt buộc ảnh nếu cấu hình) */
function shopSelfShipDeliver(orderId, packageId, sellerEmail, proofImages, note) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (pkg.carrier !== 'self') return { error: 'Kiện không phải shop tự ship' };
  if (pkg.status !== 'out_for_delivery' && pkg.status !== 'in_transit') {
    return { error: 'Kiện chưa ở trạng thái đang giao' };
  }
  const platform = window.CCLConfig ? window.CCLConfig.loadPlatformConfig() : {};
  const imgs = proofImages || [];
  if (platform.requireDeliveryPhoto !== false && (!imgs || !imgs.length)) {
    return { error: 'Vui lòng chụp/tải ít nhất 1 ảnh chứng từ giao hàng' };
  }
  return updatePackageStatus(orderId, packageId, 'delivered', {
    note: note || 'Shop xác nhận đã giao hàng thành công (kèm ảnh chứng từ)',
    proofImages: imgs,
    byRole: 'seller',
    byId: sellerEmail,
    byName: pkg.shopName,
  });
}


/** Hoàn thế chấp 100% đã khóa khi hàng đến tay (delivered) hoặc về lại shop */
function releasePackageDepositHold(orderId, packageId, reason) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (!pkg.depositHold || pkg.depositHoldStatus === 'released') {
    return { ok: true, skipped: true };
  }
  const email = pkg.shipperEmail;
  if (!email) return { error: 'Không có shipper để hoàn thế chấp' };
  const u = findUserByEmail(email);
  if (!u) return { error: 'Không tìm thấy tài khoản shipper' };
  const hold = Number(pkg.depositHold) || 0;
  const bal = Number(u.shipDepositBalance) || 0;
  updateUser(email, { shipDepositBalance: bal + hold });
  pkg.depositHoldStatus = 'released';
  pkg.depositReleasedAt = new Date().toISOString();
  pkg.depositReleaseReason = reason || 'released';
  _pushTimeline(pkg, 'deposit_released',
    'Hoàn thế chấp ' + hold.toLocaleString('vi-VN') + 'đ (' + (reason || 'hàng đã đến tay') + ')',
    'system', null, 'Hệ thống');
  _writeOrders(orders);
  return { ok: true, amount: hold };
}

/** Giá trị hàng hóa trên kiện (để đối chiếu thế chấp) */
function packageGoodsValue(pkg) {
  if (!pkg || !pkg.items) return 0;
  return (pkg.items || []).reduce((s, i) => s + (Number(i.price) || 0) * Math.max(1, Number(i.qty) || 1), 0);
}

/**
 * Ship ký hợp đồng + thế chấp với SÀN:
 * - shipContractWithPlatform === true, hoặc
 * - đã đóng phí tháng sàn VÀ có cờ shipPlatformBonded
 * → Sàn chịu trách nhiệm với shop; không cần shop duyệt từng đơn.
 */
function isPlatformBondedShipper(user) {
  if (!user || user.role !== 'shipper') return false;
  if (user.shipContractWithPlatform) return true;
  if (user.shipPlatformBonded && isShipperFeeActive(user)) return true;
  return false;
}

/** Shipper: claim a ready package */
function shipperClaimPackage(orderId, packageId, shipper) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (pkg.status !== 'ready_for_pickup') return { error: 'Kiện chưa sẵn sàng lấy hàng hoặc đã có ship' };
  if (pkg.carrier === 'self') return { error: 'Shop đã chọn tự giao kiện này' };
  if (pkg.shipperId) return { error: 'Kiện đã được shipper khác nhận' };

  const u = findUserByEmail(shipper.email) || shipper;
  const goodsVal = packageGoodsValue(pkg);
  const bal = Number(u.shipDepositBalance) || 0;
  const platformBonded = isPlatformBondedShipper(u);

  if (platformBonded) {
    // Ship sàn (HĐ + thế chấp với sàn): nhận trực tiếp; sàn chịu trách nhiệm với shop
    return updatePackageStatus(orderId, packageId, 'picked_up', {
      note: 'Ship sàn (HĐ/thế chấp với sàn) đã nhận hàng — sàn chịu trách nhiệm với shop',
      shipperId: shipper.id || shipper.email,
      shipperEmail: shipper.email,
      shipperName: shipper.name || shipper.shopName || shipper.email,
      shipperPhone: shipper.phone || '',
      byRole: 'shipper',
      byId: shipper.email,
      byName: shipper.name || 'Shipper',
    });
  }

  // Ship ngoài / chưa bond sàn: thế chấp đúng 100% giá trị hàng + shop đã duyệt
  // Khi nhận kiện: KHÓA (trừ) 100% vào hold; hoàn lại khi giao thành công / hàng về shop
  if (goodsVal <= 0) {
    return { error: 'Không xác định được giá trị hàng trên kiện để thế chấp' };
  }
  if (bal < goodsVal) {
    return {
      error: 'Thế chấp (' + bal.toLocaleString('vi-VN') + 'đ) chưa đủ 100% giá trị hàng (' +
        goodsVal.toLocaleString('vi-VN') + 'đ). Nạp thêm hoặc chờ shop duyệt khi đủ.',
    };
  }
  const approved = pkg.shopApprovedShipper &&
    (pkg.shopApprovedShipper.email || '').toLowerCase() === (shipper.email || '').toLowerCase();
  if (!approved) {
    return { error: 'Cần shop duyệt thế chấp (100% giá hàng) trước khi nhận kiện' };
  }

  // Khóa thế chấp 100%
  const hold = goodsVal;
  const newBal = bal - hold;
  updateUser(shipper.email, { shipDepositBalance: newBal });

  const res = updatePackageStatus(orderId, packageId, 'picked_up', {
    note: 'Shipper nhận hàng — đã khóa thế chấp 100% giá hàng (' + hold.toLocaleString('vi-VN') + 'đ)',
    shipperId: shipper.id || shipper.email,
    shipperEmail: shipper.email,
    shipperName: shipper.name || shipper.shopName || shipper.email,
    shipperPhone: shipper.phone || '',
    byRole: 'shipper',
    byId: shipper.email,
    byName: shipper.name || 'Shipper',
  });
  if (res.error) {
    // rollback hold
    updateUser(shipper.email, { shipDepositBalance: bal });
    return res;
  }
  // ghi hold lên package
  const orders = getOrders();
  const order2 = orders.find((o) => o.id === orderId);
  const pkg2 = order2 && (order2.packages || []).find((p) => p.packageId === packageId);
  if (pkg2) {
    pkg2.depositHold = hold;
    pkg2.depositHoldStatus = 'locked'; // locked | released
    pkg2.depositHoldAt = new Date().toISOString();
    _writeOrders(orders);
  }
  return res;
}

/**
 * Shipper: advance status.
 * options: { note, proofImages, failReason }
 * Khi newStatus === 'delivered' và sàn bật requireDeliveryPhoto → bắt buộc proofImages.
 */
function shipperUpdateStatus(orderId, packageId, newStatus, shipper, noteOrOpts) {
  const opts = typeof noteOrOpts === 'string'
    ? { note: noteOrOpts }
    : (noteOrOpts || {});
  const allowed = {
    picked_up: ['in_transit', 'out_for_delivery', 'delivery_failed'],
    in_transit: ['out_for_delivery', 'delivery_failed', 'in_transit'],
    out_for_delivery: ['delivered', 'delivery_failed'],
    delivery_failed: ['returning', 'out_for_delivery'],
    returning: ['returned_to_seller'],
  };
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  if (pkg.shipperEmail && pkg.shipperEmail !== shipper.email) {
    return { error: 'Bạn không phụ trách kiện này' };
  }
  const nexts = allowed[pkg.status] || [];
  if (!nexts.includes(newStatus)) {
    return { error: `Không thể chuyển từ "${STATUS_LABEL[pkg.status]}" sang "${STATUS_LABEL[newStatus] || newStatus}"` };
  }
  if (newStatus === 'delivered') {
    const platform = window.CCLConfig ? window.CCLConfig.loadPlatformConfig() : {};
    const imgs = opts.proofImages || [];
    if (platform.requireDeliveryPhoto !== false && (!imgs || !imgs.length)) {
      return { error: 'Vui lòng chụp/tải ít nhất 1 ảnh chứng từ giao hàng trước khi xác nhận' };
    }
  }
  return updatePackageStatus(orderId, packageId, newStatus, {
    note: opts.note || STATUS_LABEL[newStatus],
    proofImages: opts.proofImages,
    failReason: opts.failReason,
    byRole: 'shipper',
    byId: shipper.email,
    byName: shipper.name || 'Shipper',
  });
}

/** Cancel rules */
function canBuyerCancelDirect(order) {
  if (!order.packages || !order.packages.length) {
    return PRE_PICKUP.has(order.status);
  }
  return order.packages.every((p) => PRE_PICKUP.has(p.status));
}

function requestCancel(orderId, byEmail, byRole, reason) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  if (TERMINAL.has(order.status)) return { error: 'Đơn đã kết thúc, không thể hủy' };

  // Direct cancel if all packages still pre-pickup
  if (canBuyerCancelDirect(order) && (byRole === 'buyer' || byRole === 'seller' || byRole === 'admin')) {
    (order.packages || []).forEach((pkg) => {
      if (PRE_PICKUP.has(pkg.status)) {
        pkg.status = 'cancelled';
        _pushTimeline(pkg, 'cancelled', reason || 'Hủy đơn trước khi giao ship', byRole, byEmail, byEmail);
      }
    });
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    order.cancelRequest = { by: byEmail, byRole, reason, at: new Date().toISOString(), status: 'approved' };
    order.updatedAt = new Date().toISOString();
    _writeOrders(orders);
    return { ok: true, order, mode: 'direct' };
  }

  // After pickup: only request
  if (order.cancelRequest && order.cancelRequest.status === 'pending') {
    return { error: 'Đã có yêu cầu hủy đang chờ xử lý' };
  }
  order.cancelRequest = {
    by: byEmail,
    byRole,
    reason: reason || '',
    at: new Date().toISOString(),
    status: 'pending',
  };
  (order.packages || []).forEach((pkg) => {
    if (!TERMINAL.has(pkg.status) && pkg.status !== 'cancelled') {
      _pushTimeline(pkg, 'cancel_requested', reason || 'Yêu cầu hủy đơn', byRole, byEmail, byEmail);
    }
  });
  order.status = 'cancel_requested';
  order.updatedAt = new Date().toISOString();
  _writeOrders(orders);
  return { ok: true, order, mode: 'request' };
}

function resolveCancelRequest(orderId, approve, resolverEmail, note) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order || !order.cancelRequest) return { error: 'Không có yêu cầu hủy' };
  if (order.cancelRequest.status !== 'pending') return { error: 'Yêu cầu đã được xử lý' };

  if (approve) {
    (order.packages || []).forEach((pkg) => {
      if (!TERMINAL.has(pkg.status)) {
        // If already with shipper → mark returning then cancelled path simplified
        if (ACTIVE_SHIP.has(pkg.status) || pkg.status === 'out_for_delivery') {
          pkg.status = 'returning';
          _pushTimeline(pkg, 'returning', 'Thu hồi do hủy đơn: ' + (note || ''), 'admin', resolverEmail, 'Quản trị/Shop');
        } else {
          pkg.status = 'cancelled';
          _pushTimeline(pkg, 'cancelled', 'Hủy đơn được duyệt: ' + (note || ''), 'admin', resolverEmail, 'Quản trị/Shop');
        }
      }
    });
    order.cancelRequest.status = 'approved';
    order.cancelRequest.resolvedAt = new Date().toISOString();
    order.cancelRequest.resolvedBy = resolverEmail;
    order.status = _recomputeOrderStatus(order);
    if (order.status === 'cancelled' || order.packages.every((p) => p.status === 'cancelled' || p.status === 'returning')) {
      order.paymentStatus = 'refunded';
    }
  } else {
    order.cancelRequest.status = 'rejected';
    order.cancelRequest.resolvedAt = new Date().toISOString();
    order.cancelRequest.resolvedBy = resolverEmail;
    order.cancelRequest.rejectNote = note || '';
    order.status = _recomputeOrderStatus(order);
    (order.packages || []).forEach((pkg) => {
      _pushTimeline(pkg, 'cancel_rejected', 'Từ chối hủy: ' + (note || ''), 'admin', resolverEmail, 'Quản trị/Shop');
    });
  }
  order.updatedAt = new Date().toISOString();
  _writeOrders(orders);
  return { ok: true, order };
}

/** Legacy return (escrow) — keep compatible */
function getReturns() {
  return read(K.returns, []);
}

function requestReturn(orderId, reason, userEmail) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  if (order.buyerEmail && order.buyerEmail !== userEmail) return { error: 'Không phải đơn của bạn' };
  if (order.paymentStatus === 'released' || order.status === 'released') {
    return { error: 'Đơn đã giải ngân — không hoàn qua kênh escrow' };
  }
  if (order.status === 'returned' || order.status === 'returned_to_seller') {
    return { error: 'Đơn đã hoàn' };
  }
  // Prefer new cancel flow for pre-delivery
  if (canBuyerCancelDirect(order)) {
    return requestCancel(orderId, userEmail, 'buyer', reason || 'Yêu cầu hoàn/hủy');
  }
  order.status = 'return_requested';
  order.returnReason = reason;
  order.returnAt = new Date().toISOString();
  _writeOrders(orders);

  const returns = read(K.returns, []);
  returns.unshift({
    id: uid('rt'), orderId, reason, userEmail,
    status: 'pending', createdAt: new Date().toISOString(),
  });
  write(K.returns, returns);
  return { ok: true, order };
}

/** Queries for dashboards */
function getOrdersForBuyer(email) {
  return getOrders().filter((o) => o.buyerEmail === email);
}

function getOrdersForShop(shopId, sellerEmail) {
  return getOrders().filter((o) =>
    (o.packages || []).some((p) => p.shopId === shopId || p.sellerEmail === sellerEmail)
  );
}

function getPackagesReadyForPickup() {
  const out = [];
  getOrders().forEach((o) => {
    (o.packages || []).forEach((p) => {
      if (p.status === 'ready_for_pickup' && !p.shipperId) {
        out.push({ order: o, package: p });
      }
    });
  });
  return out;
}

function getPackagesForShipper(shipperEmail) {
  const out = [];
  getOrders().forEach((o) => {
    (o.packages || []).forEach((p) => {
      if (p.shipperEmail === shipperEmail && !TERMINAL.has(p.status) && p.status !== 'cancelled') {
        out.push({ order: o, package: p });
      }
    });
  });
  return out;
}

function getShipperHistory(shipperEmail) {
  const out = [];
  getOrders().forEach((o) => {
    (o.packages || []).forEach((p) => {
      if (p.shipperEmail === shipperEmail) {
        out.push({ order: o, package: p });
      }
    });
  });
  return out;
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

/* ---------- In-platform chat (order-scoped, no phone leak) ---------- */
function getChats() { return read(K.chats, []); }
function _writeChats(list) { write(K.chats, list.slice(0, 500)); }

/**
 * threadKey: orderId + optional packageId + peer roles
 * participants: [{ email, role, name }]
 */
function getOrCreateChatThread({ orderId, packageId, participants, title }) {
  const chats = getChats();
  const emails = (participants || []).map((p) => (p.email || '').toLowerCase()).filter(Boolean).sort();
  const key = [orderId || '', packageId || '', emails.join('|')].join('::');
  let thread = chats.find((c) => c.key === key);
  if (!thread) {
    thread = {
      id: uid('chat'),
      key,
      orderId: orderId || null,
      packageId: packageId || null,
      title: title || ('Đơn ' + (orderId || '')),
      participants: (participants || []).map((p) => ({
        email: (p.email || '').toLowerCase(),
        role: p.role || 'buyer',
        name: p.name || p.email || '',
      })),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    chats.unshift(thread);
    _writeChats(chats);
  }
  return thread;
}

function canAccessChat(thread, userEmail, role) {
  if (!thread || !userEmail) return false;
  if (role === 'admin') return true;
  const e = userEmail.toLowerCase();
  return (thread.participants || []).some((p) => p.email === e);
}

/** Scrub phone/email/zalo from chat text */
function scrubChatText(text) {
  if (window.CCLPrivacy && typeof CCLPrivacy.scrubPublicText === 'function') {
    return CCLPrivacy.scrubPublicText(text);
  }
  let t = String(text || '');
  t = t.replace(/(?:\+?84|0)\s*(?:\d[\s.\-]*){8,10}\d/g, '[liên hệ trong chat sàn]');
  t = t.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email ẩn]');
  t = t.replace(/\b(zalo|telegram|viber|whatsapp)\s*[:：]?\s*[\w.+-]{3,}/gi, '[liên hệ trong chat sàn]');
  return t;
}

function postChatMessage(threadId, { email, role, name, text, imageDataUrl }) {
  const chats = getChats();
  const thread = chats.find((c) => c.id === threadId);
  if (!thread) return { error: 'Không tìm thấy hội thoại' };
  if (!canAccessChat(thread, email, role)) return { error: 'Không có quyền gửi trong hội thoại này' };
  const body = scrubChatText(text || '');
  if (!body.trim() && !imageDataUrl) return { error: 'Nhập nội dung hoặc gửi ảnh' };
  if (body.length > 2000) return { error: 'Tin nhắn tối đa 2000 ký tự' };

  const msg = {
    id: uid('msg'),
    at: new Date().toISOString(),
    email: (email || '').toLowerCase(),
    role: role || 'buyer',
    name: name || email || '',
    text: body.trim(),
    image: imageDataUrl || null,
  };
  if (!thread.messages) thread.messages = [];
  thread.messages.push(msg);
  // keep last 200 msgs per thread
  if (thread.messages.length > 200) thread.messages = thread.messages.slice(-200);
  thread.updatedAt = msg.at;
  _writeChats(chats);
  return { ok: true, thread, message: msg };
}

function getChatThread(threadId) {
  return getChats().find((c) => c.id === threadId) || null;
}

function listChatsForUser(email, role) {
  const e = (email || '').toLowerCase();
  return getChats()
    .filter((c) => role === 'admin' || (c.participants || []).some((p) => p.email === e))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

/** Open chat for an order package between current user and relevant peers */
function openOrderChat(orderId, packageId, initiator) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = packageId
    ? (order.packages || []).find((p) => p.packageId === packageId)
    : (order.packages || [])[0];

  const participants = [];
  // buyer
  if (order.buyerEmail) {
    participants.push({
      email: order.buyerEmail,
      role: 'buyer',
      name: order.buyerName || order.buyerEmail,
    });
  }
  // shop
  if (pkg && (pkg.sellerEmail || pkg.shopId)) {
    let sellerEmail = pkg.sellerEmail;
    if (!sellerEmail) {
      const shops = getUsers().filter((u) => u.role === 'seller' && u.shopId === pkg.shopId);
      if (shops[0]) sellerEmail = shops[0].email;
    }
    if (sellerEmail) {
      participants.push({
        email: sellerEmail,
        role: 'seller',
        name: pkg.shopName || sellerEmail,
      });
    }
  }
  // shipper if assigned
  if (pkg && pkg.shipperEmail) {
    participants.push({
      email: pkg.shipperEmail,
      role: 'shipper',
      name: pkg.shipperName || pkg.shipperEmail,
    });
  }
  // ensure initiator in list
  if (initiator && initiator.email && !participants.some((p) => p.email === initiator.email.toLowerCase())) {
    participants.push({
      email: initiator.email,
      role: initiator.role || 'buyer',
      name: initiator.name || initiator.email,
    });
  }

  const title = (order.id || orderId) + (pkg ? ' · ' + (pkg.shopName || pkg.packageId) : '');
  const thread = getOrCreateChatThread({
    orderId,
    packageId: pkg ? pkg.packageId : packageId,
    participants,
    title,
  });
  return { ok: true, thread };
}


/* ---------- Shipper phí tháng + thế chấp ---------- */
function isShipperFeeActive(user) {
  if (!user || user.role !== 'shipper') return false;
  if (!user.shipFeePaidUntil) return false;
  return new Date(user.shipFeePaidUntil).getTime() >= Date.now();
}

function markShipperMonthlyPaid(email, months) {
  const u = findUserByEmail(email);
  if (!u || u.role !== 'shipper') return { error: 'Không phải tài khoản shipper' };
  months = Math.max(1, Number(months) || 1);
  let base = u.shipFeePaidUntil && new Date(u.shipFeePaidUntil) > new Date()
    ? new Date(u.shipFeePaidUntil)
    : new Date();
  base.setMonth(base.getMonth() + months);
  const updated = updateUser(email, {
    shipFeePaidUntil: base.toISOString(),
    shipPriority: true,
  });
  return { ok: true, user: updated };
}

function setShipperDeposit(email, balance, required) {
  const u = findUserByEmail(email);
  if (!u || u.role !== 'shipper') return { error: 'Không phải shipper' };
  const patch = {};
  if (balance != null) patch.shipDepositBalance = Math.max(0, Math.round(Number(balance) || 0));
  if (required != null) patch.shipDepositRequired = Math.max(0, Math.round(Number(required) || 0));
  return { ok: true, user: updateUser(email, patch) };
}

/**
 * Shop duyệt shipper nhận kiện theo thế chấp (>= giá trị hàng).
 * Không dùng cho ship đã bond với sàn (họ nhận trực tiếp).
 */
function shopApproveShipperForPackage(orderId, packageId, shipperEmail, sellerEmail) {
  const order = findOrder(orderId);
  if (!order) return { error: 'Không tìm thấy đơn' };
  const pkg = (order.packages || []).find((p) => p.packageId === packageId);
  if (!pkg) return { error: 'Không tìm thấy kiện' };
  const shipper = findUserByEmail(shipperEmail);
  if (!shipper || shipper.role !== 'shipper') return { error: 'Shipper không hợp lệ' };

  if (isPlatformBondedShipper(shipper)) {
    return { error: 'Shipper này đã ký HĐ/thế chấp với sàn — nhận đơn trực tiếp, không cần shop duyệt' };
  }

  const goodsVal = packageGoodsValue(pkg);
  const bal = Number(shipper.shipDepositBalance) || 0;
  if (bal < goodsVal) {
    return {
      error: 'Thế chấp shipper (' + bal.toLocaleString('vi-VN') +
        'đ) chưa đủ giá trị hàng (' + goodsVal.toLocaleString('vi-VN') + 'đ)',
    };
  }

  pkg.shopApprovedShipper = {
    email: (shipperEmail || '').toLowerCase(),
    name: shipper.name || shipper.shopName,
    at: new Date().toISOString(),
    by: sellerEmail,
    mode: 'shop_deposit',
    depositSnapshot: bal,
    goodsValue: goodsVal,
  };
  _pushTimeline(pkg, 'shipper_approved',
    'Shop duyệt shipper theo thế chấp ' + bal.toLocaleString('vi-VN') +
    'đ (hàng ' + goodsVal.toLocaleString('vi-VN') + 'đ)',
    'seller', sellerEmail, pkg.shopName);

  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    orders[idx] = order;
    _writeOrders(orders);
  }
  return { ok: true, order, package: pkg };
}

/** Admin đánh dấu shipper đã HĐ + thế chấp với sàn */
function setPlatformShipperBond(email, bonded, contract) {
  const u = findUserByEmail(email);
  if (!u || u.role !== 'shipper') return { error: 'Không phải shipper' };
  return {
    ok: true,
    user: updateUser(email, {
      shipContractWithPlatform: !!bonded,
      shipPlatformBonded: !!bonded,
      shipContractNote: contract || u.shipContractNote || '',
    }),
  };
}

function listShippersRanked() {
  return getUsers()
    .filter((u) => u.role === 'shipper' && !u.blocked)
    .map((u) => ({
      ...u,
      feeActive: isShipperFeeActive(u),
      priority: isShipperFeeActive(u),
      depositOk: (u.shipDepositBalance || 0) >= (u.shipDepositRequired || 0) && (u.shipDepositBalance || 0) > 0,
    }))
    .sort((a, b) => {
      // Ưu tiên: đang đóng phí tháng > có thế chấp > còn lại
      const score = (x) => (x.feeActive ? 2 : 0) + (x.depositOk ? 1 : 0);
      return score(b) - score(a);
    });
}


window.CCLStore = {
  K, uid, CATALOG_CATEGORIES, ensureProducts, getProducts, getProductById, getProductsByShop,
  saveProduct, deleteProduct, hardDeleteProduct, getAllProductsAdmin, clearDemoProducts, adminDeleteProduct,
  getUsers, findUserByEmail, findUserByPhone, findUserByLogin, normalizePhone, createUser, updateUser,
  setOtp, verifyOtp,
  getSession, setSession, clearSession,
  getReviews, addReview, updateReview, deleteReview, getShopRating,
  // Orders & logistics
  ORDER_STATUS, STATUS_LABEL,
  getOrders, saveOrder, findOrder, createOrder,
  updatePackageStatus, shopConfirmPackage, shopReadyForPickup,
  shopSelfShipStart, shopSelfShipDeliver,
  shipperClaimPackage, shipperUpdateStatus,
  requestCancel, resolveCancelRequest, canBuyerCancelDirect, requestReturn,
  getOrdersForBuyer, getOrdersForShop,
  getPackagesReadyForPickup, getPackagesForShipper, getShipperHistory,
  getBlocks, blockUser, unblockUser, isBlocked, reportBomb,
  listShippersRanked,
  shopApproveShipperForPackage,
  setShipperDeposit,
  markShipperMonthlyPaid,
  isShipperFeeActive,
  packageGoodsValue, isPlatformBondedShipper, setPlatformShipperBond, releasePackageDepositHold,
  getReturns,
  // Chat
  getChats, getChatThread, getOrCreateChatThread, postChatMessage,
  listChatsForUser, openOrderChat, canAccessChat, scrubChatText,
};
