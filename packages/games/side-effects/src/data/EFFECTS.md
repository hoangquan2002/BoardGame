# Bảng quy chuẩn Effect Type cho hình phạt (Disorder Punishments)

Tài liệu định nghĩa các kiểu hiệu ứng (`effect.type`) được kích hoạt khi một lá **Triệu Chứng (Episode)** được đánh vào một **Bệnh Lý (Disorder)** chưa điều trị trong Thể Trạng (Psyche) của đối thủ.

---

## Bảng tổng hợp các Effect Type

| Effect Type | Params | Người chọn | Áp dụng cho Bệnh Lý | Mô tả hành vi bằng tiếng Việt |
|---|---|---|---|---|
| `ATTACKER_STEALS_CHOSEN_CARD` | `{ "count": 1, "revealHand": true }` | **Kẻ tấn công** chọn lá (sau khi nạn nhân ngửa bài) | Lo âu (`anxiety`) | Nạn nhân phải ngửa toàn bộ bài trên tay cho kẻ tấn công xem (chỉ kẻ tấn công thấy). Kẻ tấn công **bắt buộc** chọn 1 lá bài từ tay nạn nhân chuyển sang tay của mình (không được từ chối; nếu tay nạn nhân rỗng thì bỏ qua). |
| `PREVENT_DRAW` | `{ "rounds": 1 }` | **Hệ thống tự động** (áp dụng lên nạn nhân) | Chứng biếng ăn (`anorexia`) | Nạn nhân không được rút bài ở bước Rút bài (bước 1) ở lượt kế tiếp của mình. Áp dụng luật cộng dồn: trong cùng 1 lượt của kẻ gây hại chỉ tính +1, khác lượt cộng dồn thêm. |
| `SKIP_TURN` | `{ "rounds": 1 }` | **Hệ thống tự động** (áp dụng lên nạn nhân) | Trầm cảm (`depression`) | Nạn nhân bị mất toàn bộ lượt kế tiếp (không rút, không đánh, không bỏ bài; chuyển lượt ngay cho người tiếp theo). Áp dụng luật cộng dồn: trong cùng 1 lượt của kẻ gây hại chỉ tính +1, khác lượt cộng dồn thêm. |
| `ATTACKER_STEALS_RANDOM_CARDS` | `{ "count": 3 }` | **Ngẫu nhiên tự động** (hệ thống rút ngẫu nhiên từ tay nạn nhân) | Nghiện cờ bạc (`gambling-addiction`) | Kẻ tấn công bắt buộc lấy ngẫu nhiên `min(3, số lá)` từ tay nạn nhân chuyển về tay của mình bằng `Rng` (tự động, không tạo `pendingChoice`). |
| `DISCARD_ALL_DRUGS_FROM_PSYCHE` | `{}` | **Hệ thống tự động** (áp dụng lên nạn nhân) | Điên loạn (`madness`) | Toàn bộ các lá bài Thuốc (Drugs) đang đặt trong Thể Trạng (Psyche) của nạn nhân bị chuyển vào chồng bài bỏ (discard pile). Các Bệnh Lý tương ứng trở về trạng thái chưa điều trị. |
| `DISCARD_ENTIRE_HAND` | `{}` | **Hệ thống tự động** (áp dụng lên nạn nhân) | Suy nghĩ tự tử (`suicidal-thoughts`) | Nạn nhân phải bỏ toàn bộ bài đang cầm trên tay vào chồng bài bỏ (discard pile). |
| `PREVENT_PLAY_CARDS` | `{ "rounds": 1 }` | **Hệ thống tự động** (áp dụng lên nạn nhân) | Liệt dương (`impotence`) | Ở lượt kế tiếp, nạn nhân vẫn được rút bài bình thường nhưng không được đánh bất kỳ lá bài nào xuống (bước Chơi bài bị khoá). Áp dụng luật cộng dồn: trong cùng 1 lượt của kẻ gây hại chỉ tính +1, khác lượt cộng dồn thêm. |
| `DISCARD_CARDS_OR_ENTIRE_HAND` | `{ "count": 3, "timeoutSeconds": 3 }` | **Nạn nhân** chọn 3 lá bài; quá giờ hoặc không chọn thì mất hết | Chứng run (`tremors`) | Nạn nhân có thời gian đếm ngược (mặc định 7 giây trên web theo option của engine, chữ in trên lá là 3) để chọn và bỏ đúng 3 lá bài trên tay. Nếu quá giờ (`CHOICE_TIMEOUT`) thì mất toàn bộ bài trên tay vào discard. Nếu nạn nhân có ≤ 3 lá thì bỏ hết ngay tự động, không tạo `pendingChoice`. |

---

## Chi tiết cơ chế tương tác (cho Engine T2 & Server T3)

1. **Hiệu ứng có tương tác người chơi (`pendingChoice`)**:
   - `ATTACKER_STEALS_CHOSEN_CARD`: Chỉ gửi thông tin bài trên tay của nạn nhân cho kẻ tấn công (thông qua `playerView`), sau đó kẻ tấn công **bắt buộc** gửi action lựa chọn 1 lá bài muốn lấy (`RESOLVE_CHOICE`). Nếu tay nạn nhân rỗng thì bỏ qua, không tạo `pendingChoice`.
   - `DISCARD_CARDS_OR_ENTIRE_HAND`: Chờ nạn nhân chọn 3 lá bài trong `tremorsTimeoutSeconds` (mặc định 7s); nếu gửi `RESOLVE_CHOICE` hợp lệ với đúng 3 lá thì bỏ 3 lá đó vào discard. Nếu server kích hoạt `CHOICE_TIMEOUT` thì toàn bộ bài trên tay nạn nhân vào discard. Nếu ban đầu nạn nhân có ≤ 3 lá, tự động bỏ toàn bộ vào discard ngay mà không tạo `pendingChoice`.

2. **Hiệu ứng tự động tức thì**:
   - `ATTACKER_STEALS_RANDOM_CARDS`: Tự động rút ngẫu nhiên `min(3, số lá)` từ mảng bài nạn nhân bằng `Rng` chuyển sang tay kẻ gây hại (không tạo `pendingChoice`).
   - `DISCARD_ALL_DRUGS_FROM_PSYCHE`: Lọc bỏ toàn bộ thuốc trong Thể Trạng của nạn nhân đưa vào discard; các bệnh lý đó trở lại chưa điều trị.
   - `DISCARD_ENTIRE_HAND`: Chuyển toàn bộ mảng bài trên tay của nạn nhân vào discard.

3. **Hiệu ứng trạng thái kéo dài (Status Modifier)**:
   - `SKIP_TURN`, `PREVENT_DRAW`, `PREVENT_PLAY_CARDS`: Bộ đếm vòng chơi lưu trên trạng thái người chơi. Áp dụng luật cộng dồn: trong cùng 1 lượt của kẻ gây hại tối đa +1 cho mỗi loại hình phạt trên mỗi nạn nhân; ở các lượt khác nhau của kẻ gây hại thì cộng dồn thêm (+1 cho mỗi lần bị gây hại ở lượt khác). Tự động giảm/giải phóng khi người chơi đến lượt áp dụng.
