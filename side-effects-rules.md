# Side Effects — Tổng hợp luật chơi

> Game gốc: **Side Effects** (God Hates Games / Pillbox Games), BoardGameGeek #230765.
> Thể loại: card game "take that" (chơi phá nhau), 2–8 người, 10–30 phút, 13–14+.
>
> Đã đối chiếu với **rulebook Việt hoá (Boardrian)** — tên tiếng Việt ghi trong ngoặc.
> Các mục đánh dấu ⚠️ là chỗ vẫn chưa có dữ liệu, cần xác minh trước khi code.
>
> Thuật ngữ: Psyche = **Thể Trạng**, Disorder = **Bệnh Lý**, Drug = **Thuốc**, Episode = **Triệu Chứng**
> ("Bạn đang có triệu chứng"), Therapy = **Liệu Pháp**, High Tolerance = **Kháng Thuốc**,
> Misdiagnosis = **Chẩn Đoán Sai**, dòng tác dụng phụ trên thuốc = **"CÓ THỂ GÂY RA"**,
> người đánh Triệu Chứng (inflictor) = **Kẻ gây hại**.
>
> Dữ liệu lá bài đầy đủ (tên, số lượng, Thuốc → tác dụng phụ, hình phạt): `packages/games/side-effects/src/data/cards.json`
> (chép từ PDF ở T0, đã review).

---

## 1. Mục tiêu

Mỗi người chơi có một **Psyche** (tâm trí) gồm các lá **Disorder** (rối loạn) đặt ngửa trước mặt.
Người đầu tiên **chữa khỏi toàn bộ Disorder trong Psyche của mình** sẽ thắng, game kết thúc ngay.

---

## 2. Thành phần (bản base, theo mô tả sản phẩm)

| Loại lá | Số lượng | Ký hiệu | Vai trò |
|---|---|---|---|
| Disorder | 38 | — | Bệnh trong Psyche; cũng có thể nằm trên tay để "tặng" đối thủ qua tác dụng phụ |
| Drug (thuốc) | 36 | — | Điều trị đúng 1 loại Disorder tương ứng, kèm danh sách tác dụng phụ |
| Episode | 10 | đầu lâu đỏ | Kích hoạt hình phạt của một Disorder chưa được điều trị ở đối thủ |
| Therapy | 5 | Rx tím | Lá "át chủ": điều trị bất kỳ Disorder nào (trừ ngoại lệ) |
| High Tolerance | 3 (bản PnP in 5) | đầu lâu tím | Lá đặc biệt (xem mục 6) |
| Misdiagnosis | 3 (bản PnP in 5) | Rx xanh lá | Lá đặc biệt (xem mục 6) |

**8 loại Bệnh Lý** (38 lá): Lo âu 5, Chứng biếng ăn 4, Trầm cảm 5, Nghiện cờ bạc 5, Liệt dương 5,
Điên loạn 4, Suy nghĩ tự tử 5, Chứng run 5.

**7 loại Thuốc** (36 lá):

| Thuốc | Điều trị | CÓ THỂ GÂY RA | Số lá |
|---|---|---|---|
| Chlorpromazine | Điên loạn | Chứng run | 5 |
| Clozapine | Suy nghĩ tự tử | Điên loạn | 5 |
| Fluoxetine | Trầm cảm | Liệt dương, Suy nghĩ tự tử, Chứng biếng ăn | 5 |
| Lithium | Nghiện cờ bạc | Liệt dương | 5 |
| Lorazepam | Lo âu | Suy nghĩ tự tử, Trầm cảm, Điên loạn | 5 |
| Pramipexole | Chứng run | Nghiện cờ bạc, Trầm cảm, Điên loạn | 6 |
| Sildenafil | Liệt dương | Lo âu | 5 |

High Tolerance và Misdiagnosis là lá **"Gia Vị"** (tuỳ chọn): thêm nhiều hay ít vào bộ bài tuỳ ý
→ **MVP chỉ làm luật base, không có lá Gia Vị**; để sau sẽ thêm thành tuỳ chọn khi tạo phòng.

