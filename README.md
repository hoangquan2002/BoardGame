# Board Game Platform (Side Effects)

Nền tảng web mobile-first chơi board game trực tuyến theo phòng, mỗi người một điện thoại. Game đầu tiên được triển khai là **Side Effects** (hỗ trợ 2–4 người chơi, tính cả máy).

## Yêu cầu hệ thống

- **Node.js**: >= 20 (xem `.nvmrc`)
- **pnpm**: >= 9

## Cài đặt

```bash
pnpm install
```

## Các lệnh phát triển

| Lệnh | Chức năng |
|---|---|
| `pnpm build` | Biên dịch toàn bộ các package trong monorepo |
| `pnpm lint` | Kiểm tra cú pháp và quy chuẩn code bằng ESLint |
| `pnpm test` | Chạy bộ kiểm thử tự động với Vitest |
| `pnpm e2e` | Chạy bộ kiểm thử trình duyệt E2E tự động (`pnpm e2e --url <URL>`) |
| `pnpm start` | Khởi chạy server phòng online (`@boardgame/server`), phục vụ client build tại `http://localhost:3000` |
| `pnpm dev` | Khởi chạy dev server của giao diện client (`@boardgame/client`) tại `http://localhost:5173` (Vite proxy `/socket.io` -> `http://localhost:3000`) |
| `pnpm format` | Tự động định dạng mã nguồn với Prettier |

### Trích xuất ảnh lá bài từ PDF (Chỉ cần chạy khi cập nhật PDF trên máy dev)
Dự án đã commit sẵn toàn bộ ảnh lá bài dạng WebP trong `packages/client/public/cards/`. Nếu cần trích xuất lại từ PDF gốc:
```bash
pip install pymupdf Pillow
python scripts/extract-cards.py
```

### Hướng dẫn chạy khi phát triển (Dev Mode)
1. Terminal 1: Khởi động server backend:
   ```bash
   pnpm start
   ```
   (Server lắng nghe tại `http://localhost:3000`)
2. Terminal 2: Khởi động Vite client dev server:
   ```bash
   pnpm dev
   ```
   (Client chạy tại `http://localhost:5173`, tự động proxy các kết nối WebSocket `/socket.io` sang port 3000 mà không cần cấu hình CORS)

### Hướng dẫn chạy bản dựng (Production Mode)
```bash
pnpm build
pnpm start
```
Mở trình duyệt truy cập `http://localhost:3000`. Server Node.js sẽ phục vụ đồng thời cả ứng dụng SPA PWA và Socket.IO server.

Trang bản phác giao diện theo thiết kế mới: `http://localhost:3000/?mock=1` (hỗ trợ tham số `players=2|3|4`, `hand=4|8|12`, `turn=me|other`).


## Biến môi trường (Server)

Server có thể cấu hình thông qua các biến môi trường sau:

| Biến môi trường | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `3000` | Cổng lắng nghe của HTTP server và Socket.IO server |
| `HOST` | `0.0.0.0` | Địa chỉ mạng lắng nghe (Render tự động định tuyến qua 0.0.0.0) |
| `CORS_ORIGIN` | Cùng origin | Origin được phép kết nối Socket.IO (ví dụ: `http://localhost:5173` khi phát triển client) |
| `CLIENT_DIST_DIR` | `packages/client/dist` | Đường dẫn tới thư mục chứa file tĩnh đã build của client SPA |

Các endpoint hệ thống:
- `GET /healthz` -> trả về mã `200 OK` (nội dung: `OK`).
- `GET /version` -> trả về `{ "commit": "<RENDER_GIT_COMMIT>" }`.
- `GET /robots.txt` -> chặn các bot công khai thu thập dữ liệu web (`Disallow: /`).

## Deploy lên Render

