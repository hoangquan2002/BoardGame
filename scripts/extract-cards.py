#!/usr/bin/env python3
"""
scripts/extract-cards.py

Trích xuất ảnh lá bài nguyên byte từ file PDF Việt hoá assets/card-photos/Side effects.pdf.
Mỗi ô lưới trong PDF là 1 ảnh JPEG nhúng 520x864 (trang 20 là mặt sau: 496x822).
Ghi nguyên byte ra packages/client/public/cards/<id>.jpg kèm manifest.json.
Hỗ trợ chế độ --check để kiểm tra tính toàn vẹn (băm lại ảnh nhúng so với file đã xuất).

Yêu cầu:
  pip install pymupdf Pillow

Cách chạy:
  python scripts/extract-cards.py
  python scripts/extract-cards.py --check
"""

import os
import sys
import json
import hashlib
import argparse
import pymupdf

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
PDF_PATH = os.path.join(ROOT_DIR, "assets", "card-photos", "Side effects.pdf")
OUTPUT_DIR = os.path.join(ROOT_DIR, "packages", "client", "public", "cards")
MANIFEST_PATH = os.path.join(OUTPUT_DIR, "manifest.json")

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

def extract_cards():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Mở PDF: {PDF_PATH}")
    doc = pymupdf.open(PDF_PATH)
    print(f"Tổng số trang: {len(doc)}")

    # Xoá các file .webp cũ
    webp_removed = 0
    for fname in os.listdir(OUTPUT_DIR):
        if fname.endswith(".webp"):
            os.remove(os.path.join(OUTPUT_DIR, fname))
            webp_removed += 1
    if webp_removed > 0:
        print(f"Đã xoá {webp_removed} file .webp cũ.")

    manifest = {}
    total_bytes = 0

    for page_num, card_id in PAGE_MAPPING.items():
        page_idx = page_num - 1
        page = doc[page_idx]
        images = page.get_images()
        if not images:
            raise RuntimeError(f"Trang {page_num} không có ảnh nhúng!")
        xref = images[0][0]
        img_info = doc.extract_image(xref)

        raw_bytes = img_info["image"]
        width = img_info["width"]
        height = img_info["height"]
        sha256 = hashlib.sha256(raw_bytes).hexdigest()
        filename = f"{card_id}.jpg"
        out_path = os.path.join(OUTPUT_DIR, filename)

        with open(out_path, "wb") as f:
            f.write(raw_bytes)

        manifest[card_id] = {
            "id": card_id,
            "file": filename,
            "page": page_num,
            "width": width,
            "height": height,
            "sha256": sha256,
        }

        file_size = len(raw_bytes)
        total_bytes += file_size
        print(f"  [Trang {page_num:2d}] -> {filename}: {width}x{height}px, {file_size / 1024:.1f} KB, sha256={sha256[:12]}...")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nĐã ghi manifest vào {MANIFEST_PATH}")
    print(f"Đã xuất {len(manifest)} ảnh lá bài vào {OUTPUT_DIR}")
    print(f"Tổng dung lượng: {total_bytes / 1024 / 1024:.2f} MB")

def check_cards():
    print(f"Kiểm tra tính toàn vẹn ảnh lá bài so với PDF: {PDF_PATH}")
    if not os.path.exists(PDF_PATH):
        print(f"LỖI: Không tìm thấy PDF {PDF_PATH}")
        sys.exit(1)
    if not os.path.exists(MANIFEST_PATH):
        print(f"LỖI: Không tìm thấy manifest {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    doc = pymupdf.open(PDF_PATH)
    all_ok = True

    for page_num, card_id in PAGE_MAPPING.items():
        page_idx = page_num - 1
        page = doc[page_idx]
        images = page.get_images()
        if not images:
            print(f"❌ Trang {page_num} ({card_id}): không có ảnh nhúng!")
            all_ok = False
            continue
        xref = images[0][0]
        img_info = doc.extract_image(xref)
        pdf_bytes = img_info["image"]
        pdf_sha256 = hashlib.sha256(pdf_bytes).hexdigest()

        # Kiểm tra file đã xuất
        file_path = os.path.join(OUTPUT_DIR, f"{card_id}.jpg")
        if not os.path.exists(file_path):
            print(f"❌ File không tồn tại: {file_path}")
            all_ok = False
            continue

        with open(file_path, "rb") as f:
            disk_bytes = f.read()
        disk_sha256 = hashlib.sha256(disk_bytes).hexdigest()

        if disk_sha256 != pdf_sha256:
            print(f"❌ SHA256 lệch giữa PDF và đĩa cho {card_id}: PDF={pdf_sha256} vs Đĩa={disk_sha256}")
            all_ok = False
            continue

        m_entry = manifest.get(card_id)
        if not m_entry:
            print(f"❌ Manifest thiếu mục {card_id}")
            all_ok = False
            continue

        if m_entry.get("sha256") != disk_sha256:
            print(f"❌ SHA256 lệch giữa manifest và đĩa cho {card_id}")
            all_ok = False
            continue

        if m_entry.get("width") != img_info["width"] or m_entry.get("height") != img_info["height"]:
            print(f"❌ Kích thước lệch cho {card_id}")
            all_ok = False
            continue

        print(f"  ✓ {card_id:20s}: {img_info['width']}x{img_info['height']} khớp 100% (sha256={disk_sha256[:12]}...)")

    if all_ok:
        print("\n✅ KIỂM TRA TOÀN BỘ: 100% ảnh xuất khớp chính xác từng byte với ảnh nhúng trong PDF!")
    else:
        print("\n❌ CÓ LỖI SAI KHÁC!")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Trích xuất ảnh lá bài nguyên byte từ PDF Side Effects")
    parser.add_argument("--check", action="store_true", help="Kiểm tra tính toàn vẹn (băm lại ảnh nhúng so với file đã xuất)")
    args = parser.parse_args()

    if args.check:
        check_cards()
    else:
        extract_cards()

if __name__ == "__main__":
    main()