---

## 3. Chuẩn bị (Setup)

1. Tách riêng các lá **Disorder**, xáo trộn.
2. Chia mỗi người **4 Disorder khác nhau**, đặt ngửa trước mặt → đây là **Psyche**.
   - Chơi **6–8 người**: mỗi người chỉ nhận **3 Disorder**.
   - Nếu bị trùng loại: đặt lá trùng xuống **đáy chồng Disorder** và chia tiếp.
3. Trộn phần Disorder còn lại với tất cả các lá khác (Drug, Episode, Therapy, …) thành **chồng rút (draw pile)**.
4. Chia mỗi người **4 lá úp** làm bài trên tay.
5. Người chơi "gặp ác mộng gần nhất" đi trước, sau đó theo chiều kim đồng hồ.

---

## 4. Lượt chơi

Mỗi lượt gồm 3 bước:

1. **Rút**: rút 2 lá từ chồng rút (lượt đầu tiên → lên 6 lá trên tay).
2. **Chơi**: chơi **tối đa 2 lá** (được phép không chơi lá nào).
3. **Kết thúc**: nếu trên tay có **hơn 6 lá**, bỏ bớt xuống còn 6.

Quy tắc chung:
- Lá được chơi **giải quyết ngay lập tức**; **không có** cơ chế phản đòn/ngắt lượt (no interrupts).
- Khi chồng rút hết bài: **xáo chồng bài bỏ** thành chồng rút mới.

**Thương lượng / đổi bài:**
- Được đưa và nhận (trao đổi) bài với người khác **kể cả khi không phải lượt mình**, miễn là lá đó không được *đánh ra*.
- Không được đánh bài ngoài lượt của mình; mỗi lượt vẫn tối đa 2 lá đánh ra.
- Thoả thuận **không bắt buộc** phải giữ.

---

## 5. Các loại lá và cách hoạt động

### 5.1 Disorder
- Nằm ngửa trong Psyche = vấn đề bạn cần giải quyết.
- **Một Psyche không bao giờ chứa quá 1 lá của cùng một loại Disorder.**
- Disorder **chưa được điều trị** có thể bị đối thủ đánh Episode vào.
- Mỗi Disorder có ghi một **hình phạt riêng** (punishment), chỉ kích hoạt khi bị Episode.
- Lá Disorder rút lên tay được dùng để **gây tác dụng phụ** cho đối thủ (xem 5.2).

### 5.2 Drug (thuốc) và cơ chế Tác dụng phụ
- Mỗi loại Disorder có **đúng một loại Drug** tương ứng (riêng Anorexia **không có** Drug).
- Đặt lá Drug **lên trên** Disorder tương ứng trong Psyche của bạn → Disorder đó **được điều trị (treated)**.
- Disorder đã được điều trị **không thể bị đánh Episode**.
- **Tác dụng phụ**: mỗi Drug in một danh sách Disorder là tác dụng phụ của nó. Khi bạn đang dùng Drug đó,
  đối thủ có thể đánh lá Disorder (thuộc danh sách tác dụng phụ) **từ tay họ vào Psyche của bạn** →
  bạn có thêm bệnh mới phải chữa.
- Vẫn áp dụng giới hạn 1 lá mỗi loại Disorder trong Psyche.

- Điều kiện để **đưa Bệnh Lý cho người khác**: người nhận đang có ít nhất 1 Thuốc đặt trong Thể Trạng
  mà dòng "CÓ THỂ GÂY RA" chứa Bệnh Lý đó, **và** Thể Trạng của họ chưa có Bệnh Lý đó
  (kể cả Bệnh Lý đã được điều trị bằng Thuốc cũng tính là "đã có" → không bị mắc lại).
- Thuốc + Bệnh Lý **nằm lại trên bàn**. Thuốc chỉ bị gỡ khi: bị hình phạt **Điên loạn** (bỏ tất cả Thuốc trên
  Thể Trạng) hoặc lá Gia Vị Kháng Thuốc (chưa làm ở MVP). Thuốc bị gỡ → vào discard, Bệnh Lý bên dưới trở lại
  **chưa điều trị**, và tác dụng phụ của Thuốc đó không còn hiệu lực.

