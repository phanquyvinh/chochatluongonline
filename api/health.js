export default function handler(req, res) {
  const hasBrevo = !!(process.env.BREVO_API_KEY || '').trim();
  const hasResend = !!(process.env.RESEND_API_KEY || '').trim();
  const hasJwt = !!(process.env.JWT_SECRET || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim() || null;

  let tip = 'Chưa có nhà cung cấp email.';
  if (hasBrevo) {
    tip = 'Brevo đã cấu hình — có thể gửi OTP tới mọi email khách (free ~300/ngày).';
  } else if (hasResend) {
    tip = 'Resend đã có. Free chưa verify domain: chỉ gửi tới email đăng ký Resend. Nên thêm BREVO_API_KEY để gửi mọi Gmail.';
  }

  res.status(200).json({
    ok: true,
    emailConfigured: hasBrevo || hasResend,
    provider: hasBrevo ? 'brevo' : hasResend ? 'resend' : null,
    brevoConfigured: hasBrevo,
    resendConfigured: hasResend,
    jwtConfigured: hasJwt,
    emailFrom: from,
    tip,
  });
}
