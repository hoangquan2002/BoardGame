Trạng thái: HOÀN THÀNH — Đã triển khai giao diện Mèo Nổ theo bản thiết kế duyệt & Phiên dịch toàn bộ 56 lá bài

# Báo cáo Nghiệm thu: Triển khai Giao diện Mèo Nổ (Exploding Kittens) Dark Casino & Phiên dịch Mô tả Lá Bài

> **Dự án**: Web Mobile-First Board Game Platform  
> **Nhiệm vụ**: Triển khai thiết kế đã duyệt (`scratch/ek-ui-mockup/index.html`) vào React components và hoàn thiện bản dịch tự nhiên cho 56 lá bài trong `packages/games/exploding-kittens/src/data/cards.json`.  
>
> **Kết quả kiểm tra tự động**:
> - `pnpm build`: **✅ 0 lỗi (5/5 workspace projects hoàn tất)**
> - `pnpm lint`: **✅ 0 lỗi, 0 cảnh báo (typecheck + ESLint pass 100%)**
> - `pnpm test`: **✅ 171/171 unit & simulation tests pass (100% trên 24 test files)**
> - Không cuộn trang (`scrollWidth <= innerWidth` và `scrollHeight <= innerHeight`): **✅ 100% ĐẠT trên cả 4 kích thước (375×667, 390×844, 844×390, 1280×800)**
> - Bộ ảnh đối chứng: **✅ Đã chụp và lưu 10 ảnh chất lượng cao vào `gameplay_screenshots/exploding_kitten/`**

---

## 1. Tóm Tắt Công Việc Thực Hiện

### 1.1. Phần 1 — Phiên dịch mô tả & chuẩn hóa dữ liệu 56 lá bài (`cards.json`)
- **Giữ nguyên 100% tên tiếng Anh gốc** (`name_en`: *Exploding Kitten, Defuse, Nope, Attack 2x, Skip, Favor, Shuffle, See the Future 3x, Tacocat, Cattermelon, Hairy Potato Cat, Beard Cat, Rainbow-Ralphing Cat*) và file ảnh gốc (`image_file`, `image_url`).
- **Phiên dịch tự nhiên, hài hước, sát nghĩa** toàn bộ 56 lá bài cho trường `variant_subtitle_vi` tương ứng từng tranh minh họa độc bản (ví dụ: *"Đánh thức khủng long gấu bay Bear-O-Dactyl"*, *"Đánh lạc hướng mèo bằng bút tia laser"*, *"Thỉnh giáo Pháp sư Dê Thông Thái"*, *"Tên đọc xuôi ngược đều giống nhau (I Am a Palindrome)"*, v.v. — loại bỏ hoàn toàn cách đánh số khô khan *"Bản sao #1"*).
- **Chuẩn hóa công dụng luật chơi (`description_vi`)**: Rõ ràng, súc tích, bổ sung đầy đủ hướng dẫn ghép Combo 2, 3, 5 lá cho các lá bài mèo và lá hành động.
- Sửa chuẩn tên tiếng Việt trong `deck.ts` cho `CAT_BEARD`: `'Mèo Râu Quai Nón'`.
- Nâng cấp `nopeWindow` trong `player-view.ts` và `types.ts`: Bổ sung `actionNameVi`, `targetCard`, `comboType` giúp Cửa sổ Nope hiển thị đích danh tên lá bài / hành động đang bị phản ứng thay vì mã kỹ thuật thô.

### 1.2. Phần 2 — Chuyển đổi mã HTML/CSS mẫu vào React Components
- **CSS Dark Casino (`packages/client/src/index.css`)**:
  - Bổ sung toàn bộ hệ thống token, layout và hiệu ứng từ `scratch/ek-ui-mockup/index.html`: `.btn-danger`, `.ek-table`, `.top-bar`, `.opponents-row`, `.center-stage`, `.piles-container`, `.draw-stack-3d`, `.deck-count-pill`, `.discard-count-badge`, `.risk-badge`, `.event-banner`, `.nope-window-banner`, `.selection-info-bar`, `.hand-fan`, `.hand-card`, `.select-order-badge`, và các modal overlays.
  - Đồng bộ chuẩn responsive: `100dvh` không cuộn trang; màn dọc 5 khu vực; màn ngang & máy tính chia 2 cột (`41% 1fr`).
