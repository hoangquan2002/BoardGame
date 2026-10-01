# Kế hoạch thiết kế lại giao diện — Side Effects

> Tài liệu do người quản lý soạn theo phản hồi của người dùng (2026-09-30). Agent chỉ đọc, **không sửa** file này.
> File này **tự đủ để giao cho agent**: agent làm lần lượt D0 → D7 theo mục 2, mỗi giai đoạn theo quy trình mục 7
> (làm → test → tự push → chờ Render deploy → test trên URL thật → báo cáo) và kịch bản test mục 8.
> Luật chơi lấy từ `side-effects-rules.md`. Luật nhà của app (đồng hồ lượt, thoát phòng) **đã chốt** ở mục 3 và
> đã ghi vào `side-effects-rules.md` mục 10.

---

## 1. Phản hồi của người dùng → việc cần làm

| # | Phản hồi | Hướng xử lý | Giai đoạn |
|---|---|---|---|
| 1 | Bài chưa có hình ảnh | Tách ảnh từng loại lá từ PDF Việt hoá, hiển thị ảnh thật | D1 |
| 2 | Thuốc chưa hiện tác dụng phụ | Mọi nơi hiện Thuốc đều ghi "trị X · tác dụng phụ Y, Z" | D1 |
| 3 | Tên lá bài phải là tiếng Việt | Không còn chữ tiếng Anh hay viết tắt (`T/CHỨNG`, `L/PHÁP`) | D1 |
| 4 | Xếp bài so le / bậc thang, nhấn giữ để phóng to | Bài tay xếp so le; Thể Trạng xếp bậc thang; nhấn giữ → xem to | D2 |
| 5 | Bỏ bớt icon, border thừa | Bộ quy tắc giao diện ở mục 4 | D2 |
| 6 | Bố cục ngang chưa hợp lý | Thiết kế lại bố cục dọc + ngang theo khung ở mục 5 | D2 |
| 7 | Sau mỗi hành động chưa có thông báo rõ | Sự kiện có cấu trúc + dải thông báo + hiệu ứng trên lá/ghế | D3 |
| 8 | Máy đánh quá nhanh | Máy chờ hiệu ứng xong mới đi tiếp, ~2,5 giây mỗi hành động | D3 |
| 9 | Giới hạn thời gian mỗi lượt (người dùng chốt **120 giây**) | Đồng hồ lượt ở server, luật mục 3.1 | D4 |
| 10 | Chưa có cơ chế thoát phòng | Thoát được cả khi đang chơi, máy ngồi thay (mục 3.2) | D4 |
| 11 | Thêm máy mức Khó | Làm T6b (ISMCTS) như `PLAN.md` | D5 |
| 12 | (việc còn lại của kế hoạch) Âm thanh + rung | T7 trong `PLAN.md` | D6 |
| 13 | (việc còn lại) Mở lại 5–8 người | Bố cục cho tới 8 ghế rồi nâng `maxPlayers` | D7 |

**Thay thế T4b**: mọi lỗi bố cục của T4b (tràn ngang, mất bài tay khi xoay ngang) được **gộp vào D2**. Không sửa bố cục cũ
nữa. Nếu agent trước để lại thay đổi chưa commit thì: giữ phần dùng lại được, bỏ phần còn lại, **không** `git reset --hard`.
Các việc nhỏ của T4b làm trong D0:
- nhận diện máy bằng `RoomPlayerInfo.isBot`, không đoán theo tên;
- tăng timeout riêng cho test giả lập 1000 ván (120s);
- commit message tiếng Việt có dấu hoặc tiếng Anh.

## 2. Thứ tự làm

```
D0 (hạ tầng test + bản phác + tách ảnh)  ──►  ⏸ DỪNG chờ người dùng duyệt bản phác
  → D1 (ảnh + dữ liệu hiển thị) → D2 (bố cục) → D3 (thông báo + nhịp máy)
  → D4 (đồng hồ lượt + thoát phòng) → D5 (máy Khó = T6b) → D6 (âm thanh + rung = T7) → D7 (5–8 người)
```

- D0 là điểm dừng **duy nhất** bắt buộc. Agent push bản phác, ghi `result.md` dòng đầu `Trạng thái: DỪNG — chờ duyệt D0`
  kèm link `https://boardgame-02k2.onrender.com/?mock=1`. Người dùng mở trên điện thoại, góp ý, rồi bảo agent làm tiếp.
- Từ D1 trở đi agent làm liên tục. Mỗi giai đoạn xong (đã push, đã test trên URL thật) thì ghi báo cáo rồi sang giai
  đoạn sau. Gặp luật không rõ → dừng, ghi `DỪNG — cần hỏi`.
