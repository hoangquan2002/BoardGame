# Prompt cho agent

> File này chỉ chứa: (1) việc còn tồn từ giai đoạn trước, (2) yêu cầu giai đoạn hiện tại. Làm **cả hai** phần, Phần 1 trước.
> Kế hoạch chung: [design.md](design.md) (agent chỉ đọc, không sửa). Quy trình mỗi giai đoạn: `design.md` mục 7.
> Prompt này **ưu tiên hơn** `design.md` nếu lệch nhau.
> **Trung thực trong báo cáo**: bước nào không thực sự chạy được thì ghi "không kiểm tra được" + lý do, **không** ghi ✅.
> Lần trước `result.md` ghi S2 đạt 17/17, nhưng ảnh chụp thật cho thấy tên vẫn bị cắt, lá vẫn tí hon, ghế đối thủ bị mất nửa.
> Lần này người quản lý sẽ tự xem ảnh chụp và tự đo lại.

## Phần 1 — Việc còn tồn (review D1 + D2)

Người quản lý đã review commit `0c2f6aa` (Render đã deploy đúng commit này) và `4cf5d80` (chưa push).
- **Đạt**: build/lint/test 118/118; bỏ nút 🏠; xoá `MockGameBoard`; phóng to không còn khối chữ; nhấn giữ lá sát mép không tự
  đóng; server chịu được socket sai định dạng / sai quyền / người thứ 5 (người quản lý tự dò trên URL thật).
- **Chưa đạt.** Đo bằng Chrome trên `https://boardgame-02k2.onrender.com/?mock=1` và xem ảnh trong `gameplay_screenshots/`:

1. **Ảnh lá bị cắt và giảm chất lượng so với nguồn.**
   - Trong PDF, mỗi ô lưới là **1 ảnh JPEG nhúng 520×864** (trang 20, mặt sau: 496×822); cả 6 ô dùng chung 1 ảnh.
   - Script hiện render cả trang ở 150 DPI, cắt theo hộp cố định, thu về 300×537 rồi nén WebP. Hậu quả:
     - mất viền ngoài của lá (vd. Lorazepam mất khung màu xanh vàng, Suy nghĩ tự tử mất mép trái/phải);
     - ảnh nhỏ hơn gốc nên phóng to bị mờ;
     - sai tỷ lệ: gốc là 520:864 ≈ 0,602, không phải 300:537 ≈ 0,559.
2. **Ảnh bị cắt khi hiển thị**: mọi `<img>` lá đang dùng `object-fit: cover`.
3. **Chữ đè lên ảnh lá**, che mất hình:
   - dải "TDP: …" màu đỏ trên lá Thuốc ở bài tay;
   - khối "Mở cửa: Suy nghĩ tự tử, Trầm cảm, Điên loạn" rất to, đè lên cả tiêu đề Thể Trạng;
   - huy hiệu "Đã chữa";
   - dải tên ở đáy mọi lá.
4. **Lá vẫn tí hon, màn hình vẫn trống.** Đo cỡ ảnh lá (CSS px):
   - 390×844, 4 người, 12 lá: bài tay 48×74, đối thủ 34×54;
   - 1280×800: bài tay 56×88, Thể Trạng ~108×180. Giữa Thể Trạng và bài tay trống ~500px;
   - ảnh `step_15`: 390×844, 2 người, trống ~400px ở hai chỗ.
5. **Tên vẫn bị cắt hoặc bẻ giữa chữ**:
   - còn "…": "Suy ng…", "Chlor pro…", "Liệt dư…", "Chứng biếng…";
   - bẻ đôi một từ: "Loraze / pam", "Silde / nafil", "Fluoxetin / e", "Lithi / um", "Pramipe / xole".
6. **667×375, 4 người**: ghế Máy 2 bị cắt mất nửa dưới, không thấy Bệnh Lý, nhưng S2 vẫn báo đạt.
7. **Nhãn "Chữa bệnh" trên ô mục tiêu** (ảnh `step_08`) tràn ra ngoài mép trái màn hình. `design.md` mục 4 cũng cấm kiểu nhãn này.
8. **Dữ liệu mẫu `/?mock=1` dùng lá không có thật**: `insomnia`, `zolpidem` (bàn hiện mặt sau kèm chữ "zolpidem").
9. **Khung lồng khung**: ghế đối thủ có viền ngoài, bên trong lại có thêm một khung viền. Trái `design.md` mục 4.
10. **S13 không đúng `design.md` mục 8**: hiện chỉ thử F5. Phải gửi sự kiện sai định dạng, không có ack, sai quyền và kiểm tra
    server vẫn sống.
11. **Báo cáo**:
    - `result.md` ghi S0 "`/version` khớp HEAD" trong khi chưa push;
    - không có cột kết quả trên URL thật;
    - `pnpm lint` còn 1 cảnh báo (`playedCard` trong `scripts/record_gameplay.mjs`).