- **Thẻ bài nguyên bản (`Card.tsx`)**:
  - Hiển thị **trọn vẹn hình ảnh gốc** (`objectFit: 'contain'`), **loại bỏ 100% khung chữ và nút 🔍 đè lên ảnh lá bài**.
  - Huy hiệu số thứ tự chọn lá bài (`select-order-badge`) đặt tại góc trên bên trái (`top: -9px; left: 6px`) để không bao giờ bị lá bài kế tiếp che khuất khi xếp so le.
  - Hỗ trợ nhấn giữ cảm ứng (`>= 400ms`) hoặc chuột phải (`contextmenu`) để phóng to chi tiết.
- **Bàn chơi chính (`GameBoard.tsx`)**:
  - Không cuộn trang ở mọi kích thước màn hình (`overflow: hidden`).
  - Thanh trên cùng 38px/46px với trạng thái lượt, đếm ngược `⏱`, nút âm thanh, luật chơi, menu phòng.
  - Hàng ghế đối thủ gọn gàng, hiển thị tên sạch (icon `🤖` cho máy), trạng thái kết nối, huy hiệu số lá bài hoặc nhãn đỏ `💥 Đã nổ tung`.
  - Trung tâm bàn chơi: Chồng rút 3D viền đỏ thau + huy hiệu nguy cơ nổ bom `%`; Chồng bài bỏ hiển thị lá trên cùng + huy hiệu đếm số lá + nút "Xem bài bỏ".
  - Dải thông báo sự kiện thay thế toàn bộ mã ID kỹ thuật (`p_...`, `bot-1`) bằng tên hiển thị tiếng Việt của người chơi.
  - Dải thông tin chọn bài: Hiển thị tên tiếng Anh + phụ đề tranh + mô tả công dụng tiếng Việt; khi chọn Combo 2, 3, 5 lá hợp lệ thì hiển thị tên bộ Combo và công dụng tương ứng.
  - Cụm 2 nút thao tác lớn: Đánh bài/Combo (`.btn-gold`) và Rút bài (`.btn-emerald`).