- D3 làm trước D6, vì âm thanh gắn vào chính các sự kiện của D3.
- D7 là tuỳ chọn: chỉ làm khi D0–D6 đều đạt.

---

## 3. Luật nhà của app — ĐÃ CHỐT

Rulebook không có đồng hồ lượt và không có luật rời bàn. Người dùng chốt **120 giây mỗi lượt**; các điểm còn lại do người
quản lý thiết kế. Nội dung dưới đây trùng với `side-effects-rules.md` mục 10. Nếu hai file lệch nhau thì `side-effects-rules.md`
là chuẩn.

**3.1. Đồng hồ lượt — 120 giây**
- Bắt đầu đếm khi lượt bắt đầu, **sau** bước rút 2 lá. Đồng hồ hiện cho **mọi người** thấy; 20 giây cuối đổi màu.
- Hết giờ → server tự kết thúc lượt, theo thứ tự:
  1. Nếu chính người đó đang chọn lá (Lo âu) → chọn **ngẫu nhiên** 1 lá hợp lệ.
  2. Huỷ mọi lời mời đổi bài đang mở có người đó tham gia.
  3. Tay > 6 lá → bỏ **ngẫu nhiên** (rng có seed) cho còn 6.
  4. Lá chưa đánh giữ nguyên. Chuyển lượt như `END_TURN` bình thường, gồm cả trừ lượt các hình phạt đang chịu.
- Đồng hồ **tạm dừng** trong lúc chờ **người khác** chọn (nạn nhân Chứng run có 7 giây riêng). Chọn xong thì chạy tiếp từ
  số giây còn lại.
- Người **mất kết nối** vẫn bị tính giờ để ván không kẹt.
- **Vắng mặt**: hết giờ **2 lượt liên tiếp** mà không có hành động nào → máy mức Thường tạm chơi thay. Mọi người thấy thông
  báo "An vắng mặt, máy chơi thay". Người đó kết nối lại (`room:resume`) hoặc bấm "Tôi quay lại" → **lấy lại ghế** từ lượt kế
  tiếp của mình.
- Máy không chịu đồng hồ, vì luôn đi xong trong vài giây.
- **Lời mời đổi bài** không ai trả lời trong **30 giây** thì tự huỷ.
- Thời lượng nằm trong `options` của ván: `turnTimeoutSeconds` (mặc định 120), `tradeTimeoutSeconds` (mặc định 30). Chưa cần
  giao diện chọn. Server nhận biến môi trường `TURN_TIMEOUT_SECONDS` **chỉ để test** (vd. 5 giây), không đặt biến này trên Render.

**3.2. Thoát phòng**
- **Phòng chờ**: nút "Rời phòng" như hiện nay. Chủ phòng rời → quyền chủ phòng chuyển cho người thật vào phòng sớm nhất. Không
  còn người thật → xoá phòng.
- **Đang chơi**: menu ⋯ → "Thoát ván" → hộp thoại xác nhận "Máy sẽ chơi thay bạn, bạn không vào lại được ván này".
  - Ghế đó chuyển thành **máy mức Thường**, giữ nguyên bài, Thể Trạng và hình phạt đang chịu. Tên hiện "An (máy chơi thay)".
  - Đang có `pendingChoice` hoặc lời mời đổi bài của người đó → máy xử lý tiếp như máy bình thường.
  - Người thoát bị xoá phiên và về trang chủ. `room:resume` bằng token cũ bị từ chối.
  - Chủ phòng thoát → quyền chủ phòng chuyển như ở phòng chờ.
- Không còn **người thật đang kết nối** nào trong phòng (chỉ còn máy / người đã thoát) → dừng máy và xoá phòng sau **5 phút**.
  Giữ 5 phút để người mất mạng kịp quay lại.
- **Kết thúc ván**: hiện người thắng + 2 nút:
  - "Về phòng chờ": chủ phòng đưa cả phòng về phòng chờ, giữ người thật còn kết nối và máy **gốc**. Máy chơi thay bị bỏ.
  - "Thoát": về trang chủ.

**3.3. Ảnh bài thật trên web công khai**
- Ảnh thuộc bản quyền nhà phát hành / nhóm Việt hoá. URL Render ai có link cũng mở được.
- Chỉ dùng nội bộ nhóm bạn: không quảng bá link. Thêm `robots.txt` (`Disallow: /`) và
  `<meta name="robots" content="noindex">`.

---

## 4. Quy tắc giao diện chung

**Ít trang trí, thông tin rõ:**
- Emoji chỉ dùng tối đa **3 chỗ**: 🤖 cạnh tên máy, biểu tượng đồng hồ lượt, biểu tượng menu. Bỏ hết ⚠️ 💊 🃏 🎯 ⚡ 😴 🍽️ trong
  bàn chơi.
