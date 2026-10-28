/**
 * chochatluongonline — Auth + OTP (Brevo ưu tiên, Resend dự phòng)
 * Đăng ký OTP · Đăng nhập mật khẩu (admin) · Đăng nhập OTP (mọi thiết bị)
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
function otpHtml(code) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f766e;margin:0 0 12px">chochatluongonline</h2>
      <p style="color:#334155;line-height:1.5">Mã OTP của bạn:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;margin:16px 0">${code}</p>
      <p style="color:#64748b;font-size:14px">Hết hạn sau 10 phút. Không chia sẻ mã này.</p>
    </div>
  `;
}

async function sendViaBrevo(to, code, purpose) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) return null;
  const fromEmailRaw = (process.env.EMAIL_FROM || '').trim();
  let senderEmail = fromEmailRaw;
  let senderName = 'chochatluongonline';
  const m = fromEmailRaw.match(/^(.*)<([^>]+)>$/);
  if (m) {
    senderName = m[1].trim() || senderName;
    senderEmail = m[2].trim();
  }
  if (!senderEmail || !senderEmail.includes('@')) {
    const err = new Error('EMAIL_FROM phải là email đã verify trên Brevo.');
    err.code = 'BAD_FROM';
    throw err;
  }
  const subject =
    purpose === 'login'
      ? 'Mã OTP đăng nhập — chochatluongonline'
      : 'Mã OTP kích hoạt — chochatluongonline';
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: otpHtml(code),
      textContent: `Mã OTP chochatluongonline: ${code} (hết hạn 10 phút)`,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data.message || data.error || `Brevo HTTP ${resp.status}`;
    const err = new Error(
      String(msg).toLowerCase().includes('sender')
        ? 'Email gửi chưa verify trên Brevo (Senders).'
        : `Brevo: ${msg}`
    );
    err.code = 'EMAIL_SEND_FAILED';
    err.detail = data;
    throw err;
  }
  return { provider: 'brevo', data };
}

async function sendViaResend(to, code, purpose) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;
  let from = (process.env.EMAIL_FROM || '').trim();
  if (!from) from = 'chochatluongonline <onboarding@resend.dev>';
  const subject =
    purpose === 'login'
      ? 'Mã OTP đăng nhập — chochatluongonline'
      : 'Mã OTP kích hoạt — chochatluongonline';
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
      html: otpHtml(code),
      text: `Mã OTP chochatluongonline: ${code} (hết hạn 10 phút)`,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data.message || data.error || `Resend HTTP ${resp.status}`;
    const err = new Error(String(msg));
    err.code = 'EMAIL_SEND_FAILED';
    err.detail = data;
    throw err;
  }
  return { provider: 'resend', data };
}

async function sendOtpEmail(to, code, purpose) {
  if ((process.env.BREVO_API_KEY || '').trim()) return await sendViaBrevo(to, code, purpose);
  if ((process.env.RESEND_API_KEY || '').trim()) return await sendViaResend(to, code, purpose);
  const err = new Error('Chưa cấu hình BREVO_API_KEY hoặc RESEND_API_KEY.');
  err.code = 'NO_EMAIL_PROVIDER';
  throw err;
}

function sessionToken(user) {
  return jwt.sign(
    {
      sub: user.email,
      email: user.email,
      name: user.name || user.email,
      role: user.role || 'buyer',
      shopName: user.shopName || null,
    },
    JWT_SECRET,
    { expiresIn: '30d', issuer: 'chochatluongonline' }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const action = body.action;

  // ----- Đăng ký: gửi OTP -----
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
      return res.status(400).json({ success: false, message: 'Họ tên và mật khẩu (≥6 ký tự) bắt buộc' });
    }
    if (role === 'seller' && !shopName) {
      return res.status(400).json({ success: false, message: 'Nhập tên gian hàng' });
    }
    const code = genOtp();
    const otpToken = jwt.sign(
      { purpose: 'register', email, name, role, shopName, phone, p: password, oh: hashOtp(code) },
      JWT_SECRET,
      { expiresIn: OTP_TTL_SEC, issuer: 'chochatluongonline' }
    );
    try {
      await sendOtpEmail(email, code, 'register');
    } catch (e) {
      console.error('OTP register error:', e.message, e.detail || '');
      return res.status(e.code === 'NO_EMAIL_PROVIDER' ? 503 : 502).json({
        success: false,
        message: e.message || 'Không gửi được email OTP',
        code: e.code || 'EMAIL_SEND_FAILED',
      });
    }
    return res.status(200).json({ success: true, otpSent: true, otpToken, message: 'Đã gửi mã OTP tới email' });
  }

  // ----- Đăng ký: xác nhận OTP -----
  if (action === 'verify_otp') {
    const { otpToken, code } = body;
    if (!otpToken || !code) return res.status(400).json({ success: false, message: 'Thiếu mã OTP' });
    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'OTP hết hạn. Hãy gửi lại mã.' });
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
    return res.status(200).json({
      success: true,
      verified: true,
      token: sessionToken(user),
      user: { ...user },
    });
  }

  // ----- Gửi lại OTP (đăng ký hoặc đăng nhập) -----
  if (action === 'resend_otp') {
    const { otpToken } = body;
    if (!otpToken) return res.status(400).json({ success: false, message: 'Phiên OTP không hợp lệ' });
    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({ success: false, message: 'Không thể gửi lại. Thử lại từ đầu.' });
    }
    if (!['register', 'login'].includes(payload.purpose)) {
      return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ' });
    }
    const code = genOtp();
    const newPayload = { ...payload, oh: hashOtp(code) };
    delete newPayload.iat;
    delete newPayload.exp;
    const newToken = jwt.sign(newPayload, JWT_SECRET, {
      expiresIn: OTP_TTL_SEC,
      issuer: 'chochatluongonline',
    });
    try {
      await sendOtpEmail(payload.email, code, payload.purpose);
    } catch (e) {
      return res.status(502).json({ success: false, message: e.message || 'Không gửi được email' });
    }
    return res.status(200).json({ success: true, otpSent: true, otpToken: newToken, message: 'Đã gửi lại OTP' });
  }

  // ----- Đăng nhập bằng OTP (mọi thiết bị, không phụ thuộc localStorage) -----
  if (action === 'login_otp') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }
    const code = genOtp();
    const otpToken = jwt.sign(
      { purpose: 'login', email, oh: hashOtp(code) },
      JWT_SECRET,
      { expiresIn: OTP_TTL_SEC, issuer: 'chochatluongonline' }
    );
    try {
      await sendOtpEmail(email, code, 'login');
    } catch (e) {
      console.error('OTP login error:', e.message, e.detail || '');
      return res.status(e.code === 'NO_EMAIL_PROVIDER' ? 503 : 502).json({
        success: false,
        message: e.message || 'Không gửi được email OTP',
        code: e.code || 'EMAIL_SEND_FAILED',
      });
    }
    return res.status(200).json({
      success: true,
      otpSent: true,
      otpToken,
      message: 'Đã gửi mã OTP đăng nhập tới email',
    });
  }

  if (action === 'verify_login_otp') {
    const { otpToken, code, name, role, shopName } = body;
    if (!otpToken || !code) return res.status(400).json({ success: false, message: 'Thiếu mã OTP' });
    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'OTP hết hạn. Hãy gửi lại mã.' });
    }
    if (payload.purpose !== 'login' || payload.oh !== hashOtp(String(code).trim())) {
      return res.status(401).json({ success: false, message: 'Mã OTP không đúng' });
    }
    // Hồ sơ: ưu tiên client gửi (từ local nếu còn), không thì buyer mặc định
    const user = {
      email: payload.email,
      name: (name && String(name).trim()) || payload.email.split('@')[0],
      role: ['buyer', 'seller', 'shipper', 'admin'].includes(role) ? role : 'buyer',
      shopName: shopName || null,
      verified: true,
    };
    // Admin bootstrap email luôn role admin
    if (BOOTSTRAP.some((u) => u.email === user.email)) {
      user.role = 'admin';
      user.name = BOOTSTRAP.find((u) => u.email === user.email).name;
    }
    return res.status(200).json({
      success: true,
      token: sessionToken(user),
      user,
    });
  }

  // ----- Đăng nhập mật khẩu (chủ yếu admin bootstrap; user thường dùng OTP) -----
  if (action === 'login') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }
    const user = BOOTSTRAP.find((u) => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sai email hoặc mật khẩu. Tài khoản đăng ký hãy dùng Đăng nhập bằng OTP.',
        hint: 'otp_login',
      });
    }
    return res.status(200).json({
      success: true,
      token: sessionToken(user),
      role: user.role,
      name: user.name,
      email: user.email,
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
