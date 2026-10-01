# Prompt cho agent

> File này chỉ chứa: (1) việc còn tồn từ giai đoạn trước, (2) yêu cầu giai đoạn hiện tại. Làm **cả hai** phần, Phần 1 trước.
> Kế hoạch chi tiết: [design.md](design.md) (agent chỉ đọc, không sửa). Quy trình mỗi giai đoạn: `design.md` mục 7.
> **Trung thực trong báo cáo**: bước nào không thực sự chạy được thì ghi "không kiểm tra được" + lý do, **không** ghi ✅.

## Phần 1 — Việc còn tồn (review D0)
Người quản lý đã review D0 (commit `9eb83b5`, Render đã deploy đúng commit này):
- **Đạt**: build/lint/test 118/118; 18 ảnh WebP đúng tên lá (đã đối chiếu bằng mắt, tác dụng phụ in trên lá khớp `cards.json`);
  `/version`, `/robots.txt`, chặn `/.env` / PDF / `../`; bộ e2e S0–S2 chạy được cả local lẫn URL thật; không tràn/không cuộn ở
  4 kích thước; ảnh phóng to đẹp, đủ chữ tiếng Việt; menu "⋯" có Đổi bài / Nhật ký / Thoát.
- Ảnh 300×537 (khác "khoảng 300×420" trong `design.md`): **chấp nhận**, vì đúng tỷ lệ lá thật.

Các mục dưới đây **chưa đạt**. Sửa trong D1/D2 (cùng giai đoạn với phần liên quan), mỗi mục phải có số đo trong `result.md`.

1. **Tên lá bị cắt thành "…" và lá không to lên khi còn chỗ.**
   - Đo ở `/?mock=1` 375×667: **20 nhãn** có `text-overflow: ellipsis` đang bị cắt. Ví dụ ở ghế đối thủ: "N…", "C…", "Li…", "Su…".
     Ở bài tay: "Fluoxet", "Loraze.", "Triệu C", "Liệu Ph". Điều này trái `design.md` mục 4 ("không bị cắt khi còn chỗ") và tiêu chí
     D2 ("mọi Bệnh Lý của mọi đối thủ đều thấy được, kèm tên tiếng Việt").
   - Kích thước lá đang cố định (`mini` 32px, `small` 46px). Ở 390×844, 2 người, giữa Thể Trạng và bài tay **trống khoảng 400px**,
     nhưng lá vẫn nhỏ và tên vẫn bị cắt. Ở 667×375, cột phải cũng trống giữa Thể Trạng và bài tay.
   - Sửa: cỡ lá **co giãn theo chỗ trống** (vd. CSS `clamp()` / tính theo chiều cao còn lại). Tên đủ chữ, cho xuống 2 dòng khi cần.
     Ở ghế đối thủ, nếu thật sự không đủ chỗ cho ảnh thì ưu tiên **tên đầy đủ** hơn ảnh.
2. **Thuốc chưa hiện tác dụng phụ trên bàn chơi**; hiện phải phóng to mới đọc được. Theo `design.md` mục 4:
   - lá Thuốc trên tay có dòng "Tác dụng phụ: …";
   - Thuốc đã dùng trong Thể Trạng (của mình và đối thủ) hiện "mở cửa cho: …".

   Tên Thuốc trong Thể Trạng hiện cũng bị cắt ("Fluox…", "Pram…", "Lith"). Cách xếp Thuốc đổi lại, xem Phần 2 mục B.
3. **Nút "🏠 Thoát" ở thanh trên** bị trùng với "Thoát về trang chủ" trong menu "⋯". Biểu tượng 🏠 cũng nằm ngoài 3 chỗ được dùng
   emoji (đo được trong bàn chơi: 🤖 ⏱ 🏠). Sửa: bỏ nút này, chỉ để Thoát trong menu.
4. **Nhấn giữ không nhất quán.**
   - Người quản lý giả lập chạm cảm ứng thật (CDP `Input.dispatchTouchEvent`, giữ 700ms). Phóng to **luôn mở**, nhưng khi thả tay mà
     ngón tay nằm **ngoài** khung phóng to (lá ở sát mép trái/phải), cú chạm "ảo" sau khi thả rơi vào nền mờ và **đóng ngay**.
   - Bị ở 4/11 lá Bệnh Lý: Suy nghĩ tự tử (Máy 1), Điên loạn (Bình), Trầm cảm (Máy 2), Trầm cảm (của mình). Lá ở giữa thì vẫn mở.
   - Chốt hành vi: sau khi thả tay phóng to **vẫn mở**, chạm ra ngoài hoặc chạm lại mới đóng. Chặn cú click sau nhấn giữ
     (vd. `preventDefault` ở `touchend` khi đã kích hoạt giữ, hoặc bỏ qua click lên nền trong ~300ms đầu).
   - Huỷ hẹn giờ nhấn giữ khi ngón tay di chuyển (`touchmove` > ~10px).
   - Thêm `-webkit-touch-callout: none` (hiện chưa có trong code) để iOS không hiện menu lưu ảnh.