- **Border chỉ dùng cho trạng thái**: đang chọn, mục tiêu hợp lệ, đang đến lượt. Tách khối bằng khoảng cách và nền đậm/nhạt.
  Không lồng khung trong khung.
- Mỗi loại lá có **1 màu nhận diện** (lấy từ ảnh bài thật), dùng cho viền mỏng và chấm màu:
  Bệnh Lý (đỏ), Thuốc (xanh dương), Triệu Chứng (cam), Liệu Pháp (xanh lá).
- Chữ nhỏ nhất **11px** (hiện có chỗ 8–9px, không đọc nổi trên điện thoại). Tên lá, tên người chơi không bị cắt thành `...`
  khi còn chỗ.
- Mục tiêu hợp lệ: làm mờ mọi thứ **không** phải mục tiêu (opacity 0.4) và nhấn mạnh mục tiêu. Không thêm nhãn chữ to kiểu
  "CHẠM ĐỂ ĐƯA BỆNH LÝ".
- Nút chính (Kết thúc lượt) luôn cùng một chỗ, cùng kích thước. Nút phụ (Đổi bài, Nhật ký, Thoát) gom vào menu "⋯".

**Tên tiếng Việt ở mọi nơi:**
- Bệnh Lý: `nameVi`.
- Thuốc: dùng đúng chữ in trên lá Việt hoá. Nếu lá in tên thuốc gốc (La-tinh) thì hiện tên đó kèm dòng tiếng Việt
  "Trị **Điên loạn** · Tác dụng phụ: **Chứng run**".
- Triệu Chứng, Liệu Pháp: tên đầy đủ, không viết tắt.
- Nhãn loại, nút, thông báo, nhật ký: 100% tiếng Việt. Không hiện id (`depression#5`) hay chữ tiếng Anh.

**Thuốc phải thấy tác dụng phụ ở mọi nơi:**
- Trên tay: dòng "Tác dụng phụ: Lo âu, Chứng run".
- Trong Thể Trạng (của mình và đối thủ): khi đã dùng Thuốc, hiện "mở cửa cho: Lo âu, Chứng run", tức là những Bệnh Lý người
  khác **có thể đưa** vào người này.
- Khi mình cầm lá Bệnh Lý: ghế nào đang "mở cửa" cho bệnh đó thì sáng lên (đã có qua `getValidTargets`).

---

## 5. Giai đoạn chi tiết

### D0 — Hạ tầng test + bản phác + tách ảnh (dừng chờ duyệt)
1. Việc nhỏ của T4b (mục 1): `isBot`, timeout test giả lập.
2. **Endpoint `/version`** trả `{ "commit": process.env.RENDER_GIT_COMMIT ?? "dev" }`. Agent dùng endpoint này để biết
   Render đã deploy đúng commit chưa.
3. **Bộ test trình duyệt** `scripts/e2e/` (mục 8.1).
4. **Tách ảnh bài**: bước 1 của D1, làm luôn ở đây vì bản phác cần ảnh thật.
5. **Trang bản phác** `/?mock=1`, bật cả trên Render để người dùng xem bằng điện thoại:
   - Dựng bàn chơi từ `playerView` **mẫu cố định**, không kết nối server.
   - Tham số: `players=2|3|4`, `hand=4|8|12`, `turn=me|other`. Mặc định `players=4&hand=8&turn=other`.
   - Dữ liệu mẫu có: Thuốc đã dùng, bệnh đã chữa, Lo âu đang lộ bài, một đối thủ là máy, một đối thủ mất kết nối,
     đồng hồ còn 0:42.
   - Chạm lá, nhấn giữ phóng to và xoay màn hình phải hoạt động; đánh bài thì không cần.
   - Làm theo khung D2 và quy tắc mục 4.
   - Sau D2, trang này dùng luôn làm nơi đo bố cục tự động (kịch bản S2).
6. Push → chờ deploy → chạy S0, S1, S2 trên URL thật. Chụp bản phác ở 4 kích thước để người quản lý xem (không
   commit ảnh). **DỪNG** chờ duyệt.

