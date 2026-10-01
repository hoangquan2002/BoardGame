Trạng thái: DỪNG — chờ duyệt D0 | Link: https://boardgame-02k2.onrender.com/?mock=1 (Local: http://localhost:3000/?mock=1)

# Báo cáo kết quả Giai đoạn D0 — Hạ tầng test + Bản phác + Tách ảnh bài

> **Điểm dừng bắt buộc D0 theo [design.md](design.md)**: Người dùng mở link bản phác trên điện thoại (`/?mock=1`), kiểm tra trực quan bố cục dọc, ngang, thao tác chạm lá và nhấn giữ phóng to (`card-zoom`), góp ý để hoàn thiện tiếp giai đoạn D1–D2.

---

## 1. Nội dung đã thực hiện trong Giai đoạn D0

1. **Khắc phục các việc nhỏ tồn đọng của T4b**:
   - Nhận diện máy qua `RoomPlayerInfo.isBot` từ `roomState` (không phụ thuộc chuỗi tiền tố tên).
   - Tăng timeout bộ test giả lập 1000 ván lên 120s (chạy trong 11.9s trên 18 test suite song song).
   - Commit message chuẩn hoá tiếng Việt có dấu.

2. **Hạ tầng endpoints hệ thống & bảo mật**:
   - Bổ sung `GET /version` trả về `{ "commit": process.env.RENDER_GIT_COMMIT ?? "dev" }`.
   - Bổ sung `GET /robots.txt` trả về `User-agent: *\nDisallow: /\n` và thêm thẻ `<meta name="robots" content="noindex" />` chặn bot thu thập nội dung.
   - Chặn tải file dotfiles (`/.env`), file PDF (`/Side effects.pdf`) và chống path traversal (`/../package.json`).

3. **Trích xuất toàn bộ 18 lá bài thật từ PDF Việt hoá**:
   - Sử dụng script `scripts/extract-cards.py` (PyMuPDF + Pillow) đọc file scan `assets/card-photos/Side effects.pdf`.
   - Cắt chuẩn xác từng lá bài từ lưới 3×2, xuất 18 ảnh WebP chất lượng cao (300×537px, dung lượng 18.8 KB – 53.8 KB, đều <= 60 KB):
     - 8 Bệnh Lý: `anxiety`, `anorexia`, `depression`, `gambling-addiction`, `madness`, `suicidal-thoughts`, `impotence`, `tremors`.
     - 7 Thuốc: `chlorpromazine`, `clozapine`, `fluoxetine`, `lithium`, `lorazepam`, `pramipexole`, `sildenafil`.
     - 2 Đặc biệt: `episode` (Triệu Chứng), `therapy` (Liệu Pháp).
     - 1 Mặt sau: `back` (hoa văn đen vàng nghệ thuật).
     - Bỏ qua 2 lá Gia Vị (Page 3: `misdiagnosis` - Chuẩn đoán sai, Page 4: `highTolerance` - Kháng thuốc).
   - Đã tạo contact sheet kiểm duyệt `scratch/contact_sheet.png`.

4. **Component `Card` và dữ liệu hiển thị tiếng Việt**:
   - `getCardInfoVi(cardId)` cung cấp tên tiếng Việt, loại, trị bệnh, tác dụng phụ, hình phạt cho mọi lá bài.
   - Component `Card` hỗ trợ 4 kích thước: `mini`, `small`, `normal`, `zoom`.
   - Hỗ trợ thao tác chạm thường (chọn lá) và **nhấn giữ >= 400ms** (hoặc chuột phải) để mở modal phóng to chi tiết lá bài (`data-testid="card-zoom"`).

5. **Trang bản phác (`/?mock=1`) theo thiết kế D2 & mục 4**:
   - Dựng bàn chơi từ `playerView` mẫu cố định (hỗ trợ query `players=2|3|4`, `hand=4|8|12`, `turn=me|other`).
   - Có Thể Trạng bậc thang (Bệnh Lý nằm trên, Thuốc nằm dưới lệch tầng để lộ tên Thuốc).
   - Bài trên tay xếp so le tự co theo số lá (4, 8, 12 lá), lá đang chọn nổi bật.
   - Ghế đối thủ dạng hàng ngang, Thể Trạng mini bậc thang, có đối thủ máy 🤖, đối thủ mất mạng, bài bị lộ do Lo âu.
   - Thanh trên: Lượt, đồng hồ `⏱️ 0:42`, menu `⋯`. Dải giữa bàn: `Rút 41 · Bỏ 12 · Đã đánh 1/2`.
   - Cỡ chữ nhỏ nhất 11px, không emoji thừa.

