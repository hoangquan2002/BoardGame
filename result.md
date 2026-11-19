Trạng thái: HOÀN THÀNH — Hệ thống Animation lá bài bay, phản hồi mục tiêu, dải thông báo nổi (hàng đợi) & nhịp máy cho Side Effects và Mèo Nổ

# Báo cáo Nghiệm thu: Animation & Thông báo Hành động Trực quan (Side Effects & Mèo Nổ)

## 1. Tóm tắt hạng mục đã triển khai

1. **Sự kiện có cấu trúc & Bảo mật thông tin ẩn ở Engine**:
   - **Side Effects** (`packages/games/side-effects`): Ghi nhận đầy đủ các sự kiện `TREAT`, `THERAPY`, `GIVE_DISORDER`, `EPISODE` (kèm kết quả hình phạt), `ANXIETY_STEAL`, `TREMORS_DISCARD`, `TREMORS_TIMEOUT`, `SKIP_TURN`, `TURN_RESTRICTION`, `DRAW_TURN`, `DISCARD`, `TRADE_*` với `seq` tăng đơn điệu và giới hạn cửa sổ trượt 20 sự kiện. Lọc quyền riêng tư trong `createPlayerView` (chỉ 2 người liên quan mới thấy loại lá bị lấy ở Lo âu / Nghiện cờ bạc / Đổi bài; người ngoài chỉ nhận số lượng).
   - **Mèo Nổ** (`packages/games/exploding-kittens`): Ghi nhận đầy đủ `ACTION_PENDING_NOPE`, `NOPE_PLAYED`, `ACTION_NOPED`, `ATTACK_RESOLVED`, `SKIP_RESOLVED`, `SHUFFLE_RESOLVED`, `SEE_FUTURE_RESOLVED`, `FAVOR_REQUESTED`, `FAVOR_EMPTY`, `FAVOR_GIVEN`, `COMBO_2_RESOLVED`, `COMBO_3_RESOLVED`, `COMBO_5_PROMPT`, `DISCARD_PICKED`, `DRAW_SAFE`, `EXPLODING_DEFUSED`, `PLAYER_EXPLODED`, `KITTEN_INSERTED` (cửa sổ trượt 20 sự kiện; che bài kín đối với người thứ 3 và tuyệt đối không lộ `insertIndex`).

2. **Điều chỉnh nhịp độ của Máy (`packages/server/src/server.ts`)**:
   - Tăng độ trễ mặc định của bot từ `1000ms` lên `2500ms`/hành động để người chơi kịp quan sát đường bay lá bài và đọc thông báo; rút xuống `800ms` khi đang trong cửa sổ phản ứng khẩn cấp (`Chứng run` 7s / `Nope` 5s). Hỗ trợ `options.botDelayMs` và `process.env.BOT_DELAY_MS` để test tự động chạy nhanh.

3. **Lớp hiển thị Animation & Thanh thông báo nổi (`packages/client`)**:
   - Module dùng chung `packages/client/src/app/actionFX/`:
     - Cache tọa độ `[data-fx-anchor]` sau mỗi lần render giúp lá vừa đánh khỏi tay hoặc ô bệnh vừa bị xóa bởi `THERAPY` vẫn có tọa độ nguồn/đích chính xác, kèm chuỗi fallback an toàn cho màn hình `375×667` (`oppWidth = 0`).
     - Hiệu ứng lá bài bay mượt (`~440ms`, mặt trước với lá công khai, mặt sau với lá ẩn) + sáng viền người đánh + nháy màu/rung nhẹ ô hoặc ghế bị tác động.
     - Hàng đợi thanh thông báo nổi xuyên click (`pointer-events: none`), phân cấp thời lượng: tự đánh (`1.5s`), người khác/máy (`2.5s`), nhắm trực tiếp vào mình (`4.5s`, nổi bật đậm hơn); hành động nền (`DRAW_TURN`, `DRAW_SAFE`, `DISCARD`) chỉ chạy animation lá bay nhẹ không gây nghẽn hàng đợi; bỏ qua sự kiện cũ khi mới vào ván/F5 và tự cắt gọn nếu dồn quá 3 tin.
     - Tôn trọng `@media (prefers-reduced-motion: reduce)` (tắt bay và rung, chỉ giữ đổi màu và thông báo chữ).
     - Chống lặp nội dung với `.event-banner` / `NopeBanner` ở Mèo Nổ và tự dịch vị trí tránh đè lên `trade-notice` / `trade-result-banner` ở Side Effects.

## 2. Kết quả kiểm tra tự động & trình duyệt di động

| Kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| `pnpm build` | ✅ Đạt | Biên dịch thành công toàn bộ 5/5 workspace packages (`core`, `side-effects`, `exploding-kittens`, `server`, `client` PWA) |
| `pnpm lint` | ✅ Đạt | `typecheck` + `eslint .`: 0 lỗi, 0 cảnh báo |
| `pnpm test` | ✅ Đạt | **183/183 tests pass** trên 26 test files (gồm giả lập 1000 ván Side Effects, 500 ván giải đấu bot, 200 ván Mèo Nổ, test chống lộ `events`, test mapper `actionFX` và test `sideEffectsSound`) |
| E2E `S2` (Bố cục 5 màn hình & phòng thật) | ✅ Đạt | **23/23 tiêu chí đạt** (`scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`, `emojiCount <= 3`, `minFontSize >= 11px`, `noOverlay = true`) |
| E2E `S17` (Giao dịch đa người chơi) | ✅ Đạt | **7/7 tiêu chí đạt** (mời đổi bài, đồng ý, xác nhận, từ chối, huỷ) |
| Kiểm thử Chrome di động `375×667` & `844×390` | ✅ Đạt | Cả **Side Effects** và **Mèo Nổ** đều hiển thị mượt thanh thông báo nổi + lá bài bay trực tiếp + nút bật/tắt âm & rung trong menu, không tràn khung hình (`noOverflow = true`), `0` lỗi console |

## 3. Vấn đề / câu hỏi còn mở
- (Không có — Đã hoàn thiện đồng bộ cả Animation, Thông báo nổi và Âm thanh/Rung cho cả 2 game).
