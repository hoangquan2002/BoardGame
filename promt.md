# Prompt cho agent

> File này gồm 2 phần: (1) việc còn tồn từ giai đoạn trước, (2) yêu cầu giai đoạn hiện tại. Làm **cả hai**, Phần 1 trước.
> Kế hoạch chung: [design.md](design.md) (agent chỉ đọc, không sửa). Quy trình mỗi giai đoạn: `design.md` mục 7.
> Prompt này **ưu tiên hơn** `design.md` nếu hai bên lệch nhau.
> **Báo cáo trung thực**: bước nào không thực sự chạy được thì ghi "không kiểm tra được" kèm lý do, **không** ghi ✅.

## Phần 1 — Việc còn tồn (review R1)

Người quản lý đã review commit `4a56b8d` (Render đã deploy đúng commit này).

**Đạt:**
- build/lint/test qua (121/121, lint 0 cảnh báo).
- 18 ảnh lá trùng **từng byte** với ảnh nhúng trong PDF. Người quản lý đã tự băm lại từ PDF, không dùng `--check` của agent.
- Không còn chữ đè lên ảnh, không còn "…", không bẻ đôi từ.
- Ghế đối thủ ở màn ngang hiện đủ. Mock chỉ dùng lá có thật.

**Chưa đạt.** Người quản lý tự đo trên `https://boardgame-02k2.onrender.com/?mock=1` và xem ảnh ván thật của agent
(`gameplay_screenshots/step_15_*.png`, `r1_zoom_390x844.png`):

1. **Lá không lớn thêm khi còn chỗ.**
   - Ở mọi cấu hình, cỡ lá đúng bằng **mức tối thiểu** của bảng R1 (76/72, 96/84, 64/60, 70/66, 124/114), không bao giờ lớn hơn.
   - 390×844, 2 người, 4 lá: dưới bài tay còn trống **~220px** (ván thật `step_15` cũng trống ~210px).
   - 1280×800, 2 người, 4 lá:
     - dưới bài tay trống ~240px;
     - cột trái trống ~600px dưới ghế đối thủ;
     - 4 lá trên tay vẫn xếp chồng dù còn thừa ~650px chiều ngang.
   - S2 ghi "maxGap ≤ 3px" vì chỉ đo khoảng hở **giữa** các khối, không đo khoảng trống **dưới khối cuối**. Sửa:
     - lá lớn dần tới khi hết chỗ;
     - trong S2, khoảng trống dưới khối cuối ≤ 40px và khoảng trống trong mỗi cột (khi màn ngang) ≤ 40px;
     - nếu xếp hàng ngang mà vẫn vừa thì bài tay **không chồng** lên nhau.
2. **Thuốc che nửa dưới tên Bệnh Lý.**
   - Lá Thuốc chỉ lệch xuống 25% chiều cao lá, nên chữ tiêu đề in trên lá Bệnh Lý ("TRẦM CẢM", "CHỨNG RUN") bị cắt ngang thân chữ.
   - Phải lộ **trọn** dòng tiêu đề, khoảng 33–35% chiều cao lá. Tự xem ảnh chụp để xác nhận cho cả 8 Bệnh Lý.
3. **Dòng "Có thể bị đưa: …" của mình biến mất ở màn ngang và máy tính.** Ở 667×375 và 1280×800 chỉ còn chữ "Còn 2 bệnh".
4. **Màn ngang 667×375**: ghế đối thủ chỉ hiện chữ, nhưng cột trái còn trống ~130px. Còn chỗ thì phải hiện ảnh Thể Trạng
   đối thủ.
5. **Đồng hồ lượt là số giả.**
   - Khi không có `deadline`, `GameBoard` hiện cố định "0:42".
   - Khi có, nó lấy `deadline` của Chứng run (7 giây) làm đồng hồ lượt.
   - Server **chưa** có đồng hồ lượt (D4 chưa làm), nên người chơi thật thấy số sai.
   - Sửa: ván thật **ẩn** `turn-timer` cho tới D4; chỉ `/?mock=1` được hiện số mẫu. Đếm ngược Chứng run vẫn ở hộp chọn lá như cũ.
