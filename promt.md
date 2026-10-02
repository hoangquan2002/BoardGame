# Prompt cho agent

> File này chỉ chứa: (1) việc còn tồn từ giai đoạn trước, (2) yêu cầu giai đoạn hiện tại. Làm **cả hai**.
> Kế hoạch chung: [design.md](design.md) (agent chỉ đọc, không sửa). Quy trình mỗi giai đoạn: `design.md` mục 7.
> Prompt này **ưu tiên hơn** `design.md` nếu lệch nhau.
> **Trung thực trong báo cáo**: bước nào không thực sự chạy được thì ghi "không kiểm tra được" + lý do, **không** ghi ✅.

## Phần 1 — Việc còn tồn (review R2)

Người quản lý đã review commit `94acd09`; Render đã deploy đúng commit này.

- **Đạt**:
  - `pnpm build`, `pnpm lint`, `pnpm test` đều qua (125/125).
  - Có nút "Luật chơi" ở trang chủ, phòng chờ và bàn chơi (nút "?" và mục trong menu ⋯).
  - Lá to dần theo chỗ trống:
    - 390×844: bài tay 142px, Thể Trạng 92px;
    - 1280×800: bài tay 172px, Thể Trạng 142px.
  - Thuốc lệch 34%, lộ trọn tên Bệnh Lý.
  - Dòng "Có thể bị đưa" hiện ở mọi kích thước.
- **Chưa đạt**:
  1. **Luật chơi ghi sai 2 chỗ** (`RulesModal.tsx`):
     - Dòng 268: "Liệu Pháp: Loại bỏ **vĩnh viễn**". Sai: bệnh đã bị loại bỏ vẫn có thể mắc lại (`side-effects-rules.md` mục 5.4).
     - Nghiện cờ bạc: "luôn rút được ngẫu nhiên **3** lá". Đúng là **tối đa** 3 lá; tay ít hơn thì lấy hết.
  2. **1280×800**: ghế đối thủ duy nhất nằm giữa cột trái, phía trên và dưới đều trống ~300px. Dồn các ghế lên đầu cột,
     ngay dưới thanh trên.
  3. **Commit message không dấu**: "toi uu s15_rules…", "cap nhat bao cao…". Theo quy định, dùng tiếng Việt **có dấu**
     hoặc tiếng Anh.
  4. **Bộ e2e không có ván thật nhiều người** nên bỏ lọt 2 lỗi chặn ván ở Phần 2. Kịch bản S5 (`design.md` mục 8) chưa
     từng được làm. Làm trong Phần 2.

---

## Phần 2 — Task R3: sửa 2 lỗi người dùng gặp khi chơi thật

Người dùng chơi thật và báo 2 lỗi, ưu tiên cao nhất vì làm hỏng ván:
- "Khi đề nghị đổi bài, người được đề nghị không thấy thông báo."
- "Có lúc kích bệnh Nghiện cờ bạc 2 lần rồi thì không kết thúc lượt được, có thể do quá nhiều lá trên tay."

Người quản lý đã tìm ra nguyên nhân, ghi bên dưới. Agent tự kiểm chứng lại trước khi sửa.

### A. Không kết thúc lượt được khi trên tay có hơn 6 lá (lỗi chặn ván)
- **Nguyên nhân** (lỗi phát sinh khi làm lại giao diện):
  - `GameBoard.tsx` đặt `endTurnAllowed = canEndTurn(gameView, myId)`, rồi dùng `disabled={!endTurnAllowed}` cho nút
    Kết thúc lượt.
  - `canEndTurn` trả `false` khi tay > 6 lá, nên nút bị khoá. Vì vậy `handleEndTurnClick` (chỗ mở `DiscardModal` để bỏ bài)
    **không bao giờ chạy được**.
  - Trước đợt làm lại (`7a1f658`), nút chỉ bị khoá khi `!isMyTurn || pendingChoice`.
