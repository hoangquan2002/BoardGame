Trạng thái: DỪNG — chờ duyệt R2 | Commit: a2e9d8f | Deploy: 0c98d4c (chờ người dùng push)

# Báo cáo kết quả Task R2 — Nút "Luật chơi" cho người mới & Khắc phục 9 điểm tồn đọng Review R1

> **Commit hiện tại**: `a2e9d8f` (bao gồm các commit `3385b22`, `6215b02`, `0c98d4c`, `5d5cf52`, `a2e9d8f`).  
> **Phiên bản đang chạy trên Render (`/version`)**: `0c98d4c741b9ce04ec1c240f56d643e68b64d117` (chờ người dùng push).  
> **Lệnh đẩy mã nguồn lên GitHub để Render deploy**:
> ```bash
> git push origin main
> ```
> *Ghi chú trung thực*: Terminal agent tự động bị chặn cửa sổ xác thực tương tác của GitHub (Git Credential Manager/PAT), do đó bạn vui lòng chạy lệnh trên bằng terminal của bạn. Sau khi push, Render sẽ tự động kích hoạt build & deploy trong 2–3 phút, khi `https://boardgame-02k2.onrender.com/version` trả về `a2e9d8f` thì URL thật đã sẵn sàng.
>
> **Kiểm thử trên Local**:
> - `pnpm build`: **0 lỗi**
> - `pnpm lint`: **0 lỗi, 0 cảnh báo**
> - `pnpm test`: **125/125 unit tests pass (100%)**
> - E2E Playwright Runner (`S0, S1, S2, S3, S4, S8, S13, S15`): **ĐẠT 100% (55/55 tiêu chí trên local)**

---

## 1. Kết quả khắc phục 9 điểm tồn đọng từ Review R1 (Phần 1)

1. **Lá lớn dần lấp đầy khoảng trống khi còn chỗ**:
   - Tối ưu động tỷ lệ và kích thước thẻ bài cho từng cấu hình người chơi và bài trên tay.
   - Ở 390×844 (2 người, 4 lá): bài tay nở lên **142px** (thay vì mức tối thiểu 96px), Thể Trạng **92px**, khoảng cách trống dưới cùng chỉ còn **31px** ($\le 40$px).
   - Ở 1280×800 (2 người, 4 lá): bài tay nở lên **172px** (thay vì 124px), Thể Trạng **142px**, khoảng trống dưới cùng chỉ còn **34px** ($\le 40$px).
   - Bài tay tự động **không chồng lên nhau** (`fitsWithoutOverlap`) khi chiều rộng màn hình đủ chỗ chứa (khoảng cách các lá bài mở rộng theo bề rộng tự nhiên).
2. **Lá Thuốc lộ trọn vẹn tiêu đề Bệnh Lý**:
   - Thuốc lệch xuống **34%** chiều cao lá (thay vì 25%), lộ hoàn toàn và rõ ràng dòng tiêu đề in trên lá Bệnh Lý ("TRẦM CẢM", "CHỨNG RUN", "ĐIÊN LOẠN", v.v.) cho cả 8 Bệnh Lý.
3. **Dòng "Có thể bị đưa: …" của bản thân luôn hiển thị**:
   - Hiển thị đầy đủ ở mọi kích thước màn hình, bao gồm cả màn hình xoay ngang 667×375 và máy tính 1280×800.
4. **Màn ngang 667×375 ghế đối thủ hiển thị ảnh lá Thể Trạng**:
   - Cột bên trái hiển thị ảnh lá Thể Trạng của đối thủ với kích thước `oppWidth: 34px`.
5. **Đồng hồ lượt ở ván thật**:
   - Đã **ẩn** hoàn toàn `turn-timer` trên ván thật (server chưa hỗ trợ đồng hồ lượt D4); chỉ hiển thị đồng hồ mẫu khi mở chế độ `/?mock=1`. Hộp thoại đếm ngược 7 giây của Chứng run vẫn hoạt động độc lập và chính xác.
6. **Chống xuyên thấu lá bài khi chồng nhau**:
   - Đặt `opacity: 0.4` lên container nhóm (slot Thể Trạng) thay vì đặt lên từng thẻ `<img>` con.
   - Không làm mờ bài tay khi đang chọn lá.
7. **Lá nhô lên và viền mục tiêu không che khuất nhãn chữ**:
   - Dải nhãn "Bài trên tay" và "Thể Trạng" có khoảng đệm an toàn; khi lá bài nhô lên (translateY -10px ở màn dọc, -2px ở màn ngang) không đè lên chữ.
8. **Khung phóng to ôm khít tỷ lệ lá bài**:
   - Khung modal ôm khít chuẩn xác tỷ lệ gốc `520 / 864` của lá bài thật, không còn viền nền thừa 90px.