Mục 1–9 sửa trong Phần 2. Mục 10–11 sửa trước khi báo xong.

---

## Phần 2 — Task R1: làm lại giao diện bàn chơi (đẹp, lá rõ, lá đúng nguồn)

Người dùng xem ảnh `gameplay_screenshots/` và yêu cầu: **giao diện đẹp mắt hơn; lá bài nhìn rõ ràng và không khác với nguồn đã
cung cấp** (`assets/card-photos/Side effects.pdf`).

R1 thay phần bố cục của D2. Làm trên `GameBoard` thật. `/?mock=1` vẫn chỉ là dữ liệu mẫu đưa vào `GameBoard`. Chưa làm D3.

### A. Ảnh lá = đúng nguồn (bất biến)
1. Viết lại `scripts/extract-cards.py`:
   - với mỗi trang trong bảng `trang → id`, lấy `xref = page.get_images()[0][0]` rồi `doc.extract_image(xref)`;
   - ghi **nguyên byte** ra `packages/client/public/cards/<id>.jpg`;
   - **không** render trang, không cắt, không đổi cỡ, không nén lại, không đổi định dạng;
   - giữ bảng `trang → id` hiện có (đã duyệt), bỏ qua Gia Vị (trang 3, 4);
   - xoá các file `.webp` cũ và sửa mọi chỗ tham chiếu.
2. Script ghi thêm `packages/client/public/cards/manifest.json`, mỗi lá có `{ file, page, width, height, sha256 }`.
   - Thêm chế độ `--check`: băm lại ảnh nhúng trong PDF, so với file đã xuất, khác thì báo lỗi. Người quản lý sẽ chạy lệnh này.
3. Unit test (vitest, không cần Python):
   - mọi `cardId` (trừ Gia Vị) có mục trong `manifest.json`;
   - file tồn tại và `sha256` của file trùng với manifest.
4. Dấu ✦ nhỏ ở góc lá là một phần của ảnh nguồn: **giữ nguyên**.
5. Tổng ảnh khoảng 1,6MB nên vẫn **không** đưa vào precache; giữ CacheFirst lúc chạy.

### B. Luật hiển thị ảnh lá (mọi cỡ, mọi chỗ, kể cả phóng to)
1. Hiện **trọn** lá: `object-fit: contain`, khung theo đúng tỷ lệ gốc trong manifest (`aspect-ratio: 520 / 864`), lệch ≤ 1%.
2. **Không có gì đè lên vùng ảnh**: chữ, dải màu, huy hiệu, gradient, biểu tượng đều không được. Ngoại lệ duy nhất là lá đè lá:
   Thuốc nằm trên Bệnh Lý trong Thể Trạng, các lá bài tay xếp so le.
3. Không `filter`, không `mix-blend-mode`, không lớp màu phủ lên ảnh. Trạng thái chỉ được thể hiện bằng:
   - `outline` / `box-shadow` **bên ngoài** lá;
   - nhô lên (`translateY`);
   - `opacity: 0.4` cho thứ **không** phải mục tiêu (`design.md` mục 4).
4. Bo góc ≤ 4px. Ảnh lỗi → khung màu + tên tiếng Việt (như cũ).
5. Phóng to:
   - nền tối, lá to nhất có thể (≈ 90% chiều cao hoặc chiều rộng);
   - **không** viền đỏ quanh lá;
   - nút đóng nhỏ đặt ở góc **màn hình**, không dính vào lá;
   - giữ nguyên hành vi nhấn giữ đã sửa.

### C. Chữ đi kèm lá: đặt bên ngoài lá, đủ chữ
- **Không** có `…`, không `-webkit-line-clamp` đang cắt chữ, không bẻ đôi một từ.
- Cấm `overflow-wrap: anywhere` và `word-break: break-all` trên chữ tên.
- Không đủ chỗ thì **bỏ hẳn nhãn đó** (thông tin đã có ở dòng khác hoặc khi phóng to), không cắt.
- Chữ nhỏ nhất 11px; các dòng thông tin dưới đây ≥ 12px.
- **Dải thông tin lá đang chọn**: 1–2 dòng, nằm ngay trên bài tay. Thay cho dải "TDP" trên từng lá.
  - Thuốc: "**Lorazepam** — trị Lo âu · Tác dụng phụ: Suy nghĩ tự tử, Trầm cảm, Điên loạn"
  - Bệnh Lý: "**Trầm cảm** — đưa cho người đang mở cửa cho bệnh này"
  - Triệu Chứng / Liệu Pháp: tên đầy đủ + tác dụng ngắn (lấy từ `getCardInfoVi`)
  - Chưa chọn lá: chữ mờ "Chạm để chọn · giữ để xem to"
