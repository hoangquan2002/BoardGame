# Báo cáo Trải nghiệm & Hình ảnh từng Hành động trên Render

> **Địa chỉ Web thực tế**: [https://boardgame-02k2.onrender.com/](https://boardgame-02k2.onrender.com/)  
> **Chế độ kiểm thử**: Trình duyệt Chromium thực tế, viewport Mobile `390×844` Retina (tỷ lệ 2x), chơi ván bài 1v1 đối kháng trực tiếp giữa **An** (Người chơi) và **Máy 1 (Thường)**.  
> **Thư mục lưu trữ**: Toàn bộ 18 ảnh màn hình và mã nguồn báo cáo được gom trọn vẹn trong thư mục này (`gameplay_screenshots/`).

---

## 1. Danh sách 18 Ảnh chụp từng Hành động

| Bước | Tên file | Hành động | Chi tiết giao diện |
|:---:|---|---|---|
| **01** | [`step_01_trang_chu.png`](./step_01_trang_chu.png) | **Trang chủ** | Form nhập tên người chơi và nút "Tạo phòng mới" nổi bật, tự động căn giữa vừa vặn màn hình. |
| **02** | [`step_02_phong_cho.png`](./step_02_phong_cho.png) | **Phòng chờ** | Hiển thị mã phòng to rõ (`5XKYE`), mã QR trực tiếp cho điện thoại khác quét, nút sao chép link mời. |
| **03** | [`step_03_them_may.png`](./step_03_them_may.png) | **Thêm Máy 1** | Bấm nút "🤖 Thêm máy (Thường)" tạo ngay 1 đối thủ AI. Phòng đạt 2/4 người và sẵn sàng bắt đầu. |
| **04** | [`step_04_bat_dau_van_bai.png`](./step_04_bat_dau_van_bai.png) | **Khởi tạo ván bài** | Bàn chia đều 4 Bệnh Lý vào Thể Trạng mỗi bên. Ghế đối thủ Máy 1 ở trên cùng, dải giữa bàn (Rút 71 · Bỏ 2 · Đã đánh 1/2), Thể Trạng và bài tay xếp 1 hàng so le bên dưới. |
| **05** | [`step_05_may_dang_di_luot_1.png`](./step_05_may_dang_di_luot_1.png) | **Máy 1 đi lượt đầu** | Máy 1 tự động đánh Thuốc Sildenafil vào Liệt dương (còn 2 bệnh). |
| **06** | [`step_06_dau_luot_an_2.png`](./step_06_dau_luot_an_2.png) | **Đầu lượt của An** | Đồng hồ đếm ngược ⏱ hiển thị rõ ràng, nhãn "Lượt của bạn" màu xanh lá. Rút thêm 2 lá bài từ chồng rút. |
| **07** | [`step_07_phong_to_la_bai.png`](./step_07_phong_to_la_bai.png) | **Nhấn giữ phóng to** | Chạm giữ $\ge 400$ms mở **Card Zoom Modal**: phóng to trọn vẹn lá bài thật (Suy Nghĩ Tự Tử), chiếm ~90% màn hình, không bị che bởi khối chữ. |
| **08** | [`step_08_an_chon_la_3_luot_2.png`](./step_08_an_chon_la_3_luot_2.png) | **Chọn lá Thuốc** | Chạm lá bài tay: lá được chọn nhô lên (`translateY(-10px)`) viền xanh dương. Ô Bệnh Lý hợp lệ (Lo âu) sáng viền xanh lá kèm nút "Chữa bệnh". |
| **09** | [`step_09_an_danh_thanh_cong_luot_2.png`](./step_09_an_danh_thanh_cong_luot_2.png) | **Đánh Thuốc vào Thể Trạng** | Lá Thuốc Lorazepam đặt **TRÊN** Bệnh Lý Lo âu, lệch xuống dưới để lộ tên bệnh. Hiển thị rõ dải "Mở cửa: Suy nghĩ tự tử, Trầm cảm, Điên loạn". |
| **10** | [`step_10_truoc_ket_thuc_luot_2.png`](./step_10_truoc_ket_thuc_luot_2.png) | **Chuẩn bị kết thúc lượt** | An kiểm tra lại trạng thái bài và bấm nút "Kết thúc lượt". |
| **11** | [`step_11_sau_ket_thuc_luot_2.png`](./step_11_sau_ket_thuc_luot_2.png) | **Chuyển lượt sang Máy 1** | Trạng thái chuyển mượt sang "Lượt: 🤖 Máy 1 (Thường)". |
| **12** | [`step_12_may_dang_di_luot_5.png`](./step_12_may_dang_di_luot_5.png) | **Máy 1 tính toán & đi tiếp** | Máy 1 tự động điều trị các Bệnh Lý trên ghế của mình. Ghế đối thủ mini hiển thị rõ ràng. |
| **13** | [`step_13_dau_luot_an_7.png`](./step_13_dau_luot_an_7.png) | **Lượt mới của An** | Đến lượt mới của An, rút thêm bài và kiểm tra các Bệnh Lý còn lại. |
| **14** | [`step_14_an_chon_la_6_luot_7.png`](./step_14_an_chon_la_6_luot_7.png) | **Chọn lá bài tiếp theo** | Chọn tiếp lá bài thích hợp trên tay. |
| **15** | [`step_15_an_danh_thanh_cong_luot_7.png`](./step_15_an_danh_thanh_cong_luot_7.png) | **Đánh bài thành công** | Tiếp tục đưa lá bài vào mục tiêu Thể Trạng. |
| **16** | [`step_16_truoc_ket_thuc_luot_7.png`](./step_16_truoc_ket_thuc_luot_7.png) | **Bấm kết thúc lượt** | Bấm kết thúc lượt của An. |
| **17** | [`step_17_sau_ket_thuc_luot_7.png`](./step_17_sau_ket_thuc_luot_7.png) | **Chuyển lượt cuối** | Chuyển lượt sang đối thủ để tiến tới kết thúc ván bài. |
| **18** | [`step_18_ket_thuc_van_bai.png`](./step_18_ket_thuc_van_bai.png) | **Kết thúc ván bài** | Toàn bộ Bệnh Lý được chữa khỏi $\to$ Hộp thoại chiến thắng 🏆 xuất hiện trang trọng với nút "Về trang chủ". |

---

## 2. Cách xem nhanh
- **Cách 1**: Mở trực tiếp file [`index.html`](./index.html) bằng bất kỳ trình duyệt nào để xem gallery tương tác độ nét cao có phím điều hướng (Trái/Phải/Phóng to).
- **Cách 2**: Mở thư mục trên máy tính: `d:\vnpt prj\quan\BoardGame\gameplay_screenshots\`
