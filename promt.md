# Prompt cho agent

> File này chỉ chứa: (1) việc còn tồn từ task trước, (2) yêu cầu task hiện tại. Làm **cả hai** phần, Phần 1 trước.
> Dòng đầu tiên của `result.md` khi xong: `Trạng thái: XONG | Task: T4b | Commit cuối: <hash>` (hoặc `DỪNG — xong bước X/Y` / `DỪNG — cần hỏi`).
> **Trung thực trong báo cáo** (`AGENTS.md`): bước nào không thực sự chạy được thì ghi "không kiểm tra được" + lý do, **không** ghi ✅.

## Phần 1 — Việc còn tồn (review T4b lần 1: CHƯA ĐẠT)
Người quản lý đã review các commit `4bd7333`…`5f92998` và bản đang chạy trên Render. Kết quả:
- Phần 1 cũ (nút "Vào phòng", `NODE_ENV`): **đạt**. Trang chủ/phòng chờ không tràn ngang ở 320, 375, 667px.
- Hàm xếp ghế + test: **đạt**.
- Đánh bài bằng chạm (Triệu Chứng vào đối thủ, Thuốc vào mình), xoay máy giữ lá đang chọn: **đạt**.
- Các mục dưới đây **chưa đạt**. Phải sửa hết trước khi coi T4b là xong. Phần 2 bên dưới giữ nguyên làm yêu cầu gốc.

Số đo của người quản lý (Chrome, trên URL Render, 1 người + máy):

| Kích thước | Số người | `scrollWidth` | Lá bài tay nằm trọn trong màn hình | Cao trang (`scrollHeight`) |
|---|---|---|---|---|
| 375×667 | 3 / 4 | **439 / 428** (tràn ngang) | 4/4 | 667 |
| 390×844 | 3 / 4 | **438 / 409** (tràn ngang) | 4/4 | 844 |
| 667×375 | 2 / 3 / 4 | 667 | **0/6, 0/4, 0/4** | **414–416** |
| 844×390 | 2 / 3 / 4 | 844 | **0/6, 0/4, 0/4** | **414–416** |

1. **Màn hình ngang: không thấy bài trên tay.** Ở 667×375 và 844×390, cả hàng bài tay bị đẩy xuống dưới mép màn hình, chỉ lộ
   dải tiêu đề loại lá. Trang phải cuộn dọc mới thấy. Đây đúng là điều Phần 2 cấm.
   - Bố cục ngang phải chia **cột**, không chồng dọc: vd. bên trái là bàn (ghế đối thủ + giữa bàn), bên phải là Thể Trạng của
     mình + bài tay. Hoặc thu gọn giữa bàn thành một dải mỏng.
   - Tiêu chí: `scrollHeight <= innerHeight`, **mọi** lá bài tay và nút Kết thúc lượt nằm trọn trong màn hình, với 2, 3, 4 người
     và với **8 lá** trên tay.
2. **Màn hình dọc 3–4 người: tràn ngang và mất tên bệnh.**
   - Hàng nút giữa bàn (Kết thúc lượt / Đổi bài / Nhật ký) vượt mép phải. Nút Nhật ký nằm ngoài màn hình.
   - Ghế đối thủ ở 375px chỉ còn `⚠️ .` + "Chưa chữa": **tên Bệnh Lý bị cắt hết**, tên người chơi thành `...`. Không phân
     biệt được bệnh nào, trái yêu cầu "tên phải phân biệt được".
   - Giữa ghế đối thủ và giữa bàn có một khoảng trống lớn (~100px) bỏ phí.
   - Sửa gợi ý: 3 ghế không nên xếp 3 cột hẹp ở 375px. Ví dụ: ghế trên chiếm cả hàng, trái/phải thành hàng thứ 2; hoặc mỗi ghế
     một hàng ngang gọn. Có thể viết tắt tên bệnh, nhưng phải đọc được (vd. "Ng. cờ bạc", "Liệt dương").
   - Tiêu chí: `scrollWidth <= innerWidth` ở 375×667 và 390×844 với 2, 3, 4 người. Tên Bệnh Lý thấy được trên mọi ghế.
3. **Nhận diện máy bằng tên**: `OpponentSeat` và `GameBoard` đoán máy bằng `playerName.startsWith('Máy ')`. Người thật đặt tên
   "Máy 1" sẽ bị hiện 🤖. Dùng `RoomPlayerInfo.isBot` từ `roomState`.
4. **Test giả lập 1000 ván bị quá thời gian** khi chạy cả bộ `pnpm test`: 32s, trong khi giới hạn là 30s. Chạy riêng thì 16s.
   Tăng timeout riêng cho test này (vd. 120s), không giảm số ván.
5. **Không có báo cáo**: `result.md` vẫn là báo cáo T5, còn `work_progress.md` không có dòng nào của T4b. Lần này phải ghi
   đủ theo mục "Báo cáo" ở Phần 2, kèm **bảng số đo thật** như bảng trên.