6. **Lá chồng nhau bị trong suốt, nhìn xuyên qua nhau** (`step_15`).
   - `opacity: 0.4` đang đặt cho **từng lá**. Ở bài tay và ở cột Thể Trạng có Thuốc, lá bên dưới lộ xuyên qua lá bên trên:
     "ĐIÊN LOẠN" hiện xuyên qua lá Triệu Chứng, Bệnh Lý hiện xuyên qua lá Thuốc. Hình lá bị biến dạng so với nguồn.
   - Sửa:
     - làm mờ theo **nhóm**: đặt `opacity` lên khung chứa cả nhóm (cả ghế đối thủ, cả cột Bệnh Lý + Thuốc), không đặt lên
       từng lá đang chồng nhau;
     - **không** làm mờ bài tay khi đang chọn lá, vì bài tay không phải mục tiêu.
   - S2 thêm phép đo: không có `<img>` lá nào có `opacity` < 1 nằm chồng lên một lá khác.
7. **Lá che mất nhãn chữ** (`step_15`).
   - Lá đang chọn nhô lên che chữ "Bài trên tay" (chỉ còn "Bài trên").
   - Viền của ô mục tiêu đè lên chữ "Thể Trạng (4 ô)".
   - Sửa: lá nhô lên hay viền trạng thái đều không được che chữ nào. S2 thêm phép đo: tại tâm mỗi phần tử chữ,
     `elementFromPoint` phải trả về chính phần tử chữ đó.
8. **Phóng to còn khung nền thừa** (`r1_zoom_390x844.png`).
   - Lá nằm trong một khung nền xanh đậm cao hơn lá ~90px ở cả trên và dưới.
   - Sửa: khung ôm khít đúng lá, chỉ còn nền tối mờ phủ toàn màn hình.
9. **Báo cáo và git:**
   - `result.md` ghi commit `140eda5`, nhưng commit này **không có** trong lịch sử.
   - Cột URL thật toàn ghi "Chờ push", nghĩa là chưa test trên URL thật. Lần này phải chạy đủ cả hai cột.
   - Bộ ảnh `step_*` chụp ở **localhost** (ảnh phòng chờ hiện link `http://localhost:3000/?room=…`), trong khi prompt R1
     yêu cầu chụp từ URL thật. Lần này chụp từ URL thật, ghi URL đã chụp vào `gameplay_screenshots/README.md`.
   - Còn thay đổi chưa commit trong `mockGameView.ts` (tham số `winner`) và `scripts/record_gameplay.mjs`: commit hoặc bỏ.
     Không để dở.

---

## Phần 2 — Task R2: nút "Luật chơi" cho người mới

Người dùng cần **một nút ở phòng chờ và ở bàn chơi**. Bấm vào thì mở phần giới thiệu luật cho người mới chơi.
Trang chủ cũng thêm nút này, vì người mới vào trang chủ trước.

### A. Nội dung
- **Nguồn duy nhất**: `side-effects-rules.md`, đã đối chiếu rulebook Việt hoá.
  - **Không tự đặt luật.** Chỗ nào không rõ → ghi `DỪNG — cần hỏi`.
  - Không đưa vào: lá Gia Vị (Kháng Thuốc, Chẩn Đoán Sai), luật 6–8 người, mục "Thông tin còn thiếu", bản quyền.
- **Chỉ mô tả những gì app đang làm thật.** Đồng hồ lượt 120 giây, vắng mặt, máy chơi thay, thoát ván… thuộc D4, chưa có
  trên server → **chưa** ghi. Tới D4 thì bổ sung.
- Dùng thuật ngữ in trên lá: Thể Trạng, Bệnh Lý, Thuốc, Triệu Chứng, Liệu Pháp, "Có thể gây ra", kẻ gây hại.
  Không dùng chữ tiếng Anh (Psyche, Disorder…).