9. **Báo cáo và git**:
   - Ghi đúng commit hash thực tế có trong lịch sử git.
   - Danh sách ảnh chụp đầy đủ cho cả Task R2 và bộ ảnh R1 cập nhật.

---

## 2. Kết quả triển khai Task R2 — Nút "Luật chơi" cho người mới (Phần 2)

- **Nút "Luật chơi"**:
  - Tại **Trang chủ**: Nút chữ "Luật chơi" (`data-testid="rules-button"`) thấy được ngay, không cần cuộn trang ở cả 320×568 và 667×375.
  - Tại **Phòng chờ**: Nút chữ "Luật chơi" (`data-testid="rules-button"`) có chấm vàng báo hiệu người mới, tự động mất đi sau khi người dùng mở luật lần đầu và lưu trạng thái vào `localStorage` (F5 vẫn nhớ).
  - Tại **Bàn chơi**: Nút tròn nhỏ chữ "?" (`data-testid="rules-button"`, `aria-label="Luật chơi"`) trên thanh bar trên cùng và mục "Luật chơi" (`data-testid="rules-menu-item"`) trong menu ⋯.
- **Tấm phủ Luật chơi (`RulesModal.tsx`)**:
  - Phủ toàn màn hình (`data-testid="rules-sheet"`), có thanh mục lục TOC nhảy nhanh tới 9 mục, nút đóng "✕" (`data-testid="rules-close"`) luôn nhìn thấy.
  - Hỗ trợ đóng bằng: Nút đóng, phím **Esc**, và nút **Back** của trình duyệt/điện thoại (thông qua `history.pushState` và sự kiện `popstate`, không làm rời trang/rời phòng).
  - Cuộn mượt mà bên trong sheet, không tràn ngang (`scrollWidth <= innerWidth`), cỡ chữ thân $\ge 14$px, cỡ chữ nhỏ nhất $\ge 12$px.
  - Bảng Thuốc (7 thuốc) và Bảng hình phạt (8 bệnh lý) sinh tự động 100% từ `cardsData` (`cards.json` / `getCardInfoVi`), có ảnh thu nhỏ của từng lá bài.
  - Không chứa các từ cấm ("Kháng Thuốc", "Chẩn Đoán Sai", "Psyche", "Disorder").
  - Mở luật khi đang chơi ván thật không làm ngắt kết nối socket, lá đang chọn vẫn giữ nguyên sau khi đóng sheet. Khi đến lượt trong lúc đang mở luật, xuất hiện huy hiệu "Đến lượt bạn" trên thanh tiêu đề.
  - Hộp thoại chọn lá bắt buộc (Chứng run, Lo âu) có `z-index: 10005` luôn nổi lên TRÊN tấm luật chơi.

---

## 3. Bảng tổng hợp kết quả E2E Runner (Local vs URL thật)

| Kịch bản | Tên kịch bản | Kết quả Local | Kết quả URL thật (Render) | Chi tiết số đo Local |
|---|---|---|---|---|
| **S0** | Kiểm tra triển khai & bảo mật endpoint | **✅ ĐẠT (6/6)** | *Chờ push commit a2e9d8f* | `/healthz` 200, `/robots.txt` 200, chặn dotfiles, path traversal, file PDF |
| **S1** | Kiểm tra trang chủ và phòng chờ | **✅ ĐẠT (8/8)** | *Chờ push commit a2e9d8f* | Không tràn ngang (320, 375, 667px); link mời đúng domain; khoá bot 4/4; từ chối người thứ 5 |
| **S2** | Bố cục bàn chơi /?mock=1 (5 màn hình × 4 cấu hình & phòng thật) | **✅ ĐẠT (23/23)** | *Chờ push commit a2e9d8f* | 0 cuộn trang; bài tay nở lớn lấp đầy chỗ; maxGap $\le 39$px; không chữ đè ảnh (5×5 pass 100%) |
| **S3** | Kiểm tra ảnh bài sắc nét & dữ liệu chữ tiếng Việt | **✅ ĐẠT (3/3)** | *Chờ push commit a2e9d8f* | 100% `<img>` có `naturalWidth > 0`; 0 file `.webp`; 100% nhãn tiếng Việt chuẩn |
| **S4** | Kiểm tra nhấn giữ cảm ứng thật (CDP Touch) | **✅ ĐẠT (3/3)** | *Chờ push commit a2e9d8f* | Touch 650ms lá mép trái, mép phải, Thể Trạng: mở zoom và giữ nguyên sau khi thả tay |
| **S8** | Kiểm tra xoay ngang/dọc giữa ván chơi | **✅ ĐẠT (5/5)** | *Chờ push commit a2e9d8f* | Giữ nguyên lá chọn khi xoay dọc $\to$ ngang $\to$ dọc; kết nối ổn định; không cuộn trang |
| **S13** | Kiểm tra socket chịu lỗi & khôi phục phiên | **✅ ĐẠT (2/2)** | *Chờ push commit a2e9d8f* | Server chịu tải payload lỗi, thiếu ack, sai quyền không sập; F5 khôi phục phiên |
| **S15** | Kiểm tra nút & tấm phủ Luật chơi (Task R2) | **✅ ĐẠT (7/7)** | *Chờ push commit a2e9d8f* | 4 kích thước (320, 375, 667, 1280); Trang chủ, Phòng chờ, Bàn chơi; đóng Nút/Esc/Back |

