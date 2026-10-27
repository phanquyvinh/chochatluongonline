# Cấu hình gửi OTP email — chochatluongonline

OTP **chỉ gửi được** khi Vercel có API key dịch vụ email.

## Bước 1 — Tạo Resend (miễn phí)

1. Đăng ký: https://resend.com  
2. API Keys → **Create API Key** → copy `re_...`  
3. (Tuỳ chọn) Domains → thêm domain thật để gửi từ `@chochatluongonline...`  
   - Chưa có domain: dùng tạm `onboarding@resend.dev` (Resend cho phép test)

## Bước 2 — Biến môi trường trên Vercel

Project → **Settings** → **Environment Variables**:

| Name | Value | Ghi chú |
|------|--------|---------|
| `RESEND_API_KEY` | `re_xxxx...` | **Bắt buộc** |
| `EMAIL_FROM` | `chochatluongonline <onboarding@resend.dev>` | Đổi khi đã verify domain |
| `JWT_SECRET` | chuỗi ngẫu nhiên dài | Bảo mật token |
| `ADMIN_PASSWORD` | mật khẩu admin | Không để lộ trên web |

Redeploy sau khi thêm biến.

## Bước 3 — Kiểm tra

1. Vào `/register` → điền form → **Gửi mã OTP**  
2. Mở email (và **Spam**) → lấy 6 số  
3. Nhập OTP → kích hoạt tài khoản  

Nếu thiếu `RESEND_API_KEY`, API trả lỗi rõ: *Chưa cấu hình RESEND_API_KEY*.

## Lưu ý

- Không in mã OTP lên giao diện web.  
- Mã hết hạn sau **10 phút**.  
- Gửi lại OTP: nút trên form xác nhận.