Dự án đã được thiết kế sẵn sàng cho việc triển khai lên dịch vụ đám mây [Render](https://render.com). Bạn có thể triển khai theo 1 trong 2 cách dưới đây:

### Cách 1: Sử dụng Blueprint từ `render.yaml` (Khuyến nghị - Nhanh nhất)
1. Đăng nhập vào Render Dashboard (đã liên kết tài khoản GitHub).
2. Chọn **Blueprints** -> Bấm **New Blueprint Instance**.
3. Chọn repository private `hoangquan2002/BoardGame` và branch `main`.
4. Render sẽ tự động đọc file `render.yaml`, nhận diện cấu hình Web Service, biến môi trường:
   - Nhấn **Apply** để Render tự động build và deploy service.

### Cách 2: Tạo Web Service thủ công trên Render
1. Trên Render Dashboard, bấm **New +** -> Chọn **Web Service**.
2. Chọn repository `hoangquan2002/BoardGame` (nếu chưa thấy, chọn *Configure GitHub App* để cấp quyền truy cập repository này).
3. Điền thông tin vào các trường cấu hình như sau:

| Tên trường trên Render | Giá trị cần điền | Ghi chú |
|---|---|---|
| **Name** | `boardgame-side-effects` | Tên định danh cho service (tuỳ chọn) |
| **Region** | `Singapore` | Khuyến nghị chọn Singapore để tối ưu độ trễ mạng tại Việt Nam |
| **Branch** | `main` | Nhánh chứa mã nguồn chính |
| **Root Directory** | *(để trống)* | Chạy từ thư mục gốc của repository |
| **Runtime** | `Node` | Môi trường Node.js |
| **Build Command** | `corepack enable && pnpm install --frozen-lockfile && pnpm build` | Kích hoạt pnpm qua Corepack, cài đặt dependencies và build monorepo |
| **Start Command** | `pnpm start` | Chạy `@boardgame/server`, lắng nghe cổng `PORT` được Render cấp |
| **Instance Type** | `Free` | Gói miễn phí ($0/tháng) |
| **Health Check Path** | `/healthz` | Đường dẫn kiểm tra trạng thái hoạt động của server |

4. Trong mục **Environment Variables** (Biến môi trường), thêm biến sau:
   - `NODE_VERSION`: `20.18.0` (khớp với phiên bản Node trong `.nvmrc`)

5. Bấm **Create Web Service** để bắt đầu quá trình deploy.

---

### Giới hạn của gói Render Free
- **Cơ chế tự ngủ (Spin-down)**: Server sẽ tự động chuyển sang chế độ ngủ (idle) sau khoảng 15 phút không nhận được yêu cầu truy cập nào.
- **Thời gian khởi động lạnh (Cold start)**: Khi có người truy cập lại sau khi ngủ, Render sẽ mất khoảng 50–60 giây để khởi động lại instance.
- **Trạng thái phòng chơi trong RAM**: Kiến trúc trò chơi lưu toàn bộ dữ liệu phòng trong bộ nhớ RAM (In-Memory). Vì vậy, khi server ngủ hoặc khi có bản deploy mới, các phòng chơi đang diễn ra sẽ bị xoá. Người chơi mở lại ứng dụng sẽ thấy thông báo tiếng Việt: *"Phòng không tồn tại hoặc phiên chơi đã hết hạn"* và tự động trở về trang chủ tạo/vào phòng mới mà không bị kẹt hay treo màn hình.
- **Giới hạn số instance**: Chỉ chạy **1 instance duy nhất** (do không dùng database hay Redis chia sẻ bộ nhớ).

---

### Cách kiểm tra sau khi Deploy thành công
1. **Kiểm tra Health Check**: Truy cập `https://<ten-app>.onrender.com/healthz` -> Trình duyệt hiển thị dòng chữ `OK`.
2. **Kiểm tra Trang chủ Web PWA**: Truy cập `https://<ten-app>.onrender.com/` -> Giao diện tiếng Việt "Side Effects" hiển thị mượt mà.
3. **Kiểm tra Tạo phòng & Mã QR**:
   - Nhập tên và bấm **Tạo phòng mới**.
   - Kiểm tra mã QR hiển thị đúng đường dẫn `https://<ten-app>.onrender.com/?room=<MÃ_PHÒNG>`.
   - Bấm nút **Sao chép link** và chia sẻ sang thiết bị hoặc tab khác.
4. **Kiểm tra Chơi cùng Bot**:
   - Bấm **Thêm máy (Thường)** để bổ sung bot.
   - Bấm **Bắt đầu ván chơi** và thử đánh bài cùng máy.


## Cấu trúc thư mục

```
packages/
  core/                  # Interface chung (GameDefinition, Rng, runAction)
  games/
    side-effects/        # Logic luật chơi Side Effects (T2)
  server/                # Server quản lý phòng và Socket.IO (T3)
  client/                # Giao diện người chơi React + Vite + PWA (T4)
```