- **Thể Trạng của mình**: 1 dòng bên dưới, vd. "Còn 2 bệnh · Có thể bị đưa: Suy nghĩ tự tử, Trầm cảm, Điên loạn". Dòng này
  thay cho khối "Mở cửa" đè lên lá.
- **Ghế đối thủ**: hiện tên, 🤖 nếu là máy, số lá, "Còn N bệnh".
  - Thêm 1 dòng liệt kê **đủ tên** Bệnh Lý chưa chữa, và dòng "Có thể bị đưa: …" nếu có.
  - Không đủ chỗ cho ảnh (vd. 375×667, 4 người) → chỉ hiện chữ (chấm màu + tên). Giữ chữ đó → phóng to lá tương ứng.
- **Bỏ nhãn chữ trên mục tiêu** ("Chữa bệnh"…). Mục tiêu chỉ được nhấn bằng outline, mọi thứ khác mờ đi.

### D. Thể Trạng bậc thang (giữ góp ý B của người dùng)
- Thuốc nằm **trên** Bệnh Lý, lệch xuống khoảng 25–30% chiều cao lá để lộ dải tiêu đề tên bệnh in trên lá Bệnh Lý.
- Bệnh đã chữa phải nhận ra ngay. Dấu hiệu đặt **ngoài** ảnh, vd. vạch / chữ "Đã chữa" màu xanh ngay dưới cột.
- Nhấn giữ phần lộ của lá nào thì phóng to đúng lá đó.

### E. Cỡ lá: to nhất có thể, không chừa khoảng trống thừa
Bề rộng **ảnh lá đã hiển thị** (CSS px) không được nhỏ hơn bảng dưới, ở mọi số người 2/3/4 và mọi số lá 4/8/12:

| Màn hình | Bài tay | Thể Trạng của mình | Đối thủ (khi có ảnh) |
|---|---|---|---|
| 375×667 | ≥ 76 | ≥ 72 | ≥ 34, hoặc chỉ chữ |
| 390×844 | ≥ 96 | ≥ 84 | ≥ 44 |
| 667×375 | ≥ 64 | ≥ 60 | ≥ 34, hoặc chỉ chữ |
| 844×390 | ≥ 70 | ≥ 66 | ≥ 36 |
| 1280×800 | ≥ 120 | ≥ 110 | ≥ 64 |

- Còn chỗ thì lá **phải lớn thêm**. Khoảng trống dọc lớn nhất giữa 2 khối liền nhau ≤ 40px. Các khối gồm: thanh trên, đối thủ,
  giữa bàn, Thể Trạng, dải thông tin, bài tay.
- Bài tay: mỗi lá lộ ≥ 24px, lá đang chọn lộ hết. Nút Kết thúc lượt không được nằm chung hàng bài tay nếu làm lá lộ < 24px.
- Giữ các tiêu chí cũ của D2: không cuộn trang, mọi lá tay và nút Kết thúc lượt nằm trọn trong màn hình, mọi Bệnh Lý của mọi
  đối thủ thấy được (ảnh hoặc chữ) và đủ tên.
- Ngang: 2 cột như `design.md`, mọi ghế đối thủ hiện **đủ**, không bị cắt (lỗi Phần 1 mục 6).
- Máy tính (≥ 1024px): bàn tối đa ~1200px, căn giữa.

### F. Phong cách: đẹp và gọn
- **Nền bàn**: nỉ xanh đậm (gợi ý `#0f2a24` → `#0b1f1a`, gradient rất nhẹ) để lá màu kem nổi bật. Dưới mỗi lá có bóng đổ nhẹ
  như lá thật trên bàn (vd. `0 2px 6px rgba(0,0,0,.45)`).
- **Không khung lồng khung**: ghế đối thủ tách nhau bằng khoảng cách hoặc nền sáng hơn 1 bậc. Border chỉ dùng cho trạng thái
  (`design.md` mục 4).
- **Chữ**: 1 họ font hệ thống, 3 cỡ chính 12 / 14 / 16px.
  - Bỏ tiêu đề viết hoa to kiểu "THỂ TRẠNG CỦA BẠN (4 BỆNH LÝ)", thay bằng nhãn nhỏ màu mờ.
  - Bỏ dòng hướng dẫn bị xuống dòng lộn xộn cạnh "BÀI TRÊN TAY".
- **Trạng thái**:
  - Ghế đang đến lượt: viền / ánh sáng màu nhấn.
  - Lá đang chọn: nhô lên ~12px + outline.
  - Mục tiêu hợp lệ: outline, mọi thứ khác `opacity: 0.4`.
- **Nút Kết thúc lượt**: luôn cùng chỗ, nổi bật, không che bài.
- **Đồng bộ màu và font** cho trang chủ, phòng chờ, màn kết thúc. Không cần làm lại bố cục các trang này.
- Không thêm thư viện. Emoji trong bàn chơi vẫn ≤ 3 loại (🤖 ⏱ ⋯).