- **Không riêng Nghiện cờ bạc**: lượt nào kết thúc với 7 lá trở lên đều bị kẹt. Ví dụ: có 6 lá, rút 2 lên 8, rồi đánh ít hơn
  2 lá. Người quản lý đo trên URL thật `/?mock=1&players=2&turn=me`: `hand=4` → nút bật; `hand=8` và `hand=12` → nút **bị khoá**.
- **Sửa**:
  1. Nút Kết thúc lượt bật khi: đúng lượt mình, không có `pendingChoice`, ván chưa kết thúc. Số lá trên tay **không** được
     làm khoá nút.
  2. Tay > 6 lá → bấm nút sẽ mở `DiscardModal`. Bỏ đủ lá → gửi `DISCARD` rồi `END_TURN`. Bước nào lỗi thì hiện thông báo
     lỗi, không im lặng.
  3. Khi tay > 6 lá, nút ghi rõ việc phải làm, vd. "Kết thúc lượt (bỏ 2 lá)".
  4. `DiscardModal`:
     - dùng component `Card` (ảnh trọn lá, đúng nguồn, không chữ đè lên ảnh) thay cho `CardView` cũ;
     - chọn được mọi lá kể cả khi tay có 15 lá, ở 375×667 và 667×375. Được cuộn bên trong hộp, trang không cuộn;
     - nhấn giữ lá thì phóng to như trên bàn.
  5. Tách logic trạng thái nút ra hàm thuần, vd. `getEndTurnState(view, me)` trả `{ enabled, discardCount }`, kèm unit test
     cho các ca: tay 6, 7, 8, 12; có `pendingChoice`; không phải lượt mình; ván đã kết thúc.
- **Luật chơi**: mục "Một lượt" thêm câu "Tay quá 6 lá: bấm Kết thúc lượt rồi chọn lá để bỏ".

### B. Người được mời đổi bài không thấy thông báo
- **Nguyên nhân** (cũng là lỗi phát sinh khi làm lại giao diện):
  - Hiện `TradeModal` chỉ hiện khi tự mở menu ⋯ → Đổi bài.
  - Bản cũ (`7a1f658`) có `(showTradeModal || myActiveTrade) && <TradeModal …>`: có lời mời là tự hiện. Nút Đổi bài cũng
    được tô sáng. Bản mới làm mất cả hai.
- Luồng đổi bài trong engine:
  1. `PROPOSE_TRADE`: người mời gửi lời mời.
  2. Người được mời trả lời (`RESPOND_TRADE`): đồng ý (kèm lá đưa lại) hoặc từ chối.
  3. Người mời chốt (`CONFIRM_TRADE`) hoặc huỷ (`CANCEL_TRADE`).

  Như vậy **cả 2 người** đều có lúc phải chờ người kia, nên cả 2 đều cần được báo.
- **Sửa**:
  1. **Có lời mời gửi tới mình** (`status = PROPOSED`, `targetPlayerId = mình`):
     - hiện ngay một hộp nổi `data-testid="trade-notice"` ghi "**Bình** mời bạn đổi bài: đưa bạn 1 lá";
     - hộp có nút "Xem" (mở `TradeModal` ở bước trả lời) và nút "Từ chối";
     - hộp không che bài tay và không che nút Kết thúc lượt;
     - hộp hiện cả khi **không phải lượt mình**, và còn hiện cho tới khi lời mời được trả lời hoặc bị huỷ.
  2. **Người kia đã trả lời** (`status = RESPONDED`, `proposerId = mình`): hiện `trade-notice` tương tự, "Bình đã trả lời,
     xác nhận đổi bài", có nút "Xem".
  3. **Dấu nhắc trên menu**: khi có lời mời đang chờ mình xử lý, nút ⋯ có chấm nhắc (`data-testid="menu-badge"`); mục
     "Đổi bài" trong menu ghi rõ "Đổi bài (1 lời mời)".
  4. **Kết thúc đổi bài**: lời mời bị từ chối, bị huỷ hay đổi xong → cả 2 người thấy 1 dòng thông báo ~3 giây, vd.
     "Bình từ chối đổi bài" / "Đã đổi bài với Bình". Lấy kết quả từ `logs` hoặc từ thay đổi của `trades`. **Không** sửa engine
     chỉ để phục vụ việc này; sự kiện có cấu trúc để sang D3.
  5. **Thứ tự ưu tiên khi nhiều thứ cùng hiện**:
     - hộp chọn lá bắt buộc (Lo âu, Chứng run) luôn nằm trên `trade-notice`;
     - nếu đang mở Luật chơi hoặc Nhật ký thì `trade-notice` vẫn thấy được, hoặc hiện ngay khi đóng lại.
  6. Không thêm emoji mới; số loại emoji trong bàn chơi vẫn ≤ 3.