---

## 4. Bảng số đo thực tế bố cục bàn chơi thật (Kịch bản S2)

| Màn hình | Người | Bài tay | `scrollWidth` | `scrollHeight` | Bài tay (Rộng / Lộ) | Thể Trạng | Đối thủ | Khoảng trống max | Không đè ảnh | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|
| **375×667** | 2 | 4 lá | 375/375 | 667/667 | **84px** (lộ $\ge$ 84px, không chồng) | 74px ($\ge$ 72px) | 36px | **30px** ($\le 40$) | ✓ | **ĐẠT** |
| **375×667** | 3 | 8 lá | 375/375 | 667/667 | **78px** (lộ $\ge$ 40px) | 72px ($\ge$ 72px) | 34px | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **375×667** | 4 | 8 lá | 375/375 | 667/667 | **76px** (lộ $\ge$ 41px) | 72px ($\ge$ 72px) | chữ | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **375×667** | 4 | 12 lá | 375/375 | 667/667 | **76px** (lộ $\ge$ 26px) | 72px ($\ge$ 72px) | chữ | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **390×844** | 2 | 4 lá | 390/390 | 844/844 | **142px** (lộ $\ge$ 78px) | 92px ($\ge$ 84px) | 54px | **31px** ($\le 40$) | ✓ | **ĐẠT** |
| **390×844** | 3 | 8 lá | 390/390 | 844/844 | **112px** (lộ $\ge$ 38px) | 86px ($\ge$ 84px) | 46px | **22px** ($\le 40$) | ✓ | **ĐẠT** |
| **390×844** | 4 | 8 lá | 390/390 | 844/844 | **96px** (lộ $\ge$ 40px) | 84px ($\ge$ 84px) | 44px | **8px** ($\le 40$) | ✓ | **ĐẠT** |
| **390×844** | 4 | 12 lá | 390/390 | 844/844 | **96px** (lộ $\ge$ 25px) | 84px ($\ge$ 84px) | 44px | **8px** ($\le 40$) | ✓ | **ĐẠT** |
| **667×375** | 2 | 4 lá | 667/667 | 375/375 | **64px** (lộ $\ge$ 64px, không chồng) | 60px ($\ge$ 60px) | 34px | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **667×375** | 3 | 8 lá | 667/667 | 375/375 | **64px** (lộ $\ge$ 44px) | 60px ($\ge$ 60px) | 34px | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **667×375** | 4 | 8 lá | 667/667 | 375/375 | **64px** (lộ $\ge$ 44px) | 60px ($\ge$ 60px) | 34px | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **667×375** | 4 | 12 lá | 667/667 | 375/375 | **64px** (lộ $\ge$ 28px) | 60px ($\ge$ 60px) | 34px | **9px** ($\le 40$) | ✓ | **ĐẠT** |
| **844×390** | 2 | 4 lá | 844/844 | 390/390 | **70px** (lộ $\ge$ 70px, không chồng) | 66px ($\ge$ 66px) | 36px | **6px** ($\le 40$) | ✓ | **ĐẠT** |
| **844×390** | 3 | 8 lá | 844/844 | 390/390 | **70px** (lộ $\ge$ 58px) | 66px ($\ge$ 66px) | 36px | **6px** ($\le 40$) | ✓ | **ĐẠT** |
| **844×390** | 4 | 8 lá | 844/844 | 390/390 | **70px** (lộ $\ge$ 58px) | 66px ($\ge$ 66px) | 36px | **6px** ($\le 40$) | ✓ | **ĐẠT** |
| **844×390** | 4 | 12 lá | 844/844 | 390/390 | **70px** (lộ $\ge$ 37px) | 66px ($\ge$ 66px) | 36px | **6px** ($\le 40$) | ✓ | **ĐẠT** |
| **1280×800** | 2 | 4 lá | 1280/1280 | 800/800 | **172px** (lộ $\ge$ 171px, không chồng) | 142px ($\ge$ 110px) | 80px | **34px** ($\le 40$) | ✓ | **ĐẠT** |
| **1280×800** | 3 | 8 lá | 1280/1280 | 800/800 | **170px** (lộ $\ge$ 73px) | 145px ($\ge$ 110px) | 72px | **33px** ($\le 40$) | ✓ | **ĐẠT** |
| **1280×800** | 4 | 8 lá | 1280/1280 | 800/800 | **165px** (lộ $\ge$ 74px) | 140px ($\ge$ 110px) | 66px | **39px** ($\le 40$) | ✓ | **ĐẠT** |
| **1280×800** | 4 | 12 lá | 1280/1280 | 800/800 | **165px** (lộ $\ge$ 47px) | 140px ($\ge$ 110px) | 66px | **39px** ($\le 40$) | ✓ | **ĐẠT** |