### G. Dữ liệu mẫu
- `/?mock=1` chỉ dùng `cardId` có thật trong `cards.json`. Thêm unit test kiểm tra điều này.
- Dữ liệu mẫu phải có:
  - Thuốc đã dùng trên Bệnh Lý (của mình và đối thủ);
  - 1 đối thủ mất kết nối, 1 đối thủ là máy;
  - bài tay có đủ 4 loại lá;
  - tên Bệnh Lý dài nhất (Suy nghĩ tự tử, Nghiện cờ bạc) và tên Thuốc dài nhất (Chlorpromazine, Pramipexole).

### H. Test và ảnh chụp
1. **S2** (local + URL thật). Đo trên 5 màn hình: 375×667, 390×844, 667×375, 844×390, 1280×800; × 2/3/4 người; × 4/8/12 lá.
   Ngoài tiêu chí cũ, thêm:
   - **Ảnh**: mọi ảnh lá có `object-fit: contain`, tỷ lệ hiển thị lệch tỷ lệ gốc ≤ 1%, `naturalWidth` = `width` trong manifest.
   - **Không đè**: lấy lưới 5×5 điểm trên phần **thấy được** của mỗi ảnh lá. Tại mỗi điểm, `elementFromPoint` phải trả về ảnh lá
     (của lá đó hoặc lá khác đè lên), không được là chữ / huy hiệu / nhãn.
   - **Cỡ lá**: bề rộng ảnh ≥ bảng mục E; khoảng trống dọc lớn nhất ≤ 40px.
   - **Chữ**:
     - không phần tử nào đang bị cắt (`scrollWidth > clientWidth` hoặc `scrollHeight > clientHeight` khi `overflow` là
       hidden/clip);
     - không từ nào bị bẻ sang 2 dòng: tạo `Range` cho từng từ, `getClientRects().length` phải = 1;
     - cỡ chữ ≥ 11px.
   - **Đối thủ**: mọi ghế nằm trọn trong màn hình.
   - Ngoài `/?mock=1`, đo thêm trên phòng thật 1 người + 1 máy và 1 người + 3 máy.
2. **S3**: mọi `<img>` lá có `naturalWidth > 0`; không còn `.webp` lá cũ; không còn chữ tiếng Anh ngoài tên thuốc / tên người.
3. **S4** và **S8**: giữ như cũ, chạy lại.
4. **S13**: làm đúng `design.md` mục 8 (Phần 1 mục 10).
5. **Ảnh chụp cho người dùng xem**, lưu vào `gameplay_screenshots/` (đã `.gitignore`), chụp từ **URL thật** sau khi deploy, `deviceScaleFactor: 2`:
   - `r1_<w>x<h>_p4_h8.png` cho cả 5 màn hình (`turn=me`, đang chọn 1 lá Thuốc, có mục tiêu sáng);
   - `r1_375x667_p4_h12.png` và `r1_390x844_p2_h4.png`;
   - `r1_zoom_390x844.png` và `r1_zoom_844x390.png`;
   - chạy lại `scripts/record_gameplay.mjs` (sửa cảnh báo lint) để tạo lại bộ `step_*.png` của ván thật;
   - cập nhật `gameplay_screenshots/README.md`.
6. Tự xem lại từng ảnh trước khi báo. Ảnh nào còn lá bị che, tên bị cắt hoặc khoảng trống lớn thì sửa tiếp, không báo xong.

### I. Quy trình và điểm dừng
- Commit từng bước nhỏ (tiếng Việt có dấu hoặc tiếng Anh).
- `pnpm build` / `pnpm lint` (0 lỗi, 0 cảnh báo) / `pnpm test` đều qua.
- Chạy e2e local → `git push origin main` → chờ `/version` = `git rev-parse HEAD` → chạy e2e 🌐 trên URL thật → chụp ảnh.
- Push lỗi xác thực → ghi lệnh cho người dùng tự push, **dừng**. Chưa test URL thật thì không ghi đạt.
- `result.md`:
  - dòng đầu: `Trạng thái: DỪNG — chờ duyệt giao diện R1 | Commit: <hash> | Deploy: <commit trên /version>`;
  - bảng S0, S1, S2, S3, S4, S8, S13 có 2 cột Local / URL thật kèm số đo thật. Với S2, ghi cỡ ảnh lá nhỏ nhất theo từng màn hình;
  - danh sách ảnh chụp;
  - checklist 6–8 bước để người dùng thử trên 2 điện thoại thật (`design.md` mục 6).
- Thêm 1 dòng vào `work_progress.md`.
- **Dừng sau R1.** Chưa làm D3 cho tới khi người dùng duyệt ảnh và thử trên điện thoại.
