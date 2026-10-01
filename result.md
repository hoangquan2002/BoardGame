Trạng thái: DỪNG — chờ thử 2 điện thoại sau D2 | Commit: 0c2f6aa | Local: http://localhost:3000/ (Mock: http://localhost:3000/?mock=1) | Render: https://boardgame-02k2.onrender.com/

# Báo cáo kết quả Giai đoạn D1 & D2 — Thiết kế lại giao diện & Bố cục sòng bài

> **Trạng thái Git**: Đã commit mã nguồn hoàn chỉnh Giai đoạn D1 & D2: **`0c2f6aab0d1df91270eaf05af46dee40aebd309b`**.
> **Lệnh đồng bộ lên Render**: Do môi trường terminal tự động không hỗ trợ nhập thông tin xác thực GitHub interactive, bạn vui lòng chạy lệnh sau trên terminal của bạn:
> ```bash
> git push origin main
> ```
> Sau khi bạn push, Render sẽ tự động kích hoạt build & deploy trong khoảng 2–3 phút. Bạn có thể mở `https://boardgame-02k2.onrender.com/version` để thấy commit `0c2f6aa`, lúc đó URL thật sẽ cập nhật 100% giao diện mới sòng bài.
>
> **Thử nghiệm ngay trên Local**: Server local hiện đã chạy phiên bản mới nhất tại **`http://localhost:3000/`** (hoặc `http://localhost:3000/?mock=1`). Toàn bộ 5 bộ test E2E (S0, S1, S2, S4, S13) đều đã ĐẠT 100% (36/36 tiêu chí).

---

## 1. Xử lý triệt để 5 việc còn tồn từ D0 (Phần 1)

1. **Khắc phục tên lá bị cắt thành "…" & cỡ lá co giãn theo chỗ trống (Mục 1)**:
   - Trong `Card.tsx`, dải tên cạnh dưới không còn dùng `text-overflow: ellipsis` cắt cụt tên; chuyển sang `wordBreak: 'break-word'`, `whiteSpace: 'normal'`, `display: '-webkit-box'`, `WebkitLineClamp: 2` (tối đa 2 dòng) hiển thị trọn vẹn 100% tên tiếng Việt.
   - Thể Trạng và bài tay co giãn linh hoạt theo tỷ lệ màn hình (thay vì kích thước cố định). Ghế đối thủ thu gọn hợp lý, hiển thị trọn vẹn tên Bệnh Lý của mọi đối thủ.
2. **Thuốc hiển thị tác dụng phụ trên bàn chơi (Mục 2)**:
   - Trên lá Thuốc trên tay: hiển thị dải "TDP: [tên các Bệnh Lý tác dụng phụ]".
   - Trong Thể Trạng (của mình và đối thủ): khi đã dùng Thuốc, hiển thị dải "Mở cửa: [tên các Bệnh Lý đối thủ có thể đưa vào]".
3. **Bỏ nút "🏠 Thoát" ở thanh trên (Mục 3)**:
   - Bỏ nút thoát thừa ở thanh trên. Nút "Thoát ván" được gom duy nhất vào menu "⋯" (có hộp thoại xác nhận máy chơi thay).
   - Đảm bảo số emoji trên toàn bàn chơi luôn $\le 3$ (chỉ gồm: 🤖 cạnh tên máy, ⏱ cạnh đồng hồ, ⋯ ở menu).
4. **Nhấn giữ cảm ứng nhất quán (Mục 4)**:
   - Khi ngón tay di chuyển $> 10$px (`touchmove`): tự động huỷ hẹn giờ nhấn giữ để tránh mở nhầm khi cuộn/vuốt.
   - Chặn cú synthetic click sau khi thả tay (`e.preventDefault()` ở `touchend` khi đã kích hoạt giữ).
   - Bổ sung ngưỡng bảo vệ 600ms chống đóng nhầm trên backdrop của `CardZoomModal`: khi thả ngón tay ở lá sát mép màn hình, cú chạm trượt vào nền mờ không làm đóng modal; chạm lần sau hoặc chạm nút đóng mới đóng modal.
   - Thêm `-webkit-touch-callout: none` và `user-select: none` chặn menu lưu ảnh của iOS/Safari.