### D1 — Ảnh bài + dữ liệu hiển thị
1. **Tách ảnh** (đã làm ở D0; D1 chỉ sửa nếu bản phác lộ ra ảnh sai). Script chạy một lần, app không phụ thuộc vào nó lúc chạy:
   - Nguồn: `assets/card-photos/Side effects.pdf` (bản Việt hoá, 24 trang). Mỗi trang là 1 ảnh scan gồm **6 bản giống nhau
     của cùng 1 loại lá** (lưới 2×3). Trang 1 là mặt sau / lá "Bạn đang có triệu chứng".
   - Cắt **1 lá mỗi trang** theo toạ độ lưới (đo 1 lần, kiểm tra trên mọi trang). Lập bảng `trang → id lá` bằng cách **nhìn ảnh**,
     đối chiếu `cards.json`. Không đoán; trang nào không chắc thì ghi vào báo cáo.
   - Bỏ qua lá Gia Vị (không dùng trong MVP), nhưng vẫn ghi trang nào là Gia Vị.
   - Xuất `packages/client/public/cards/<id>.webp`, khoảng 300×420px, mỗi ảnh ≤ 60KB, và 1 ảnh mặt sau `back.webp`.
   - Script đặt ở `scripts/extract-cards.py` (Python + PyMuPDF + Pillow, chỉ để chạy tay trên máy dev). Ghi cách chạy trong
     README. Commit ảnh đã xuất; không bắt build Render phải chạy Python.
   - Làm **contact sheet** (tất cả ảnh + id bên dưới) để người quản lý duyệt nhanh. Không commit contact sheet.
2. **Service worker**: ảnh bài cache kiểu CacheFirst lúc chạy, không đưa vào precache nếu tổng > 1MB.
3. **Component `Card`** dùng chung: `size = mini | small | normal | zoom`.
   - `mini` / `small`: ảnh + tên tiếng Việt 1 dòng (ảnh nhỏ không đọc được chữ in).
   - `zoom`: ảnh to + khối chữ tiếng Việt: tên, loại, "Trị …", "Tác dụng phụ …", hình phạt đầy đủ (`punishment.textVi`).
   - Ảnh lỗi/chưa tải → khung màu theo loại + tên, không vỡ bố cục.
4. **Dữ liệu hiển thị**:
   - Hàm `getCardInfoVi(cardId)` trong `games/side-effects` trả về tên, loại, trị bệnh, tác dụng phụ, hình phạt (tiếng Việt).
   - Thay mọi chỗ đang hiện tên/nhãn tiếng Anh hoặc viết tắt.
   - Test: mọi `cardId` trong `cards.json` (trừ Gia Vị) đều có ảnh và có tên tiếng Việt.

### D2 — Bố cục mới + xếp bài + nhấn giữ phóng to
**Xếp bài:**
- **Bài tay — xếp so le**: các lá chồng lên nhau theo chiều ngang, chỉ lộ phần trái của lá (khoảng 40% chiều rộng). Khoảng
  lộ tự co theo số lá để **8–12 lá luôn vừa 1 hàng**, không cuộn. Lá đang chọn nhô lên và lộ hết.
- **Thể Trạng — xếp bậc thang**: mỗi ô là lá Bệnh Lý. Đã có Thuốc → lá Thuốc nằm **dưới**, lệch xuống ~22% để lộ dải tên
  Thuốc. Lá bị Liệu Pháp loại bỏ thì không còn trong Thể Trạng.
- **Ghế đối thủ**: Thể Trạng dạng bậc thang cỡ `mini`. Bài trên tay là chồng mặt sau kèm số lá.

**Thao tác:**
- **Chạm** = chọn / bỏ chọn / đánh vào mục tiêu (như hiện nay).
- **Nhấn giữ ≥ 400ms** lên bất kỳ lá nào (trên tay, Thể Trạng mình, Thể Trạng đối thủ, bài bị lộ) → mở `Card size=zoom`
  ở giữa màn hình. Thả tay hoặc chạm ra ngoài → đóng. Nhấn giữ **không** làm chọn lá. Rung nhẹ khi mở (nếu máy hỗ trợ).
  Trên máy tính: chuột phải hoặc giữ chuột để phóng to.
- Chặn menu ngữ cảnh / chọn chữ mặc định của trình duyệt khi nhấn giữ trên lá (`-webkit-touch-callout: none`,
  `user-select: none`).

**Khung dọc (375×667):**
```
┌──────────────────────────────┐
│ Lượt: Máy 2   ⏱ 0:42    ⋯   │  thanh trên 36px: lượt, đồng hồ, menu (Đổi bài, Nhật ký, Thoát)
├──────────────────────────────┤
│ Máy 1 · 5 lá   [bệnh][bệnh]… │  mỗi đối thủ 1 hàng (~72px): tên, số lá, Thể Trạng mini bậc thang
│ Bình  · 6 lá   [bệnh][bệnh]… │
│ Máy 2 · 4 lá   [bệnh][bệnh]… │
├──────────────────────────────┤
│ Rút 41 · Bỏ 12 · Đã đánh 1/2 │  dải giữa bàn 28px + dải thông báo sự kiện (D3)
├──────────────────────────────┤
│   Thể Trạng của bạn (4 ô)    │  lá small, bậc thang
├──────────────────────────────┤
│  bài tay xếp so le (≤12 lá)  │
│            [Kết thúc lượt]   │  nút chính cố định góc phải dưới
└──────────────────────────────┘
```

