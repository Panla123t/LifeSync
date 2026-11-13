# LifeSync — System Handover & LINE Bot Deployment Guide

> **Project Name**: LifeSync (Health & Habit Tracking Platform)  
> **Tech Stack**: Next.js 16 (App Router), Supabase (PostgreSQL + Auth), Google Gemini AI, LINE Messaging API, Vercel  
> **Mascot / Health Coach**: "Sunny" (ซันนี่ ☀️)  

This guide provides end-to-end instructions for transferring, configuring, and deploying this software repository to another person, server, or organization from scratch.

---

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Environment Variables Reference Matrix](#2-environment-variables-reference-matrix)
3. [Database Setup (Supabase)](#3-database-setup-supabase)
4. [AI Provider Setup (Google Gemini)](#4-ai-provider-setup-google-gemini)
5. [Complete LINE Official Account & Bot Guide](#5-complete-line-official-account--bot-guide)
6. [Automated Cron Reminders (Vercel Cron)](#6-automated-cron-reminders-vercel-cron)
7. [Handover Recipient Quickstart Checklist](#7-handover-recipient-quickstart-checklist)

---

## 1. Overview & Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │                 LifeSync                     │
                  │   Desktop Sidebar & Mobile Responsive App    │
                  └──────┬──────────────────┬─────────────────┬──┘
                         │                  │                 │
         Supabase Auth & DB         Gemini Flash AI     LINE Messaging API
         • Profiles & Records       • Vision Food Log   • Sunny Webhook Bot
         • Streaks & Quests         • Wellness Coach    • Automated Cron Nudges
         • PDPA Data Export         • Dynamic Prompts   • 6-Tile Rich Menu
```

LifeSync operates as a hybrid progressive web platform:
- **Web App**: Daily health tracking for Hydration (2L goal), Nutrition (AI camera scan), and Sleep (sleep + power naps), gamified with XP points, streak counters, 11 milestone badges, and 9:16 Social Story sharing.
- **LINE Bot Companion**: Users link their web account to Coach Sunny in LINE to receive scheduled nudges, log water with 1 tap, and get instant answers to wellness questions.

---

## 2. Environment Variables Reference Matrix

When handing over the codebase, the new owner must configure these environment variables in their local `.env.local` file and in their hosting provider (e.g. **Vercel Project Settings &rarr; Environment Variables**):

| Variable Name | Required? | Visibility | Description & Where to Find |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client (Public) | Your Supabase Project URL (`https://<project-ref>.supabase.co`). Found in **Supabase Dashboard &rarr; Project Settings &rarr; API**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client (Public) | Supabase `anon` / public API key. Found in **Supabase Dashboard &rarr; Project Settings &rarr; API**. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server (Secret) | Supabase `service_role` secret key (bypasses RLS for webhooks, cron jobs, and account deletion). Found in **Supabase Dashboard &rarr; Project Settings &rarr; API**. |
| `AI_PROVIDER_API_KEY` *(or `GEMINI_API_KEY`)* | **Yes** | Server (Secret) | Google Gemini API Key. Powers AI Vision food recognition and Coach Sunny chatbot. Obtain free at [Google AI Studio](https://aistudio.google.com/app/apikey). |
| `LINE_CHANNEL_ACCESS_TOKEN` | **Yes** (for bot) | Server (Secret) | Long-lived Channel Access Token for LINE Messaging API. Issued in [LINE Developers Console](https://developers.line.biz/) under **Messaging API &rarr; Channel access token**. |
| `LINE_CHANNEL_SECRET` | **Yes** (for bot) | Server (Secret) | Channel Secret used to verify webhook signatures. Found in [LINE Developers Console](https://developers.line.biz/) under **Basic settings**. |
| `LINE_BOT_BASIC_ID` | Optional | Server (Public) | The `@` basic ID of your LINE Official Account (e.g., `@766iowmg`). Used for generating invite links. |
| `APP_BASE_URL` | **Yes** | Server / Client | The public URL of the deployed application (e.g., `https://your-domain.vercel.app` in production or `http://localhost:3000` in dev). |
| `CRON_SECRET` | **Yes** | Server (Secret) | Secret key protecting scheduled cron routes (`/api/line/reminders`). You can generate any random 32-character string. |

### Sample `.env.local` file template:
```env
# 1. Supabase (Database & Authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# 2. AI Intelligence (Google Gemini)
AI_PROVIDER_API_KEY=AIzaSy...

# 3. LINE Official Account Integration
LINE_CHANNEL_ACCESS_TOKEN=your-long-lived-line-token
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_BOT_BASIC_ID=@766iowmg

# 4. App URL & Cron Job Authentication
APP_BASE_URL=https://your-app.vercel.app
CRON_SECRET=super_secret_cron_token_generate_one_randomly
```

---

## 3. Database Setup (Supabase)

If transferring to a new Supabase project, execute the SQL migration scripts in order:

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase Dashboard.
3. Open and run:
   - `supabase/migrations/20261109000000_init_schema.sql`: Creates user profiles, water logs, food logs, sleep logs, quests, point transactions, streaks, and milestone badges with Row Level Security (RLS) policies.
   - `supabase/migrations/20261109000001_line_link_tokens.sql`: Creates the LINE link token table and notification preference schema.
4. **Auth Settings**:
   - Go to **Authentication &rarr; URL Configuration**.
   - Set **Site URL** to `https://your-domain.vercel.app` (or `http://localhost:3000`).
   - Add `https://your-domain.vercel.app/**` to **Redirect URLs**.
   - *(Optional for development)*: Under **Authentication &rarr; Providers &rarr; Email**, toggle off **"Confirm email"** if you want users to log in immediately without waiting for verification emails.

---

## 4. AI Provider Setup (Google Gemini)

LifeSync utilizes **Google Gemini** for vision and natural language conversation:
- **Food Photo Recognition**: `/api/nutrition/analyze`
- **Sunny AI Coach**: `/api/ai/coach` and LINE bot webhook
- **Primary Model**: `gemini-flash-lite-latest` (fast 2–3s inference, no reasoning token budget truncation).
- **Secondary Model**: `gemini-3.5-flash`.

### Steps:
1. Log in to [Google AI Studio](https://aistudio.google.com/app/apikey) with any Google account.
2. Click **Create API key** &rarr; select or create a Google Cloud project.
3. Copy the key (starts with `AIzaSy...`).
4. Set it as `AI_PROVIDER_API_KEY` in `.env.local` and Vercel.

---

## 5. Complete LINE Official Account & Bot Guide

### Step 5.1: Create Channel on LINE Developers Console
1. Log in to [LINE Developers Console](https://developers.line.biz/).
2. Select or create a **Provider** (e.g. "LifeSync Health").
3. Click **Create a new channel** &rarr; select **Messaging API**.
4. Fill in:
   - **Channel name**: `LifeSync - Sunny Coach`
   - **Channel description**: `Personal AI Health & Habit Companion`
   - **Category**: Health / Medical / Personal Care
5. Accept terms and click **Create**.

### Step 5.2: Obtain Secrets & Issue Access Token
1. Go to the **Basic settings** tab:
   - Copy **Channel ID** and **Channel secret** &rarr; save as `LINE_CHANNEL_SECRET`.
2. Go to the **Messaging API** tab:
   - Scroll down to **Channel access token**.
   - Click **Issue** (or **Reissue**) to get a long-lived channel access token.
   - Save this value as `LINE_CHANNEL_ACCESS_TOKEN`.

### Step 5.3: Configure Webhook URL
1. In the **Messaging API** tab on LINE Developers:
   - Find **Webhook settings**.
   - In **Webhook URL**, enter:
     ```
     https://your-app.vercel.app/api/line/webhook
     ```
   - Toggle **Use webhook** to **Enabled**.
   - Click **Verify** to confirm that the server responds with HTTP 200.

### Step 5.4: LINE Official Account Manager Settings
1. Open [LINE Official Account Manager](https://manager.line.biz/) and select your account.
2. In the top-right corner, click **Settings (การตั้งค่า)** &rarr; **Response settings (การตั้งค่าการตอบกลับ)**:
   - **Response mode**: Select **Bot (บอท)**.
   - **Greeting message**: You can customize or disable.
   - **Auto-response messages**: Set to **Disabled (ปิด)** *(Crucial: If enabled, LINE will auto-reply standard text and interfere with Coach Sunny)*.
   - **Webhooks**: Set to **Enabled (เปิด)**.

### Step 5.5: Set Mascot Profile Picture (PFP)
1. In **LINE Official Account Manager** &rarr; **Settings** &rarr; **Account settings**:
2. In **Profile photo**, click **Change**.
3. Upload the mascot image located in the repository at:
   - `public/mascot/sunny-avatar.jpg`
4. Click **Save**.

### Step 5.6: Set Up the 6-Tile Rich Menu
1. In LINE Official Account Manager left menu, go to **Chat room management &rarr; Rich menus**:
2. Click **Create new (สร้างใหม่)**:
   - **Title**: `LifeSync Main Menu`
   - **Chat bar text**: `เมนูหลัก LifeSync`
   - **Menu display**: `Display (แสดง)`
3. Under **Template**, select **Large (6 tiles: 3 columns x 2 rows)**.
4. Click **Upload background image** and upload:
   - `public/line/rich-menu-6tiles.png` *(Standard 2500 x 1686 px)*
5. Configure the 6 Actions (Tile A to F):

| Tile | Label | Action Type | Action Value / Text |
|---|---|---|---|
| **A** (Top Left) | 💧 Water Log | **Text** | `ดื่มน้ำ` |
| **B** (Top Center) | 📸 Food AI | **Text** | `วิเคราะห์อาหาร` |
| **C** (Top Right) | 😴 Sleep Log | **Text** | `บันทึกการนอน` |
| **D** (Bottom Left) | 🎯 Quests & XP | **Link / URI** | `https://your-app.vercel.app/quests` |
| **E** (Bottom Center)| 📊 Dashboard | **Link / URI** | `https://your-app.vercel.app/dashboard` |
| **F** (Bottom Right) | ⚙️ Settings | **Link / URI** | `https://your-app.vercel.app/settings` |

6. Click **Save**.

---

## 6. Automated Cron Reminders (Vercel Cron)

LifeSync includes automated health nudges powered by Vercel Cron. The schedules are configured in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/line/reminders?type=morning", "schedule": "0 1 * * *" },
    { "path": "/api/line/reminders?type=hydration", "schedule": "0 3 * * *" },
    { "path": "/api/line/reminders?type=hydration", "schedule": "0 7 * * *" },
    { "path": "/api/line/reminders?type=meal", "schedule": "0 11 * * *" },
    { "path": "/api/line/reminders?type=sleep", "schedule": "30 14 * * *" },
    { "path": "/api/line/reminders?type=weekly_summary", "schedule": "0 13 * * 0" }
  ]
}
```

*Note: Schedules are defined in UTC time:*
- `0 1 * * *` = 08:00 AM Bangkok (ICT, UTC+7) &rarr; Morning greeting & first water glass
- `0 3 * * *` = 10:00 AM Bangkok &rarr; Mid-morning hydration reminder
- `0 7 * * *` = 14:00 PM Bangkok &rarr; Afternoon hydration reminder
- `0 11 * * *` = 18:00 PM Bangkok &rarr; Balanced dinner suggestion
- `30 14 * * *` = 21:30 PM Bangkok &rarr; Nighttime wind-down nudge
- `0 13 * * 0` = Sunday 20:00 PM Bangkok &rarr; Weekly AI habit report card (Flex Message)

> [!TIP]
> You can manually test any reminder at any time directly from the web app: navigate to **Settings &rarr; LINE Integration** and click any of the *"Test Reminder"* buttons.

---

## 7. Handover Recipient Quickstart Checklist

If you are receiving this project, follow this 5-minute setup checklist:

- [ ] **1. Clone & Install**:
  ```bash
  git clone <repo-url>
  cd LifeSync
  npm install
  ```
- [ ] **2. Configure `.env.local`**:
  Copy `.env.example` to `.env.local` and fill in the values from your Supabase, Gemini, and LINE accounts.
- [ ] **3. Run DB Migrations**:
  Paste the contents of `supabase/migrations/20261109000000_init_schema.sql` and `20261109000001_line_link_tokens.sql` into your Supabase SQL editor and run.
- [ ] **4. Run Locally**:
  ```bash
  npm run dev
  ```
  Open `http://localhost:3000` to verify the dashboard and sign up.
- [ ] **5. Deploy to Vercel**:
  - Push repository to GitHub.
  - Import into Vercel and paste your environment variables under **Project Settings &rarr; Environment Variables**.
  - Update the LINE Webhook URL in [LINE Developers](https://developers.line.biz/) to your new Vercel domain (`https://<your-project>.vercel.app/api/line/webhook`).
