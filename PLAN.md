# Kế hoạch: Nền tảng board game online — game đầu tiên: Side Effects

> Tài liệu điều phối. Mỗi **Task** bên dưới là một yêu cầu giao cho một agent riêng; agent chỉ làm đúng phạm vi
> task, đọc các file được liệt kê ở mục "Đầu vào", và trả kết quả theo "Tiêu chí hoàn thành".
> Luật chơi chuẩn: [side-effects-rules.md](side-effects-rules.md).

---

## 1. Quyết định đã chốt

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Nền tảng | **Web mobile-first (PWA)** | Bạn bè vào bằng link/QR, không cần cài app, 1 code cho iOS + Android |
| Chế độ chơi MVP | **Online theo phòng**, mỗi người 1 điện thoại, **tạm thời 2–4 người** (tính cả máy) | Bài trên tay là bí mật → mỗi người cần màn hình riêng; 4 ghế để bàn chơi dạng sòng bài hiện đủ mọi người trên 1 màn hình. Engine vẫn giữ luật 6–8 người để mở lại sau |
| Hướng màn hình | Dọc và ngang đều chơi được, theo cách người dùng cầm máy | Màn hình ngang rộng hơn, dễ bày bàn chơi |
| Người dùng | Nhóm bạn test, **chưa phát hành rộng** | Không cần tài khoản/đăng nhập, chỉ nhập tên + mã phòng |
| Dữ liệu lá bài | **Chụp ảnh bộ bài thật** rồi chép thành JSON | App giống bản gốc; chỉ dùng nội bộ |
| Chi phí | Miễn phí, tên miền rẻ là tuỳ chọn | Dùng hosting free tier |

## 2. Kiến trúc & công nghệ

- **Ngôn ngữ**: TypeScript toàn bộ (client + server dùng chung logic game).
- **Monorepo** (pnpm workspaces):
  ```
  packages/
    core/           # Interface chung cho mọi game: GameDefinition, state, action, validate, playerView
    games/
      side-effects/ # Luật Side Effects: setup, reducer, validate, playerView, dữ liệu cards.json
    server/         # Node + Socket.IO: quản lý phòng, nhận action, chạy engine, gửi state đã lọc
    client/         # React + Vite + PWA: sảnh, phòng chờ, bàn chơi (UI riêng cho từng game)
  ```
- **Server là trọng tài (authoritative)**: client chỉ gửi *action*; server validate bằng engine, cập nhật state,
  rồi gửi cho từng người **playerView** (ẩn bài trên tay người khác, ẩn chồng rút).
- **Engine là hàm thuần (pure)**: `(state, action, rng) → newState | error` → test được bằng unit test, không phụ
  thuộc mạng. Thêm game mới = thêm một thư mục trong `games/` implement interface của `core`.
- **Lựa chọn tương tác**: một số hình phạt cần người chơi chọn (vd. kẻ tấn công rút ngẫu nhiên 3 lá, chọn Thuốc để
  Kháng Thuốc). Engine có trạng thái `pendingChoice` chờ đúng người chọn rồi mới chạy tiếp.
- **Lưu trạng thái**: MVP giữ state phòng trong RAM server; người chơi reload trang được phép vào lại bằng
  `playerToken` lưu ở localStorage. Server khởi động lại thì mất ván đang chơi (chấp nhận được khi test).
- **Hosting**: 1 service Node trên **Render free tier** (phục vụ cả file tĩnh của client lẫn WebSocket).
  Lưu ý free tier "ngủ" sau ~15 phút không dùng → lần mở đầu chờ ~30–60 giây. Tên miền riêng: tuỳ chọn.

## 3. Lộ trình

| Giai đoạn | Nội dung | Task |
|---|---|---|
| 0 | Dữ liệu lá bài | T0 (có thể chạy song song với T1–T2) |
| 1 | Nền móng + engine Side Effects (chưa có UI) | T1, T2 |
| 2 | Server phòng online | T3 |
| 3 | UI mobile chơi được | T4 |
| 3b | Bàn chơi dạng sòng bài + xoay ngang | T4b |
| 4 | Deploy + test với bạn bè | T5 |
| 4b | Người chơi máy: mức **Thường** (theo quy tắc) và **Khó** (AI tìm kiếm) | T6a, T6b |
| 4c | Âm thanh + rung | T7 |
| 5 | Sau MVP: lá "Gia Vị", animation, game thứ 2 | — |