5. **Bộ e2e còn thiếu so với `design.md` mục 8.** Bổ sung trước khi báo xong D2:
   - S0: so `/version` với `git rev-parse HEAD`, khác thì **không đạt** (hiện chỉ kiểm tra 200).
   - S1: vào phòng bằng link (mã điền sẵn); người thứ 5 bị từ chối kèm thông báo tiếng Việt; phòng chờ ở 320×568 và 667×375.
   - S2: mỗi lá bài tay lộ ≥ 24px; mọi Bệnh Lý của mọi đối thủ thấy được **và tên không bị cắt**; số emoji trong bàn ≤ 3 (hiện có
     đếm nhưng không dùng để chấm); cỡ chữ đo cả phần tử có con (hiện chỉ đo phần tử lá).
   - S4: nhấn giữ bằng **chạm cảm ứng thật** (CDP touch, giữ 600ms), không chỉ dùng chuột phải. Thử cả lá ở mép trái/phải màn hình
     (bắt được lỗi mục 4).
   - S13 (socket chịu lỗi): chưa có, thêm vào runner.

---

## Phần 2 — Tiếp tục `design.md` từ D1

**Người dùng đã duyệt bản phác (2026-10-01) với 3 góp ý.** Ưu tiên cao hơn `design.md` nếu lệch nhau (`design.md` đã được cập nhật theo):

- **A. Phóng to chỉ hiện ảnh lá, bỏ chú thích.**
  - Hiện khối chữ (tên, loại, hình phạt…) đè lên che mất lá.
  - Bỏ hẳn khối chữ. `Card size=zoom` chỉ hiện **trọn cả lá** (không cắt viền), to nhất có thể trong màn hình
    (≈ 90% chiều cao hoặc chiều rộng, giữ đúng tỷ lệ ảnh 300×537), ở cả dọc lẫn ngang.
  - Lá Việt hoá đã in đủ thông tin. Ảnh lỗi → khung màu + tên tiếng Việt như cũ.
  - Phần 1 mục 4 (thả tay không được đóng phóng to) vẫn phải sửa.
- **B. Thuốc đã dùng nằm TRÊN lá Bệnh Lý** (đổi so với bản phác, nơi Thuốc nằm dưới).
  - Lá Thuốc đè lên lá Bệnh Lý, lệch xuống để vẫn lộ phần đầu lá Bệnh Lý có tên bệnh. Lá Thuốc thấy rõ tên thuốc.
  - Áp dụng cho Thể Trạng của mình và ghế đối thủ.
  - Nhấn giữ phần lộ của lá nào thì phóng to đúng lá đó (Bệnh Lý hoặc Thuốc).
  - Bệnh đã chữa vẫn phải nhận ra ngay là đã chữa.
- **C. Làm thẳng trên bàn chơi thật, không làm bản phác nữa.**
  - Xoá `MockGameBoard.tsx` và banner/nút dẫn tới bản phác (commit `9c9a085`). Mọi thay đổi giao diện từ D1 làm trên `GameBoard`
    và các component thật.
  - `/?mock=1` chỉ được giữ làm **dữ liệu mẫu** đưa vào chính `GameBoard` thật (action gửi đi bị bỏ qua) để S2 đo được ca 8–12 lá.
    Không còn giao diện riêng.
  - S2/S4/S8 phải đo trên bàn chơi thật: phòng thật 1 người + 1/2/3 máy, cộng `/?mock=1` cho ca nhiều lá.

Làm lần lượt **D1 → D2 → D3 → D4 → D5 → D6** theo `design.md` mục 2 và mục 5, mỗi giai đoạn theo quy trình mục 7:
làm → test local → tự push → chờ `/version` = HEAD → test trên URL thật → ghi `result.md` + 1 dòng `work_progress.md` → sang giai đoạn sau.
- Góp ý A và C làm ngay đầu D1. B thuộc D2.
- Phần 1 mục 1–2 thuộc D1/D2; mục 3–4 thuộc D2; mục 5 làm dần, xong hết trước khi báo D2.
- **Dừng sau D2** để người dùng thử 2 điện thoại thật (`design.md` mục 6). Ghi `result.md` dòng đầu
  `Trạng thái: DỪNG — chờ thử 2 điện thoại sau D2` kèm checklist 5–8 bước.
- Luật không rõ → `DỪNG — cần hỏi`. Không tự đặt luật.
- Push lỗi xác thực → ghi lệnh cho người dùng tự push, chờ người dùng báo rồi mới test trên URL thật. Không ghi đạt khi chưa test URL thật.