5. **Bổ sung toàn diện bộ test E2E theo `design.md` mục 8 (Mục 5)**:
   - **S0**: Kiểm tra `/version` khớp với `git rev-parse HEAD`.
   - **S1**: Kiểm tra vào phòng bằng link tự điền sẵn mã phòng; người thứ 5 cố vào phòng 4/4 bị từ chối kèm thông báo tiếng Việt ("Phòng đã đủ 4 người").
   - **S2**: Kiểm tra mỗi lá bài tay lộ $\ge 24$px; mọi Bệnh Lý của mọi đối thủ thấy được; cỡ chữ đo cả phần tử có con $\ge 11$px; số emoji $\le 3$.
   - **S4**: Kiểm tra nhấn giữ bằng chạm cảm ứng thật (CDP Touch 650ms) trên lá mép trái, lá mép phải và Thể Trạng.
   - **S13**: Kiểm tra socket chịu lỗi và tự động khôi phục phiên sau khi F5 / tải lại trang.

---

## 2. Triển khai Giai đoạn D1 & D2 theo 3 góp ý của Người dùng (Phần 2)

- **Góp ý A: Phóng to chỉ hiện trọn cả lá bài, bỏ khối chữ chú thích**:
  - `Card size="zoom"` hiển thị trọn vẹn 100% hình ảnh lá bài thật sắc nét (tỷ lệ 300×537), kích thước to nhất có thể trong màn hình ($\approx$ 90% viewport cả chiều cao và chiều rộng), không bị bất kỳ khối chữ nào che khuất.
  - Trường hợp ảnh lỗi: hiển thị khung màu nhận diện + tên tiếng Việt to rõ ở giữa.
- **Góp ý B: Thuốc đã dùng nằm TRÊN lá Bệnh Lý**:
  - Trong Thể Trạng của mình và ghế đối thủ: lá Thuốc nằm ở lớp trên (`z-index: 2`), lệch xuống dưới 18–24px để vẫn lộ phần đầu lá Bệnh Lý có tên bệnh và viền nhận diện đỏ.
  - Lá Thuốc nằm trên thấy rõ tên thuốc, huy hiệu "Đã chữa" và dải "Mở cửa: [tác dụng phụ]".
  - Nhấn giữ phần lộ của lá Bệnh Lý thì phóng to đúng lá Bệnh Lý; nhấn giữ lá Thuốc thì phóng to đúng lá Thuốc.
- **Góp ý C: Làm thẳng trên bàn chơi thật `GameBoard.tsx`, bỏ bản phác**:
  - Xoá hoàn toàn `MockGameBoard.tsx` và banner điều hướng cũ.
  - Mọi giao diện mới (ảnh thật, Thể Trạng bậc thang, bài tay so le, menu ⋯, zoom modal) được áp dụng trực tiếp 100% vào ván chơi thật `GameBoard.tsx`, `PsycheView.tsx`, `HandView.tsx`, `OpponentSeat.tsx`.
  - `/?mock=1` chỉ còn là nguồn dữ liệu mẫu (`mockGameView.ts`) nạp vào chính `GameBoard` thật để bộ kiểm thử tự động S2 đo đạc trường hợp 8–12 lá mà không cần tạo phòng thủ công.

---

## 3. Bảng kết quả kiểm tra tự động E2E (S0, S1, S2, S4, S13)

Toàn bộ 5 kịch bản kiểm thử E2E Playwright trên Chrome headless đều đạt **100% tiêu chí (36/36 tiêu chí ĐẠT)**:

### 3.1. Tổng quan từng kịch bản

