import os
import json
import urllib.request
import urllib.error

TOKEN = '1rh5h2a2yGUoVwrz7OmjXaWiTdOnneTiW/l0zZGVOVl0SlUeyAna8E1SRiPL9ocrFirghOzhu+bxDohQVfPsG207JBeMOxJBq+fwo6/Wr0jcjVr5qyfILcd5KPuAESZQZyIJI4IESFEJpJBLAMD6BgdB04t89/1O/w1cDnyilFU='
APP_URL = 'https://life-sync-panla123ts-projects.vercel.app'
IMAGE_PATH = 'public/richmenu.png'

# 1. Define Rich Menu Structure
rich_menu_data = {
    "size": {
        "width": 2500,
        "height": 1686
    },
    "selected": True,
    "name": "LifeSync Companion Menu",
    "chatBarText": "เมนูดูแลสุขภาพ ☀️",
    "areas": [
        # Tile 1: Nutrition / Food (Top-Left)
        {
            "bounds": {"x": 0, "y": 0, "width": 833, "height": 843},
            "action": {
                "type": "uri",
                "label": "บันทึกอาหาร",
                "uri": f"{APP_URL}/nutrition"
            }
        },
        # Tile 2: Hydration Quick Add (Top-Center)
        {
            "bounds": {"x": 833, "y": 0, "width": 834, "height": 843},
            "action": {
                "type": "message",
                "label": "จิบน้ำ +250ml",
                "text": "น้ำ 250"
            }
        },
        # Tile 3: Sleep / Naps (Top-Right)
        {
            "bounds": {"x": 1667, "y": 0, "width": 833, "height": 843},
            "action": {
                "type": "uri",
                "label": "บันทึกการนอน",
                "uri": f"{APP_URL}/sleep"
            }
        },
        # Tile 4: Analytics / Dashboard (Bottom-Left)
        {
            "bounds": {"x": 0, "y": 843, "width": 833, "height": 843},
            "action": {
                "type": "uri",
                "label": "สถิติ & กราฟ",
                "uri": f"{APP_URL}/dashboard"
            }
        },
        # Tile 5: Quests & Badges (Bottom-Center)
        {
            "bounds": {"x": 833, "y": 843, "width": 834, "height": 843},
            "action": {
                "type": "uri",
                "label": "ภารกิจ & เหรียญ",
                "uri": f"{APP_URL}/quests"
            }
        },
        # Tile 6: Settings (Bottom-Right)
        {
            "bounds": {"x": 1667, "y": 843, "width": 833, "height": 843},
            "action": {
                "type": "uri",
                "label": "ตั้งค่าการเตือน",
                "uri": f"{APP_URL}/settings"
            }
        }
    ]
}

def create_and_set_rich_menu():
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }

    # Step 1: Create Rich Menu
    print("[1/3] Creating Rich Menu object...")
    req = urllib.request.Request(
        'https://api.line.me/v2/bot/richmenu',
        data=json.dumps(rich_menu_data).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        res_json = json.loads(resp.read().decode())
        rich_menu_id = res_json['richMenuId']
        print(f"Rich Menu created successfully! ID: {rich_menu_id}")

    # Step 2: Upload Image
    print("[2/3] Uploading Rich Menu image (public/richmenu.png)...")
    with open(IMAGE_PATH, 'rb') as f:
        img_bytes = f.read()

    upload_headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'image/png',
        'Content-Length': str(len(img_bytes))
    }
    upload_req = urllib.request.Request(
        f'https://api-data.line.me/v2/bot/richmenu/{rich_menu_id}/content',
        data=img_bytes,
        headers=upload_headers,
        method='POST'
    )
    with urllib.request.urlopen(upload_req) as resp:
        print("Image uploaded successfully! Status:", resp.status)

    # Step 3: Set as default for all users
    print("[3/3] Setting Rich Menu as default for all LINE users...")
    default_req = urllib.request.Request(
        f'https://api.line.me/v2/bot/user/all/richmenu/{rich_menu_id}',
        headers={'Authorization': f'Bearer {TOKEN}'},
        method='POST'
    )
    with urllib.request.urlopen(default_req) as resp:
        print("Default Rich Menu set successfully! Status:", resp.status)

    print("\n🎉 DONE! The LifeSync Rich Menu is now LIVE on Sunny (@766iowmg)!")

if __name__ == '__main__':
    create_and_set_rich_menu()