- **Luật chơi**: mục "Đổi bài" thêm 1 câu về chỗ hiện lời mời.

### C. Kịch bản test mới (đều chạy cả local lẫn 🌐 URL thật)
- **S5 — ván thật 2 người** (`design.md` mục 8):
  - 2 người thật, mỗi người 1 context ẩn danh riêng, cộng 2 máy;
  - mỗi người đánh được ít nhất 1 lá của mỗi loại đang có trên tay;
  - người kia thấy thay đổi trong ≤ 3 giây;
  - không có lỗi console.
- **S16 — tay > 6 lá**:
  - trong ván thật, không đánh lá nào cho tới khi tay có ≥ 8 lá. Cách tạo: rút 2 lá mỗi lượt, lượt sau không đánh;
  - nút Kết thúc lượt **bật** và ghi số lá phải bỏ;
  - bấm → `DiscardModal` hiện → chọn đủ lá → lượt chuyển sang người kế; tay còn 6 lá;
  - chạy ở 375×667 và 667×375;
  - thêm ca `/?mock=1&hand=12&turn=me`: nút bật, hộp bỏ bài chọn được đủ 6 lá.
- **S17 — đổi bài giữa 2 người thật**:
  - A mời B (lúc đó **không phải** lượt B) → B thấy `trade-notice` trong ≤ 3 giây mà không cần mở menu;
  - B đồng ý và đưa 1 lá → A thấy `trade-notice` → A xác nhận → bài trên tay cả 2 người thay đổi đúng;
  - nhánh từ chối: cả 2 người thấy dòng "từ chối";
  - nhánh huỷ: A huỷ → `trade-notice` của B biến mất;
  - B đang mở Luật chơi khi lời mời tới → đóng luật thì vẫn thấy lời mời.
- **Chạy lại** S0, S1, S2, S3, S4, S8, S13, S15. Tiêu chí S2 không đổi, thêm ca 1280×800 cho Phần 1 mục 2.
- **Ảnh chụp** từ URL thật vào `gameplay_screenshots/`:
  - `r3_trade_notice_375x667.png`;
  - `r3_end_turn_8_cards_375x667.png`;
  - `r3_discard_modal_375x667.png` và `r3_discard_modal_667x375.png`;
  - `r3_1280x800_p2_h4.png`.

### D. Quy trình và điểm dừng
- Commit từng bước nhỏ, message tiếng Việt có dấu hoặc tiếng Anh.
- Trước khi push: `pnpm build`, `pnpm lint` (0 cảnh báo) và `pnpm test` đều qua.
- Thứ tự: chạy e2e local → `git push origin main` → chờ `/version` = `git rev-parse HEAD` → chạy e2e 🌐 → chụp ảnh.
- Push lỗi xác thực → ghi lệnh cho người dùng tự push rồi **dừng**. Chưa test URL thật thì không ghi đạt.
- `result.md`:
  - dòng đầu: `Trạng thái: DỪNG — chờ người dùng thử lại R3 | Commit: <hash> | Deploy: <commit trên /version>`;
  - bảng kết quả từng kịch bản, 2 cột Local / URL thật, kèm số đo thật;
  - checklist 5–6 bước để người dùng thử lại 2 lỗi trên 2 điện thoại thật.
- Thêm 1 dòng vào `work_progress.md`.
- **Dừng sau R3.** Chưa làm D3.