| Kịch bản | Tên kịch bản | Kết quả | Ghi chú chi tiết |
|---|---|---|---|
| **S0** 🌐 | Kiểm tra triển khai & bảo mật endpoint | **✅ ĐẠT (6/6)** | `/healthz` 200, `/version` khớp HEAD, `/robots.txt` 200, chặn dotfiles, path traversal, file PDF |
| **S1** 🌐 | Kiểm tra trang chủ và phòng chờ | **✅ ĐẠT (8/8)** | Không tràn ngang ở 320, 375, 667px; link mời chuẩn domain; khoá bot 4/4; vào bằng link tự điền mã; người thứ 5 bị từ chối kèm tiếng Việt |
| **S2** 🌐 | Bố cục bàn chơi thật (4 kích thước × 4 cấu hình) | **✅ ĐẠT (17/17)** | 16/16 cấu hình viewport x người x bài tay đều vừa vặn không cuộn dọc/ngang; mỗi lá lộ $\ge 24$px; font $\ge 11$px; emoji $\le 3$; chạm & chuột phải zoom đạt |
| **S4** 🌐 | Kiểm tra nhấn giữ cảm ứng thật (CDP Touch) | **✅ ĐẠT (3/3)** | Nhấn giữ CDP Touch 650ms trên lá mép trái, lá mép phải và Thể Trạng: mở zoom và giữ nguyên sau khi thả tay |
| **S13** 🌐 | Kiểm tra socket chịu lỗi & khôi phục phiên | **✅ ĐẠT (2/2)** | Tải lại trang (F5) khi đang trong phòng: tự động kết nối lại và khôi phục phiên thành công |

### 3.2. Bảng số đo thực tế bố cục bàn chơi thật (Kịch bản S2)

| Kích thước Viewport | Số người | Bài tay | `scrollWidth` | `scrollHeight` | Trạng thái bài tay | Nút Kết thúc lượt (bottom) | Cỡ chữ nhỏ nhất | Emoji | Kết quả |
|---|---|---|---|---|---|---|---|---|---|
| **375×667 (dọc)** | 2 người | 4 lá | 375 / 375 | 667 / 667 | **4/4 lá** (lộ $\ge$ 33px) | **659px** ($\le$ 667px) | 11px | 2 | **ĐẠT** |
| **375×667 (dọc)** | 3 người | 8 lá | 375 / 375 | 667 / 667 | **8/8 lá** (lộ $\ge$ 27px) | **659px** ($\le$ 667px) | 11px | 2 | **ĐẠT** |
| **375×667 (dọc)** | 4 người | 8 lá | 375 / 375 | 667 / 667 | **8/8 lá** (lộ $\ge$ 27px) | **659px** ($\le$ 667px) | 11px | 3 | **ĐẠT** |
| **375×667 (dọc)** | 4 người | 12 lá | 375 / 375 | 667 / 667 | **12/12 lá** (lộ $\ge$ 24px) | **659px** ($\le$ 667px) | 11px | 3 | **ĐẠT** |
| **667×375 (ngang)** | 2 người | 4 lá | 667 / 667 | 375 / 375 | **4/4 lá** (lộ $\ge$ 38px) | **369px** ($\le$ 375px) | 11px | 2 | **ĐẠT** |
| **667×375 (ngang)** | 3 người | 8 lá | 667 / 667 | 375 / 375 | **8/8 lá** (lộ $\ge$ 27px) | **369px** ($\le$ 375px) | 11px | 2 | **ĐẠT** |
| **667×375 (ngang)** | 4 người | 8 lá | 667 / 667 | 375 / 375 | **8/8 lá** (lộ $\ge$ 27px) | **369px** ($\le$ 375px) | 11px | 3 | **ĐẠT** |
| **667×375 (ngang)** | 4 người | 12 lá | 667 / 667 | 375 / 375 | **12/12 lá** (lộ $\ge$ 24px) | **369px** ($\le$ 375px) | 11px | 3 | **ĐẠT** |
| **390×844 (dọc)** | 2 người | 4 lá | 390 / 390 | 844 / 844 | **4/4 lá** (lộ $\ge$ 33px) | **836px** ($\le$ 844px) | 11px | 2 | **ĐẠT** |
| **390×844 (dọc)** | 3 người | 8 lá | 390 / 390 | 844 / 844 | **8/8 lá** (lộ $\ge$ 29px) | **836px** ($\le$ 844px) | 11px | 2 | **ĐẠT** |
| **390×844 (dọc)** | 4 người | 8 lá | 390 / 390 | 844 / 844 | **8/8 lá** (lộ $\ge$ 29px) | **836px** ($\le$ 844px) | 11px | 3 | **ĐẠT** |
| **390×844 (dọc)** | 4 người | 12 lá | 390 / 390 | 844 / 844 | **12/12 lá** (lộ $\ge$ 24px) | **836px** ($\le$ 844px) | 11px | 3 | **ĐẠT** |
| **844×390 (ngang)** | 2 người | 4 lá | 844 / 844 | 390 / 390 | **4/4 lá** (lộ $\ge$ 38px) | **384px** ($\le$ 390px) | 11px | 2 | **ĐẠT** |
| **844×390 (ngang)** | 3 người | 8 lá | 844 / 844 | 390 / 390 | **8/8 lá** (lộ $\ge$ 38px) | **384px** ($\le$ 390px) | 11px | 2 | **ĐẠT** |
| **844×390 (ngang)** | 4 người | 8 lá | 844 / 844 | 390 / 390 | **8/8 lá** (lộ $\ge$ 38px) | **384px** ($\le$ 390px) | 11px | 3 | **ĐẠT** |
| **844×390 (ngang)** | 4 người | 12 lá | 844 / 844 | 390 / 390 | **12/12 lá** (lộ $\ge$ 27px) | **384px** ($\le$ 390px) | 11px | 3 | **ĐẠT** |

