/**
 * chochatluongonline — đa ngôn ngữ VI / EN
 */
const I18N_KEY = 'ccl_lang_v1';

const STRINGS = {
  vi: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Thoát',
    profile: 'Hồ sơ',
    orders: 'Đơn hàng',
    seller: 'Gian hàng',
    admin: 'Quản trị',
    searchPlaceholder: 'Tìm sản phẩm, dịch vụ, shop...',
    products: 'Sản phẩm',
    services: 'Dịch vụ',
    all: 'Tất cả',
    parts: 'Linh kiện',
    repair: 'Sửa chữa',
    install: 'Lắp đặt',
    add: 'Thêm',
    cart: 'Giỏ hàng',
    checkout: 'Thanh toán',
    emptyCart: 'Giỏ hàng trống',
    subtotal: 'Tạm tính',
    shipping: 'Vận chuyển',
    discount: 'Giảm giá',
    total: 'Tổng',
    voucher: 'Mã giảm',
    apply: 'Áp dụng',
    bank: 'Ngân hàng',
    priceFrom: 'Giá từ',
    priceTo: 'Giá đến',
    anyRating: 'Mọi đánh giá',
    sortDefault: 'Phù hợp nhất',
    sortPriceAsc: 'Giá thấp → cao',
    sortPriceDesc: 'Giá cao → thấp',
    sortRating: 'Đánh giá cao',
    sortSold: 'Bán chạy',
    sortNewest: 'Mới nhất',
    noResults: 'Không tìm thấy kết quả phù hợp',
    freeShip: 'Miễn ship',
    product: 'Sản phẩm',
    service: 'Dịch vụ',
    reviews: 'đánh giá',
    sold: 'Đã bán',
    hotline: 'Hotline',
  },
  en: {
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    profile: 'Profile',
    orders: 'Orders',
    seller: 'Seller panel',
    admin: 'Admin',
    searchPlaceholder: 'Search products, services, shops...',
    products: 'Products',
    services: 'Services',
    all: 'All',
    parts: 'Parts',
    repair: 'Repair',
    install: 'Installation',
    add: 'Add',
    cart: 'Cart',
    checkout: 'Checkout',
    emptyCart: 'Your cart is empty',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    discount: 'Discount',
    total: 'Total',
    voucher: 'Voucher',
    apply: 'Apply',
    bank: 'Bank',
    priceFrom: 'Min price',
    priceTo: 'Max price',
    anyRating: 'Any rating',
    sortDefault: 'Relevance',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    sortRating: 'Top rated',
    sortSold: 'Best selling',
    sortNewest: 'Newest',
    noResults: 'No matching results',
    freeShip: 'Free ship',
    product: 'Product',
    service: 'Service',
    reviews: 'reviews',
    sold: 'Sold',
    hotline: 'Hotline',
  },
};

function getLang() {
  try {
    return localStorage.getItem(I18N_KEY) || 'vi';
  } catch {
    return 'vi';
  }
}

function setLang(lang) {
  if (!STRINGS[lang]) lang = 'vi';
  localStorage.setItem(I18N_KEY, lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'vi';
  applyI18n();
  if (typeof renderUserNav === 'function') renderUserNav();
  if (typeof renderCatalog === 'function') renderCatalog();
  if (typeof renderCart === 'function') renderCart();
}

function t(key) {
  const lang = getLang();
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.vi[key] || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-option]').forEach((el) => {
    const key = el.getAttribute('data-i18n-option');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('#langSelect').forEach((sel) => {
    sel.value = getLang();
  });
}

function langSwitcherHtml() {
  const lang = getLang();
  return `<select id="langSelect" class="lang-select" onchange="setLang(this.value)" aria-label="Language">
    <option value="vi" ${lang === 'vi' ? 'selected' : ''}>VI</option>
    <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
  </select>`;
}

window.CCL_I18N = { getLang, setLang, t, applyI18n, langSwitcherHtml, STRINGS };
window.getLang = getLang;
window.setLang = setLang;
window.t = t;
window.applyI18n = applyI18n;

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = getLang() === 'en' ? 'en' : 'vi';
  applyI18n();
});