**Khung ngang (667×375): chia 2 cột, không chồng dọc:**
```
┌────────────────────┬─────────────────────────────┐
│ Lượt: Máy 2 ⏱0:42 ⋯│  Thể Trạng của bạn (4 ô)     │
├────────────────────┤                              │
│ Máy 1 · 5 lá       ├─────────────────────────────┤
│  [bệnh][bệnh]…     │  bài tay xếp so le           │
│ Bình · 6 lá        │                              │
│  [bệnh][bệnh]…     │                              │
│ Máy 2 · 4 lá       │           [Kết thúc lượt]    │
│  [bệnh][bệnh]…     │  Rút 41 · Bỏ 12 · 1/2        │
└────────────────────┴─────────────────────────────┘
   cột trái ~42%: thanh trên + đối thủ    cột phải ~58%: khu của mình
```
- Máy tính (≥ 1024px): bố cục ngang, bàn tối đa ~1200px, căn giữa, lá cỡ `normal`.
- Dải thông báo sự kiện (D3): ở dọc nằm dưới thanh trên; ở ngang nổi trên cột phải.

**Tiêu chí đo được** (agent tự đo bằng kịch bản S2; người quản lý đo lại. 4 kích thước 375×667, 667×375, 390×844, 844×390;
2, 3, 4 người; 4, 8, 12 lá trên tay):
- `scrollWidth <= innerWidth` và `scrollHeight <= innerHeight` (không cuộn trang ở bàn chơi).
- Mọi lá bài tay và nút Kết thúc lượt nằm trọn trong màn hình. Mỗi lá lộ ≥ 24px để chạm được.
- Mọi Bệnh Lý của mọi đối thủ đều thấy được, kèm tên tiếng Việt.
- Nhấn giữ mở phóng to; chạm thường không mở.
- Không còn chữ < 11px trong bàn chơi (đo bằng `getComputedStyle`).

### D3 — Thông báo sau mỗi hành động + nhịp của máy
**Sự kiện có cấu trúc:**
- Engine ghi `events` (tăng dần `seq`) bên cạnh `logs`. Mỗi sự kiện gồm: `type`, `actorId`, `targetId?`, `cardId?`,
  `disorderInstanceId?`, `detail?`.
- `playerView` chỉ gửi sự kiện người đó **được biết**. Ví dụ Lo âu: người ngoài thấy "An lấy 1 lá của Bình", còn tên lá chỉ
  An và Bình thấy. Viết test chống lộ cho điều này.

**Hiển thị ở client:**
- **Dải thông báo** 1 dòng, tiếng Việt, ~3 giây, dạng hàng đợi (không đè nhau). Ví dụ: "Máy 1 đánh Triệu Chứng vào
  **Lo âu** của **An** → An phải cho Máy 1 xem bài và mất 1 lá".
- **Hiệu ứng tại chỗ**: lá vừa đánh bay từ ghế người đánh tới mục tiêu (~400ms). Ô Bệnh Lý bị tác động nháy màu. Ghế bị hại
  rung nhẹ. Phải tôn trọng `prefers-reduced-motion`: khi bật thì chỉ đổi màu, không chuyển động.
- Sự kiện liên quan **mình** (bị đánh, bị đưa bệnh, bị lấy bài, có lời mời đổi bài) hiện đậm hơn và giữ lâu hơn (~5 giây).
- Nhật ký (menu ⋯) hiện đủ các câu tiếng Việt có tên người.

**Nhịp của máy:**
- Mỗi hành động của máy cách nhau **~2,5 giây** (ngẫu nhiên 2–3 giây), cấu hình được qua `botDelayMs`. Test đặt nhỏ để chạy
  nhanh.
- Máy đánh lá thứ 2 thì chờ thêm ~1 giây để người xem kịp đọc thông báo lá thứ 1.
- Máy chỉ bỏ bài / kết thúc lượt sau khi thông báo cuối cùng của nó đã hiện.
- Riêng Chứng run: máy là nạn nhân thì vẫn chọn bỏ bài trong hạn 7 giây.

**Tiêu chí:** kịch bản S6. 1 người + 3 máy chơi 5 lượt: mọi hành động của máy đều có dòng thông báo, không có hành động
nào "tự nhiên xảy ra" mà không có dòng thông báo.

