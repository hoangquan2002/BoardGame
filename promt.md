# Prompt cho agent

> File này chỉ chứa: (1) việc còn tồn từ task trước, (2) yêu cầu task hiện tại. Làm **cả hai** phần, Phần 1 trước.
> Dòng đầu tiên của `result.md` khi xong: `Trạng thái: XONG | Task: T5 | Commit cuối: <hash>` (hoặc `DỪNG — xong bước X/Y` / `DỪNG — cần hỏi`).
> **Trung thực trong báo cáo** (`AGENTS.md`): bước nào không thực sự chạy được thì ghi "không kiểm tra được" + lý do, **không** ghi ✅.

## Phần 1 — Việc còn tồn (từ review T6a + yêu cầu mới)
Người quản lý đã review T6a: đạt. Còn 2 lỗi nhỏ và 1 yêu cầu mới, mỗi mục 1 commit + test.
(Mục 1, 2 đã có commit `b40797c`, `bf5f755` — chỉ cần làm tiếp mục 3.)
1. **Mức "random" bị lộ qua socket**: gửi thẳng `room:addBot { level: 'random' }` thì server nhận và tạo "Máy 2 (Ngẫu nhiên)".
   Theo yêu cầu T6a, mức random chỉ dùng cho test. Sửa: bỏ `random` khỏi `sideEffectsGame.bots` (test vẫn import thẳng
   `chooseRandomAction`). Thêm test server: `addBot { level: 'random' }` bị từ chối.
2. **Tên máy có thể trùng**: tên đang là `Máy ${số máy hiện có + 1}`. Có Máy 1, Máy 2 → xoá Máy 1 → thêm máy mới thì lại ra
   "Máy 2". Sửa: dùng số nhỏ nhất chưa có. Thêm test cho đúng tình huống này.
3. **Tạm giới hạn tối đa 4 người** (tính cả máy) — để chuẩn bị bàn chơi dạng sòng bài (T4b):
   - `sideEffectsGame.maxPlayers`: 8 → 4.
   - **Giữ nguyên** luật "3 Bệnh Lý khi ≥ 6 người" trong `setup.ts` và test của nó (luật vẫn đúng, chỉ tạm chưa dùng).
   - Phòng chờ đang hard-code `x/8` (`LobbyRoomPage.tsx`) → lấy từ `maxPlayers`, không hard-code số.
     Đủ 4 người thì nút "Thêm máy" bị vô hiệu hoá.
   - Người thứ 5 vào phòng → bị từ chối, client hiện thông báo tiếng Việt (vd. "Phòng đã đủ 4 người").
   - Test server: người thứ 5 `join` bị từ chối; `addBot` khi đủ 4 bị từ chối. Sửa test "phòng đầy 8 người" hiện có trong
     `server.test.ts` cho khớp. Kiểm tra các test/giả lập khác có tạo phòng > 4 người qua server không.
   - README ghi số người chơi thì sửa thành 2–4.

---

## Phần 2 — Task T5: Deploy lên Render

### Đọc trước
- `AGENTS.md`; `PLAN.md` mục T5; `README.md`; `packages/server/src/index.ts` và `server.ts` (phục vụ file tĩnh, `/healthz`, `PORT`).

### Bối cảnh
- Repo GitHub **private** `hoangquan2002/BoardGame` đã có (đang trống). Tài khoản Render đã nối GitHub. Repo local chưa có remote,
  nhánh hiện tại là `master`.
- Gói **Free** của Render: tự ngủ sau ~15 phút không có truy cập, lần mở đầu mất khoảng 1 phút để khởi động lại. Phòng chơi lưu trong RAM
  nên sẽ mất khi server ngủ hoặc khi deploy lại. Chấp nhận được, nhưng phải ghi rõ trong README.
- **Chỉ 1 instance**, vì phòng nằm trong bộ nhớ. Không thêm Redis hay database.

### Việc cần làm
1. **Cấu hình build/chạy cho Render** (không thêm thư viện, ưu tiên giải pháp đơn giản nhất):
   - Ghim phiên bản: thêm trường `packageManager` (pnpm, đúng bản đang dùng) vào `package.json` gốc để Corepack cài đúng pnpm.
     Phiên bản Node để Render dùng phải khớp `.nvmrc` / `engines`.
   - Thêm `render.yaml` (Blueprint), 1 web service:
     - `runtime: node`, `plan: free`
     - `buildCommand`: dùng corepack + `pnpm install --frozen-lockfile` + `pnpm build`
     - `startCommand: pnpm start`
     - `healthCheckPath: /healthz`
     - Biến môi trường cần thiết (Node version, `NODE_ENV=production` nếu có tác dụng thật)

     Tự tra tài liệu Render để dùng đúng tên trường. Không chắc trường nào thì ghi vào "Vấn đề / câu hỏi còn mở", không đoán.
   - Server phải nghe đúng `PORT` do Render cấp, trên mọi interface. Kiểm tra lại, sửa nếu cần.