Thứ tự phụ thuộc: `T1 → T0 → T2 → T3 → T4 → T6a → T6b`; `T5` và `T7` chỉ cần `T4`, làm xen kẽ được.
`T4b` làm ngay sau `T5`, trước `T7` (T7 gắn âm thanh vào giao diện nên cần bố cục mới ổn định trước).
Đã có PDF bộ bài nên T0 chạy ngay sau T1; T2 dùng `cards.json` thật (không cần `cards.sample.json`).

---

## 4. Task giao cho agent

### T0 — Chép dữ liệu lá bài từ ảnh
- **Đầu vào**: PDF bộ bài Việt hoá + bản Print & Play tiếng Anh trong `assets/card-photos/`, [side-effects-rules.md](side-effects-rules.md).
- **Việc cần làm**: tạo `packages/games/side-effects/src/data/cards.json` theo schema:
  ```jsonc
  {
    "disorders": [{ "id": "anxiety", "nameEn": "Anxiety", "nameVi": "…", "count": 0,
                    "punishment": { "textVi": "…", "effect": { "type": "…", "params": {} } } }],
    "drugs":     [{ "id": "…", "name": "…", "treats": "anxiety", "sideEffects": ["impotence", "…"], "count": 0 }],
    "episodes":  { "count": 0 },
    "therapies": { "count": 0 },
    "spice":     { "highTolerance": 0, "misdiagnosis": 0 }
  }
  ```
- Mỗi hình phạt phải được quy về một `effect.type` có thể code được (vd. `REVEAL_HAND_TO_ATTACKER`,
  `ATTACKER_TAKES_RANDOM_CARDS {n}`, `DISCARD_CARDS {n}`, `SKIP_TURN`…). Lập bảng liệt kê tất cả effect type.
- **Không đoán**: chữ nào mờ/không rõ → ghi vào `cards-todo.md`, không tự bịa nội dung.
- **Tiêu chí hoàn thành**: tổng số lá khớp bộ bài thật; mọi `treats`/`sideEffects` trỏ tới id tồn tại
  (kèm script kiểm tra); danh sách effect type đầy đủ.

### T1 — Khởi tạo monorepo + package `core`
- **Việc cần làm**: pnpm workspace, TypeScript strict, ESLint, Vitest; thư mục như mục 2.
- `core` định nghĩa interface:
  ```ts
  interface GameDefinition<S, A, V> {
    id: string; minPlayers: number; maxPlayers: number;
    setup(playerIds: string[], options: unknown, rng: Rng): S;
    validate(state: S, playerId: string, action: A): string | null; // null = hợp lệ
    apply(state: S, playerId: string, action: A, rng: Rng): S;
    playerView(state: S, playerId: string): V;
    winner(state: S): string | null;
  }
  ```
  và `Rng` có seed (để test tái lập được).
- **Tiêu chí hoàn thành**: `pnpm build`, `pnpm lint`, `pnpm test` chạy thành công; có 1 game mẫu nhỏ trong test để kiểm interface.

### T2 — Engine Side Effects
- **Đầu vào**: [side-effects-rules.md](side-effects-rules.md), interface `core`, `cards.json` (nếu T0 chưa xong → dùng file dữ liệu mẫu `cards.sample.json`, cùng schema).
- **Action tối thiểu**: `TREAT` (Thuốc → Bệnh Lý của mình), `GIVE_DISORDER` (Bệnh Lý từ tay → Thể Trạng người khác),
  `THERAPY`, `EPISODE`, `RESOLVE_CHOICE`, `END_TURN`, `DISCARD` (khi >6 lá), `PROPOSE_TRADE` / `RESPOND_TRADE`
  (Thương Lượng: đổi bài trên tay giữa 2 người, cả 2 phải đồng ý, làm được cả ngoài lượt, **không** tính vào 2 lá đánh ra).
