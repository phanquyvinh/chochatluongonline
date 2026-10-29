# chochatluongonline

Nền tảng của **Phan Quý Vinh**.

## Chức năng

- Đăng ký / đăng nhập (buyer, seller, shipper) + xác nhận OTP email
- Gian hàng seller: đăng SP/DV, giá, tối đa 10 ảnh + 2 video (máy/camera/link), mô tả, hướng dẫn, phí ship riêng
- Trang sản phẩm & shop: đánh giá sao + bình luận + ảnh/video (upload máy hoặc camera); buyer/admin xóa sửa
- Giỏ hàng, escrow, yêu cầu hoàn khi chưa giải ngân
- Admin: cấu hình phí/thuế/ship, chặn seller gian lận / buyer bom hàng

## Deploy

Vercel project: gắn domain `chochatluongonline`.  
Env: `JWT_SECRET`, `ADMIN_PASSWORD`, (tuỳ chọn) `RESEND_API_KEY`.

Không hiển thị thông tin nội bộ / demo trên giao diện công khai.
