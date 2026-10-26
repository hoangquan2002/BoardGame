# Tài Liệu Tổng Hợp Luật Chơi & Đặc Tả Gameplay: Mèo Nổ – Bản Thường (Exploding Kittens: Original Edition)

**Dự án áp dụng:** `hoangquan2002/BoardGame` (BoardGame make by Quandeptrai)  
**Phạm vi tài liệu:** Chỉ áp dụng cho bộ cơ bản [Exploding Kittens: Original Edition](https://explodi.ng/decks/exploding-kittens-original-edition) (56 lá bài, 2–5 người chơi), không bao gồm các bản mở rộng.  
**Nguồn tham chiếu chuẩn:** [Trang hướng dẫn chính thức Exploding Kittens](https://www.explodingkittens.com/pages/rules-kittens), [Rulebook PDF bản gốc](https://libraries.sutherlandshire.nsw.gov.au/__data/assets/pdf_file/0030/99291/Exploding-Kittens-rulebook.pdf) và [Cơ sở dữ liệu thẻ bài Here Be Kittens!](https://explodi.ng/decks/exploding-kittens-original-edition).

## 1. Thông Số Tổng Quan Bộ Bài Bản Thường

Bộ bài [Exploding Kittens: Original Edition](https://explodi.ng/decks/exploding-kittens-original-edition) vận hành theo cơ chế "Cò quay Nga" (Russian Roulette) kết hợp quản lý bài trên tay. Người chơi lần lượt đánh bài chức năng để né tránh hoặc đẩy rủi ro cho đối phương, sau đó kết thúc lượt bằng việc rút 1 lá bài từ chồng bài chung.

| Thông số kỹ thuật | Giá trị chuẩn | Ghi chú áp dụng cho dự án `hoangquan2002/BoardGame` |
| :--- | :--- | :--- |
| **Tổng số lá bài** | 56 lá | Chia thành 9 nhóm chức năng (14 loại tên bài khác nhau) theo [danh mục Original Edition](https://explodi.ng/decks/exploding-kittens-original-edition) |
| **Số người chơi hỗ trợ** | 2 – 5 người | Nếu muốn mở rộng lên 6–10 người cần ghép 2 bộ cơ bản hoặc dùng [bản Party Pack](https://www.explodingkittens.com/pages/rules-kittens-party) |
| **Số lá Mèo Nổ trong chồng rút** | `N - 1` lá | Với `N` là số người chơi bắt đầu ván đấu (đảm bảo luôn tìm ra đúng 1 người sống sót cuối cùng) |
| **Số bài khởi đầu mỗi người** | 8 lá (7 lá thường + 1 Defuse) | Theo [luật chính thức hiện hành](https://www.explodingkittens.com/pages/rules-kittens) (bản in đời đầu chia 4 lá thường + 1 Defuse = 5 lá theo [Shopee Blog](https://shopee.vn/blog/luat-choi-meo-no/)) |
| **Giới hạn bài trên tay** | Không giới hạn | Người chơi có thể giữ từ 0 lá đến toàn bộ chồng bài; nếu hết bài trên tay vẫn rút bài cuối lượt bình thường |
| **Điều kiện chiến thắng** | Người sống sót cuối cùng | Tất cả người chơi khác đều đã rút phải Exploding Kitten mà không có lá Defuse để gỡ |

## 2. Danh Sách Chi Tiết 56 Lá Bài & Hiệu Ứng Chuẩn

Dưới đây là thông số đầy đủ của toàn bộ 56 lá bài trong [bộ Original Edition](https://explodi.ng/decks/exploding-kittens-original-edition) cùng quy tắc tương tác với lá chặn (`Nope`) và ảnh minh họa gốc trên [Here Be Kittens!](https://explodi.ng/):

| Nhóm bài | Tên lá bài (Tiếng Anh / Tiếng Việt) | Số lượng | Có bị chặn bởi `Nope`? | Đánh ngoài lượt? | Hiệu ứng & Quy tắc xử lý chuẩn theo [Rulebook PDF](https://libraries.sutherlandshire.nsw.gov.au/__data/assets/pdf_file/0030/99291/Exploding-Kittens-rulebook.pdf) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hiểm họa** | **Exploding Kitten** (Mèo Nổ) | 4 lá | **Không** | Tự động kích hoạt khi rút | Phải lật ngửa ngay lập tức khi vừa rút khỏi chồng bài. Nếu người rút không đánh ra lá `Defuse`, người đó phát nổ, phải bỏ toàn bộ bài trên tay cùng lá Mèo Nổ vào chồng bài bỏ (Discard Pile) và bị loại khỏi ván đấu. |
| **Phòng thủ** | **Defuse** (Gỡ Bom) | 6 lá | **Không** | Chỉ dùng khi vừa rút trúng Mèo Nổ | Đánh vào chồng bài bỏ ngay khi vừa rút phải `Exploding Kitten` để thoát chết. Người chơi lấy lá `Exploding Kitten` vừa rút và **bí mật chèn lại vào bất kỳ vị trí nào** trong chồng bài rút (Draw Pile) mà không cho người khác biết vị trí (từ đỉnh `index 0` đến đáy chồng bài). |
| **Phản đòn** | **Nope** (Chặn) | 5 lá | **Có** (Tạo thành *Yup*) | **Có** (Đánh bất kỳ lúc nào) | Vô hiệu hóa bất kỳ lá bài hành động, cặp bài hoặc Special Combo nào vừa được đánh ra trước khi hiệu ứng bắt đầu thực thi (ngoại trừ `Exploding Kitten` và `Defuse`). Lá bị chặn mất tác dụng và nằm lại ở chồng bài bỏ. Nếu đánh 1 lá `Nope` thứ hai chồng lên lá `Nope` đầu tiên, hiệu ứng chặn bị hủy (thành *Yup*) và hành động gốc được tiếp tục. |
| **Tấn công** | **Attack 2x** (Tấn Công) | 4 lá | **Có** | Không | Kết thúc ngay lập tức lượt hiện tại (hoặc mọi lượt đang nợ) của người đánh mà **không cần rút bài**. Buộc người chơi kế tiếp phải thực hiện **2 lượt liên tiếp**. Nếu nạn nhân đánh tiếp 1 lá `Attack` khác, toàn bộ lượt của họ kết thúc ngay và người kế tiếp phải gánh tổng số lượt còn lại cộng thêm 2 lượt (ví dụ: 4 lượt, 6 lượt). |
| **Né tránh** | **Skip** (Bỏ Lượt) | 4 lá | **Có** | Không | Kết thúc ngay lập tức 1 lượt chơi hiện tại của bạn mà **không cần rút bài**. Lưu ý: Nếu bạn đang phải chịu 2 lượt từ lá `Attack`, đánh 1 lá `Skip` chỉ giúp qua được **1 lượt** (vẫn còn 1 lượt phải chơi tiếp; muốn thoát hoàn toàn phải đánh 2 lá `Skip` hoặc 1 lá `Attack`). |
| **Tương tác** | **Favor** (Xin Xỏ) | 4 lá | **Có** | Không | Chỉ định 1 người chơi khác còn sống trong bàn. Người bị chỉ định bắt buộc phải **tự chọn 1 lá bài** trên tay họ và đưa cho bạn (nếu người đó không còn lá bài nào trên tay thì không thu được bài). |
| **Kiểm soát** | **Shuffle** (Xáo Bài) | 4 lá | **Có** | Không | Xáo trộn ngẫu nhiên toàn bộ chồng bài rút (Draw Pile) mà không được nhìn mặt bài. Rất hữu ích khi bạn nghi ngờ hoặc biết chắc lá trên cùng là `Exploding Kitten`. |
| **Thông tin** | **See the Future 3x** (Nhìn Tương Lai) | 5 lá | **Có** | Không | Bí mật xem **3 lá bài trên cùng** của chồng bài rút (nếu chồng bài còn ít hơn 3 lá thì xem toàn bộ số lá còn lại), sau đó đặt chúng trở lại đúng thứ tự cũ mà không tiết lộ cho người chơi khác. |
| **Bài Mèo** | **Cat Cards** (5 loại × 4 lá) | 20 lá | **Có** (Khi đánh theo cặp/bộ) | Không | Gồm 5 nhân vật: **Taco Cat** (4), **Cattermelon** (4), **Hairy Potato Cat** (4), **Beard Cat** (4) và **Rainbow-Ralphing Cat** (4). Đứng riêng lẻ 1 lá hoàn toàn không có tác dụng (không được phép đánh lẻ 1 lá xuống bàn), chỉ dùng để ghép cặp (**Two of a Kind**) hoặc ghép bộ (**Special Combos**). |

### Danh Mục Biến Thể Minh Họa (Artwork Variants) Trong Bản Thường (41 Mẫu Độc Bản)

Theo [bảng thống kê Master List trên Reddit](https://www.reddit.com/r/ExplodingKittens/comments/1dxfyn6/master_list_of_every_unique_exploding_kittens_card/), dù các lá cùng tên có chức năng giống hệt nhau, bộ Original Edition 56 lá sở hữu **41 bức tranh minh họa/tiêu đề phụ (subtitle) khác nhau** để tăng tính hài hước khi thiết kế giao diện:

* **Exploding Kitten (4 mẫu):** *House Grenade*, *Ship Dynamite*, *Warp Core*, *Launch Y/N (C4)*.
* **Defuse (6 mẫu):** *Via Laser Pointer*, *Via Kitten Therapy*, *Via Belly Rubs*, *Via Catnip Sandwiches*, *Via Participation in Kitten Yoga*, *Via 3AM Flatulence*.
* **Nope (5 mẫu):** *A Jackanope Bounds into the Room*, *Feed Your Opponent a Nope Sandwich*, *Nopestradamus Speaks the Truth*, *A Nope Ninja Delivers a Wicked Dragon Kick*, *Win the Nopebell Peace Prize*.
* **Attack (4 mẫu):** *Deploy the Thousand-Year Back Hair*, *Unleash the Catterwocky*, *Awaken the Bear-O-Dactyl*, *Fire the Crab-a-Pult*.
* **Skip (4 mẫu):** *Don a Portable Cheetah Butt*, *Engage the Hypergoat*, *Commandeer a Bunnyraptor*, *Crab Walk With Some Crabs*.
* **Favor (4 mẫu):** *Ask the Back Hair Beard Boat*, *Get Enslaved by Party Squirrels*, *Rub Peanut Butter on Your Bellybutton*, *Take Your Friends Beard-Sailing*.
* **Shuffle (4 mẫu):** *Summon the Pomeranian Storm*, *A Transdimensional Litter Box Materializes*, *Abracrab Lincoln is Elected*, *Enter the Crabbits*.
* **See the Future (5 mẫu):** *Rub the Belly of a Pig-a-Corn*, *Ask the All-Seeing Goat Wizard*, *Feast Upon a Unicorn Enchilada*, *Deploy the Special Ops Bunnies*, *Summon the Mantis Shrimp*.
* **Cat Cards (5 mẫu × 4 bản sao giống nhau = 20 lá):** *Tacocat* (4), *Cattermelon* (4), *Hairy Potato Cat* (4), *Beard Cat* (4), *Rainbow-Ralphing Cat* (4).

## 3. Quy Trình Thiết Lập Ván Đấu (Game Setup Algorithm)

Khi khởi tạo một ván chơi mới cho `N` người chơi (`2 <= N <= 5`), hệ thống hoặc người chia bài thực hiện chính xác 6 bước tuần tự theo [Rulebook PDF](https://libraries.sutherlandshire.nsw.gov.au/__data/assets/pdf_file/0030/99291/Exploding-Kittens-rulebook.pdf) và [hướng dẫn Boardgame.vn](https://boardgame.vn/blogs/tin-tuc/cach-choi-board-game-meo-no-exploding-kittens-ban-co-ban-mo-rong-cho-nguoi-moi-choi):

1. **Tách bài đặc biệt:** Lấy toàn bộ **4 lá Exploding Kitten** và **6 lá Defuse** ra khỏi bộ bài 56 lá. Lúc này chồng bài tạm thời còn đúng **46 lá** (gồm các lá chức năng và Cat Cards).
2. **Xáo và chia bài khởi đầu:** Xáo trộn ngẫu nhiên 46 lá bài trên và chia úp cho mỗi người chơi **7 lá** (hoặc 4 lá nếu chọn chế độ chơi nhanh đời đầu).
3. **Phát lá Gỡ Bom mặc định:** Đưa cho mỗi người chơi **1 lá Defuse** từ 6 lá đã tách ở Bước 1. Như vậy mỗi người bắt đầu ván đấu với **8 lá bài trên tay** (gồm 7 lá ngẫu nhiên + 1 lá Defuse chắc chắn có).
4. **Hoàn trả lá Defuse thừa vào chồng bài:**
   * Nếu chơi **2 người** hoặc **3 người**: Chỉ lấy đúng **2 lá Defuse** còn thừa bỏ vào chồng bài chung; các lá Defuse dư còn lại (2 lá khi chơi 2 người, 1 lá khi chơi 3 người) được loại bỏ hoàn toàn khỏi ván đấu để tránh ván bài kéo dài quá lâu.
   * Nếu chơi **4 người** (thừa 2 lá Defuse) hoặc **5 người** (thừa 1 lá Defuse): Bỏ toàn bộ số lá Defuse còn thừa vào chồng bài chung.
5. **Chèn lá Mèo Nổ (Exploding Kittens):** Lấy đúng **`N - 1` lá Exploding Kitten** bỏ vào chồng bài chung (cụ thể: 2 người = 1 lá; 3 người = 2 lá; 4 người = 3 lá; 5 người = 4 lá). Các lá Exploding Kitten dư ra được cất vào hộp, không sử dụng trong ván đó.
6. **Xáo chồng bài rút & Chọn người đi trước:** Xáo trộn thật kỹ chồng bài chung và đặt úp ở giữa bàn làm **Chồng Bài Rút (Draw Pile)**, để trống một ô bên cạnh làm **Chồng Bài Bỏ (Discard Pile)**. Chọn ngẫu nhiên người đi đầu tiên và đánh theo chiều kim đồng hồ.

### Bảng Định Lượng Chồng Bài Rút Ngay Sau Khi Setup (Chuẩn 7 Lá + 1 Defuse/Người)

| Số người chơi (`N`) | Tổng bài đã chia trên tay (`N × 8`) | Số `Defuse` bỏ thêm vào Draw Pile | Số `Exploding Kitten` bỏ vào Draw Pile (`N - 1`) | Tổng số lá trong Draw Pile lúc bắt đầu |
| :--- | :--- | :--- | :--- | :--- |
| **2 người** | 16 lá (14 thường + 2 Defuse) | 2 lá (bỏ 2 lá ra ngoài) | 1 lá (bỏ 3 lá ra ngoài) | **35 lá** (32 thường + 2 Defuse + 1 Mèo Nổ) |
| **3 người** | 24 lá (21 thường + 3 Defuse) | 2 lá (bỏ 1 lá ra ngoài) | 2 lá (bỏ 2 lá ra ngoài) | **29 lá** (25 thường + 2 Defuse + 2 Mèo Nổ) |
| **4 người** | 32 lá (28 thường + 4 Defuse) | 2 lá (dùng hết 6 Defuse) | 3 lá (bỏ 1 lá ra ngoài) | **23 lá** (18 thường + 2 Defuse + 3 Mèo Nổ) |
| **5 người** | 40 lá (35 thường + 5 Defuse) | 1 lá (dùng hết 6 Defuse) | 4 lá (dùng hết 4 Mèo Nổ) | **16 lá** (11 thường + 1 Defuse + 4 Mèo Nổ) |

## 4. Luồng Chơi Trong Một Lượt (Turn Flow)

Mỗi lượt của một người chơi luôn gồm **2 giai đoạn bắt buộc** theo đúng thứ tự trong [Rulebook PDF](https://libraries.sutherlandshire.nsw.gov.au/__data/assets/pdf_file/0030/99291/Exploding-Kittens-rulebook.pdf):

### Giai đoạn 1: Đánh bài hoặc Bỏ qua (Play or Pass)
* **Không đánh bài (Pass):** Người chơi có quyền không đánh bất kỳ lá bài nào trên tay và chuyển thẳng sang Giai đoạn 2 (Rút bài).
* **Đánh 1 hoặc nhiều lá bài (Play):** Người chơi đặt ngửa lá bài (hoặc cặp/bộ bài Combo) từ trên tay vào chồng bài bỏ (Discard Pile) và tuyên bố mục tiêu (nếu có).
* **Cửa sổ phản ứng Nope (Nope Window):** Sau khi một lá bài hoặc Combo được đặt xuống nhưng trước khi hiệu ứng xảy ra, mọi người chơi khác đều có cơ hội đánh lá `Nope` để hủy bỏ hành động đó.
* **Lặp lại:** Sau khi hiệu ứng của lá bài vừa đánh được giải quyết xong (và nếu lá bài đó không phải là `Skip` hoặc `Attack` làm kết thúc lượt ngay), người chơi có thể tiếp tục đánh thêm bao nhiêu lá bài khác tùy ý trước khi quyết định rút bài.

### Giai đoạn 2: Rút bài kết thúc lượt (Draw to End Turn)
* Nếu không dùng `Skip` hoặc `Attack`, người chơi **bắt buộc phải rút 1 lá bài trên cùng** của chồng bài rút (Draw Pile) để kết thúc lượt hiện tại.
* **Trường hợp 1 – Rút được lá bài an toàn (không phải Exploding Kitten):** Người chơi bí mật đưa lá bài đó lên tay. Lượt chơi hiện tại kết thúc (hoặc giảm bộ đếm số lượt phải đi đi `1` nếu đang chịu hiệu ứng `Attack`).
* **Trường hợp 2 – Rút trúng lá Exploding Kitten:**
  * Người chơi phải lật ngửa lá `Exploding Kitten` lên ngay lập tức cho cả bàn thấy.
  * **Nếu có lá `Defuse` trên tay:** Đánh 1 lá `Defuse` vào chồng bài bỏ, sau đó lấy lá `Exploding Kitten` bí mật nhét lại vào vị trí bất kỳ trong chồng bài rút (từ vị trí đầu tiên trên cùng đến vị trí cuối cùng dưới đáy). Lượt hiện tại kết thúc.
  * **Nếu không có lá `Defuse`:** Người chơi phát nổ, bỏ toàn bộ bài trên tay cùng lá `Exploding Kitten` vừa rút vào chồng bài bỏ và rời khỏi cuộc chơi.

## 5. Luật Tổ Hợp Đặc Biệt (Special Combos)

Theo quy định tại [Rulebook PDF](https://libraries.sutherlandshire.nsw.gov.au/__data/assets/pdf_file/0030/99291/Exploding-Kittens-rulebook.pdf) và cập nhật luật tại [Here Be Kittens! – Original Edition](https://explodi.ng/decks/exploding-kittens-original-edition), người chơi có thể ghép nhiều lá bài cùng tên hoặc khác tên để tạo ra hiệu ứng cướp bài mạnh mẽ. Khi đánh các lá bài dưới dạng Combo, **hiệu ứng gốc ghi trên từng lá bài lẻ bị bỏ qua hoàn toàn**.

| Loại Combo | Điều kiện ghép bài | Hiệu ứng thực thi | Quy tắc khi bị chặn bởi `Nope` |
| :--- | :--- | :--- | :--- |
| **Two of a Kind** (Đôi cùng tên) | Đánh cùng lúc **2 lá bài có cùng tiêu đề** (ví dụ: 2 lá *Tacocat*, hoặc 2 lá *Shuffle*, 2 lá *Skip*) | Chọn 1 người chơi bất kỳ và **rút mù ngẫu nhiên 1 lá bài** từ trên tay của họ đưa về tay bạn (không được nhìn mặt trước khi chọn). | Chỉ cần **1 lá `Nope`** để chặn toàn bộ đôi bài vừa đánh; cả 2 lá bài trong đôi đều bị mất vào chồng bài bỏ. |
| **Three of a Kind** (Bộ ba cùng tên) | Đánh cùng lúc **3 lá bài có cùng tiêu đề** (ví dụ: 3 lá *Beard Cat* hoặc 3 lá *Favor*) | Chọn 1 người chơi bất kỳ và **đọc tên đích danh 1 loại bài** bạn muốn lấy (ví dụ: *"Đưa cho tôi lá Defuse"* hoặc *"Đưa cho tôi lá Nope"*). Nếu mục tiêu có lá đó, họ bắt buộc phải đưa 1 lá cho bạn. Nếu họ không có, bạn không nhận được gì và mất bộ 3 lá vừa đánh. | Chỉ cần **1 lá `Nope`** để chặn cả bộ 3 lá; toàn bộ 3 lá đều nằm lại ở chồng bài bỏ. |
| **Five Different Cards** (5 lá khác tên) | Đánh cùng lúc **5 lá bài có tiêu đề hoàn toàn khác nhau** (5 loại mèo khác nhau hoặc kết hợp bài chức năng khác tên) | Lục tìm toàn bộ chồng bài bỏ (Discard Pile) và **chọn lấy 1 lá bài bất kỳ** trong đó (trừ Exploding Kitten đã nổ) đưa về tay bạn. | Chỉ cần **1 lá `Nope`** đánh ra trước khi bạn rút bài từ Discard Pile để hủy bỏ toàn bộ 5 lá vừa đánh. |

## 6. Bảng Xử Lý Tình Huống Biên (Edge Cases) Dành Cho Lập Trình Game

Khi xây dựng logic máy trạng thái (State Machine) cho dự án `hoangquan2002/BoardGame`, bạn cần lưu ý xử lý chính xác các tình huống tương tác đặc biệt sau theo [luật chuẩn Exploding Kittens](https://explodi.ng/decks/exploding-kittens-original-edition):

| Tình huống trong game | Cách xử lý chuẩn trong code / gameplay |
| :--- | :--- |
| **Đang bị `Attack` (nợ 2 lượt) mà đánh ra 1 lá `Skip`** | Biến `turnsRemaining` giảm đi `1` (từ `2` xuống `1`). Người chơi đó thoát được lượt đầu tiên không cần bốc bài, nhưng **vẫn phải thực hiện tiếp lượt thứ hai** ngay sau đó. |
| **Đang bị `Attack` (nợ 2 lượt) mà đánh ra 1 lá `Attack` mới** | Theo luật cập nhật trên [Here Be Kittens!](https://explodi.ng/decks/exploding-kittens-original-edition), toàn bộ lượt của người đang bị tấn công kết thúc ngay lập tức; người chơi kế tiếp phải chịu số lượt còn lại cộng thêm 2 lượt (`turnsRemaining = remainingTurns + 2`). *(Lưu ý: Trong [Rulebook in lần đầu năm 2015](https://libraries.sutherlandshire.nsw.gov.au/__data/assets/pdf_file/0030/99291/Exploding-Kittens-rulebook.pdf), lá Attack mới chỉ chuyển giao 2 lượt cho người sau; bạn có thể thêm cờ `stackAttacks = true/false` trong phần cài đặt phòng chơi).* |
| **Đang bị `Attack` (nợ 2 lượt) và rút trúng `Exploding Kitten` ở lượt đầu tiên** | Nếu người chơi **không có `Defuse`**: họ chết ngay lập tức, số lượt nợ còn lại tự động hủy bỏ và chuyển sang người chơi kế tiếp với `turnsRemaining = 1`. Nếu người chơi **dùng `Defuse` thành công**: họ chỉ mới hoàn thành xong lượt thứ nhất và **bắt buộc phải thực hiện tiếp lượt thứ hai**. |
| **Đánh `Nope` lên một lá `Attack` hoặc `Skip`** | Lá `Attack` hoặc `Skip` bị hủy bỏ hoàn toàn; lượt chơi vẫn thuộc về người vừa đánh lá đó và họ vẫn phải rút bài (hoặc đánh lá khác) để kết thúc lượt của mình. |
| **Chuỗi `Nope` liên hoàn (`Nope` chồng lên `Nope`)** | Đếm tổng số lá `Nope` được đánh trong cùng một chuỗi phản ứng: nếu tổng số lá `Nope` là **số lẻ (1, 3, 5)** thì hành động gốc bị **HỦY BỎ (Noped)**; nếu tổng số lá `Nope` là **số chẵn (2, 4)** thì hành động gốc được **THỰC THI (Yupped)**. |
| **Đánh `Favor` hoặc Combo cướp bài vào người chơi đang có 0 lá trên tay** | Luật không cấm chọn mục tiêu có 0 lá, nhưng hành động đó sẽ không thu về được lá bài nào (trong UI game có thể làm mờ/vô hiệu hóa việc chọn mục tiêu đang có `hand.length === 0` để tránh người chơi bấm nhầm). |
| **Chồng bài rút (Draw Pile) còn ít hơn 3 lá khi dùng `See the Future`** | Chỉ hiển thị số lá bài thực tế đang còn trong chồng bài rút (ví dụ: còn 2 lá hoặc 1 lá) mà không báo lỗi tràn mảng (`IndexOutOfBounds`). |
