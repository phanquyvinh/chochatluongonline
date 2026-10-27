/**
 * chochatluongonline — Auth + OTP email
 *
 * Hỗ trợ 2 nhà cung cấp MIỄN PHÍ (ưu tiên theo thứ tự):
 *
 * 1) BREVO_API_KEY  (Sendinblue) — 300 email/ngày, gửi MỌI địa chỉ
 *    https://app.brevo.com → SMTP & API → API keys
 *    BREVO_API_KEY = xkeysib-...
 *    EMAIL_FROM    = email đã verify trên Brevo (thường là Gmail của bạn)
 *
 * 2) RESEND_API_KEY — 100 email/ngày
 *    Free chưa verify domain: chỉ gửi tới email đăng ký Resend
 *    Đã verify domain: gửi mọi địa chỉ
 *    EMAIL_FROM = Name <onboarding@resend.dev>  hoặc mail domain đã verify
 *
 * Chung: JWT_SECRET, ADMIN_PASSWORD
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

/** Brevo — free tier, send to any email after verifying sender */
async function sendViaBrevo(to, code, purpose) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) return null;

  const fromEmail = (process.env.EMAIL_FROM || '').trim();
  // EMAIL_FROM can be "Name <mail@x.com>" or just "mail@x.com"
  let senderEmail = fromEmail;
  let senderName = 'chochatluongonline';
  const m = fromEmail.match(/^(.*)<([^>]+)>$/);
  if (m) {
    senderName = m[1].trim() || senderName;
    senderEmail = m[2].trim();
  }
  if (!senderEmail || !senderEmail.includes('@')) {
    const err = new Error(
      'Brevo cần EMAIL_FROM là email đã xác minh trên Brevo (vd: ban@gmail.com).'
    );
    err.code = 'BAD_FROM';
    throw err;
  }

  const subject =
    purpose === 'register'
      ? 'Mã OTP kích hoạt — chochatluongonline'
      : 'Mã OTP — chochatluongonline';

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
    const msg = data.message || data.error || JSON.stringify(data) || `Brevo HTTP ${resp.status}`;
    const err = new Error(
      String(msg).includes('sender') || String(msg).includes('Sender')
        ? 'Email người gửi chưa verify trên Brevo. Vào Brevo → Senders → thêm đúng EMAIL_FROM.'
        : `Brevo: ${msg}`
    );
    err.code = 'EMAIL_SEND_FAILED';
    err.detail = data;
    throw err;
  }
  return { provider: 'brevo', data };
}

/** Resend */
async function sendViaResend(to, code, purpose) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;

  let from = (process.env.EMAIL_FROM || '').trim();
  if (!from) from = 'chochatluongonline <onboarding@resend.dev>';

  const subject =
    purpose === 'register'
      ? 'Mã OTP kích hoạt — chochatluongonline'
      : 'Mã OTP — chochatluongonline';

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
    let hint = msg;
    const lower = String(msg).toLowerCase();
    if (lower.includes('api key') || resp.status === 401) {
      hint = 'RESEND_API_KEY sai. Tạo key mới trên resend.com.';
    } else if (
      lower.includes('only send testing') ||
      lower.includes('verify a domain') ||
      lower.includes('testing emails')
    ) {
      hint =
        'Resend free chưa verify domain chỉ gửi tới email đăng ký Resend. Dùng BREVO_API_KEY (miễn phí, gửi mọi Gmail) hoặc verify domain Resend.';
    }
    const err = new Error(hint);
    err.code = 'EMAIL_SEND_FAILED';
    err.detail = data;
    throw err;
  }
  return { provider: 'resend', data };
}

async function sendOtpEmail(to, code, purpose) {
  // Ưu tiên Brevo (gửi được mọi email trên free tier)
  if ((process.env.BREVO_API_KEY || '').trim()) {
    return await sendViaBrevo(to, code, purpose);
  }
  if ((process.env.RESEND_API_KEY || '').trim()) {
    return await sendViaResend(to, code, purpose);
  }
  const err = new Error(
    'Chưa cấu hình email. Thêm BREVO_API_KEY (khuyến nghị, free gửi mọi mail) hoặc RESEND_API_KEY trên Vercel, rồi Redeploy.'
  );
  err.code = 'NO_EMAIL_PROVIDER';
  throw err;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const action = body.action;

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
      return res.status(400).json({
        success: false,
        message: 'Họ tên và mật khẩu (tối thiểu 6 ký tự) là bắt buộc',
      });
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
      const status = e.code === 'NO_EMAIL_PROVIDER' ? 503 : 502;
      return res.status(status).json({
        success: false,
        message: e.message || 'Không gửi được email OTP',
        code: e.code || 'EMAIL_SEND_FAILED',
      });
    }

    return res.status(200).json({
      success: true,
      otpSent: true,
      otpToken,
      message: 'Đã gửi mã OTP tới email của bạn',
    });
  }

  if (action === 'verify_otp') {
    const { otpToken, code } = body;
    if (!otpToken || !code) {
      return res.status(400).json({ success: false, message: 'Thiếu mã OTP' });
    }
    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'OTP hết hạn hoặc không hợp lệ. Hãy gửi lại mã.',
      });
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
        password: user.password,
        verified: true,
      },
    });
  }

  if (action === 'resend_otp') {
    const { otpToken } = body;
    if (!otpToken) {
      return res.status(400).json({ success: false, message: 'Phiên OTP không hợp lệ' });
    }
    let payload;
    try {
      payload = jwt.verify(otpToken, JWT_SECRET, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Không thể gửi lại. Đăng ký lại từ đầu.',
      });
    }
    if (payload.purpose !== 'register') {
      return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ' });
    }

    const code = genOtp();
    const newToken = jwt.sign(
      {
        purpose: payload.purpose,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        shopName: payload.shopName,
        phone: payload.phone,
        p: payload.p,
        oh: hashOtp(code),
      },
      JWT_SECRET,
      { expiresIn: OTP_TTL_SEC, issuer: 'chochatluongonline' }
    );

    try {
      await sendOtpEmail(payload.email, code, 'register');
    } catch (e) {
      return res.status(502).json({
        success: false,
        message: e.message || 'Không gửi được email',
      });
    }

    return res.status(200).json({
      success: true,
      otpSent: true,
      otpToken: newToken,
      message: 'Đã gửi lại mã OTP',
    });
  }

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
