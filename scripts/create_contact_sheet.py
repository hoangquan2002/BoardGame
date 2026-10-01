#!/usr/bin/env python3
"""
Tạo contact sheet với 18 lá bài và id bên dưới để người quản lý duyệt nhanh.
Lưu vào scratch/contact_sheet.png (không commit vào repo).
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
CARDS_DIR = os.path.join(ROOT_DIR, "packages", "client", "public", "cards")
OUT_PATH = os.path.join(ROOT_DIR, "scratch", "contact_sheet.png")

CARD_LIST = [
    ("anxiety", "Lo âu"),
    ("anorexia", "Chứng biếng ăn"),
    ("depression", "Trầm cảm"),
    ("gambling-addiction", "Nghiện cờ bạc"),
    ("madness", "Điên loạn"),
    ("suicidal-thoughts", "Suy nghĩ tự tử"),
    ("impotence", "Liệt dương"),
    ("tremors", "Chứng run"),
    ("chlorpromazine", "Chlorpromazine (Trị Điên loạn)"),
    ("clozapine", "Clozapine (Trị Suy nghĩ tự tử)"),
    ("fluoxetine", "Fluoxetine (Trị Trầm cảm)"),
    ("lithium", "Lithium (Trị Nghiện cờ bạc)"),
    ("lorazepam", "Lorazepam (Trị Lo âu)"),
    ("pramipexole", "Pramipexole (Trị Chứng run)"),
    ("sildenafil", "Sildenafil (Trị Liệt dương)"),
    ("episode", "Triệu Chứng"),
    ("therapy", "Liệu Pháp"),
    ("back", "Mặt sau lá bài"),
]

def main():
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    card_w, card_h = 160, 286
    label_h = 36
    item_w = card_w + 16
    item_h = card_h + label_h + 16
    cols = 6
    rows = 3

    sheet = Image.new("RGB", (cols * item_w + 20, rows * item_h + 20), (28, 33, 40))
    draw = ImageDraw.Draw(sheet)

    for i, (cid, title) in enumerate(CARD_LIST):
        r = i // cols
        c = i % cols
        x = 10 + c * item_w + 8
        y = 10 + r * item_h + 8

        img_path = os.path.join(CARDS_DIR, f"{cid}.webp")
        if os.path.exists(img_path):
            card_img = Image.open(img_path).resize((card_w, card_h), Image.Resampling.LANCZOS)
            sheet.paste(card_img, (x, y))

        draw.rectangle([x, y + card_h + 2, x + card_w, y + card_h + label_h], fill=(15, 23, 42))
        draw.text((x + 4, y + card_h + 4), cid, fill=(56, 189, 248))
        draw.text((x + 4, y + card_h + 18), title[:22], fill=(226, 232, 240))

    sheet.save(OUT_PATH)
    print(f"Đã tạo contact sheet: {OUT_PATH}")

if __name__ == "__main__":
    main()
