import os
from PIL import Image, ImageDraw, ImageFont

WIDTH = 2500
HEIGHT = 1686

# Create high-res canvas
canvas = Image.new('RGB', (WIDTH, HEIGHT), color=(243, 245, 248))
draw = ImageDraw.Draw(canvas)

# Modern Thai Sans-Serif Fonts (Google Fonts Prompt: clean, loopless, sans-serif)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
font_thai_bold = os.path.join(SCRIPT_DIR, 'fonts', 'Prompt-Bold.ttf')
font_thai_reg = os.path.join(SCRIPT_DIR, 'fonts', 'Prompt-Regular.ttf')
font_segoe_emoji = r'C:\Windows\Fonts\seguiemj.ttf'

title_font = ImageFont.truetype(font_thai_bold, 60)
sub_font = ImageFont.truetype(font_thai_reg, 36)
emoji_font = ImageFont.truetype(font_segoe_emoji, 115) if os.path.exists(font_segoe_emoji) else title_font

# 6 Tiles Configuration
tiles = [
    # Row 0
    {
        "col": 0, "row": 0,
        "emoji": "🥗",
        "title": "บันทึกมื้ออาหาร",
        "subtitle": "AI Food Diary • สแกนรูป",
        "bg_top": (236, 253, 245), "bg_bot": (209, 250, 229), # Emerald pastel
        "border": (110, 231, 183),
        "icon_bg": (16, 185, 129),
        "text_color": (6, 78, 59),
        "sub_color": (15, 118, 110)
    },
    {
        "col": 1, "row": 0,
        "emoji": "💧",
        "title": "จิบน้ำ +250ml",
        "subtitle": "กดเพื่อบันทึกน้ำทันที",
        "bg_top": (238, 248, 255), "bg_bot": (207, 235, 253), # Sky pastel
        "border": (125, 211, 252),
        "icon_bg": (14, 165, 233),
        "text_color": (12, 74, 96),
        "sub_color": (3, 105, 161)
    },
    {
        "col": 2, "row": 0,
        "emoji": "🌙",
        "title": "บันทึกการนอน",
        "subtitle": "Sleep & Power Naps",
        "bg_top": (243, 242, 255), "bg_bot": (224, 220, 255), # Indigo/Violet pastel
        "border": (196, 181, 253),
        "icon_bg": (124, 58, 237),
        "text_color": (59, 7, 100),
        "sub_color": (109, 40, 217)
    },
    # Row 1
    {
        "col": 0, "row": 1,
        "emoji": "📊",
        "title": "สถิติ & กราฟ",
        "subtitle": "7-Day Habits Analytics",
        "bg_top": (240, 253, 250), "bg_bot": (204, 251, 241), # Teal pastel
        "border": (94, 234, 212),
        "icon_bg": (13, 148, 136),
        "text_color": (19, 78, 74),
        "sub_color": (15, 118, 110)
    },
    {
        "col": 1, "row": 1,
        "emoji": "🏆",
        "title": "ภารกิจ & เหรียญ",
        "subtitle": "Quests, Streaks & Badges",
        "bg_top": (255, 251, 235), "bg_bot": (254, 243, 199), # Amber pastel
        "border": (252, 211, 77),
        "icon_bg": (245, 158, 11),
        "text_color": (120, 53, 15),
        "sub_color": (180, 83, 9)
    },
    {
        "col": 2, "row": 1,
        "emoji": "⚙️",
        "title": "ตั้งค่าการเตือน",
        "subtitle": "Reminder Preferences",
        "bg_top": (248, 250, 252), "bg_bot": (226, 232, 240), # Slate pastel
        "border": (203, 213, 225),
        "icon_bg": (71, 85, 105),
        "text_color": (30, 41, 59),
        "sub_color": (71, 85, 105)
    }
]

col_widths = [833, 834, 833]
row_height = 843
pad = 18

for t in tiles:
    c = t["col"]
    r = t["row"]
    x1 = sum(col_widths[:c]) + pad
    x2 = sum(col_widths[:c+1]) - pad
    y1 = r * row_height + pad
    y2 = (r + 1) * row_height - pad

    # Draw rounded card with subtle gradient
    card_w = x2 - x1
    card_h = y2 - y1

    card = Image.new('RGB', (card_w, card_h), t["bg_top"])
    card_draw = ImageDraw.Draw(card)

    for i in range(card_h):
        ratio = i / card_h
        r_c = int(t["bg_top"][0] * (1 - ratio) + t["bg_bot"][0] * ratio)
        g_c = int(t["bg_top"][1] * (1 - ratio) + t["bg_bot"][1] * ratio)
        b_c = int(t["bg_top"][2] * (1 - ratio) + t["bg_bot"][2] * ratio)
        card_draw.line([(0, i), (card_w, i)], fill=(r_c, g_c, b_c))

    # Mask for rounded corners
    mask = Image.new('L', (card_w, card_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (card_w, card_h)], radius=46, fill=255)

    # Paste rounded card
    canvas.paste(card, (x1, y1), mask)

    # Draw border
    draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=46, outline=t["border"], width=5)

    # Center coordinates of the tile
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2

    # Draw Icon Circle
    circle_r = 100
    icon_cy = cy - 100
    draw.ellipse(
        [(cx - circle_r, icon_cy - circle_r), (cx + circle_r, icon_cy + circle_r)],
        fill=t["icon_bg"]
    )
    # Inner subtle glow
    draw.ellipse(
        [(cx - circle_r + 4, icon_cy - circle_r + 4), (cx + circle_r - 4, icon_cy + circle_r - 4)],
        outline=(255, 255, 255),
        width=4
    )

    # Draw Emoji in icon circle
    try:
        bbox = draw.textbbox((0, 0), t["emoji"], font=emoji_font)
        ew = bbox[2] - bbox[0]
        eh = bbox[3] - bbox[1]
        draw.text((cx - ew // 2, icon_cy - eh // 2 - 12), t["emoji"], font=emoji_font, fill=(255, 255, 255))
    except Exception:
        pass

    # Draw Title
    t_bbox = draw.textbbox((0, 0), t["title"], font=title_font)
    tw = t_bbox[2] - t_bbox[0]
    draw.text((cx - tw // 2, cy + 95), t["title"], font=title_font, fill=t["text_color"])

    # Draw Subtitle
    s_bbox = draw.textbbox((0, 0), t["subtitle"], font=sub_font)
    sw = s_bbox[2] - s_bbox[0]
    draw.text((cx - sw // 2, cy + 190), t["subtitle"], font=sub_font, fill=t["sub_color"])

# Save to public directory
os.makedirs('public', exist_ok=True)
out_path = 'public/richmenu.png'
canvas.save(out_path, format='PNG', optimize=True)
print(f"Rich Menu image generated successfully at {out_path} ({WIDTH}x{HEIGHT})")
