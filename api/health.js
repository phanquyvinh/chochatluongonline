export default function handler(req, res) {
  const hasResend = !!(process.env.RESEND_API_KEY || '').trim();
  const hasJwt = !!(process.env.JWT_SECRET || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim() || '(default onboarding@resend.dev)';
  res.status(200).json({
    ok: true,
    emailConfigured: hasResend,
    jwtConfigured: hasJwt,
    emailFrom: hasResend ? from : null,
    tip: hasResend
      ? 'RESEND_API_KEY đã có. Thử đăng ký lại. Free Resend: chỉ gửi được tới email đăng ký Resend.'
      : 'Thiếu RESEND_API_KEY — thêm trên Vercel rồi Redeploy.',
  });
}