### D4 — Đồng hồ lượt + thoát phòng
- Làm đúng mục 3.1 và 3.2 (đã chốt, đã có trong `side-effects-rules.md` mục 10).
- **Đồng hồ**:
  - Engine giữ `turnDeadline` / `turnRemainingMs` (khi tạm dừng) và action `TURN_TIMEOUT`, chạy qua hook
    `scheduledAction` (đã dùng cho Chứng run).
  - Server là trọng tài, client chỉ hiển thị theo `deadline` server gửi xuống.
  - Unit test bằng đồng hồ giả, không chờ 120 giây thật. Test đủ 4 bước hết giờ, tạm dừng khi chờ Chứng run, vắng mặt 2 lượt
    → máy thay → quay lại lấy ghế, và lời mời đổi bài tự huỷ sau 30 giây.
  - Giả lập 1000 ván (test cũ) vẫn qua: thêm một số ván có `TURN_TIMEOUT` ngẫu nhiên, bất biến 89 lá vẫn giữ.
- **Thoát**:
  - `room:leave` khi đang chơi → chuyển ghế thành máy (server).
  - Test: chủ phòng thoát; người thật cuối cùng thoát; thoát đúng lúc đang có `pendingChoice` của mình; resume bằng token cũ
    bị từ chối; "Về phòng chờ" bỏ máy chơi thay.
- **Giao diện**:
  - Đồng hồ trên thanh trên.
  - Menu ⋯ có "Thoát ván" kèm xác nhận.
  - Nhãn "vắng mặt / máy chơi thay" trên ghế; nút "Tôi quay lại" khi mình đang bị máy chơi thay.
  - Màn kết thúc có "Về phòng chờ" / "Thoát".

### D5 — Máy mức Khó (= T6b trong `PLAN.md`)
- Giữ nguyên yêu cầu T6b: ISMCTS chỉ dựa trên `playerView`; thắng máy Thường ≥ 60%; p95 ≤ 1 giây; chạy trong `worker_threads`.
- Phòng chờ: "Thêm máy" → chọn **Thường / Khó**. Tên máy: "Máy 1 (Khó)".
- Nhịp D3 vẫn áp dụng: nếu máy Khó tính nhanh hơn 2,5 giây thì vẫn chờ cho đủ.

---

### D6 — Âm thanh + rung (= T7 trong `PLAN.md`)
- Giữ nguyên yêu cầu T7: Web Audio tự tổng hợp hoặc file CC0; mở khoá âm thanh iOS ở lần chạm đầu; `navigator.vibrate` (iOS
  bỏ qua êm); nút bật/tắt âm và rung riêng, lưu localStorage.
- Gắn vào **sự kiện D3**, không tự so sánh `playerView` nữa:
  - đến lượt mình;
  - mình bị đánh / bị đưa bệnh / bị lấy bài;
  - đánh bài thành công;
  - có lời mời đổi bài;
  - 10 giây cuối đồng hồ lượt và đếm ngược Chứng run (tích tắc);
  - thắng / thua;
  - lỗi action.
- Test: unit test "sự kiện → âm nào". Thử tay trên Android (âm + rung) và iOS (âm) là việc của người dùng; agent ghi checklist.

### D7 — Mở lại 5–8 người (tuỳ chọn)
- Chỉ làm khi D0–D6 đạt.
- Bố cục D2 cho 5–7 đối thủ:
  - Dọc: đối thủ thành lưới 2 cột, mỗi ghế thu gọn còn tên + số lá + các Bệnh Lý dạng chấm màu có tên ngắn. Chạm ghế để mở
    chi tiết.
  - Ngang: cột trái cuộn được **bên trong**, trang vẫn không cuộn.
- Nâng `maxPlayers` lên 8. Luật "3 Bệnh Lý khi ≥ 6 người" đã có sẵn trong engine.
- Chạy lại S2 với 5–8 người. Test server: người thứ 9 bị từ chối.

---

## 6. Việc của người dùng (agent không làm được)
- Duyệt bản phác D0 trên điện thoại rồi báo agent làm tiếp.
- Sau D2 và sau D4: thử **2 điện thoại thật** chơi 1 ván với nhau (checklist agent ghi trong `result.md`).
- Sau D6: thử âm thanh / rung trên Android và iOS.
- (Tuỳ chọn) gắn tên miền riêng trên Render.

---

## 7. Quy trình cho agent ở mỗi giai đoạn

1. **Đọc**: `AGENTS.md`, `design.md` (file này), `side-effects-rules.md`, `PLAN.md` (mục T6b/T7 khi làm D5/D6).
2. **Làm theo bước nhỏ**, commit từng bước. Commit message tiếng Anh hoặc tiếng Việt **có dấu**.
3. **Kiểm tra ở máy**:
   - `pnpm build`, `pnpm lint`, `pnpm test` đều qua (kể cả test giả lập 1000 ván).
   - `pnpm build`, rồi chạy server local (`PORT=3456 pnpm start`), chạy các kịch bản mục 8 dành cho giai đoạn đó với
     `--url http://localhost:3456`.