- Viết ngắn, câu đơn, dễ hiểu với người chưa chơi bao giờ. Thứ tự các mục:
  1. **Tóm tắt 30 giây** (≤ 6 dòng): mục tiêu, mỗi lượt làm gì, 4 loại lá dùng để làm gì.
  2. **Mục tiêu**: chữa hết Bệnh Lý trong Thể Trạng của mình trước người khác thì thắng ngay.
     Chữa = đặt Thuốc lên, hoặc dùng Liệu Pháp loại bỏ.
  3. **Chuẩn bị**: mỗi người 4 Bệnh Lý khác loại, ngửa trước mặt; 4 lá trên tay; người đi đầu chọn ngẫu nhiên.
  4. **Một lượt**: rút 2 lá → đánh tối đa 2 lá (có thể không đánh) → tay quá 6 lá thì bỏ cho còn 6.
     - Lá đánh ra có tác dụng ngay, không ai chặn được.
     - Chồng rút hết thì xáo chồng bỏ thành chồng rút mới.
  5. **4 loại lá**: mỗi loại có **ảnh lá thật** (dùng component `Card`, nhấn giữ để phóng to như trên bàn) và 2–3 câu giải thích.
     - **Bệnh Lý**: nằm trong Thể Trạng thì là bệnh phải chữa. Trên tay thì dùng để đưa cho người đang "mở cửa" cho bệnh đó.
       Mỗi Thể Trạng chỉ có tối đa 1 lá mỗi loại.
     - **Thuốc**:
       - đặt lên đúng Bệnh Lý nó trị → bệnh đó đã chữa và không bị Triệu Chứng đánh vào nữa;
       - đổi lại, người khác được đưa cho bạn những Bệnh Lý ghi ở dòng "Có thể gây ra" (nếu bạn chưa có bệnh đó, kể cả
         bệnh đã chữa cũng tính là đã có).
     - **Triệu Chứng**: đánh vào 1 Bệnh Lý **chưa chữa** của người khác. Người đó phải chịu hình phạt ghi trên lá Bệnh Lý.
     - **Liệu Pháp**: loại bỏ hẳn 1 Bệnh Lý bất kỳ của mình, kể cả bệnh đã có Thuốc.
       - Ngoại lệ: **Chứng run** không dùng Liệu Pháp được;
       - **Chứng biếng ăn** không có Thuốc, chỉ chữa được bằng Liệu Pháp;
       - bệnh bị loại bỏ có thể bị mắc lại sau này.
  6. **Bảng Thuốc**: tên thuốc → trị bệnh gì → có thể gây ra. Đủ 7 Thuốc.
  7. **Bảng hình phạt**: 8 Bệnh Lý → hình phạt khi bị Triệu Chứng, đúng cách app áp dụng (`side-effects-rules.md` mục 5.3).
     - Ghi rõ: Chứng run có 7 giây để chọn 3 lá bỏ;
     - Lo âu / Nghiện cờ bạc thì kẻ gây hại luôn lấy bài;
     - Trầm cảm / Liệt dương / Chứng biếng ăn cộng dồn theo từng lượt bị đánh.
  8. **Đổi bài**: đổi được với người khác kể cả ngoài lượt mình. Thoả thuận không bắt buộc phải giữ.
  9. **Thao tác trên app**:
     - chạm lá để chọn, rồi chạm mục tiêu đang sáng;
     - nhấn giữ lá để xem to;
     - nút **Kết thúc lượt**;
     - menu ⋯ có Đổi bài, Nhật ký, Thoát.
- **Bảng 6 và 7 lấy từ dữ liệu** (`cards.json` / `getCardInfoVi`), không gõ tay, để không lệch với engine. Mỗi dòng có ảnh nhỏ
  của lá tương ứng.
- Thêm unit test:
  - nội dung luật có đủ 8 Bệnh Lý, 7 Thuốc, đúng tác dụng phụ theo `cards.json`;
  - không có chữ "Kháng Thuốc", "Chẩn Đoán Sai", "Psyche", "Disorder".

### B. Nút và cách mở
- **Trang chủ** và **phòng chờ**:
  - nút chữ "Luật chơi", thấy được ngay, không cần cuộn, ở cả 320×568 và 667×375;
  - không thêm emoji mới.
- **Bàn chơi**:
  - thanh trên có nút tròn nhỏ chữ "?" (là ký tự thường, không phải emoji), `aria-label="Luật chơi"`;
  - menu ⋯ cũng có mục "Luật chơi";
  - không làm lệch nút Kết thúc lượt; số loại emoji trong bàn chơi vẫn ≤ 3.
- **Người mới**: nút ở phòng chờ có dấu nhấn nhẹ (chấm màu) cho tới khi người dùng mở luật lần đầu (lưu `localStorage`).
  **Không** tự bật hộp luật.