6. Commit message viết tiếng Việt **có dấu** (hoặc tiếng Anh). Không viết tiếng Việt không dấu.

Cách tự kiểm tra (người quản lý sẽ đo lại đúng như vậy):
- Chrome/Playwright, `newContext` với `viewport` từng kích thước, `isMobile: true`.
- Tạo phòng, thêm 1/2/3 máy, bắt đầu. Đo bằng `document.documentElement.scrollWidth/scrollHeight` và `getBoundingClientRect()`
  của `[data-testid^=hand-card-]`, `[data-testid=end-turn-button]`, `[data-testid^=opponent-seat-]`.
- Đổi hướng màn hình bằng `page.setViewportSize` giữa ván.

---

## Phần 2 — Task T4b: Bàn chơi dạng sòng bài + xoay ngang

### Đọc trước
- `AGENTS.md`; `PLAN.md` mục T4b (yêu cầu gốc) và mục 1 (tối đa 4 người, dọc/ngang đều chơi được).
- `packages/client/src/App.tsx`, `index.css`, `vite.config.ts` (manifest).
- Toàn bộ `packages/client/src/games/side-effects/`: `GameBoard`, `OpponentBar`, `PsycheView`, `HandView`, `CardView`, các modal.
- `packages/games/side-effects/src/types.ts`: `SEPlayerView`, `SEPlayerViewPlayer` (`handCount`, `revealedHand`, `psyche`,
  `skipTurns`, `preventPlayCardsTurns`, `preventDrawTurns`), `playerIds` (thứ tự lượt).

### Mục tiêu
Người chơi **nhìn một lần thấy hết** mọi thông tin mình được biết, không phải chạm mở từng đối thủ, không phải cuộn ngang:
- toàn bộ bài trên tay mình;
- Thể Trạng công khai (Bệnh Lý + Thuốc) của **tất cả** người chơi, kể cả mình;
- ai đang đến lượt, đang chịu hình phạt gì.

Dùng được cả khi cầm máy **dọc** lẫn **ngang**, theo cách người dùng đang cầm.

### Việc cần làm
1. **Hàm xếp ghế (thuần, có unit test)**: đặt trong `client/src/games/side-effects/` (vd. `seats.ts`).
   - Đầu vào: `playerIds` (thứ tự lượt), `myId`, hướng màn hình.
   - Đầu ra: vị trí từng đối thủ.
   - Mình luôn ở cạnh dưới. Đối thủ xếp theo **thứ tự lượt** tính từ người đi sau mình, theo chiều kim đồng hồ:
     - 1 đối thủ → trên.
     - 2 đối thủ → trái, phải (dọc: trên-trái, trên-phải).
     - 3 đối thủ → trái, trên, phải.
   - Người xem (`myId` không có trong `playerIds`) → không crash, xếp mọi người quanh bàn.
2. **Bàn chơi dạng sòng bài** (thay `OpponentBar` thu gọn hiện nay):
   - **Ghế đối thủ luôn hiện đủ**, không cần chạm mở:
     - tên, 🤖 nếu là máy, trạng thái mất kết nối;
     - viền/nhãn "đang đến lượt";
     - số lá trên tay (mặt úp, chỉ số lượng);
     - huy hiệu hình phạt đang chịu (mất lượt / không được đánh bài / không được rút bài, kèm số lượt còn lại nếu > 0);
     - **từng Bệnh Lý** trong Thể Trạng: tên tiếng Việt (có thể viết tắt nếu thiếu chỗ nhưng phải phân biệt được), trạng thái
       chưa chữa / đã có Thuốc (hiện tên Thuốc);
     - dòng "Còn X bệnh chưa chữa" để thấy ai gần thắng.
   - Chạm vào ghế vẫn mở được chi tiết (tên đầy đủ, hình phạt đầy đủ), như bản cũ.
   - **Đang chọn lá bài**: mục tiêu hợp lệ sáng lên **ngay trên ghế hoặc Bệnh Lý** của đối thủ. Chạm vào đó là đánh, dùng
     `getValidTargets` như hiện tại. Đưa Bệnh Lý (mục tiêu là người) thì chạm vào ghế.
   - `revealedHand` có dữ liệu (hình phạt lộ bài) → hiện các lá đó ở ghế tương ứng.
   - **Giữa bàn**: chồng rút, chồng bỏ (số lá), lượt của ai, số lá đã đánh `x/2`, các nút Kết thúc lượt / Đổi bài / Nhật ký.
   - **Khu của mình**: Thể Trạng của mình + **toàn bộ bài trên tay hiện cùng lúc**. Khi nhiều lá thì thu nhỏ, xếp lấn kiểu quạt
     hoặc chia 2 hàng, **không** cuộn ngang. Tên lá vẫn đọc được. Chạm để chọn; lá đang chọn nổi lên hoặc phóng to.
   - Phải hiển thị được **tới 12 lá** trên tay mà không cuộn ngang.
