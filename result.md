Trạng thái: DỪNG — chờ người dùng thử lại R3 | Commit: e44efee | Deploy: 94acd09 (chờ push)

# Báo cáo kết quả Task R3 — Sửa lỗi Bỏ bài thừa & Đổi bài giữa người thật

> **Commit hoàn thành**: `e44efee`  
> **Deploy hiện tại trên Render (`/version`)**: `94acd094a71933783ed7312afbc1fd58fe7df5d1` (Chờ người dùng chạy `git push origin main`)  
> **URL thực tế**: `https://boardgame-02k2.onrender.com/`  
>
> **Kết quả kiểm thử tự động Local**:
> - `pnpm build`: **0 lỗi**
> - `pnpm lint`: **0 lỗi, 0 cảnh báo**
> - `pnpm test`: **132/132 unit tests pass (100% across 20 test files)**
> - E2E Playwright Runner Local: **✅ ĐẠT 100% (78/78 tiêu chí trên toàn bộ 11 kịch bản S0, S1, S2, S3, S4, S5, S8, S13, S15, S16, S17)**

---

## 1. Chi tiết khắc phục 2 lỗi khi chơi thật (Phần 2.A & 2.B)

### 1.1. Sửa lỗi kẹt ván khi bài trên tay > 6 lá (Phần 2.A)
- **Nguyên nhân cũ**: Nút "Kết thúc lượt" sử dụng điều kiện `canEndTurn(gameView, myId)`, hàm này yêu cầu `mustDiscardCount === 0`. Do đó khi bài trên tay $> 6$ lá (sau khi rút bài ở đầu lượt, hoặc do đối thủ đổi bài / tác dụng phụ), nút bị disabled (khoá) hoàn toàn $\to$ Người chơi không thể bấm nút để kích hoạt `DiscardModal` bỏ bài thừa $\to$ Kẹt ván chơi.
- **Giải pháp**:
  - Bổ sung hàm chuẩn hoá `getEndTurnState(gameView, myId)` trả về `{ enabled: boolean, discardCount: number }`. Nút Kết thúc lượt **BẬT** (enabled) khi đến lượt mình, bất kể bài tay có $> 6$ lá hay không.
  - Khi `discardCount > 0`: Nhãn nút hiển thị rõ ràng: `Kết thúc lượt (bỏ N lá)`.
  - Khi bấm nút: Tự động mở hộp thoại `DiscardModal` hiển thị đủ mọi lá trên tay, người chơi chọn đúng `N` lá bài cần bỏ.
  - Bấm "Xác nhận bỏ N lá bài" sẽ gửi tuần tự action `DISCARD` và `END_TURN`, đóng modal, chuyển lượt sang người kế tiếp, số lá trên tay trở về đúng 6 lá.

### 1.2. Sửa lỗi lời mời đổi bài bị ẩn trong menu (Phần 2.B)
- **Nguyên nhân cũ**: `TradeModal` chỉ được mở thủ công qua menu "⋯", khi người khác gửi lời mời đổi bài thì người nhận không nhận được tín hiệu rõ ràng trên bàn chơi.
- **Giải pháp**:
  - Thêm thanh thông báo nổi tự động `trade-notice` (`data-testid="trade-notice"`) hiển thị ngay phía trên bàn chơi trong $\le 3$ giây khi có lời mời đổi bài gửi tới, không cần phải mở menu ⋯.
  - Thanh thông báo có sẵn nút **"Xem"** (mở `TradeModal` chọn bài đáp lại) và nút **"Từ chối"** (từ chối ngay mà không cần mở modal).
  - Nút menu "⋯" xuất hiện chấm đỏ `menu-badge` và dòng chữ `Đổi bài (1 lời mời)` màu xanh nổi bật để nhắc người chơi.
  - Sau khi giao dịch kết thúc (hoàn tất, bị từ chối, hoặc bị huỷ), xuất hiện thanh thông báo kết quả `trade-result-banner` trong 3 giây cho cả 2 bên.
  - Trường hợp đang mở tấm phủ Luật chơi khi có lời mời: Đóng luật chơi thì `trade-notice` vẫn hiển thị đầy đủ.

---

## 2. Bảng tổng hợp kết quả E2E Runner (Local vs URL thật Render)