- **Cách hiển thị**: một tấm phủ gần toàn màn hình (trên điện thoại là toàn màn hình), dùng chung một component cho cả 3 chỗ.
  - Có mục lục ở đầu (các nút nhảy tới từng mục) và nút đóng luôn nhìn thấy. Đóng được bằng nút đóng, phím Esc và nút
    Back của điện thoại (dùng `history`, không rời trang).
  - **Chỉ cuộn bên trong** tấm phủ; trang phía sau không cuộn, không tràn ngang.
  - Bảng không được tràn ngang ở 320px. Màn hẹp thì đổi bảng thành danh sách thẻ.
  - Chữ thân ≥ 14px, nhỏ nhất 12px. Cùng màu và font với giao diện R1.
- **Mở luật giữa ván không được ảnh hưởng ván chơi**: vẫn kết nối socket; lá đang chọn vẫn được chọn sau khi đóng.
  - Nếu tới lượt mình trong lúc đang mở, đầu tấm phủ hiện dòng "Đến lượt bạn" (không tự đóng).
  - Hộp chọn lá bắt buộc (Lo âu, Chứng run) phải hiện **trên** tấm luật, để không lỡ 7 giây của Chứng run.
- `data-testid`: `rules-button` (trang chủ, phòng chờ, thanh trên bàn chơi), `rules-menu-item`, `rules-sheet`, `rules-close`.

### C. Test
- **S15 🌐 (mới, thêm vào runner)** ở 320×568, 375×667, 667×375, 1280×800:
  - mở luật từ trang chủ, phòng chờ, và bàn chơi (cả nút "?" lẫn mục trong menu ⋯; bàn chơi đo trên `/?mock=1` và phòng thật
    1 người + 1 máy);
  - `rules-sheet` hiện; trang không tràn: `scrollWidth ≤ innerWidth`;
  - tấm luật cuộn được bên trong; có đủ tên 8 Bệnh Lý và 7 Thuốc; mọi `<img>` có `naturalWidth > 0`;
  - cỡ chữ nhỏ nhất ≥ 12px;
  - đóng bằng nút đóng, bằng Esc, bằng `page.goBack()` → về đúng màn trước, không rời phòng;
  - ở phòng thật: chọn 1 lá → mở luật → đóng → lá vẫn được chọn, không hiện "mất kết nối";
  - chấm "người mới" có ở lần đầu, mất sau khi mở luật, F5 vẫn mất.
- **Chạy lại** S0, S1, S2, S3, S4, S8, S13 trên local và URL thật.
  - S2 đo thêm khoảng trống dưới cùng (Phần 1 mục 1).
  - Ván thật không còn `turn-timer` (Phần 1 mục 5).
- **Ảnh chụp** vào `gameplay_screenshots/`, chụp từ URL thật, `deviceScaleFactor: 2`:
  - `r2_rules_<chỗ mở>_<w>x<h>.png` cho trang chủ, phòng chờ, bàn chơi, ở 375×667 và 667×375;
  - chụp lại bộ `r1_*` sau khi sửa Phần 1;
  - tự xem lại từng ảnh trước khi báo.

### D. Quy trình và điểm dừng
- Commit từng bước nhỏ, message tiếng Việt có dấu hoặc tiếng Anh. Mỗi lần push, `result.md` phải ghi đúng hash có trong
  `git log`.
- `pnpm build` / `pnpm lint` (0 lỗi, 0 cảnh báo) / `pnpm test` đều qua.
- Chạy e2e local → `git push origin main` → chờ `/version` trả về đúng `git rev-parse HEAD` → chạy e2e 🌐 trên URL thật → chụp ảnh.
- Push lỗi xác thực → ghi lệnh vào `result.md` cho người dùng tự push rồi **dừng**. Chưa test trên URL thật thì không ghi đạt.
- `result.md`:
  - dòng đầu: `Trạng thái: DỪNG — chờ duyệt R2 | Commit: <hash> | Deploy: <commit trên /version>`;
  - bảng S0, S1, S2, S3, S4, S8, S13, S15, mỗi kịch bản 2 cột Local / URL thật, kèm số đo thật;
  - với S2, ghi cỡ lá **lớn nhất** đạt được và khoảng trống dưới cùng theo từng màn hình;
  - danh sách ảnh chụp.
- Thêm 1 dòng vào `work_progress.md`.
- **Dừng sau R2.** Chưa làm D3 cho tới khi người dùng báo tiếp.
