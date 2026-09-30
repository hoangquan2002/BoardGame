# AGENTS.md — Board game platform (Side Effects first)

> File này áp dụng cho mọi thứ trong thư mục `quan/` và **thay thế** các quy định dành cho dự án khác trong
> `../AGENTS.md` (CRUD MODULE STANDARD, `appsettings.json`, database, .NET…). Những gì không nói ở đây thì
> vẫn theo tinh thần chung: làm phạm vi nhỏ nhất, không đoán.

## Dự án
Web mobile-first (PWA) để nhóm bạn chơi board game online theo phòng, mỗi người một điện thoại.
Game đầu tiên: **Side Effects**. Kiến trúc hỗ trợ thêm nhiều game sau này.

## Đọc trước khi làm
| File | Vai trò |
|---|---|
| `PLAN.md` | Kiến trúc, công nghệ, định nghĩa từng task (T0–T5) — **nguồn sự thật về phạm vi** |
| `side-effects-rules.md` | Luật chơi — **nguồn sự thật duy nhất về luật** |
| `promt.md` | Yêu cầu của task hiện tại giao cho bạn |
| `work_progress.md` | Trạng thái các task |
| `result.md` | Nơi bạn ghi báo cáo khi xong task |

## Quy trình mỗi task
1. Đọc `promt.md` và các mục của `PLAN.md` mà prompt chỉ tới.
2. Chỉ làm đúng phạm vi task. Thấy việc khác cần làm → ghi vào "Vấn đề / câu hỏi còn mở" trong `result.md`, không tự làm.
3. Chạy kiểm tra (xem mục Kiểm tra).
4. Ghi đè `result.md` theo mẫu trong file, cập nhật dòng task trong `work_progress.md` (trạng thái + ghi chú ngắn).
5. Không sửa `PLAN.md`, `side-effects-rules.md`, `AGENTS.md`, `promt.md` — đó là việc của người quản lý.

## Công nghệ (đã chốt, không tự đổi)
- TypeScript `strict` toàn bộ, Node >= 20, **pnpm** workspaces.
- `packages/core` (interface game chung), `packages/games/<game>` (luật từng game), `packages/server`
  (Node + Socket.IO), `packages/client` (React + Vite + PWA).
- Test: Vitest. Lint: ESLint + Prettier.
- Thư viện được phép: TypeScript, React, React DOM, Vite, @vitejs/plugin-react, vite-plugin-pwa, Socket.IO
  (server + client), Vitest, ESLint, typescript-eslint, Prettier, qrcode. **Cần thư viện khác → dừng và hỏi.**

## Nguyên tắc kiến trúc
- **Server là trọng tài**: client chỉ gửi action; mọi kiểm tra luật chạy ở server bằng engine.
- **Engine thuần**: `validate`/`apply`/`playerView` là hàm thuần, không I/O, không `Math.random()` — chỉ dùng `Rng` có seed.
- **Không lộ thông tin ẩn**: `playerView` không bao giờ chứa bài trên tay người khác (chỉ số lượng) hay thứ tự chồng rút.
  Server chỉ gửi `playerView`, không bao giờ gửi full state.
- **Code chung vs code riêng game**: thứ gì mọi game đều cần → `core`/`server`; thứ gì chỉ Side Effects cần →
  `games/side-effects` hoặc thư mục UI riêng của game trong client. Không nhét luật Side Effects vào `core`.
- **Dữ liệu lá bài** nằm trong JSON (`cards.json`, tạm thời `cards.sample.json`), code không hard-code tên bệnh/thuốc.
- Ưu tiên giải pháp đơn giản; không tạo abstraction khi mới có 1 chỗ dùng.

## Luật chơi
- Phạm vi MVP: **luật base** (gồm Thương Lượng), **không** có lá Gia Vị (High Tolerance, Misdiagnosis).
- Luật chưa rõ hoặc mâu thuẫn → **dừng và ghi câu hỏi vào `result.md`**, không tự đặt luật.
- Mỗi luật trong `side-effects-rules.md` phải có ít nhất 1 unit test tương ứng.

## Ngôn ngữ & văn bản
- Giao diện người dùng: **tiếng Việt có dấu**. Không chuyển sang không dấu.
- Code, tên biến, commit message: tiếng Anh. Comment: ngắn, chỉ khi cần giải thích "tại sao".
- File có dấu hiệu lỗi encoding/mojibake → dừng và báo, không viết lại hàng loạt.

## Kiểm tra trước khi báo xong
- Luôn chạy: `pnpm build`, `pnpm lint`, `pnpm test` (hoặc bản giới hạn trong package bị ảnh hưởng nếu task chỉ đụng 1 package).
- Task có UI: thêm kiểm tra thủ công ở viewport mobile (~375px) và ghi lại kết quả trong `result.md`.
- Báo trung thực: test fail / bước bị bỏ qua → ghi rõ, không ghi ✅.

## Git
- Commit nhỏ, mỗi commit một ý, message tiếng Anh dạng `feat(engine): ...`, `test(core): ...`.
- Không commit `node_modules`, `dist`, `.env`, file ảnh lớn ngoài `assets/`.
- Không push, không force, không rewrite history trừ khi người dùng yêu cầu.

## Không được làm
- Không thêm đăng nhập/tài khoản, database, thanh toán, analytics (chưa nằm trong phạm vi).
- Không đổi công nghệ đã chốt, không refactor ngoài phạm vi task, không format lại file không liên quan.
- Không đưa nội dung/artwork của bộ bài gốc lên nơi công khai ngoài bản deploy dùng nội bộ.