3. **Xoay màn hình**:
   - Manifest: `orientation` đổi `portrait` → `any`.
   - Bỏ giới hạn `max-width: 480px` (`#root` trong `index.css` và `App.tsx`) **cho bàn chơi**. Trang chủ và phòng chờ có thể giữ
     cột hẹp ở giữa.
   - **Dọc**: đối thủ ở phần trên, giữa bàn, rồi khu của mình ở dưới.
   - **Ngang**: bàn trải rộng. Khu của mình (Thể Trạng + bài tay) nằm dưới hoặc bên cạnh. Ở 667×375 phải thấy được bài tay và
     nút Kết thúc lượt **mà không cuộn cả trang**.
   - Ưu tiên CSS (`@media (orientation: landscape)`, flex/grid). Chỉ dùng JS khi CSS không đủ (vd. hàm xếp ghế cần biết hướng
     màn hình).
   - Xoay máy giữa ván: không mất lá đang chọn, không kết nối lại, không mở/đóng modal ngoài ý muốn.
   - Chừa vùng tai thỏ bằng `env(safe-area-inset-*)`, đặc biệt khi ngang.
   - Các modal (Lo âu, Chứng run kèm đếm ngược, Đổi bài, Bỏ bài, Thắng/Thua, Nhật ký) vừa khung 667×375: có `max-height` và cuộn
     bên trong, nút xác nhận luôn bấm được.
   - Trang chủ và phòng chờ: dùng được khi ngang (không vỡ, không tràn ngang). Không cần thiết kế lại.
   - Máy tính (≥ 1024px): bàn chơi có `max-width` hợp lý, căn giữa.
4. **Không làm lộ thông tin**: chỉ dùng dữ liệu đã có trong `playerView`. **Không** sửa engine, server, `protocol.ts`, `playerView`.

### Kiểm tra
- `pnpm build`, `pnpm lint`, `pnpm test` thành công. Test cũ (kể cả `e2e-gameplay`) vẫn qua.
- Unit test hàm xếp ghế:
  - 2, 3 và 4 người; mình ở mọi vị trí trong `playerIds`; cả dọc lẫn ngang;
  - trường hợp người xem không có trong `playerIds`.
- **Kiểm tra bằng trình duyệt** (Chrome/Playwright), ở **4 kích thước** 375×667, 667×375, 390×844, 844×390, với ván **2, 3 và 4
  người** (1 người + máy). Tiêu chí đo được, ghi số liệu thật vào báo cáo:
  - `document.documentElement.scrollWidth <= window.innerWidth` (không tràn ngang), trên bàn chơi, trang chủ, phòng chờ;
  - ở 667×375 và 375×667: lá cuối trên tay và nút Kết thúc lượt có `getBoundingClientRect().bottom <= window.innerHeight`;
  - đếm được đủ số lá trên tay và đủ số Bệnh Lý của từng đối thủ trên màn hình, không cần chạm;
  - đánh được Thuốc, Liệu Pháp (vào mình), Triệu Chứng và đưa Bệnh Lý (vào đối thủ) bằng chạm;
  - đổi viewport dọc ↔ ngang giữa ván: lá đang chọn vẫn giữ, không hiện "mất kết nối".
- Không chạy được trình duyệt → ghi "không kiểm tra được" cho từng mục, **không** ghi ✅.
- Không commit ảnh chụp màn hình vào repo.

### Không được làm
- Không thêm thư viện (không UI kit, không CSS framework, không thư viện kéo-thả).
- Không sửa luật, engine, bot, server, protocol.
- Không làm âm thanh/rung (T7), không làm ảnh lá bài thật.
- Không sửa `PLAN.md`, `side-effects-rules.md`, `AGENTS.md`, `promt.md`.

### Git & deploy
- Commit theo từng bước:
  1. Phần 1 (2 commit);
  2. hàm xếp ghế + test;
  3. bàn chơi sòng bài;
  4. xoay ngang + manifest + modal.
- Push lên `origin main` **chỉ khi** build/lint/test đều qua. Render sẽ tự deploy, và các phòng đang chơi sẽ mất.
- Không force push. Push lỗi vì xác thực → ghi lệnh vào `result.md` để người dùng tự push.

### Báo cáo
Ghi đè `result.md` theo mẫu, **thêm** các mục sau:
- "Việc còn tồn" (kết quả Phần 1).
- Mô tả ngắn bố cục dọc và ngang (vị trí ghế, giữa bàn, khu của mình).
- Bảng kiểm tra trình duyệt: kích thước × số người × từng tiêu chí, kèm số đo thật.
- Danh sách commit (hash + message). Ghi rõ đã push hay chưa.

Cập nhật dòng T4b trong `work_progress.md` (thêm dòng nhật ký, **không** ghi đè dòng của task khác).
