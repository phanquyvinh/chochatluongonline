/**
 * Auth API — VinhQuay Market
 *
 * PRODUCTION CHECKLIST:
 * - Move JWT_SECRET to process.env.JWT_SECRET
 * - Hash passwords with bcrypt (bcryptjs already in package.json)
 * - Store users in DB (users table with role, shop_id, ...)
 * - Add rate limiting & refresh tokens
 */

const jwt = require('jsonwebtoken');

// TODO: process.env.JWT_SECRET — never commit real secret
const JWT_SECRET = process.env.JWT_SECRET || 'chuoi_bi_mat_ma_hoa_toan_dien_phan_quy_vinh_2027';

// Demo accounts only — replace with DB + bcrypt.compare
const DEMO_USERS = [
  {
    email: 'phanquyvinh@gmail.com',
    password: 'Beliveme76@',
    name: 'Phan Quý Vinh',
    role: 'admin',
  },
  {
    email: 'shopmau@gmail.com',
    password: 'Shop123@',
    name: 'Shop Điện Tử Mẫu',
    role: 'seller',
    shopId: 's101',
  },
];

export default async function handler(req, res) {
  // Basic CORS / method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email, password } = req.body || {};

  if (action !== 'login') {
    return res.status(400).json({ error: 'Yêu cầu không hợp lệ' });
  }

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
  }

  // Normalize
  const normalizedEmail = email.trim().toLowerCase();

  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) {
    // Generic message to avoid user enumeration
    return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
  }

  const payload = {
    sub: user.email,
    email: user.email,
    name: user.name,
    role: user.role,
    shopId: user.shopId || null,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '8h',
    issuer: 'vinhquay-market',
  });

  return res.status(200).json({
    success: true,
    token,
    role: user.role,
    name: user.name,
    email: user.email,
  });
}
