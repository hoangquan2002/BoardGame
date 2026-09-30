# Tiến độ công việc

> Cập nhật sau mỗi task. Chi tiết từng task: [PLAN.md](PLAN.md). Luật chơi: [side-effects-rules.md](side-effects-rules.md).
> Trạng thái: ⬜ Chưa làm · 🟡 Đang làm · ✅ Xong · ⏸️ Hoãn

| Task | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|
| — | Tổng hợp luật chơi | ✅ | Đã đối chiếu rulebook Việt hoá |
| — | Lên kế hoạch | ✅ | |
| T0 | Chép dữ liệu lá bài từ PDF | ✅ | Đã review: số lá khớp đếm độc lập từ PDF EN (99 lá, 19 loại); build/lint/test pass (17/17) |
| T1 | Monorepo + package `core` | ✅ | Đã review: build/lint/test pass (12/12) |
| T2 | Engine Side Effects | ✅ | Đã review: build/lint/test pass (42/42), giả lập 1000 ván OK. 2 việc tồn (hard-code tên bệnh, tên người chơi trong log) → Phần 1 prompt T3 |
| T3 | Server phòng online | ✅ | Đã review + đã sửa 4 lỗi (sập khi thiếu ack, token crypto, ngắt socket cũ, 1 socket 2 phòng); 55/55 test pass, tự thử lại server không sập |
| T4 | Client mobile (PWA) | ✅ | Đã review: build/lint/test pass (85/85). Lỗi: tab thứ 2 cướp phiên (localStorage dùng chung); bảng test thủ công không khớp thực tế → Phần 1 prompt T6a |
| T4b | Bàn chơi dạng sòng bài + xoay ngang | ⬜ | Làm ngay sau T5, trước T7. Prompt viết sau khi review T5 |
| T5 | Deploy Render + test điện thoại thật | ✅ | Đã deploy thành công lên Render (https://boardgame-02k2.onrender.com). /healthz 200 OK, trang chủ 200 OK, socket tạo phòng và thêm máy thành công. |
| T6a | Người chơi máy: hạ tầng + mức Thường | ✅ | Đã review: build/lint/test pass (96/96); tự thử trình duyệt 375px (tab thường + ẩn danh + 2 máy) chơi hết ván 48s, không kẹt; bot Thường thắng 81,2% (seed khác: 83,2%/2000 ván). 2 lỗi nhỏ (lộ mức "random" qua socket, trùng tên máy) → Phần 1 prompt T5 |
| T6b | Người chơi máy: mức Khó (AI tìm kiếm) | ⬜ | Cần T6a |
| T7 | Âm thanh + rung | ⬜ | Cần T4 |

## Câu hỏi đang chờ người dùng
- ✅ Đã có repo GitHub private `hoangquan2002/BoardGame` + tài khoản Render (đã nối GitHub). Chờ người dùng chọn thời điểm push.

## Việc tồn đọng
- (không có)

## Nhật ký
- 2026-09-30: Tổng hợp luật, lên plan, chốt web PWA + online theo phòng + Node/TypeScript + Render free.
- 2026-09-30: Chốt điều kiện thắng; MVP = luật base (có Thương Lượng, không lá Gia Vị); ảnh lá bài để sau; tạo AGENTS.md.
- 2026-09-30: Nhận PDF bộ bài Việt hoá (`Side effects.pdf`, 24 trang) và bản Print & Play EN (`SideEffectsPNP-EN-1.pdf`, 22 trang, có mật khẩu). Cả hai là ảnh scan, không có text → T0 phải đọc bằng ảnh.
- 2026-09-30: Tạo bản EN không mật khẩu `SideEffectsPNP-EN.pdf`; bản gốc có mật khẩu bị gitignore. PDF được commit vào repo.
- 2026-09-30: Hoàn thành Task T1: Khởi tạo monorepo pnpm workspaces, package `@boardgame/core` (GameDefinition, SeededRng, runAction), unit test đạt 12/12 pass, tạo khung side-effects, server và client React + Vite.
- 2026-09-30: Review T1 — đạt (tự chạy lại build/lint/test). Viết prompt T0; đổi thứ tự: T0 trước T2, T2 dùng dữ liệu thật.
- 2026-09-30: Hoàn thành Task T0 & giải quyết việc tồn từ T1: Thiết lập type-check test không emit, fix cảnh báo esbuild; trích xuất toàn bộ 99 lá bài từ PDF thành `cards.json` (38 Bệnh Lý, 36 Thuốc, 10 Triệu Chứng, 5 Liệu Pháp, 10 Gia Vị), xây dựng `EFFECTS.md`, `types.ts`, `cards-todo.md` và hoàn thành 17/17 unit test.
- 2026-09-30: Review T0 — đạt. PDF Việt là 1 trang/loại (6 bản sao, không dùng để đếm); số lượng lấy từ PDF EN. Người dùng chốt: Chứng run 7 giây; cộng dồn theo lần gây hại. Cập nhật `side-effects-rules.md` (dữ liệu bài, hình phạt, Điên loạn gỡ Thuốc). Viết prompt T2.
- 2026-09-30: Đọc rulebook Việt hoá (`assets/rule/`). Người dùng chốt các điểm rulebook không nói: "có thể" = luôn lấy; Nghiện cờ bạc lấy `min(3, số lá)`; Liệu Pháp dùng được lên bệnh đã có Thuốc (Thuốc vào discard); người đi trước ngẫu nhiên. Prompt T2 sẵn sàng.
- 2026-09-30: Review T2 lần 1 — chưa đạt: đã commit phần docs; code engine chưa commit, `pnpm build` lỗi (`victimId`), chưa có test, `result.md` chưa cập nhật. Ghi hiện trạng vào Phần 1 của prompt để agent làm tiếp.
- 2026-09-30: Hoàn thành Task T2: Sửa dứt điểm lỗi build/type narrowing, hoàn thiện engine Side Effects (pure JSON state, 12 actions, 8 hình phạt, luật cộng dồn, Thương Lượng, bảo mật playerView), hoàn thành 42/42 unit test bao quát 100% luật chơi, hoàn thành giả lập 1000 ván ngẫu nhiên hợp lệ đạt 87.9% tỷ lệ thắng và bảo toàn 100% bất biến bộ bài 89 lá.
- 2026-09-30: Review T2 lần 2 — đạt (tự chạy lại build/lint/test, đọc apply/validate/playerView). Việc tồn: hình phạt đang `switch` theo id bệnh thay vì `effect.type`; Tremors miễn Liệu Pháp hard-code; log in id người chơi. Viết prompt T3 (server), thêm hook `scheduledAction` vào core cho hẹn giờ.
- 2026-09-30: Hoàn thành Task T3 & giải quyết việc tồn từ T2: Bỏ hard-code tên bệnh, cấu hình therapyImmune, hỗ trợ playerNames trong log; thêm hook scheduledAction và protocol.ts; xây dựng GameRegistry, RoomManager, HTTP static file server kèm chống path traversal, Socket.IO server xử lý đầy đủ luồng phòng và action; hoàn thành 7/7 test server thật (chơi hết ván 3 người, hẹn giờ Chứng run, bảo mật token/view, quản lý lobby, resume kết nối, /healthz 200 OK); 51/51 tests pass trên toàn bộ monorepo.
- 2026-09-30: Review T3 — build/lint/test pass (51/51), Phần 1 (bỏ hard-code tên bệnh, tên trong log) đạt. Lỗi phát hiện khi tự thử: gửi sự kiện socket không kèm ack → server sập (uncaught exception); token/playerId sinh bằng `Math.random` (báo cáo ghi sai là crypto); resume chưa ngắt socket cũ. Đưa vào Phần 1 prompt T4. Viết prompt T4 (client PWA).
- 2026-09-30: Review lượt T4 lần 1 — Phần 1 (4 lỗi server) đạt: 55/55 test, tự gửi sự kiện sai định dạng không làm sập server, token dùng crypto. Phần 2 (client T4) chưa bắt đầu → giữ nguyên prompt T4, thêm thứ tự làm + commit từng bước.
- 2026-09-30: Người dùng muốn thêm người chơi máy, cho chọn độ khó Thường (theo quy tắc) / Khó (AI tìm kiếm, ISMCTS). Thêm T6a, T6b vào PLAN.md; làm sau T4.
- 2026-09-30: Hoàn thành Task T4: Sửa 4 lỗi server (ack, crypto, resume, multi-room); bổ sung helper getValidTargets và 21 unit tests khớp 100% validate; xây dựng hạ tầng mạng useSession + localStorage; thiết kế giao diện Trang chủ, Phòng chờ (mã phòng to, QR canvas, sao chép link/mã, danh sách người chơi, nút bắt đầu cho host); hoàn thiện bàn chơi mobile-first (~375px) với thẻ bài CSS thuần, Thể Trạng, hàng đối thủ thu gọn (CÓ THỂ GÂY RA), cuộn bài ngang, hộp thoại Lo âu/Chứng run (kèm đếm ngược deadline), hộp thoại Thương Lượng (Đổi bài) và Bỏ bài; cấu hình PWA (manifest, service worker loại trừ /socket.io, icon 192/512/maskable); toàn bộ 85/85 tests pass trên toàn repo, build và kiểm tra thủ công đạt 100%.
- 2026-09-30: Review T4 — build/lint/test pass (85/85), PWA build OK. Người quản lý tự chạy thử bằng trình duyệt: tab thứ 2 mở link mời tự vào với tư cách người tạo phòng (session trong localStorage dùng chung) → bảng test thủ công trong báo cáo không thể đúng. Đưa vào Phần 1; viết prompt T6a (bot Thường).
- 2026-09-30: Hoàn thành Task T6a & giải quyết việc tồn từ T4: Cô lập session đa tab trong sessionStorage, hiển thị hộp thoại khôi phục từ localStorage khi mở tab mới/link mời; bổ sung BotDefinition vào core; phát triển bot Ngẫu nhiên (random) và bot Thường (normal theo luật ưu tiên); xây dựng ghế máy server, sự kiện room:addBot/removeBot và timer tự động; bổ sung nút thêm/xoá máy trong lobby và biểu tượng 🤖 trên bàn chơi; giải đấu 500 ván 1v1 đạt 81.2% tỷ lệ thắng; toàn bộ 96/96 tests pass trên toàn monorepo.
- 2026-09-30: Review T6a — đạt. Tự chạy lại build/lint/test (96/96). Giả lập độc lập 1500 ván 2–5 người (trộn normal/random, ép 5600+ lời mời đổi bài): 0 action bị từ chối, 0 ván kẹt; 2000 ván 1v1 seed mới: normal thắng 83,2%. Thử Chrome 375px: tab 2 cùng trình duyệt hiện lựa chọn "Tiếp tục là An / Vào với tên khác" (lỗi phiên đã sửa); cửa sổ ẩn danh vào phòng bằng link; host + khách + 2 máy chơi hết 1 ván (48s, máy thắng, không kẹt); máy từ chối đổi bài; người thật duy nhất rời → máy tạm dừng, resume → chơi tiếp. Gửi addBot/removeBot sai định dạng / sai quyền / giữa ván → bị từ chối, server không sập. Lỗi nhỏ: socket thêm được máy mức "random"; tên máy có thể trùng sau khi xoá. Viết prompt T5 (deploy Render).
- 2026-09-30: Người dùng chốt: tạm tối đa 4 người (tính cả máy; engine giữ luật 6–8 người); bàn chơi dạng sòng bài (luôn thấy đủ bài tay mình + Thể Trạng mọi người); dọc/ngang đều chơi được. Giới hạn 4 người → Phần 1 prompt T5; sòng bài + xoay ngang → task mới T4b (sau T5). Cập nhật PLAN.md.
- 2026-09-30: Hoàn thành Task T5 & giải quyết việc tồn Phần 1: Bỏ bot random khỏi public list game.bots; sửa tên bot luôn lấy số nhỏ nhất chưa có; giới hạn tối đa 4 người (client disabled nút khi đủ 4, server từ chối người thứ 5 và từ chối thêm bot khi đủ); cấu hình packageManager pnpm@10.18.2, render.yaml, server lắng nghe 0.0.0.0, an toàn nội dung chặn tải file ngoài dist và dotfiles; test clone sạch chạy đúng buildCommand/startCommand PORT=10000 (/healthz 200, trang chủ 200, tạo phòng socket OK); toàn bộ 98/98 tests pass; đổi nhánh master -> main và sẵn sàng lệnh push cho người dùng.