4. **Tự push** (được phép): `git push origin main`.
   - **Không** force push, không rewrite history, không `git reset --hard` thay đổi chưa commit của người khác.
   - Chỉ push khi bước 3 qua hết.
   - Mỗi lần push, Render deploy lại và **các phòng đang chơi trên URL thật sẽ mất**. Gom thay đổi, mỗi giai đoạn push 1–3 lần.
   - Push lỗi vì xác thực → ghi lệnh vào `result.md` cho người dùng tự push, rồi chạy tiếp mục 5 khi người dùng báo đã push.
     Không đoán.
5. **Chờ Render deploy**: gọi `GET https://boardgame-02k2.onrender.com/version` mỗi 20 giây, tối đa 15 phút, cho tới khi
   `commit` = `git rev-parse HEAD`. Quá 15 phút → ghi "Render chưa deploy xong", không coi là đạt.
6. **Test trên URL thật**: chạy lại các kịch bản mục 8 có đánh dấu 🌐 với `--url https://boardgame-02k2.onrender.com`. Lần gọi
   đầu có thể mất ~1 phút nếu server đang ngủ.
7. **Báo cáo**: ghi đè `result.md`.
   - Dòng đầu: `Trạng thái: XONG D<n> | Commit: <hash> | Deploy: <commit trên /version>`, hoặc `DỪNG — …`.
   - Có bảng kết quả từng kịch bản (local / URL thật) kèm **số đo thật**.
   - Bước nào không chạy được thì ghi "không kiểm tra được" + lý do, **không** ghi ✅.
   - Thêm 1 dòng nhật ký vào `work_progress.md`.
8. Sang giai đoạn tiếp theo. Riêng D0 thì dừng chờ duyệt.

Được thêm **1 devDependency**: `playwright-core` (ở root, **không** tải trình duyệt; dùng Chrome có sẵn qua biến
`CHROME_PATH`, mặc định `C:/Program Files/Google/Chrome/Application/chrome.exe`). Ngoài ra không thêm thư viện nào khác.

---

## 8. Kịch bản test trình duyệt

### 8.1. Hạ tầng (làm ở D0)
- Thư mục `scripts/e2e/`, chạy bằng `pnpm e2e --url <URL> [--only S2,S5] [--headed]`. **Không** nằm trong `pnpm test`, vì cần
  Chrome và server đang chạy.
- Helper dùng chung:
  - `newPlayer(browser, viewport)`: mỗi người chơi là 1 `browser.newContext({ viewport, isMobile: true, hasTouch: true })`,
    tương đương 1 cửa sổ ẩn danh riêng.
  - `createRoom(name)`, `joinByLink(roomCode, name)`, `addBots(n, level)`, `startGame()`, `waitMyTurn()`.
  - `playOne(kind)` với `kind` là `treat | therapy | episode | give`: chọn lá, chạm mục tiêu, kiểm tra số lá trên tay giảm.
  - `measureLayout()`: trả `scrollWidth`, `scrollHeight`, `innerWidth`, `innerHeight`, số lá tay nằm trọn trong màn hình,
    `bottom` của nút Kết thúc lượt, số Bệnh Lý thấy được trên từng ghế, cỡ chữ nhỏ nhất, số emoji trong bàn chơi.
  - `rotate(page)`: đổi `setViewportSize` dọc ↔ ngang.
- Giữ nguyên `data-testid`: `hand-card-*`, `end-turn-button`, `opponent-seat-*`, `psyche-slot-*`. Thêm `event-banner`,
  `turn-timer`, `menu-button`, `card-zoom`.
- Ảnh chụp lưu ra thư mục tạm của hệ điều hành, **không** commit.
- Script in bảng kết quả dạng Markdown để dán thẳng vào `result.md`.

### 8.2. Danh sách kịch bản
🌐 = chạy cả trên URL thật sau khi deploy. Cột "Từ" là giai đoạn bắt đầu phải qua kịch bản đó; từ đó về sau mọi giai đoạn đều
phải chạy lại.