- **Chỉ luật base**: không làm lá Gia Vị (High Tolerance, Misdiagnosis) trong MVP.
- **Luật bắt buộc test**: chia bài không trùng (3 Bệnh Lý khi ≥6 người); rút 2 lá, tối đa 2 lá mỗi lượt, giới hạn 6
  lá cuối lượt; không trùng Bệnh Lý trong Thể Trạng (kể cả đã điều trị); điều kiện đưa Bệnh Lý = có Thuốc với tác
  dụng phụ tương ứng; Episode chỉ vào Bệnh Lý chưa điều trị; Tremors không dùng Liệu Pháp được; Anorexia không có
  Thuốc; hết chồng rút → xáo discard; thắng khi mọi Bệnh Lý đã có Thuốc hoặc đã bị loại bỏ.
- `playerView` không bao giờ lộ bài trên tay người khác (chỉ số lượng) và thứ tự chồng rút.
- **Tiêu chí hoàn thành**: unit test cho từng luật trên + 1 test giả lập ván đầy đủ bằng action ngẫu nhiên hợp lệ
  (1000 ván không crash, không vi phạm bất biến).

### T3 — Server phòng online
- **Việc cần làm**: Node + Socket.IO. Tạo phòng (mã 4–6 ký tự), vào phòng bằng tên, host bắt đầu ván, gửi action,
  broadcast `playerView` riêng cho từng người, reconnect bằng `playerToken`, dọn phòng không hoạt động sau 2 giờ.
- Server phục vụ luôn file build của client (1 service duy nhất khi deploy).
- **Tiêu chí hoàn thành**: integration test 3 client giả lập chơi hết 1 ván; action sai luật bị từ chối với thông
  báo lỗi; client ngắt kết nối rồi vào lại vẫn tiếp tục được.

### T4 — Client mobile (React + Vite + PWA)
- **Màn hình**: Trang chủ (tạo/vào phòng) → Phòng chờ (danh sách người, nút bắt đầu, link + QR mời) → Bàn chơi → Kết quả.
- **Bàn chơi (màn hình dọc ~375px)**: Thể Trạng của mình ở dưới cùng; bài trên tay dạng quạt/cuộn ngang; đối thủ
  dạng hàng thu gọn ở trên, chạm để xem chi tiết Thể Trạng và hình phạt; đánh bài bằng chạm lá → chạm mục tiêu
  (không kéo-thả ở MVP); chỉ highlight mục tiêu hợp lệ (dùng `validate` của engine); log sự kiện ngắn; hộp thoại
  khi có `pendingChoice`.
- Giao diện tiếng Việt; tên bệnh hiển thị theo `nameVi`.
- **Tiêu chí hoàn thành**: `pnpm lint` + `pnpm build` thành công; chơi được 1 ván với 3 tab trình duyệt ở chế độ
  mobile; cài được lên màn hình chính trên Android Chrome và iOS Safari.

### T4b — Bàn chơi dạng sòng bài + xoay ngang
- **Mục tiêu**: nhìn một lần thấy hết mọi thông tin mình được biết — toàn bộ bài trên tay mình và Thể Trạng công khai
  của tất cả người chơi — không phải chạm mở từng người hay cuộn ngang.
- **Bố cục sòng bài** (mặt bàn nhìn từ trên xuống, tối đa 4 ghế):
  - Mình ở cạnh dưới. Đối thủ xếp quanh bàn theo **thứ tự lượt chơi** (người đi sau mình ngồi kế bên trái, tiếp tục theo
    chiều kim đồng hồ): 1 đối thủ → trên; 2 đối thủ → trái, phải (hoặc trên-trái, trên-phải khi màn hình dọc); 3 đối thủ → trái, trên, phải.
  - Mỗi ghế đối thủ **luôn hiện đủ**: tên, 🤖 nếu là máy, trạng thái mất kết nối, dấu "đang đến lượt", số lá trên tay (mặt úp,
    chỉ số lượng), **từng Bệnh Lý** trong Thể Trạng (tên tiếng Việt; chưa chữa / đã có Thuốc nào / đã loại bỏ bằng Liệu Pháp).
    Chạm vào ghế vẫn mở được chi tiết (hình phạt đầy đủ).
  - Khi đang chọn lá bài: mục tiêu hợp lệ sáng lên **ngay trên ghế/Bệnh Lý** của đối thủ (thay cho hàng đối thủ thu gọn hiện nay).
  - Giữa bàn: chồng rút, chồng bỏ (số lá), lượt của ai, số lá đã đánh `x/2`, nút Kết thúc lượt / Đổi bài / Nhật ký.
  - Khu của mình: Thể Trạng + **toàn bộ bài trên tay hiện cùng lúc** (thu nhỏ, xếp lấn kiểu quạt hoặc 2 hàng khi nhiều lá;
    tên lá vẫn đọc được; chạm lá để chọn/phóng to). Không dùng cuộn ngang để giấu lá.
  - Chỉ dùng dữ liệu `playerView` đã có. **Không** thêm thông tin vào `playerView`, không sửa engine/server.
