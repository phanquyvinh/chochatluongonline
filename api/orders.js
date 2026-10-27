/**
 * Orders API — accepts dynamic platform fee + per-shop ship from client snapshot.
 * Production: recompute fees server-side from shop_settings + platform_settings tables.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chuoi_bi_mat_ma_hoa_toan_dien_phan_quy_vinh_2027';
const DEFAULT_FEE_RATE = 0.01;

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' });
  }

  const { cart, bank, platformFeeRate, totals, shopSettingsSnapshot } = req.body || {};

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống hoặc không hợp lệ' });
  }
  if (!bank || typeof bank !== 'string') {
    return res.status(400).json({ error: 'Vui lòng chọn ngân hàng' });
  }

  const feeRate =
    typeof platformFeeRate === 'number' && platformFeeRate >= 0 && platformFeeRate <= 0.3
      ? platformFeeRate
      : DEFAULT_FEE_RATE;

  // Prefer client-computed totals (from shop settings); fallback recompute simply
  let totalItems = 0;
  const shopIds = new Set();
  cart.forEach((item) => {
    if (!item || !item.shopId) return;
    shopIds.add(item.shopId);
    totalItems += (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1);
  });

  const totalShip = totals?.totalShip != null ? Number(totals.totalShip) : 0;
  const discount = totals?.discount != null ? Number(totals.discount) : 0;
  const platformFee = totals?.platformFee != null
    ? Number(totals.platformFee)
    : Math.round(totalItems * feeRate);
  const grandTotal = totals?.grandTotal != null
    ? Number(totals.grandTotal)
    : Math.max(0, totalItems + totalShip - discount);

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const shopCount = shopIds.size || (shopSettingsSnapshot?.length || 0);

  return res.status(200).json({
    success: true,
    orderId,
    summary: {
      totalItems,
      totalShip,
      platformFee,
      discount,
      feeRate,
      shops: shopCount,
      grandTotal,
      shopBreakdown: shopSettingsSnapshot || null,
    },
    message:
      `Đặt hàng thành công (${orderId}) qua ${bank}. ` +
      `${shopCount} gói từ các gian hàng. ` +
      `Ship: ${totalShip.toLocaleString('vi-VN')} đ` +
      (discount > 0 ? ` · Giảm: ${discount.toLocaleString('vi-VN')} đ` : '') +
      `. Phí sàn ${(feeRate * 100).toFixed(2)}% (${platformFee.toLocaleString('vi-VN')} đ) trừ khi giải ngân. ` +
      `Tiền đang tạm giữ escrow.`,
  });
}