| ID | Từ | Kịch bản | Đạt khi |
|---|---|---|---|
| S0 🌐 | D0 | Deploy | `/healthz` 200; `/version` = HEAD; `/robots.txt` có `Disallow: /`; `/.env`, `/../package.json`, file PDF trả 403/404 |
| S1 🌐 | D0 | Trang chủ + phòng chờ ở 320×568, 375×667, 667×375 | Không tràn ngang; tạo phòng; link mời dùng đúng domain đang chạy; vào bằng link điền sẵn mã; đủ 4 người thì người thứ 5 bị từ chối kèm thông báo tiếng Việt |
| S2 🌐 | D0 (bản phác), D2 (thật) | Bố cục trên `/?mock=1`: 4 kích thước × `players` 2/3/4 × `hand` 4/8/12 | Mọi tiêu chí đo được của D2; không lỗi console |
| S3 🌐 | D1 | Ảnh + chữ | Mọi `<img>` lá bài có `naturalWidth > 0`; không còn `T/CHỨNG`, `L/PHÁP`, id dạng `abc#5`; lá Thuốc có chữ "Tác dụng phụ"; `/?mock=1` không có chữ tiếng Anh ngoài tên thuốc và tên người |
| S4 🌐 | D2 | Chạm và nhấn giữ | Chạm 100ms → lá được chọn, không mở phóng to; giữ 600ms → `card-zoom` hiện, lá không bị chọn; chạm ra ngoài → đóng |
| S5 🌐 | D2 | Ván thật: 2 người thật (2 context) + 2 máy | Mỗi người đánh được ít nhất 1 lá mỗi loại có trên tay (Thuốc, Liệu Pháp, Triệu Chứng, đưa Bệnh Lý); người kia thấy thay đổi trong ≤ 3 giây; không lỗi console |
| S6 🌐 | D3 | 1 người + 3 máy, 5 vòng | Mỗi hành động của máy có 1 dòng `event-banner` tiếng Việt; khoảng cách giữa 2 hành động của máy ≥ 2 giây; số dòng thông báo = số hành động trong nhật ký |
| S7 | D3 | Chống lộ thông tin (socket) | Trong mọi `game:view` của người A không có `cardId` bài trên tay người khác (trừ `revealedHand` hợp lệ); sự kiện Lo âu chỉ lộ tên lá cho 2 người liên quan |
| S8 🌐 | D2 | Xoay máy giữa ván | Chọn lá → xoay ngang → vẫn chọn; không hiện "mất kết nối"; đo lại vẫn đạt tiêu chí D2 |
| S9 | D4 | Đồng hồ lượt (server local với `TURN_TIMEOUT_SECONDS=5`) | Không làm gì → sau ~5 giây tự kết thúc lượt; tay 8 lá → còn 6; người kia thấy `turn-timer` đếm ngược; 2 lượt vắng → ghế hiện "máy chơi thay"; resume → lấy lại ghế ở lượt sau |
| S9b 🌐 | D4 | Đồng hồ trên URL thật | `turn-timer` bắt đầu ~2:00 và giảm dần (chỉ quan sát 10 giây, không chờ hết giờ) |
| S10 🌐 | D4 | Thoát ván | Khách thoát giữa ván → ghế thành máy, ván tiếp tục, khách về trang chủ, resume bằng token cũ bị từ chối; chủ phòng thoát → người khác thành chủ phòng; mọi người thật thoát → sau 5 phút phòng bị xoá (local, rút ngắn bằng biến test) |
| S11 | D4 | Hết ván (local, `botDelayMs` nhỏ) | 1 người + 3 máy chơi tới khi có người thắng; hiện màn kết thúc; "Về phòng chờ" đưa cả phòng về phòng chờ, bỏ máy chơi thay; "Thoát" về trang chủ |
| S12 🌐 | D5 | Máy Khó | Phòng chờ chọn được "Khó"; 1 người + 3 máy Khó chơi 3 vòng; trong lúc máy tính, ack của `room:state` / action của người thật ≤ 300ms |
| S13 | D0 | Server chịu lỗi (socket) | Gửi sự kiện sai định dạng, thiếu ack, sai quyền → bị từ chối, server không sập (giống test cũ) |
| S14 🌐 | D6 | Âm thanh | Bật/tắt lưu qua F5; khi tắt không gọi `AudioContext`/`vibrate` (kiểm bằng spy trong trang) |

### 8.3. Cách báo kết quả
Bảng trong `result.md`:

| ID | Local | URL thật | Số đo / ghi chú |
|---|---|---|---|

Ví dụ ô ghi chú: `667×375, 4 người, 12 lá: sw=667, sh=375, 12/12 lá trong màn hình, nút KT lượt bottom=361`.

---

## 9. Không làm trong đợt này
- Kéo-thả lá bài (vẫn chạm để chọn → chạm mục tiêu).
- Lá Gia Vị, chế độ khán giả, chat, tài khoản, lưu phòng ra database.
- Thêm thư viện UI/animation. Hiệu ứng làm bằng CSS transition / Web Animations API có sẵn.

