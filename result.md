Trạng thái: XONG | Task: T5 | Commit cuối: c86797c

# Kết quả task

> Agent ghi đè file này sau mỗi task theo mẫu dưới. Người quản lý đọc để review rồi cập nhật `work_progress.md`.

## Task: T5 — Deploy lên Render & Khắc phục việc tồn đọng T6a

---

### Phần 1 — Việc còn tồn (Review T6a + Yêu cầu mới)

1. **Bỏ mức "random" khỏi danh sách bot công khai qua Socket**:
   - **Thực hiện**: Đã xoá `{ level: 'random', ... }` khỏi `sideEffectsGame.bots` trong `packages/games/side-effects/src/game.ts`. Bot ngẫu nhiên vẫn nằm trong `src/bots/random.ts` và được các file test giải đấu/giả lập import trực tiếp.
   - **Kiểm thử**: Bổ sung test trong `packages/server/test/server-bots.test.ts` xác thực rằng khi client gửi `room:addBot { level: 'random' }`, server từ chối với lỗi tiếng Việt `"Độ khó máy không hợp lệ hoặc trò chơi không hỗ trợ"`.
   - **Commit**: `b40797c` — `fix(side-effects): remove random bot from public game bots list`.

2. **Khắc phục lỗi trùng tên máy khi thêm/xoá (Bot numbering)**:
   - **Thực hiện**: Tại `packages/server/src/server.ts`, cơ chế đánh số bot được chuyển sang tìm số nguyên dương nhỏ nhất chưa có trong phòng (`botNumber = 1, 2, 3...`) thay vì dùng `số bot hiện có + 1`.
   - **Kiểm thử**: Bổ sung test ca kiểm thử thứ 4 trong `packages/server/test/server-bots.test.ts`: Thêm Máy 1, Máy 2 -> xoá Máy 1 -> thêm máy mới -> xác nhận bot mới được đặt tên `"Máy 1 (Thường)"` (không bị trùng Máy 2).
   - **Commit**: `bf5f755` — `fix(server): assign lowest unused number to bot names to prevent duplicates`.

3. **Tạm giới hạn tối đa 4 người (tính cả máy)**:
   - **Thực hiện**:
     - `sideEffectsGame.maxPlayers` đổi từ 8 thành 4 trong `packages/games/side-effects/src/game.ts`.
     - Giữ nguyên quy tắc khởi tạo 3 Bệnh Lý khi ≥ 6 người trong `setup.ts` và các bài test của nó theo đúng yêu cầu.
     - Tại `packages/server/src/server.ts`: Khi phòng đã có đủ 4 người, `room:join` và `room:addBot` đều từ chối với thông báo tiếng Việt: `"Phòng đã đủ 4 người"`.
     - Tại giao diện phòng chờ `packages/client/src/lobby/LobbyRoomPage.tsx`: Tiêu đề hiển thị động `Người chơi ({roomState.players.length}/{maxPlayers})`. Khi phòng đã đủ 4 người, nút **"Thêm máy"** tự động chuyển sang trạng thái disabled (vô hiệu hoá), hiển thị chữ `🤖 Phòng đã đủ 4 người`.
   - **Kiểm thử**: Sửa test kiểm tra phòng đầy trong `packages/server/test/server.test.ts` (test 6) khớp với giới hạn 4 người, xác nhận người thứ 5 join và host addBot khi đủ 4 người đều bị từ chối với thông báo `"Phòng đã đủ 4 người"`.
   - **Commit**: `34a8ce0` — `feat(game): limit max players to 4 and disable adding bots when full`.

---

### Phần 2 — Cấu hình Deploy Render (Task T5)

#### 1. Cấu hình Blueprint `render.yaml` & Môi trường chạy
- Đã ghim `packageManager: "pnpm@10.18.2"` trong `package.json` gốc để Corepack tự động cài đúng phiên bản pnpm.
- Tạo file Blueprint `render.yaml` tại thư mục gốc với đầy đủ thông số:
  - Web Service Node, gói `free`, region `singapore`.
  - `buildCommand`: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
  - `startCommand`: `pnpm start`
  - `healthCheckPath`: `/healthz`
  - `envVars`: `NODE_VERSION=20.18.0`, `NODE_ENV=production`.
- Cập nhật server lắng nghe trên host `0.0.0.0` (biến môi trường `HOST` hoặc mặc định `0.0.0.0`) tại `packages/server/src/server.ts` và `src/index.ts` để Render định tuyến lưu lượng truy cập chính xác.
- **Commit**: `a21af92` — `feat(deploy): configure Render Blueprint, packageManager, host binding and deployment docs`.

#### 2. Bảng thông số Render cần điền (Copy từ README.md)