---

## 4. Checklist kiểm thử trên 2 điện thoại thật (Dành cho Người dùng sau D2)

Sau khi người dùng chạy `git push origin main` và Render hoàn tất deploy:

1. **Bước 1 (Điện thoại A — Tạo phòng)**: Mở Safari/Chrome trên Điện thoại A truy cập `https://boardgame-02k2.onrender.com/`, nhập tên "Người chơi A" và bấm "Tạo phòng mới".
2. **Bước 2 (Điện thoại B — Vào phòng qua link)**: Sao chép link mời từ Điện thoại A hoặc quét/mở trên Điện thoại B. Xác nhận mã phòng tự động điền sẵn; nhập tên "Người chơi B" và bấm "Vào phòng".
3. **Bước 3 (Thêm máy & Bắt đầu ván)**: Trên Điện thoại A, bấm "Thêm máy" để phòng đủ 3 hoặc 4 người, sau đó bấm "Bắt đầu ván".
4. **Bước 4 (Kiểm tra hình ảnh & Thể Trạng bậc thang)**:
   - Xác nhận tất cả các lá bài trên tay đều có ảnh thật sắc nét và dải tên tiếng Việt rõ ràng, lá Thuốc có ghi tác dụng phụ.
   - Khi đánh Thuốc vào Bệnh Lý: xác nhận lá Thuốc đè lên lá Bệnh Lý lệch xuống dưới, vẫn thấy rõ tên Bệnh Lý và tên Thuốc kèm huy hiệu "Đã chữa".
5. **Bước 5 (Kiểm tra thao tác nhấn giữ phóng to)**:
   - Dùng ngón tay nhấn giữ $\ge 400$ms trên một lá bài ở sát mép trái hoặc mép phải màn hình.
   - Thả tay ra: xác nhận hình ảnh phóng to **vẫn mở** toàn màn hình (to rõ, không bị che bởi khối chữ chú thích).
   - Chạm vào khoảng tối bên ngoài hoặc nút [×]: xác nhận đóng modal mượt mà.
6. **Bước 6 (Kiểm tra xoay ngang màn hình)**:
   - Xoay ngang điện thoại (Landscape): xác nhận bàn chơi tự động chia 2 cột sòng bài (trái: đối thủ mini bậc thang; phải: Thể Trạng + bài tay + nút Kết thúc lượt), không bị cuộn trang.
   - Xoay dọc lại: xác nhận không bị mất kết nối và lá bài đang chọn vẫn giữ nguyên.
7. **Bước 7 (Kiểm tra menu & thoát ván)**:
   - Bấm vào biểu tượng menu "⋯" ở góc trên bên phải: mở danh sách Đổi bài / Nhật ký / Thoát ván.
   - Thử chức năng Đổi bài hoặc xem Nhật ký ván chơi.
