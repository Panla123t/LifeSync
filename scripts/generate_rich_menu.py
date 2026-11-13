import os
from PIL import Image, ImageDraw, ImageFont

WIDTH = 2500
HEIGHT = 1686
COLS = 3
ROWS = 2

TILE_W = WIDTH // COLS  # 833
TILE_H = HEIGHT // ROWS # 843

# Color palettes for each tile
TILES_DATA = [
    # Row 0
    {
        "col": 0, "row": 0,
        "bg_top": (2, 132, 199),     # sky-600
        "bg_bot": (14, 165, 233),   # sky-500
        "icon": "💧",
        "title_th": "บันทึกดื่มน้ำ",
        "sub_en": "HYDRATION LOG",
        "badge": "แตะเพื่อเลือกปริมาณน้ำ",
        "badge_bg": (255, 255, 255, 45)
    },
    {
        "col": 1, "row": 0,
        "bg_top": (5, 150, 105),     # emerald-600
        "bg_bot": (16, 185, 129),   # emerald-500
        "icon": "📸",
        "title_th": "ถ่ายรูปอาหาร",
        "sub_en": "AI FOOD CAMERA",
        "badge": "วิเคราะห์แคลอรีด้วย AI",
        "badge_bg": (255, 255, 255, 55)
    },
    {
        "col": 2, "row": 0,
        "bg_top": (79, 70, 229),     # indigo-600
        "bg_bot": (99, 102, 241),   # indigo-500
        "icon": "😴",
        "title_th": "บันทึกการนอน",
        "sub_en": "SLEEP ROUTINE",
        "badge": "เวลานอนและงีบหลับ",
        "badge_bg": (255, 255, 255, 45)
    },
    # Row 1
    {
        "col": 0, "row": 1,
        "bg_top": (217, 119, 6),    # amber-600
        "bg_bot": (245, 158, 11),   # amber-500
        "icon": "🎯",
        "title_th": "ภารกิจ & เลเวล",
        "sub_en": "QUESTS & REWARDS",
        "badge": "ดูแต้มและเหรียญรางวัล",
        "badge_bg": (255, 255, 255, 45)
    },
    {
        "col": 1, "row": 1,
        "bg_top": (13, 148, 136),    # teal-600
        "bg_bot": (20, 184, 166),   # teal-500
        "icon": "📊",
        "title_th": "สรุปสุขภาพ",
        "sub_en": "WEEKLY SNAPSHOT",
        "badge": "เปิดดูกราฟในเว็บแอป",
        "badge_bg": (255, 255, 255, 55)
    },
    {
        "col": 2, "row": 1,
        "bg_top": (51, 65, 85),      # slate-700
        "bg_bot": (71, 85, 105),     # slate-600
        "icon": "⚙️",
        "title_th": "ตั้งค่า & บัญชี",
        "sub_en": "SETTINGS & PREFS",
        "badge": "เวลาเตือน & บัญชีผู้ใช้",
        "badge_bg": (255, 255, 255, 45)
    }
]

def draw_vertical_gradient(draw, x0, y0, x1, y1, c1, c2):
    height = y1 - y0
    for y in range(y0, y1):
        ratio = (y - y0) / max(1, height)
        r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
        g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
        b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
        draw.line([(x0, y), (x1, y)], fill=(r, g, b))

def main():
    img = Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Fonts
    font_path_thai = r"C:\Windows\Fonts\leelawdb.ttf"
    font_path_en = r"C:\Windows\Fonts\arialbd.ttf"
    font_path_emoji = r"C:\Windows\Fonts\seguiemj.ttf"

    font_title = ImageFont.truetype(font_path_thai, 72)
    font_sub = ImageFont.truetype(font_path_en, 36)
    font_badge = ImageFont.truetype(font_path_thai, 38)
    font_icon = ImageFont.truetype(font_path_emoji, 140)

    for item in TILES_DATA:
        c = item["col"]
        r = item["row"]

        x0 = c * TILE_W
        x1 = WIDTH if c == 2 else (c + 1) * TILE_W
        y0 = r * TILE_H
        y1 = HEIGHT if r == 1 else (r + 1) * TILE_H

        # Draw tile gradient
        draw_vertical_gradient(draw, x0, y0, x1, y1, item["bg_top"], item["bg_bot"])

        center_x = (x0 + x1) // 2

        # Draw Icon (Emoji)
        icon_str = item["icon"]
        # In PIL, emoji positioning
        icon_bbox = draw.textbbox((0, 0), icon_str, font=font_icon)
        icon_w = icon_bbox[2] - icon_bbox[0]
        icon_x = center_x - (icon_w // 2)
        icon_y = y0 + 130
        draw.text((icon_x, icon_y), icon_str, font=font_icon, fill=(255, 255, 255))

        # Draw Thai Title
        title = item["title_th"]
        title_bbox = draw.textbbox((0, 0), title, font=font_title)
        title_w = title_bbox[2] - title_bbox[0]
        title_x = center_x - (title_w // 2)
        title_y = y0 + 380
        draw.text((title_x, title_y), title, font=font_title, fill=(255, 255, 255))

        # Draw English Subtitle
        sub = item["sub_en"]
        sub_bbox = draw.textbbox((0, 0), sub, font=font_sub)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_x = center_x - (sub_w // 2)
        sub_y = y0 + 490
        draw.text((sub_x, sub_y), sub, font=font_sub, fill=(255, 255, 255, 210))

        # Draw Badge Pill at bottom
        badge = item["badge"]
        badge_bbox = draw.textbbox((0, 0), badge, font=font_badge)
        bw = badge_bbox[2] - badge_bbox[0]
        bh = badge_bbox[3] - badge_bbox[1]
        
        pw = bw + 70
        ph = 76
        px0 = center_x - (pw // 2)
        py0 = y0 + 610
        px1 = px0 + pw
        py1 = py0 + ph

        # Semi-transparent pill
        pill_overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        pdraw = ImageDraw.Draw(pill_overlay)
        pdraw.rounded_rectangle([px0, py0, px1, py1], radius=38, fill=item["badge_bg"], outline=(255, 255, 255, 90), width=3)
        img.paste(Image.alpha_composite(img.convert("RGBA"), pill_overlay).convert("RGB"))
        draw = ImageDraw.Draw(img)

        # Draw text inside pill
        bx = center_x - (bw // 2)
        by = py0 + (ph - bh) // 2 - 4
        draw.text((bx, by), badge, font=font_badge, fill=(255, 255, 255))

    # Draw grid divider lines
    line_color = (255, 255, 255, 120)
    # Vertical lines
    for c in range(1, 3):
        x = c * TILE_W
        draw.line([(x, 0), (x, HEIGHT)], fill=(255, 255, 255), width=4)
    # Horizontal line
    draw.line([(0, TILE_H), (WIDTH, TILE_H)], fill=(255, 255, 255), width=4)

    out_path = os.path.join("public", "line", "rich-menu-6tiles.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Successfully generated 6-tile Rich Menu at: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    main()