| Tên trường trên Render | Giá trị cần điền | Ghi chú |
|---|---|---|
| **Name** | `boardgame-side-effects` | Tên định danh cho service trên Render (tuỳ chọn) |
| **Region** | `Singapore` | Khuyến nghị chọn Singapore để tối ưu độ trễ mạng tại Việt Nam |
| **Branch** | `main` | Nhánh chứa mã nguồn chính sau khi push |
| **Root Directory** | *(để trống)* | Chạy từ thư mục gốc của repository |
| **Runtime** | `Node` | Môi trường Node.js |
| **Build Command** | `corepack enable && pnpm install --frozen-lockfile && pnpm build` | Kích hoạt pnpm qua Corepack, cài dependencies lockfile và build monorepo |
| **Start Command** | `pnpm start` | Chạy `@boardgame/server`, lắng nghe cổng `PORT` được Render cấp |
| **Instance Type** | `Free` | Gói miễn phí ($0/tháng) |
| **Health Check Path** | `/healthz` | Đường dẫn kiểm tra trạng thái hoạt động của server |
| **Environment Variables** | `NODE_VERSION`: `20.18.0`<br>`NODE_ENV`: `production` | Khớp phiên bản Node trong `.nvmrc` |

#### 3. Kết quả kiểm tra bản build sạch (Clean Build Test)
> Agent đã mô phỏng chính xác môi trường build sạch của Render: `git clone . .clean_test` sang thư mục độc lập hoàn toàn không có `node_modules` hay `dist` có sẵn, chạy đúng `buildCommand` và `startCommand` với `PORT=10000`.

- **Lệnh cài đặt & build**: `pnpm install --frozen-lockfile; pnpm build`
  - Kết quả: Thành công 100%, tạo đầy đủ dist cho cả 4 packages và PWA service worker (`dist/sw.js`, `dist/workbox-9c191d2f.js`).
- **Lệnh khởi chạy**: `$env:PORT="10000"; pnpm start`
  - Kết quả log: `[BoardGame Server] Running on http://0.0.0.0:10000`
- **Kiểm tra HTTP `/healthz`**:
  - `GET http://localhost:10000/healthz` -> **HTTP 200 OK**, nội dung `OK`.
- **Kiểm tra Trang chủ Web PWA**:
  - `GET http://localhost:10000/` -> **HTTP 200 OK**, trả về HTML index của client (độ dài 1186 bytes).
- **Kiểm tra Tạo phòng qua Socket.IO**:
  - Kết nối `http://localhost:10000` và gửi `room:create { name: 'CleanTester', gameId: 'side-effects' }`
  - Kết quả trả về: `{"ok":true,"roomCode":"4QFAD","playerId":"p_51ff3547","token":"6323c278f0951aef3298e5c77dc58f34"}`
- Thư mục kiểm tra `.clean_test` đã được dọn dẹp sạch sẽ sau khi hoàn tất.

#### 4. Kết quả kiểm tra an toàn nội dung (Content Security)
- **Chặn truy cập file PDF gốc ngoài client**:
  - `GET /assets/card-photos/SideEffectsPNP-EN.pdf` -> **404 Not Found**
  - `GET /assets/rule/SideEffectsRules-VI.pdf` -> **404 Not Found**
- **Chặn truy cập dotfile / file bí mật**:
  - `GET /.env` -> **404 Not Found**
- **Chặn tấn công Path Traversal**:
  - `GET /../../package.json` -> **403 Forbidden**
  - `GET /%2e%2e/package.json` -> **403 Forbidden**
  - `GET /%2e%2e%2fpackage.json` -> **403 Forbidden**
- **Kiểm tra rò rỉ secret / token / password (`git grep`)**:
  - Quét toàn bộ repository: Không phát hiện bất kỳ token, password, hay secret thật nào bị lưu trong code.
  - File `SideEffectsPNP-EN-1.pdf` (bản có mật khẩu) được bảo vệ bằng `.gitignore`, đã kiểm tra lệnh `git ls-files` không xuất hiện.
  - Cả `node_modules/`, `.env*`, và `dist/` đều không nằm trong git tracking.

#### 5. Đổi tên nhánh & Lệnh push lên GitHub
- **Tên nhánh**: `main`.
- **Remote**: `origin` -> `https://github.com/hoangquan2002/BoardGame.git`.
- **Trạng thái Push**: ✅ Người dùng đã push thành công toàn bộ mã nguồn lên GitHub tại `https://github.com/hoangquan2002/BoardGame` (commit `c86797c`).