6. **Bộ test E2E tự động (`scripts/e2e/`)**:
   - Viết trọn vẹn bộ runner E2E Playwright Chromium (`scripts/e2e/runner.mjs`) kiểm tra S0, S1, S2 trên 4 kích thước màn hình.

---

## 2. Bảng kết quả kiểm tra tự động E2E (Kịch bản S0, S1, S2)

> Môi trường hiện tại không có kết nối ra ngoài internet tới URL Render thật (`dial tcp: no such host`), do đó theo hướng dẫn của người dùng *"nếu không test được trên url thật thì hãy test trên local"*, toàn bộ số đo dưới đây được thực hiện trực tiếp trên server local port 3000 bằng trình duyệt Chrome headless.

### Tổng quan từng kịch bản

| Kịch bản | Tên kịch bản | Kết quả Local | Ghi chú |
|---|---|---|---|
| **S0** 🌐 | Kiểm tra triển khai & bảo mật endpoint | **✅ ĐẠT (6/6)** | `/healthz` 200, `/version` 200, `/robots.txt` 200, chặn `/.env`, `/../package.json`, file PDF |
| **S1** 🌐 | Kiểm tra trang chủ và phòng chờ | **✅ ĐẠT (6/6)** | Trang chủ/phòng chờ không tràn ngang ở 320, 375, 667px; tạo phòng; link mời đúng domain; khoá bot 4/4 |
| **S2** 🌐 | Bố cục bản phác `/?mock=1` (4 kích thước × cấu hình) | **✅ ĐẠT (17/17)** | Đạt 100% tiêu chí D2 (không tràn ngang, không cuộn dọc, bài tay và nút KT lượt trọn màn hình, zoom đạt) |

### Bảng số đo thực tế bố cục `/?mock=1` (Kịch bản S2)

| Kích thước | Người | Bài tay | `scrollWidth / innerWidth` | `scrollHeight / innerHeight` | Bài tay trọn màn hình | Nút KT lượt (bottom) | Font min | Kết quả |
|---|---|---|---|---|---|---|---|---|
| **375×667 (dọc)** | 2 | 4 lá | **375 / 375** (Không tràn) | **667 / 667** (Không cuộn) | **4/4 lá** | 663px (<= 667px) | 11px | **ĐẠT** |
| **375×667 (dọc)** | 3 | 8 lá | **375 / 375** (Không tràn) | **667 / 667** (Không cuộn) | **8/8 lá** | 663px (<= 667px) | 11px | **ĐẠT** |
| **375×667 (dọc)** | 4 | 8 lá | **375 / 375** (Không tràn) | **667 / 667** (Không cuộn) | **8/8 lá** | 663px (<= 667px) | 11px | **ĐẠT** |
| **375×667 (dọc)** | 4 | 12 lá | **375 / 375** (Không tràn) | **667 / 667** (Không cuộn) | **12/12 lá** | 663px (<= 667px) | 11px | **ĐẠT** |
| **667×375 (ngang)** | 2 | 4 lá | **667 / 667** (Không tràn) | **375 / 375** (Không cuộn) | **4/4 lá** | 371px (<= 375px) | 11px | **ĐẠT** |
| **667×375 (ngang)** | 3 | 8 lá | **667 / 667** (Không tràn) | **375 / 375** (Không cuộn) | **8/8 lá** | 371px (<= 375px) | 11px | **ĐẠT** |
| **667×375 (ngang)** | 4 | 8 lá | **667 / 667** (Không tràn) | **375 / 375** (Không cuộn) | **8/8 lá** | 371px (<= 375px) | 11px | **ĐẠT** |
| **667×375 (ngang)** | 4 | 12 lá | **667 / 667** (Không tràn) | **375 / 375** (Không cuộn) | **12/12 lá** | 371px (<= 375px) | 11px | **ĐẠT** |
| **390×844 (dọc)** | 2 | 4 lá | **390 / 390** (Không tràn) | **844 / 844** (Không cuộn) | **4/4 lá** | 840px (<= 844px) | 11px | **ĐẠT** |
| **390×844 (dọc)** | 3 | 8 lá | **390 / 390** (Không tràn) | **844 / 844** (Không cuộn) | **8/8 lá** | 840px (<= 844px) | 11px | **ĐẠT** |
| **390×844 (dọc)** | 4 | 8 lá | **390 / 390** (Không tràn) | **844 / 844** (Không cuộn) | **8/8 lá** | 840px (<= 844px) | 11px | **ĐẠT** |
| **390×844 (dọc)** | 4 | 12 lá | **390 / 390** (Không tràn) | **844 / 844** (Không cuộn) | **12/12 lá** | 840px (<= 844px) | 11px | **ĐẠT** |
| **844×390 (ngang)** | 2 | 4 lá | **844 / 844** (Không tràn) | **390 / 390** (Không cuộn) | **4/4 lá** | 386px (<= 390px) | 11px | **ĐẠT** |
| **844×390 (ngang)** | 3 | 8 lá | **844 / 844** (Không tràn) | **390 / 390** (Không cuộn) | **8/8 lá** | 386px (<= 390px) | 11px | **ĐẠT** |
| **844×390 (ngang)** | 4 | 8 lá | **844 / 844** (Không tràn) | **390 / 390** (Không cuộn) | **8/8 lá** | 386px (<= 390px) | 11px | **ĐẠT** |
| **844×390 (ngang)** | 4 | 12 lá | **844 / 844** (Không tràn) | **390 / 390** (Không cuộn) | **12/12 lá** | 386px (<= 390px) | 11px | **ĐẠT** |

