# Phan Quý Vinh Market v2.1

Sàn **linh kiện + dịch vụ kỹ thuật** · Escrow · **Mọi chỉ số giá linh hoạt**.

## Ai chỉnh được gì?

| Chỉ số | Ai chỉnh | Ghi chú |
|--------|----------|---------|
| Phí sàn % | **Admin** | 0–30%, áp dụng khi giải ngân |
| Thuế DN / VAT | **Admin** | Báo cáo tài chính |
| Ship mặc định sàn | **Admin** | Fallback khi shop chưa set |
| Voucher sàn | **Admin** | Mã, %, trần giảm |
| Escrow (số ngày) | **Admin** | |
| **Giá từng SP/DV** | **Seller** | Đổi giá realtime |
| **Phí ship sản phẩm** | **Seller** | Theo gian hàng |
| **Ngưỡng miễn ship** | **Seller** | Theo gian hàng |
| **Phí ship / phụ phí dịch vụ** | **Seller** | Call-out thợ |
| **Đơn tối thiểu shop** | **Seller** | |
| **Bật/tắt nhận đơn** | **Seller** | |

Không còn hardcode 30k/đơn — mỗi shop tự quyết.

## File quan trọng

- `js/config.js` — platform + shop settings, tính ship/tổng đơn
- `js/app.js` — giỏ, catalog, checkout
- `seller.html` — form giá & ship của đối tác
- `admin.html` — cấu hình thị trường

## Demo

- Admin: `phanquyvinh@gmail.com` / `Beliveme76@`
- Seller: `shopmau@gmail.com` / `Shop123@` (shop `s101`)

Voucher demo: `VINHQUAY10`

## Scale

Settings lưu localStorage versioned (`vq_platform_config_v1`, `vq_shop_settings_v1`, `vq_catalog_overrides_v1`).
Khi có DB: map 1-1 sang `platform_settings` + `shop_settings` + `products.price` — migration không phá data cũ.

© 2026 Phan Quý Vinh