#### 6. Kết quả kiểm tra từ xa trên Render thật
- **URL dịch vụ**: `https://boardgame-02k2.onrender.com`
- **Health Check (`GET /healthz`)**: ✅ **200 OK** (nội dung: `OK`, header: `x-render-origin-server: Render`).
- **Trang chủ (`GET /`)**: ✅ **200 OK** (phục vụ ứng dụng React PWA mobile-first hoàn chỉnh).
- **Tạo phòng qua Socket.IO**: ✅ Kết nối Socket.IO thành công và gọi `room:create` tạo phòng mới thành công (`roomCode: 97R4P`, `playerId: p_495507d0`).
- **Thêm máy qua Socket.IO**: ✅ Gọi `room:addBot { level: 'normal' }` trên server Render thành công (`playerId: p_d20d87a6`).
- **An toàn nội dung trên Render**:
  - `GET /assets/card-photos/SideEffectsPNP-EN.pdf` ➔ **404 Not Found**
  - `GET /.env` ➔ **404 Not Found**
  - `GET /../../package.json` ➔ **404 Not Found**

#### 7. Checklist test 2 điện thoại thật cho người dùng (sau khi deploy)
Sau khi Render deploy thành công và cấp URL `https://<ten-app>.onrender.com`:
1. **Kiểm tra khởi động**: Mở `https://<ten-app>.onrender.com/healthz` trên trình duyệt xem chữ `OK`.
2. **Điện thoại 1 (Chủ phòng)**:
   - Mở `https://<ten-app>.onrender.com` -> Nhập tên (vd. *An*) -> Bấm **Tạo phòng mới**.
   - Kiểm tra mã phòng to rõ và mã QR hiển thị trên màn hình.
   - Thử bấm **Thêm máy (Thường)** -> Phòng có 2 người (*An* và *🤖 Máy 1 (Thường)*).
3. **Điện thoại 2 (Khách vào phòng)**:
   - Dùng camera quét mã QR trên Điện thoại 1 (hoặc mở link mời dạng `?room=MÃ_PHÒNG`).
   - Nhập tên (vd. *Bình*) -> Bấm **Vào phòng**.
   - Cả 2 điện thoại đều cập nhật danh sách người chơi tức thì.
4. **Bắt đầu ván chơi**:
   - Điện thoại 1 bấm **Bắt đầu ván chơi**.
   - Cả 2 điện thoại chuyển sang bàn chơi Side Effects mobile-first mượt mà.
5. **Đánh bài & Tương tác**:
   - Thực hiện đánh Thuốc, đưa Bệnh Lý, đánh Triệu Chứng theo lượt.
   - Quan sát máy (*Máy 1*) tự động suy nghĩ và đi bài khi đến lượt.
6. **Kiểm tra khôi phục phiên**:
   - Thử vuốt tắt tab trình duyệt trên Điện thoại 2 rồi mở lại `https://<ten-app>.onrender.com`.
   - Chọn **Tiếp tục là Bình** -> Trở lại bàn chơi ngay lập tức mà không bị mất lượt.

---

### Kết quả kiểm tra tự động

- **build**: ✅ (`pnpm build` thành công cả 4 packages: `core`, `games/side-effects`, `server`, `client` kèm PWA).
- **lint**: ✅ (`pnpm lint` typecheck 0 lỗi, ESLint 0 errors, 0 warnings).
- **test**: ✅ (**98/98 tests pass** trên toàn bộ 16 test files):
  - `packages/client`: 13 tests (`session.test.ts` 12 tests, `e2e-gameplay.test.ts` 1 test).
  - `packages/server`: 16 tests (`server.test.ts` 12 tests, `server-bots.test.ts` 4 tests).
  - `packages/games/side-effects`: 57 tests (`bots-tournament.test.ts` 2 tests, `simulation.test.ts` 1 test 1000 ván, `targets.test.ts` 21 tests, `rules.test.ts` 10 tests, v.v.).
  - `packages/core`: 12 tests (`rng.test.ts` 7 tests, `sample-game.test.ts` 5 tests).

---

### Danh sách các commit trong Task T5

1. `48f3a79` — `docs: sync plan, prompt, and progress for task T5`
2. `b40797c` — `fix(side-effects): remove random bot from public game bots list`
3. `bf5f755` — `fix(server): assign lowest unused number to bot names to prevent duplicates`
4. `b28f3fa` — `docs: sync prompt with max 4 players requirement and T4b plan`
5. `34a8ce0` — `feat(game): limit max players to 4 and disable adding bots when full`
6. `a21af92` — `feat(deploy): configure Render Blueprint, packageManager, host binding and deployment docs`
7. `2d9cf10` — `docs: update progress log for task T5`

---

### Vấn đề / câu hỏi còn mở
- Không còn vấn đề mở. Web Service trên Render đã hoạt động hoàn hảo và vượt qua toàn bộ các bước kiểm tra tự động từ xa.
- Sẵn sàng chuyển tiếp sang **Task T4b: Bàn chơi dạng sòng bài + hỗ trợ xoay ngang**.