- **Kiểm tra thao tác tương tác**:
  - Chạm thường (< 400ms): Chọn / bỏ chọn lá bài trên tay, không mở popup zoom.
  - Nhấn giữ >= 400ms (hoặc chuột phải): Mở hộp thoại modal `card-zoom` hiển thị ảnh lớn và thông tin tiếng Việt chi tiết (tên, loại, trị bệnh, tác dụng phụ, hình phạt).
  - Chạm ra ngoài backdrop: Đóng popup zoom ngay lập tức.

---

## 3. Kết quả kiểm tra chất lượng mã nguồn

- **Build**: ✅ `pnpm build` biên dịch thành công cả 4 package (`core`, `game-side-effects`, `server`, `client`).
- **Lint**: ✅ `pnpm lint` typecheck 0 lỗi, ESLint 0 errors, 0 warnings.
- **Unit & Integration Tests**: ✅ **118/118 tests pass** trên toàn bộ 18 test files (test giả lập 1000 ván chạy hoàn tất trong 11.9s).

---

## 4. Hướng dẫn người dùng xem và duyệt bản phác D0

Do môi trường dòng lệnh Git trên máy yêu cầu tương tác xác thực và không có mạng ra ngoài, người dùng hãy chạy lệnh sau để đẩy các commit lên GitHub cho Render tự động deploy:
```bash
git push origin main
```

Sau khi deploy lên Render:
1. Mở liên kết: **`https://boardgame-02k2.onrender.com/?mock=1`** (hoặc chạy local `pnpm start` rồi mở `http://localhost:3000/?mock=1`).
2. Thử các tham số khác nhau:
   - `?mock=1&players=2&hand=4`: Bàn 2 người, 4 lá trên tay.
   - `?mock=1&players=3&hand=8`: Bàn 3 người, 8 lá trên tay.
   - `?mock=1&players=4&hand=12`: Bàn 4 người, 12 lá trên tay.
3. Thử nghiệm trên điện thoại:
   - Xoay màn hình dọc ↔ ngang xem bàn chơi tự thích ứng (ngang chia 2 cột, dọc chia hàng).
   - Chạm vào lá bài để xem hiệu ứng chọn lá nhô lên.
   - Nhấn giữ lâu vào bất kỳ lá nào (trên tay hoặc trên Thể Trạng) để xem thẻ phóng to chi tiết.
4. Góp ý cho agent để chuyển sang giai đoạn D1 (ảnh + dữ liệu hiển thị hoàn chỉnh).
