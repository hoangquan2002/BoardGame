# Ghi chú đối chiếu dữ liệu lá bài (cards-todo.md)

Tài liệu ghi lại các điểm lệch giữa bản Việt hoá và bản tiếng Anh, lỗi in ấn trên bản quét, và các câu hỏi luật về hình phạt cần lưu ý khi xây dựng Engine ở Task T2.

---

## 1. Chữ mờ / không đọc được
- **Không có**: Tất cả 20 trang bản Việt hoá và 22 trang bản Print & Play tiếng Anh đều có độ phân giải đủ cao, chữ in và hình vẽ rõ ràng 100%.

---

## 2. Điểm lệch giữa bản Việt hoá và bản tiếng Anh (VI vs. EN)

1. **Số lượng lá bài Gia Vị (Spice cards)**:
   - *Tham khảo tài liệu luật*: Rulebook và các nguồn tham khảo (BGG, Amazon) ghi số lượng lá Gia Vị là **3 Kháng Thuốc (High Tolerance)** và **3 Chuẩn Đoán Sai (Misdiagnosis)** (tổng bộ bài 95 lá).
   - *Bản in thực tế Print & Play (`SideEffectsPNP-EN.pdf`)*: In chính xác **5 lá Kháng Thuốc** và **5 lá Chuẩn Đoán Sai** (tổng bộ bài gồm 99 lá).
   - *Quyết định*: Dữ liệu trong `cards.json` được ghi nhận theo số lượng thực tế đếm được trong file PDF (`highTolerance: 5`, `misdiagnosis: 5`).

2. **Chính tả tiếng Việt**:
   - Lá bài tiếng Việt in tựa đề: **"Chuẩn đoán sai"**. Trong từ điển và tiếng Việt chuẩn y khoa là **"Chẩn đoán sai"**. Bộ dữ liệu giữ nguyên văn text trên lá bài theo nguyên tắc không tự ý sửa đổi văn bản gốc.

3. **Tên thuốc trên hình vẽ bản tiếng Anh**:
   - Viên thuốc Lorazepam: trên đồ hoạ viên thuốc in là `"LORAZAPAM"`.
   - Viên thuốc Sildenafil: trên đồ hoạ viên thuốc in là `"SILDAFINIL"`.
   - Cả hai đều là tên biến thể/cách viết của nhà sản xuất game, trong dữ liệu `id` chuẩn dùng `lorazepam` và `sildenafil`.

---

## 3. Các quyết định luật về hình phạt (Đã chốt ở Task T2 theo side-effects-rules.md 5.3)

1. **Hình phạt Chứng run (Tremors) — Cơ chế đếm thời gian**:
   - *Nguyên văn trên lá*: "Bỏ 3 lá bài trong 3 giây, hoặc mất toàn bộ bài trên tay".
   - *Đã chốt*: Trên web cho nạn nhân **7 giây** (cấu hình qua option `tremorsTimeoutSeconds`, mặc định 7) để chọn đúng 3 lá bỏ; nếu hết giờ (`CHOICE_TIMEOUT`) mà chưa gửi đủ 3 lá thì mất toàn bộ bài trên tay vào discard pile. Nếu nạn nhân có ≤ 3 lá trên tay thì tự động bỏ hết ngay lập tức, không tạo `pendingChoice`.

2. **Quyền "Có thể" (May) của Kẻ gây hại**:
   - *Đã chốt*: Chốt là **LUÔN LẤY**, không được từ chối.
   - *Lo âu (`anxiety`)*: Kẻ gây hại (chỉ người này) thấy bài trên tay nạn nhân, **bắt buộc** chọn 1 lá lấy về tay mình qua `pendingChoice` (nếu tay nạn nhân rỗng thì bỏ qua, không tạo choice).
   - *Nghiện cờ bạc (`gambling-addiction`)*: **Tự động**, kẻ gây hại lấy ngẫu nhiên `min(3, số lá)` từ tay nạn nhân bằng `Rng`, không tạo `pendingChoice`.

3. **Thời điểm bắt đầu hiệu lực & Luật cộng dồn hình phạt kéo dài 1 vòng (1 round)**:
   - *Trầm cảm (`depression`)*: Mất nguyên lượt kế tiếp (không rút, không đánh, không bỏ bài; chuyển lượt ngay).
   - *Liệt dương (`impotence`)*: Ở lượt tiếp theo, nạn nhân vẫn rút 2 lá nhưng bị khoá không được đánh bài.
   - *Chứng biếng ăn (`anorexia`)*: Ở lượt tiếp theo, nạn nhân không được rút bài đầu lượt nhưng vẫn được đánh bài bình thường.
   - *Luật cộng dồn*: Bị gây hại trong **cùng một lượt của kẻ gây hại** → tối đa +1 lượt cho mỗi loại hình phạt trên mỗi nạn nhân; bị gây hại ở **các lượt khác nhau của kẻ gây hại** → cộng dồn thêm (+1 cho mỗi lần bị gây hại ở lượt khác).
