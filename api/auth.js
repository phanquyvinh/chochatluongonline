/**
 * chochatluongonline — Auth + OTP email
 *
 * Env (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY   = re_xxxx          (bắt buộc để gửi mail)
 *   EMAIL_FROM       = chochatluongonline <onboarding@resend.dev>
 *                      (domain riêng sau khi verify trên Resend)
 *   JWT_SECRET       = chuỗi bí mật dài
 *   ADMIN_PASSWORD   = mật khẩu admin bootstrap
 *
 * OTP không lưu DB: mã hóa trong otpToken (JWT, hết hạn 10 phút).
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'ccl_change_me_in_production_phanquyvinh';
const OTP_TTL_SEC = 10 * 60;

const BOOTSTRAP = [
  {
    email: 'phanquyvinh@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'Beliveme76@',
    name: 'Phan Quý Vinh',
    role: 'admin',
  },
];

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code) + JWT_SECRET).digest('hex');
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(to, code, purpose) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('Chưa cấu hình RESEND_API_KEY trên Vercel');
    err.code = 'NO_EMAIL_PROVIDER';
    throw err;
  }

  const from =
    process.env.EMAIL_FROM ||
    'chochatluongonline <onboarding@resend.dev>';

  const subject =
    purpose === 'register'
      ? 'Mã OTP kích hoạt — chochatluongonline'
      : 'Mã OTP — chochatluongonline';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f766e;margin:0 0 12px">chochatluongonline</h2>
      <p style="color:#334155;line-height:1.5">Mã OTP của bạn:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;margin:16px 0">${code}</p>
      <p style="color:#64748b;font-size:14px">Hết hạn sau 10 phút. Không chia sẻ mã này.</p>
    </div>
  `;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text: `Mã OTP chochatluongonline: ${code} (hết hạn 10 phút)`,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data?.message || data?.error || `Resend HTTP ${resp.status}`;
    const err = new Error(msg);
    err.code = 'EMAIL_SEND_FAILED';
    err.detail = data;
    throw err;
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const action = body.action;

  // ---------- Gửi OTP đăng ký ----------
  if (action === 'send_otp' || action === 'register_otp') {
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    const role = ['buyer', 'seller', 'shipper'].includes(body.role) ? body.role : 'buyer';
    const shopName = String(body.shopName || '').trim();
    const phone = String(body.phone || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }
    if (!name || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Họ tên và mật khẩu (tối thiểu 6 ký tự) là bắt buộc' });
    }
    if (role === 'seller' && !shopName) {
      return res.status(400).json({ success: false, message: 'Nhập tên gian hàng' });
    }

    const code = genOtp();
    const otpToken = jwt.sign(
      {
        purpose: 'register',
        email,
        name,
        role,
        shopName,
        phone,
        // password chỉ trong token tạm — production nên hash trước
        p: password,
        oh: hashOtp(code),
      },
      JWT_SECRET,
      { expiresIn: OTP_TTL_SEC, issuer: 'chochatluongonline' }
    );

    try {
      await sendOtpEmail(email, code, 'register');
    } catch (e) {
      console.error('OTP email error:', e.message, e.detail || '');
      if (e.code === 'NO_EMAIL_PROVIDER') {
        return res.status(503).json({
          success: false,
          message:
            'Hệ thống chưa cấu hình gửi email. Vào Vercel → Environment Variables thêm RESEND_API_KEY.',
          code: 'NO_EMAIL_PROVIDER',
        });
      }
      return res.status(502).json({
        success: false,
        message: 'Không gửi được email OTP. Kiểm tra RESEND_API_KEY / EMAIL_FROM hoặc hộp thư spam.',
        code: 'EMAIL_SEND_FAILED',
      });
    }

    return res.status(200).json({
      success: true,
      otpSent: true,
      otpToken,
      message: 'Đã gửi mã OTP tới email của bạn',
    });
  }

  // ---------- Xác nhận OTP ----------
  if (action === 'verify_otp') {
    const { otpToken, code } = body;
    if (!otpToken || !code) {
      return res.status(400).json({ success: false, message: 'Thiếu mã OTP' });
    }

    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'OTP hết hạn hoặc không hợp lệ. Hãy gửi lại mã.' });
    }

    if (payload.purpose !== 'register' || payload.oh !== hashOtp(String(code).trim())) {
      return res.status(401).json({ success: false, message: 'Mã OTP không đúng' });
    }

    const user = {
      email: payload.email,
      name: payload.name,
      role: payload.role,
      shopName: payload.shopName || null,
      phone: payload.phone || '',
      password: payload.p,
      verified: true,
    };

    const token = jwt.sign(
      {
        sub: user.email,
        email: user.email,
        name: user.name,
        role: user.role,
        shopName: user.shopName,
      },
      JWT_SECRET,
      { expiresIn: '8h', issuer: 'chochatluongonline' }
    );

    return res.status(200).json({
      success: true,
      verified: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        shopName: user.shopName,
        phone: user.phone,
        password: user.password, // client lưu local registry (hash sau khi có DB)
        verified: true,
      },
    });
  }

  // ---------- Gửi lại OTP ----------
  if (action === 'resend_otp') {
    const { otpToken } = body;
    if (!otpToken) {
      return res.status(400).json({ success: false, message: 'Phiên OTP không hợp lệ' });
    }
    let payload;
    try {
      // cho phép đọc cả token sắp hết hạn để lấy email
      payload = jwt.verify(otpToken, JWT_SECRET, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({ success: false, message: 'Không thể gửi lại. Đăng ký lại từ đầu.' });
    }
    if (payload.purpose !== 'register') {
      return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ' });
    }

    const code = genOtp();
    const newToken = jwt.sign(
      { ...payload, oh: hashOtp(code), iat: undefined, exp: undefined },
      JWT_SECRET,
      { expiresIn: OTP_TTL_SEC, issuer: 'chochatluongonline' }
    );

    try {
      await sendOtpEmail(payload.email, code, 'register');
    } catch (e) {
      console.error('Resend OTP error:', e.message);
      return res.status(502).json({
        success: false,
        message: e.code === 'NO_EMAIL_PROVIDER'
          ? 'Chưa cấu hình RESEND_API_KEY trên Vercel'
          : 'Không gửi được email. Thử lại sau.',
      });
    }

    return res.status(200).json({
      success: true,
      otpSent: true,
      otpToken: newToken,
      message: 'Đã gửi lại mã OTP',
    });
  }

  // ---------- Login ----------
  if (action === 'login') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }

    const user = BOOTSTRAP.find((u) => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
    }

    const token = jwt.sign(
      { sub: user.email, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h', issuer: 'chochatluongonline' }
    );
    return res.status(200).json({
      success: true,
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