✅ Đã xác nhận: Bệnh Lý có Thuốc đặt lên = **đã chữa**; thắng khi **mọi** Bệnh Lý trong Thể Trạng
đều có Thuốc hoặc đã bị Liệu Pháp loại bỏ.

### 5.3 Episode
- Đánh vào một Disorder **chưa được điều trị** trong Psyche của **đối thủ**.
- Kích hoạt hình phạt ghi trên lá Disorder đó (mỗi Disorder khác nhau; ví dụ có trigger cho phép
  **cướp bài trên tay** đối thủ nếu nghĩ họ đang giữ thuốc bạn cần).
- Nạn nhân **bắt buộc** làm theo chỉ dẫn trên lá Bệnh Lý; lá Triệu Chứng bỏ vào discard sau khi dùng.
- Ví dụ hình phạt thấy trong rulebook: *"Cho kẻ tấn công xem bài trên tay"*, *"Kẻ tấn công có thể rút ngẫu nhiên
  3 thẻ bài trên tay bạn"*.

**Hình phạt từng Bệnh Lý** (nguyên văn lá bài Việt hoá → cách áp dụng trên web):

| Bệnh Lý | Chữ trên lá | Áp dụng |
|---|---|---|
| Lo âu | Cho kẻ gây hại xem bài. Kẻ gây hại có thể lấy 1 lá bài | Kẻ gây hại (chỉ người này) thấy bài trên tay nạn nhân, **bắt buộc** chọn 1 lá lấy về tay mình (tay rỗng → không có gì) |
| Chứng biếng ăn | Không được rút bài trong 1 vòng | Lượt kế tiếp của nạn nhân: bỏ bước Rút, vẫn được đánh bài |
| Trầm cảm | Nghỉ chơi 1 vòng | Mất nguyên lượt kế tiếp (không rút, không đánh) |
| Nghiện cờ bạc | Kẻ gây hại có thể rút ngẫu nhiên 3 lá bài từ tay bạn | Tự động: kẻ gây hại lấy ngẫu nhiên `min(3, số lá)` từ tay nạn nhân về tay mình |
| Liệt dương | Không thể đánh bài ở lượt chơi tiếp theo | Lượt kế tiếp của nạn nhân: vẫn rút, không được đánh lá nào |
| Điên loạn | Loại bỏ tất cả lá bài Thuốc trên Thể Trạng | Mọi Thuốc của nạn nhân vào discard; các Bệnh Lý đó trở lại chưa điều trị |
| Suy nghĩ tự tử | Loại bỏ toàn bộ bài đang cầm trên tay | Toàn bộ bài trên tay nạn nhân vào discard |
| Chứng run | Bỏ 3 lá bài trong 3 giây, hoặc mất toàn bộ bài trên tay | Nạn nhân có **7 giây** (đã chốt, thay cho 3 giây) chọn 3 lá bỏ; hết giờ chưa đủ → mất cả tay. Có ≤ 3 lá → bỏ hết ngay |

- ✅ **Cộng dồn** (Trầm cảm / Liệt dương / Biếng ăn): bị gây hại trong **cùng 1 lần** (cùng một lượt của kẻ gây
  hại) → tính 1 lượt; bị gây hại **2 lần** (2 lượt khác nhau) → tính 2 lượt.
- ✅ **"Có thể"** (Lo âu, Nghiện cờ bạc): rulebook không nói → người dùng chốt **luôn lấy**, không được từ chối.

### 5.4 Therapy
- Lá "át chủ": điều trị **bất kỳ** Disorder nào trong Psyche của bạn.
- Khi dùng: **cả lá Therapy lẫn Disorder đó bị bỏ vào chồng bài bỏ (discard)** → Disorder biến mất khỏi Psyche.
  Hệ quả: ô Disorder đó trống, bạn **có thể bị nhiễm lại** loại Disorder đó sau này.