| Kịch bản | Tên kịch bản | Kết quả Local | Kết quả URL thật (Render) | Chi tiết số đo |
|---|---|---|---|---|
| **S0** | Kiểm tra triển khai & bảo mật endpoint | **✅ ĐẠT (6/6)** | *Chờ push* | `/healthz` 200, `/robots.txt` 200, chặn dotfiles, path traversal, file PDF |
| **S1** | Kiểm tra trang chủ và phòng chờ | **✅ ĐẠT (8/8)** | *Chờ push* | Không tràn ngang (320, 375, 667px); link mời đúng domain; khoá bot 4/4; từ chối người thứ 5 |
| **S2** | Bố cục bàn chơi /?mock=1 (5 màn hình × 4 cấu hình & phòng thật) | **✅ ĐẠT (23/23)** | *Chờ push* | 0 cuộn trang; bài tay nở lớn lấp đầy chỗ; maxGap $\le 39$px; bottomGap $\le 40$px; 0 chữ đè ảnh (23/23 pass 100%) |
| **S3** | Kiểm tra ảnh bài sắc nét & dữ liệu chữ tiếng Việt | **✅ ĐẠT (3/3)** | *Chờ push* | 100% `<img>` có `naturalWidth > 0`; 0 file `.webp`; 100% nhãn tiếng Việt chuẩn |
| **S4** | Kiểm tra nhấn giữ cảm ứng thật (CDP Touch) | **✅ ĐẠT (3/3)** | *Chờ push* | Touch 650ms lá mép trái, mép phải, Thể Trạng: mở zoom và giữ nguyên sau khi thả tay |
| **S5** | Ván thật 2 người thật + 2 máy | **✅ ĐẠT (6/6)** | *Chờ push* | 2 context ẩn danh riêng, đánh bài hợp lệ, đồng bộ $\le 3$s, 0 lỗi console |
| **S8** | Kiểm tra xoay ngang/dọc giữa ván chơi | **✅ ĐẠT (5/5)** | *Chờ push* | Giữ nguyên lá chọn khi xoay dọc $\to$ ngang $\to$ dọc; kết nối ổn định; không cuộn trang |
| **S13** | Kiểm tra socket chịu lỗi & khôi phục phiên | **✅ ĐẠT (2/2)** | *Chờ push* | Server chịu tải payload lỗi, thiếu ack, sai quyền không sập; F5 khôi phục phiên |
| **S15** | Kiểm tra nút & tấm phủ Luật chơi (Task R2) | **✅ ĐẠT (7/7)** | *Chờ push* | 4 kích thước (320, 375, 667, 1280); Trang chủ, Phòng chờ, Bàn chơi; đóng Nút/Esc/Back |
| **S16** | Kết thúc lượt khi bài tay > 6 lá & DiscardModal (Task R3) | **✅ ĐẠT (12/12)** | *Chờ push* | Nút bật ghi số lá bỏ; DiscardModal hiển thị đủ bài tay; chọn đủ lá và xác nhận; bài tay về 6 lá |
| **S17** | Đổi bài giữa 2 người thật & trade-notice (Task R3) | **✅ ĐẠT (7/7)** | *Chờ push* | `trade-notice` hiện $\le 3$s; menu-badge; xem/từ chối/huỷ; banner kết quả; không bị che bởi luật |

---

## 3. Hướng dẫn Người dùng Push mã nguồn lên Render

Do môi trường dòng lệnh tự động chặn nhập mật khẩu GitHub interactive, bạn vui lòng mở terminal và chạy lệnh:

```bash
git push origin main
```

Sau khoảng 2–3 phút, Render sẽ tự động build xong. Bạn kiểm tra `https://boardgame-02k2.onrender.com/version` thấy commit `e44efee` là hoàn tất.

---

## 4. Checklist 5 bước kiểm thử 2 lỗi đã sửa trên 2 điện thoại thật

Sau khi bạn đã push lên Render:

1. **Bước 1 (Tạo phòng & Vào phòng 2 người)**:
   - Điện thoại A truy cập `https://boardgame-02k2.onrender.com/`, nhập tên "An" và bấm "Tạo phòng mới".
   - Điện thoại B quét mã QR hoặc mở link mời, nhập tên "Bình" và bấm "Vào phòng".
   - Điện thoại A bấm "Thêm máy" để đủ 3 hoặc 4 người, sau đó bấm "Bắt đầu trò chơi".
2. **Bước 2 (Kiểm tra Lời mời đổi bài nổi tự động — Sửa lỗi 2)**:
   - Khi đang trong ván, Điện thoại A mở menu "⋯" $\to$ "Đổi bài", chọn đổi 1 lá bài với Bình.
   - **Xác nhận trên Điện thoại B**: Ngay trên bàn chơi xuất hiện thanh thông báo màu xanh `trade-notice` với dòng chữ *"An mời bạn đổi bài: đưa bạn 1 lá"* kèm 2 nút **"Xem"** và **"Từ chối"** mà **không cần phải mở menu ⋯**. Nút menu ⋯ cũng có chấm đỏ báo hiệu.
   - Điện thoại B bấm **"Xem"**, chọn 1 lá bài gửi lại cho An.
   - Điện thoại A nhận được thông báo xác nhận và bấm đồng ý $\to$ Bài trên tay 2 bên hoán đổi thành công kèm thông báo kết quả.
3. **Bước 3 (Kiểm tra Bỏ bài khi tay > 6 lá — Sửa lỗi 1)**:
   - Đến lượt của một bên, rút 2 lá bài đầu lượt nhưng **không đánh lá nào** (hoặc tích luỹ bài tay qua các lượt).
   - Khi bài trên tay đạt 8 lá ($> 6$ lá): Xác nhận nút góc dưới ghi rõ **"Kết thúc lượt (bỏ 2 lá)"** và nút đang ở trạng thái **BẬT** (màu xanh lá, bấm được, không bị khoá).
   - Bấm nút: Hộp thoại **"Bỏ bớt bài trên tay"** hiện lên, liệt kê đầy đủ 8 lá bài.
   - Chọn 2 lá bài cần bỏ: Nút "Xác nhận bỏ 2 lá bài" sáng lên. Bấm xác nhận $\to$ Lượt chuyển mượt mà sang đối thủ, bài trên tay còn lại đúng 6 lá.
4. **Bước 4 (Thử lại ở cả màn hình dọc và ngang)**:
   - Xoay ngang điện thoại (Landscape) và lặp lại thao tác: Xác nhận giao diện hiển thị vừa khít, không bị tràn hay lỗi bố cục.
5. **Bước 5 (Kiểm tra tấm phủ Luật chơi)**:
   - Mở thử nút "?" xem bảng Luật chơi tóm tắt có bảng Thuốc và bảng Bệnh Lý đầy đủ hình ảnh.