2. **Kiểm tra bản build sạch giống môi trường Render**: `git clone` repo local sang một thư mục tạm → chạy đúng `buildCommand` và
   `startCommand` ở trên với `PORT=10000` → `/healthz` trả 200, trang chủ mở được, tạo phòng được. Việc này để bắt lỗi
   "thiếu file chưa commit" và lỗi "chạy được nhờ `dist` có sẵn trên máy".
3. **An toàn nội dung**: server chỉ phục vụ `packages/client/dist`. Kiểm tra (và ghi vào báo cáo) rằng `/assets/card-photos/...pdf`,
   `/assets/rule/...pdf`, `/../../package.json`, `/.env` đều **không** tải được. Không có secret nào trong repo (`git grep` token/key).
4. **Chạy đúng sau khi deploy**:
   - Link mời và mã QR dùng domain đang chạy (không phải `localhost`).
   - PWA cài được qua HTTPS.
   - Service worker không cache `/socket.io` và `/healthz`.
   - Deploy bản mới thì client nhận bản mới (autoUpdate).
   - Mở lại app sau khi server ngủ (phòng cũ không còn) → hiện thông báo tiếng Việt và về trang chủ, **không** kẹt màn hình trắng
     hoặc vòng lặp kết nối lại. Viết test cho trường hợp này nếu chưa có.
5. **README.md**: thêm mục "Deploy lên Render" bằng tiếng Việt. Ghi 2 cách:
   - (a) Blueprint từ `render.yaml`.
   - (b) Tạo Web Service thủ công, liệt kê từng ô cần điền: Name, Branch, Root Directory, Runtime, Build Command, Start Command,
     Health Check Path, Instance Type, Environment Variables.

   Thêm giới hạn của gói Free (ngủ, mất phòng khi ngủ/deploy) và cách kiểm tra sau deploy.
6. **Git & push (được phép trong task này)**:
   - Commit tài liệu đang sửa dở của người quản lý (`PLAN.md`, `promt.md`, `work_progress.md`) thành 1 commit `docs: ...` riêng,
     **không sửa nội dung**.
   - Đổi tên nhánh local `master` → `main`.
   - Thêm remote `origin` = `https://github.com/hoangquan2002/BoardGame.git`, rồi `git push -u origin main`.
   - Trước khi push, kiểm tra `git ls-files` không có `node_modules`, `dist`, `.env`, file `SideEffectsPNP-EN-1.pdf` (bản có mật khẩu).
   - **Không** force push, **không** rewrite history, không tạo repo public.
   - Push bị từ chối vì thiếu quyền/xác thực → dừng, ghi rõ lỗi và lệnh cần chạy vào `result.md` để người dùng tự push.
7. Agent **không** có quyền vào dashboard Render. Việc tạo service do người dùng làm theo README.
   - Nếu người dùng đã tạo service và đưa URL: tự kiểm tra `https://<url>/healthz`, trang chủ, tạo phòng qua socket.io-client tới URL
     đó, rồi ghi kết quả.
   - Chưa có URL → ghi "chờ người dùng tạo service", không tự điền kết quả.

### Kiểm tra
- `pnpm build`, `pnpm lint`, `pnpm test` thành công.
- Bản build sạch (mục 2) chạy được. Ghi lệnh đã chạy và kết quả thật.
- Kiểm tra thủ công bằng 2 trình duyệt hoặc cửa sổ ẩn danh ở viewport ~375px trên bản build sạch: tạo phòng, vào bằng link, thêm 1 máy,
  chơi vài lượt. Không có trình duyệt → ghi "không kiểm tra được".
- Test trên **2 điện thoại thật** là việc của người dùng, sau khi có URL. Agent chuẩn bị checklist ngắn (5–8 bước) trong `result.md`
  để người dùng làm theo.

### Không được làm
- Không thêm thư viện. Không thêm database, Redis, đăng nhập, analytics.
- Không đổi kiến trúc phòng trong RAM.
- Không sửa luật hay bot ngoài Phần 1.
- Không làm bàn chơi sòng bài / xoay ngang (T4b) trong task này — manifest vẫn giữ `portrait`.
- Không sửa `PLAN.md`, `side-effects-rules.md`, `AGENTS.md`, `promt.md` (chỉ commit nguyên trạng như mục 6).

### Báo cáo
Ghi đè `result.md` theo mẫu, **thêm** các mục sau:
- "Việc còn tồn" (kết quả Phần 1).
- Bảng thông số Render cần điền (copy từ README).
- Kết quả kiểm tra bản build sạch.
- Kết quả kiểm tra an toàn nội dung (mục 3).
- Hash commit đã push và tên nhánh trên GitHub.
- Checklist test 2 điện thoại cho người dùng.

Cập nhật dòng T5 trong `work_progress.md` (thêm dòng nhật ký, **không** ghi đè dòng của task khác).