- **Các hộp thoại chuyên dụng (Modals)**:
  - `NopeBanner.tsx`: Biểu ngữ đỏ cam phát sáng, đếm ngược 5 giây kèm thanh tiến trình gradient, nút "🚫 Đánh NOPE!" và "Bỏ qua".
  - `DefuseModal.tsx`: Minh họa cặp bài Mèo Nổ ➜ Gỡ Bom, thanh trượt chọn vị trí nhét bom bí mật `0..maxIndex`, 4 nút preset (Trên cùng, Vị trí #2, Ở giữa, Dưới đáy).
  - `SeeFutureModal.tsx`: Lưới 3 cột hiển thị thứ tự 3 lá trên cùng, cảnh báo đỏ viền rực khi có lá Mèo Nổ.
  - `ComboModals.tsx`:
    - `Combo3TargetModal`: Bước 1 chọn đối thủ mục tiêu; Bước 2 lưới 3×4 hiển thị 12 loại bài kèm ảnh thumbnail minh họa `38×53px`.
    - `TargetPlayerModal`, `FavorGiveModal`, `FiveDiffPickModal`: Đồng bộ phong cách `.casino-glass`.
  - `CardZoomModal.tsx`: Nửa trên là ảnh lớn `224×315px` viền vàng; Nửa dưới là tên tiếng Anh + phụ đề tranh tiếng Việt, 3 nhãn phân loại (Loại bài, Thời điểm dùng, Trạng thái Nope) và bản dịch luật chi tiết.
  - `RulesModal.tsx` & Winner Modal: Đồng bộ phong cách thẻ bài Dark Casino.

---

## 2. Bảng Đo Đạc Responsive & Không Cuộn Trang (Chrome DevTools MCP)

Kiểm tra trực tiếp trên trình duyệt Chrome headless qua công cụ DevTools MCP (`evaluate_script` và `emulate`):

| Kích thước | Chế độ | innerWidth × innerHeight | scrollWidth × scrollHeight | Kết quả tràn (overflowX / overflowY) | Đánh giá |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **375 × 667** | Dọc (Mobile Compact) | 375 × 667 | 375 × 667 | `true` / `true` (Không cuộn) | **✅ ĐẠT** |
| **390 × 844** | Dọc (Mobile Standard) | 390 × 844 | 390 × 844 | `true` / `true` (Không cuộn) | **✅ ĐẠT** |
| **844 × 390** | Ngang (Mobile Landscape) | 844 × 390 | 844 × 390 | `true` / `true` (Không cuộn) | **✅ ĐẠT** |
| **1280 × 800** | Ngang (Desktop / Laptop) | 1280 × 800 | 1280 × 800 | `true` / `true` (Không cuộn) | **✅ ĐẠT** |

---

## 3. Danh Sách File Đã Thay Đổi & Lý Do

| File | Lý do thay đổi |
|---|---|
| `packages/games/exploding-kittens/src/data/cards.json` | Phiên dịch đầy đủ `variant_subtitle_vi` và `description_vi` cho 56 lá bài; bảo toàn tên tiếng Anh và ảnh gốc. |
| `packages/games/exploding-kittens/src/deck.ts` | Sửa tên tiếng Việt chuẩn của `CAT_BEARD` thành `'Mèo Râu Quai Nón'`. |
| `packages/games/exploding-kittens/src/types.ts` | Bổ sung `actionNameVi`, `targetCard`, `comboType` vào interface `EKPlayerView['nopeWindow']`. |
| `packages/games/exploding-kittens/src/player-view.ts` | Cung cấp thông tin lá bài/hành động cụ thể cho Cửa sổ Nope khi tạo `playerView`. |
| `packages/client/src/index.css` | Thêm toàn bộ các class Dark Casino layout, animation và modal cho game Mèo Nổ. |
| `packages/client/src/games/exploding-kittens/Card.tsx` | Loại bỏ khung chữ và nút 🔍 trên mặt thẻ bài, thêm huy hiệu thứ tự `select-order-badge` góc trên bên trái, hỗ trợ nhấn giữ và click phải. |
| `packages/client/src/games/exploding-kittens/CardZoomModal.tsx` | Thiết kế lại modal phóng to gồm ảnh lớn viền vàng + khung thông tin tags + bản dịch luật tiếng Việt. |
| `packages/client/src/games/exploding-kittens/NopeBanner.tsx` | Biểu ngữ Cửa sổ Nope phát sáng đỏ cam, đếm ngược 5 giây, nút đánh Nope và Bỏ qua. |
| `packages/client/src/games/exploding-kittens/DefuseModal.tsx` | Modal gỡ bom với cặp bài Mèo Nổ ➜ Gỡ Bom, thanh trượt chọn vị trí nhét bom bí mật kèm 4 preset. |
| `packages/client/src/games/exploding-kittens/SeeFutureModal.tsx` | Modal nhìn trước tương lai lưới 3 cột hiển thị thứ tự các lá bài kèm cảnh báo bom đỏ. |
| `packages/client/src/games/exploding-kittens/ComboModals.tsx` | Nâng cấp Combo 3 với lưới 12 thumbnail loại bài, đồng bộ các modal Favor, Combo 2, Combo 5. |
| `packages/client/src/games/exploding-kittens/RulesModal.tsx` | Đồng bộ phong cách thẻ bài Dark Casino cho modal luật chơi. |
| `packages/client/src/games/exploding-kittens/GameBoard.tsx` | Triển khai bố cục bàn chơi 5 khu vực (dọc) và 2 cột (ngang/desktop), dải thông tin chọn bài, bộ nút hành động, thay thế ID kỹ thuật bằng tên người chơi. |
| `packages/client/src/games/exploding-kittens/mockGameView.ts` | Cập nhật dữ liệu mock sử dụng mã lá bài có thực (`DF_01`, `AT_01`, `CT_TACO_01`...), thêm dữ liệu cho cửa sổ Nope và combo 3 lá. |

---

## 4. Danh Sách Ảnh Nghiệm Thu Giao Diện Thật

Các ảnh chụp màn hình thực tế từ client Vite React đã được lưu vào `gameplay_screenshots/exploding_kitten/`:
1. `05_ban_choi_khoi_dau_chia_bai.png`: Bàn chơi dọc 390×844 pha bình thường.
2. `12_ban_choi_xoay_ngang_landscape.png`: Bàn chơi ngang 844×390 chia 2 cột.
3. `03_board_desktop_1280x800.png`: Bàn chơi máy tính 1280×800.
4. `08_cua_so_phan_ung_nope_5s.png`: Cửa sổ phản ứng Nope 5 giây phát sáng đỏ cam.
5. `10_modal_go_bom_defuse.png`: Hộp thoại gỡ bom Defuse & thanh trượt chọn vị trí.
6. `09_modal_nhin_truoc_tuong_lai.png`: Hộp thoại xem 3 lá tương lai kèm cảnh báo bom.
7. `07_nguoi_choi_chon_the_bai.png`: Multi-select chọn 2 lá Tacocat kèm huy hiệu thứ tự `1`, `2`.
8. `08_combo3_modal_390x844.png`: Hộp thoại Combo 3 lá với lưới 12 loại bài kèm ảnh thumbnail.
9. `06_phong_to_chi_tiet_the_bai.png`: Hộp thoại phóng to chi tiết lá bài và giải thích luật tiếng Việt.
10. `02_modal_luat_choi_meo_no.png`: Hộp thoại luật chơi toàn diện Mèo Nổ.