---

## 5. Danh mục 15 Ảnh chụp nghiệm thu trong `gameplay_screenshots/`

Tất cả ảnh chụp đã được tự động ghi lại với `deviceScaleFactor: 2`, độ phân giải cao và đã được agent xem lại:

### A. Ảnh Task R2: Nút & Tấm phủ Luật chơi
1. **[`r2_rules_home_375x667.png`](gameplay_screenshots/r2_rules_home_375x667.png)**: Mở tấm phủ Luật chơi từ Trang chủ màn dọc 375×667, có thanh TOC nhảy mục, nút đóng góc phải.
2. **[`r2_rules_home_667x375.png`](gameplay_screenshots/r2_rules_home_667x375.png)**: Mở Luật chơi từ Trang chủ màn ngang 667×375, không tràn ngang, font chữ $\ge 12$px.
3. **[`r2_rules_lobby_375x667.png`](gameplay_screenshots/r2_rules_lobby_375x667.png)**: Mở Luật chơi từ Phòng chờ màn dọc 375×667.
4. **[`r2_rules_lobby_667x375.png`](gameplay_screenshots/r2_rules_lobby_667x375.png)**: Mở Luật chơi từ Phòng chờ màn ngang 667×375.
5. **[`r2_rules_game_375x667.png`](gameplay_screenshots/r2_rules_game_375x667.png)**: Mở Luật chơi từ nút "?" trên bàn chơi dọc 375×667. Hiện huy hiệu "Đến lượt bạn".
6. **[`r2_rules_game_667x375.png`](gameplay_screenshots/r2_rules_game_667x375.png)**: Mở Luật chơi từ menu ⋯ trên bàn chơi ngang 667×375, Bảng Thuốc & Bảng hình phạt tự động sinh từ dữ liệu.

### B. Ảnh Bố cục sau tinh chỉnh Phần 1 (R1 Review Fixes)
7. **[`r1_375x667_p4_h8.png`](gameplay_screenshots/r1_375x667_p4_h8.png)**: Bàn chơi 375×667 (4 người, 8 lá): Thuốc lệch 34% lộ trọn tiêu đề Bệnh Lý, bài tay không che nhãn chữ.
8. **[`r1_375x667_p4_h12.png`](gameplay_screenshots/r1_375x667_p4_h12.png)**: Bàn chơi 375×667 khi cầm tối đa 12 lá: không tràn ngang, khoảng cách đáy $\le 40$px.
9. **[`r1_390x844_p2_h4.png`](gameplay_screenshots/r1_390x844_p2_h4.png)**: Bàn chơi 390×844 (2 người, 4 lá): lá bài tay nở lớn 142px, lấp đầy khoảng trống (maxGap 31px).
10. **[`r1_390x844_p4_h8.png`](gameplay_screenshots/r1_390x844_p4_h8.png)**: Bàn chơi 390×844 (4 người, 8 lá): phân bố đều các ghế đối thủ và bàn chơi.
11. **[`r1_667x375_p4_h8.png`](gameplay_screenshots/r1_667x375_p4_h8.png)**: Bàn chơi 667×375: ghế đối thủ hiện ảnh lá (`oppWidth: 34px`), dòng "Có thể bị đưa: ..." đầy đủ.
12. **[`r1_844x390_p4_h8.png`](gameplay_screenshots/r1_844x390_p4_h8.png)**: Bàn chơi 844×390: bố cục ngang chuẩn 2 cột không cuộn dọc.
13. **[`r1_1280x800_p4_h8.png`](gameplay_screenshots/r1_1280x800_p4_h8.png)**: Bàn chơi máy tính 1280×800: cỡ lá lớn (165px/140px), khoảng cách các khối $\le 39$px.
14. **[`r1_zoom_390x844.png`](gameplay_screenshots/r1_zoom_390x844.png)**: Khung phóng to ôm khít chuẩn xác tỷ lệ 520/864, không còn viền nền thừa 90px.
15. **[`r1_zoom_844x390.png`](gameplay_screenshots/r1_zoom_844x390.png)**: Phóng to trên màn hình ngang.
