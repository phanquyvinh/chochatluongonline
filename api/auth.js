/**
 * Auth API — chochatluongonline
 * login + optional send_otp (wire to Resend/SMTP via env)
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ccl_change_me_in_production_phanquyvinh';

const BOOTSTRAP = [
  { email: 'phanquyvinh@gmail.com', password: process.env.ADMIN_PASSWORD || 'Beliveme76@', name: 'Phan Quý Vinh', role: 'admin' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const { action } = body;

  if (action === 'send_otp') {
    // Production: send body.code to body.email via Resend / SES
    // Never return the code in response body on production
    if (process.env.RESEND_API_KEY && body.email && body.code) {
      try {
        // placeholder for email provider
      } catch (_) {}
    }
    return res.status(200).json({ success: true, otpSent: true });
  }

  if (action === 'login') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const user = BOOTSTRAP.find((u) => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });

    const token = jwt.sign(
      { sub: user.email, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h', issuer: 'chochatluongonline' }
    );
    return res.status(200).json({
      success: true, token, role: user.role, name: user.name, email: user.email,
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