- ✅ Dùng được cả lên Bệnh Lý **đã có Thuốc**: Bệnh Lý + Thuốc + Liệu Pháp cùng vào discard (tác dụng phụ của
  Thuốc đó hết hiệu lực). Rulebook chỉ ghi "loại bỏ 1 Bệnh Lý bất kỳ" — người dùng chốt.
- Ngoại lệ:
  - **Anorexia**: chỉ chữa được bằng Therapy (không có Drug).
  - **Tremors**: **miễn nhiễm** với Therapy (chỉ chữa bằng Drug).

---

## 6. Lá đặc biệt

### High Tolerance — Kháng Thuốc
- Bắt **một người chơi khác** loại bỏ **1 lá Thuốc** khỏi Thể Trạng của họ; **người đánh** chọn Thuốc nào.
- Lá Thuốc và lá Kháng Thuốc vào discard → Bệnh Lý bên dưới trở lại **chưa điều trị**.

### Misdiagnosis (Rx xanh lá)
- Đổi **1 Disorder trong Psyche** của bạn với **1 Disorder trên tay** bạn.
- Disorder bị đổi ra được **giữ lại trên tay**; lá Misdiagnosis bị bỏ vào discard.

---

## 7. Kết thúc game

- Game kết thúc **ngay lập tức** khi một người chơi chữa hết toàn bộ Disorder trong Psyche → người đó thắng.


---

## 8. Tóm tắt nhanh

```
Setup : 4 Disorder ngửa (3 nếu 6–8 người), 4 lá trên tay
Lượt  : Rút 2 → Chơi ≤ 2 → Bỏ xuống còn 6
Drug     → đặt lên Disorder của mình (treated), nhưng mở cửa cho tác dụng phụ
Disorder → (trên tay) đánh vào đối thủ nếu thuộc tác dụng phụ Drug họ đang dùng
Episode  → đánh vào Disorder chưa điều trị của đối thủ, kích hoạt hình phạt
Therapy  → bỏ hẳn 1 Disorder (trừ Tremors; Anorexia bắt buộc dùng Therapy)
Thắng    : chữa hết Psyche trước
```

---

## 9. Thông tin còn thiếu

1. ✅ Danh sách Bệnh Lý, Thuốc → tác dụng phụ, hình phạt: đã có (T0, xem mục 2 và 5.3).
2. ✅ Đã đối chiếu rulebook Việt hoá (`assets/rule/side_effects_viet_hoa_boardrian.pdf`); các chỗ rulebook không nói
   đã được người dùng chốt (mục 5.3, 5.4).
3. ✅ Người đi trước ("gặp ác mộng gần nhất"): trên web chọn **ngẫu nhiên** bằng `Rng`.
4. Bản quyền: tên game, artwork, nội dung lá bài thuộc Pillbox Games — nếu phát hành app công khai
   cần xin phép hoặc tự thiết kế lại theme/nội dung.

---

## Nguồn tham khảo

- Rulebook Việt hoá — Boardrian: bản trong repo `assets/rule/side_effects_viet_hoa_boardrian.pdf` ([Google Drive](https://drive.google.com/file/d/1gHUStaglQVhUxpmB8ZEes_unOsNTOlFf/view))
- [BoardGameGeek — Side Effects](https://boardgamegeek.com/boardgame/230765/side-effects)
- [Zatu Games — How to Play Side Effects](https://zatu.com/blogs/how-to-play/how-to-play-side-effects)
- [officialgamerules.org — Side Effects](https://officialgamerules.org/game-rules/side-effects/)
- [Amazon — Side Effects (mô tả thành phần)](https://www.amazon.com/God-Hates-Games-004GHG-Effects/dp/B07JM57JV7)
- [BoardGameMatcher — Side Effects](https://boardgamematcher.com/game/side-effects)
- [Pillbox Games — Booster Shot](https://www.pillboxgames.com/side-effects-booster-shot-1)
