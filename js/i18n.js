/**
 * chochatluongonline — đa ngôn ngữ (VI / EN)
 */
const I18N_KEY = 'ccl_lang_v1';

const STRINGS = {
  vi: {
    langName: 'Tiếng Việt',
    home: 'Trang chủ',
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
    addToCart: 'Thêm',
    cart: 'Giỏ hàng',
    checkout: 'Thanh toán',
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
    saved: 'Đã lưu',
    delete: 'Xóa',
    edit: 'Sửa',
    hide: 'Ẩn',
    cancelProduct: 'Hủy SP',
    productName: 'Tên sản phẩm / dịch vụ',
    price: 'Giá (đ)',
    description: 'Mô tả',
    guide: 'Hướng dẫn chi tiết',
    saveProduct: 'Lưu sản phẩm',
    cancel: 'Hủy',
    imageLink: 'Link ảnh',
    chooseImage: 'Chọn ảnh',
    takePhoto: 'Chụp ảnh',
    clearImage: 'Xóa ảnh',
    imageHint: 'Link, chọn từ máy, hoặc chụp camera',
  },
  en: {
    langName: 'English',
    home: 'Home',
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    profile: 'Profile',
    orders: 'Orders',
    seller: 'Shop',
    admin: 'Admin',
    searchPlaceholder: 'Search products, services, shops...',
    products: 'Products',
    services: 'Services',
    all: 'All',
    parts: 'Parts',
    repair: 'Repair',
    install: 'Installation',
    addToCart: 'Add',
    cart: 'Cart',
    checkout: 'Checkout',
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
    saved: 'Saved',
    delete: 'Delete',
    edit: 'Edit',
    hide: 'Hide',
    cancelProduct: 'Remove',
    productName: 'Product / service name',
    price: 'Price (VND)',
    description: 'Description',
    guide: 'Detailed guide',
    saveProduct: 'Save product',
    cancel: 'Cancel',
    imageLink: 'Image URL',
    chooseImage: 'Choose image',
    takePhoto: 'Take photo',
    clearImage: 'Clear image',
    imageHint: 'URL, gallery, or camera',
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
  window.dispatchEvent(new CustomEvent('ccl:lang', { detail: lang }));
}

function t(key) {
  const lang = getLang();
  return (STRINGS[lang] && STRINGS[lang][key]) || (STRINGS.vi && STRINGS.vi[key]) || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.hasAttribute('data-i18n-placeholder')) el.placeholder = val;
      else el.value = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = getLang();
}

function langSwitcherHtml() {
  const lang = getLang();
  return `<select id="langSelect" class="lang-select" onchange="setLang(this.value)" title="Language" aria-label="Language">
    <option value="vi" ${lang === 'vi' ? 'selected' : ''}>VI</option>
    <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
  </select>`;
}

window.CCL_I18N = { STRINGS, getLang, setLang, t, applyI18n, langSwitcherHtml };
window.getLang = getLang;
window.setLang = setLang;
window.t = t;
window.applyI18n = applyI18n;
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = getLang() === 'en' ? 'en' : 'vi';
  applyI18n();
});
