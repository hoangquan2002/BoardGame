#!/usr/bin/env python3
"""
scripts/extract-cards.py

Trích xuất ảnh lá bài từ file PDF Việt hoá assets/card-photos/Side effects.pdf.
Cắt lá bài ở vị trí hàng 1, cột 1 (lưới 2x3), xuất ra định dạng WebP chất lượng cao (<= 60KB).
Xuất ảnh vào thư mục packages/client/public/cards/

Yêu cầu:
  pip install pymupdf Pillow

Cách chạy:
  python scripts/extract-cards.py
"""

import os
import sys
import pymupdf
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
PDF_PATH = os.path.join(ROOT_DIR, "assets", "card-photos", "Side effects.pdf")
OUTPUT_DIR = os.path.join(ROOT_DIR, "packages", "client", "public", "cards")

# Bảng ánh xạ Trang (1-indexed) -> Card ID
# Page 3 & Page 4 là lá Gia Vị (misdiagnosis, highTolerance) được ghi nhận nhưng bỏ qua trong MVP
PAGE_MAPPING = {
    1: "episode",
    2: "therapy",
    # 3: "misdiagnosis",  # Gia Vị (Spice)
    # 4: "highTolerance", # Gia Vị (Spice)
    5: "chlorpromazine",
    6: "clozapine",
    7: "fluoxetine",
    8: "lithium",
    9: "lorazepam",
    10: "pramipexole",
    11: "sildenafil",
    12: "anxiety",
    13: "anorexia",
    14: "depression",
    15: "gambling-addiction",
    16: "madness",
    17: "suicidal-thoughts",
    18: "impotence",
    19: "tremors",
    20: "back",
}

# Toạ độ cắt lá bài (hàng 1, cột 1 trên trang rendered ở 150 DPI)
# Khung trang: 1275 x 1650
CROP_BOX = (105, 157, 416, 714) # width 311, height 557
TARGET_WIDTH = 300

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Mở PDF: {PDF_PATH}")
    doc = pymupdf.open(PDF_PATH)
    print(f"Tổng số trang: {len(doc)}")

    exported = []
    for page_num, card_id in PAGE_MAPPING.items():
        page_idx = page_num - 1
        page = doc[page_idx]
        pix = page.get_pixmap(dpi=150)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Cắt lá bài
        card_img = img.crop(CROP_BOX)

        # Scale tỷ lệ chuẩn (rộng 300px, cao ~537px)
        target_height = int(round(TARGET_WIDTH * card_img.height / card_img.width))
        resized = card_img.resize((TARGET_WIDTH, target_height), Image.Resampling.LANCZOS)

        # Lưu WebP
        out_path = os.path.join(OUTPUT_DIR, f"{card_id}.webp")
        resized.save(out_path, "WEBP", quality=82)

        file_size = os.path.getsize(out_path)
        print(f"  [Trang {page_num:2d}] -> {card_id}.webp: {resized.size[0]}x{resized.size[1]}px, {file_size / 1024:.1f} KB")
        exported.append((card_id, file_size))

    print(f"\nĐã xuất {len(exported)} ảnh lá bài vào {OUTPUT_DIR}")
    max_size = max(s for _, s in exported)
    print(f"Kích thước lớn nhất: {max_size / 1024:.1f} KB (yêu cầu <= 60 KB: {'ĐẠT' if max_size <= 60 * 1024 else 'KHÔNG ĐẠT'})")

if __name__ == "__main__":
    main()