- **Xoay màn hình**:
  - Bỏ khoá `orientation: portrait` trong manifest PWA; bỏ giới hạn chiều rộng 480px ở bàn chơi.
  - Dọc: bàn sòng bài thu gọn. Ngang: bàn trải rộng, khu của mình ở dưới hoặc bên cạnh — vừa trong 1 màn hình, không phải cuộn
    cả trang để thấy bài tay và nút Kết thúc lượt.
  - Xoay máy giữa ván: không mất lá đang chọn, không kết nối lại.
  - Tôn trọng vùng tai thỏ (`env(safe-area-inset-*)`) khi ngang.
  - Các hộp thoại (Lo âu, Chứng run, đổi bài, bỏ bài, thắng/thua) vừa màn hình ngang thấp (~375px chiều cao), cuộn bên trong được.
  - Trang chủ, phòng chờ: dùng được cả hai chiều (chỉ cần không vỡ, không phải thiết kế lại).
  - Ưu tiên CSS (`@media (orientation: landscape)`, flex/grid); không thêm thư viện.
- **Chung vs riêng**: bố cục sòng bài nằm trong `client/src/games/side-effects/`; phần chung (khung trang, safe-area,
  bỏ giới hạn chiều rộng) nằm ở `client/src/app` hoặc `index.css`.
- **Tiêu chí hoàn thành**: build/lint/test pass; unit test hàm xếp ghế theo thứ tự lượt (2, 3, 4 người, mình ở mọi vị trí);
  kiểm tra thủ công ở 375×667, 667×375, 390×844, 844×390 với 2, 3 và 4 người (1 người + máy): thấy đủ bài tay + mọi Bệnh Lý
  công khai mà không cuộn/không chạm mở, đánh được Thuốc / Triệu Chứng / Liệu Pháp / đưa Bệnh Lý bằng chạm, xoay máy giữa ván không lỗi.

### T5 — Deploy
- **Việc cần làm**: Dockerfile hoặc build script cho Render; biến môi trường; hướng dẫn deploy trong `README.md`;
  (tuỳ chọn) gắn tên miền riêng.
- **Tiêu chí hoàn thành**: URL công khai chạy được; 2 điện thoại thật chơi được 1 ván với nhau.

### T6 — Người chơi máy (bot)
Người dùng chọn độ khó cho từng máy: **Thường** (mức 2) hoặc **Khó** (mức 3).

Nguyên tắc chung:
- **Không gian lận**: bot chỉ nhận `playerView` của chính nó (giống người thật), không bao giờ đọc full state.
- **Chung vs riêng**: chiến thuật nằm trong `games/<game>` (vd. `GameDefinition.bots?: { level, labelVi, chooseAction(view, playerId, rng) }[]`);
  "ghế máy" trong phòng, hẹn giờ ra quyết định, gửi action qua `runAction` nằm ở `server` — không biết luật game.
- Bot đánh chậm 1–2 giây mỗi action để người thật theo dõi; tự xử lý `pendingChoice` (Lo âu, Chứng run trong thời hạn),
  lời mời đổi bài, bỏ bài khi > 6.
- UI phòng chờ: chủ phòng "Thêm máy" → chọn độ khó → máy hiện tên vd. "Máy 1 (Khó)"; xoá được máy trước khi bắt đầu;
  tổng người + máy ≤ `maxPlayers`. Chơi 1 người + máy được (đủ `minPlayers` tính cả máy).

**T6a — Hạ tầng ghế máy + mức Thường (theo quy tắc)**
- Chiến thuật ưu tiên: chữa bệnh của mình (Thuốc/Liệu Pháp, ưu tiên bệnh có hình phạt nặng với mình); đánh Triệu Chứng / đưa Bệnh Lý
  vào người **gần thắng nhất**, chọn hình phạt gây hại nhất; tránh dùng Thuốc mở "cửa" tác dụng phụ khi đối thủ đang cầm bệnh đó
  (ước lượng từ thông tin công khai); bỏ lá ít giá trị; từ chối đổi bài bất lợi.
