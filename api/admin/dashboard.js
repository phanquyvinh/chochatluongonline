const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chuoi_bi_mat_ma_hoa_toan_dien_phan_quy_vinh_2027';

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Truy cập bị chặn' });
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền quản trị' });
    }

    // Demo GMV — production: SUM from orders
    // Actual fee/tax rates come from platform_settings (frontend applies live config)
    const totalSales = 85000000;
    const feeRate = 0.01;
    const taxRate = 0.10;
    const platformRevenue = Math.round(totalSales * feeRate);
    const stateTaxPayable = Math.round(platformRevenue * taxRate);
    const netProfit = platformRevenue - stateTaxPayable;

    return res.status(200).json({
      success: true,
      note: 'Rates are configurable in Admin UI; this endpoint returns demo GMV baseline',
      financialStats: {
        totalSales: totalSales.toLocaleString('vi-VN') + ' đ',
        platformRevenue: platformRevenue.toLocaleString('vi-VN') + ' đ',
        stateTaxPayable: stateTaxPayable.toLocaleString('vi-VN') + ' đ',
        netProfit: netProfit.toLocaleString('vi-VN') + ' đ',
      },
    });
  } catch {
    return res.status(401).json({ error: 'Xác thực admin không thành công' });
  }
}