- **Tiêu chí**: giả lập ≥ 1000 ván không crash; bot Thường thắng bot ngẫu nhiên ≥ 80% (ván 1 chọi 1, đổi chỗ ngồi);
  test server: 1 client + 2 máy chơi hết 1 ván; test không gian lận (bot không nhận được state đầy đủ).

**T6b — Mức Khó (AI tìm kiếm, thông tin ẩn)**
- Determinized MCTS / ISMCTS: mỗi lần ra quyết định, sinh nhiều "thế giới giả định" (chia ngẫu nhiên phần bài chưa thấy vào tay
  đối thủ/chồng rút, **chỉ** dựa trên `playerView` + lá đã lộ công khai), mô phỏng bằng engine (`validate`/`apply`) với
  rollout theo chiến thuật Thường, chọn nước có kết quả tốt nhất.
- Giới hạn thời gian mỗi quyết định (vd. ≤ 1 giây) và **không chặn event loop** của server (chạy trong `worker_threads`
  hoặc chia nhỏ); giới hạn số bot Khó tính đồng thời nếu cần để hợp với Render free tier.
- **Tiêu chí**: bot Khó thắng bot Thường ≥ 60% (≥ 500 ván 1 chọi 1, đổi chỗ ngồi); thời gian quyết định p95 ≤ 1 giây;
  server vẫn phản hồi người thật bình thường khi có bot Khó đang tính.

### T7 — Âm thanh + rung
- **Âm thanh**: tạo bằng Web Audio API (tổng hợp sóng âm, không cần file) hoặc file ngắn giấy phép CC0 trong `assets/`;
  không dùng âm thanh có bản quyền. iOS chỉ phát âm thanh sau lần chạm đầu tiên → "mở khoá" audio khi người dùng chạm lần đầu.
- **Rung**: `navigator.vibrate` (Android Chrome). iOS Safari **không hỗ trợ** → bỏ qua êm, không báo lỗi.
- **Sự kiện** (cả hai dựa trên thay đổi `playerView`, chỉ ở client): đến lượt mình; mình bị đánh Triệu Chứng / bị đưa
  Bệnh Lý; đánh bài thành công; có lời mời đổi bài; đếm ngược Chứng run (tích tắc 3 giây cuối); thắng / thua; lỗi action.
- **Cài đặt**: nút bật/tắt âm thanh và rung riêng, lưu localStorage; mặc định bật; tôn trọng `prefers-reduced-motion` cho rung.
- **Phân tách**: module chung `client/src/app/feedback/` (phát âm, rung, cài đặt); game Side Effects chỉ khai báo sự kiện nào → âm nào.
- **Tiêu chí**: unit test logic phát hiện sự kiện từ 2 view liên tiếp; thử thật trên Android (âm + rung) và iOS (âm).

---

## 5. Quy tắc chung cho mọi agent
- Luật chơi lấy **duy nhất** từ [side-effects-rules.md](side-effects-rules.md). Luật chưa rõ → dừng và báo, không tự đặt luật.
- Không thêm thư viện ngoài danh sách (React, Vite, vite-plugin-pwa, Socket.IO, Vitest, ESLint, Prettier, typescript-eslint, qrcode) nếu chưa hỏi.
  Bot dùng module có sẵn của Node (`worker_threads`), không cần thư viện AI.
- Giữ nguyên tiếng Việt có dấu trong mọi text hiển thị.
- Kết thúc task: báo cáo file đã thay đổi, lý do, và kết quả lint/build/test.

## 6. Việc người dùng cần làm / cần xác nhận
1. (Để sau, không chặn T1–T5) Chụp ảnh **tất cả các loại lá bài** (mỗi loại khác nhau 1 ảnh rõ chữ, ghi số lượng mỗi loại) → bỏ vào `assets/card-photos/`.
2. ✅ Điều kiện thắng: *mọi Bệnh Lý trong Thể Trạng đều có Thuốc hoặc đã bị Liệu Pháp loại bỏ*.
3. ✅ MVP làm đúng luật base (gồm cả Thương Lượng), chưa có lá Gia Vị.
