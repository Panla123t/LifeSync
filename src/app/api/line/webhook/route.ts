import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  verifyLineSignature, 
  sendLineReply, 
  createWelcomeMessage, 
  createLinkSuccessMessage, 
  createWaterLoggedMessage, 
  createDailySummaryMessage, 
  createHydrationReminderMessage, 
  createSleepReminderMessage,
  createFoodLinkMessage,
  createSleepLinkMessage,
  createQuestLinkMessage,
  createWeeklyDigestMessage,
  getAppUrl
} from '@/lib/line/client';
import { generateWeeklySummary } from '@/lib/analytics/weeklySummary';
import { verifyAndConsumeMemoryToken } from '../link-token/route';
import { getLocalDateStr, getStartOfDayISO } from '@/lib/utils/date';
import { askSunnyCoach } from '@/lib/ai/coach';

interface LineEventSource {
  userId: string;
  type: string;
}

interface LineWebhookEvent {
  type: string;
  replyToken: string;
  source: LineEventSource;
  timestamp: number;
  message?: {
    id: string;
    type: string;
    text?: string;
  };
}

// Health check endpoint for testing and verification
export async function GET() {
  const hasSecret = Boolean(process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_SECRET !== 'your-line-channel-secret');
  const hasToken = Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_ACCESS_TOKEN !== 'your-line-channel-access-token');

  return NextResponse.json({
    status: 'online',
    service: 'LifeSync LINE Webhook',
    timestamp: new Date().toISOString(),
    configured: {
      has_channel_secret: hasSecret,
      has_channel_access_token: hasToken,
      bot_id: process.env.LINE_BOT_BASIC_ID || '@766iowmg',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 1. Verify Signature
    if (!verifyLineSignature(rawBody, signature)) {
      console.warn('[LINE Webhook] Invalid signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    let payload: { events?: LineWebhookEvent[] };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const events = payload.events || [];
    console.log(`[LINE Webhook] Received ${events.length} event(s)`);

    const admin = createAdminClient();

    for (const event of events) {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      // Handle Follow / Add Friend Event
      if (event.type === 'follow') {
        const appUrl = process.env.APP_BASE_URL || 'https://life-sync-panla123ts-projects.vercel.app';
        await sendLineReply(event.replyToken, [createWelcomeMessage(appUrl)]);
        continue;
      }

      // Handle Unfollow / Block Event
      if (event.type === 'unfollow') {
        await admin
          .from('notification_settings')
          .update({ line_user_id: null, line_linked_at: null })
          .eq('line_user_id', lineUserId);
        continue;
      }

      // Handle Image Message Event (e.g. user sends food photo directly in LINE)
      if (event.type === 'message' && event.message?.type === 'image') {
        const { data: notifRow } = await admin
          .from('notification_settings')
          .select('user_id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (notifRow?.user_id) {
          const { data: profile } = await admin
            .from('profiles')
            .select('display_name')
            .eq('id', notifRow.user_id)
            .maybeSingle();

          const userName = profile?.display_name || 'เพื่อนคนเก่ง';
          await sendLineReply(event.replyToken, [createFoodLinkMessage(userName)]);
        } else {
          await sendLineReply(event.replyToken, [createWelcomeMessage(getAppUrl())]);
        }
        continue;
      }

      // Handle Text Message Event
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim();
        console.log(`[LINE Message from ${lineUserId}]: "${text}"`);

        // A. Check for 6-digit Account Link Code
        const sixDigitMatch = text.match(/\b\d{6}\b/);
        if (sixDigitMatch) {
          const code = sixDigitMatch[0];
          let matchedUserId: string | null = null;

          // 1. Check in notification_settings.reminder_preferences (persisted across servers)
          try {
            const { data: notifRows } = await admin
              .from('notification_settings')
              .select('user_id, reminder_preferences');

            if (notifRows && notifRows.length > 0) {
              for (const row of notifRows) {
                const prefs = (row.reminder_preferences as Record<string, unknown>) || {};
                if (prefs.link_token === code) {
                  const expiresStr = prefs.link_token_expires as string | undefined;
                  const expires = expiresStr ? new Date(expiresStr) : null;
                  if (!expires || expires.getTime() > Date.now()) {
                    matchedUserId = row.user_id;
                  }
                  // Clean up used token
                  delete prefs.link_token;
                  delete prefs.link_token_expires;
                  await admin
                    .from('notification_settings')
                    .update({ reminder_preferences: prefs })
                    .eq('user_id', row.user_id);
                  break;
                }
              }
            }
          } catch (e) {
            console.warn('[LINE Webhook] Error checking notification_settings for token:', e);
          }

          // 2. Check database line_link_tokens table if it exists
          if (!matchedUserId) {
            try {
              const { data: tokenRow } = await admin
                .from('line_link_tokens')
                .select('user_id, expires_at')
                .eq('token', code)
                .maybeSingle();

              if (tokenRow) {
                if (new Date(tokenRow.expires_at) > new Date()) {
                  matchedUserId = tokenRow.user_id;
                }
                await admin.from('line_link_tokens').delete().eq('token', code);
              }
            } catch {
              // Ignore if table does not exist
            }
          }

          // 3. Fallback to in-memory store
          if (!matchedUserId) {
            matchedUserId = verifyAndConsumeMemoryToken(code);
          }

          if (matchedUserId) {
            console.log(`[LINE Webhook] Link token ${code} matched user: ${matchedUserId}`);

            // Link user in notification_settings
            await admin
              .from('notification_settings')
              .upsert({
                user_id: matchedUserId,
                line_user_id: lineUserId,
                line_linked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });

            // Fetch display name
            const { data: profile } = await admin
              .from('profiles')
              .select('display_name')
              .eq('id', matchedUserId)
              .maybeSingle();

            const displayName = profile?.display_name || 'เพื่อนคนเก่ง';

            // Award 20 bonus points
            try {
              await admin.from('point_transactions').insert({
                user_id: matchedUserId,
                points_delta: 20,
                reason: 'Linked LINE Official Account',
                idempotency_key: `line_link_${matchedUserId}`,
              });
            } catch {
              // Ignore duplicate bonus points
            }

            await sendLineReply(event.replyToken, [createLinkSuccessMessage(displayName)]);
            continue;
          } else {
            console.log(`[LINE Webhook] No match or expired token for code: ${code}`);
            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: '⚠️ ซันนี่ไม่พบรหัสนี้ หรือรหัสอาจหมดอายุแล้วครับ (รหัสมีอายุ 15 นาที)\n\n💡 ทิป: คุณสามารถพิมพ์ "อีเมล" ที่ใช้สมัคร LifeSync (เช่น your@email.com) ส่งให้ซันนี่ในห้องแชทนี้ เพื่อเชื่อมต่อบัญชีได้ทันทีเช่นกันครับ! 🌿',
              },
            ]);
            continue;
          }
        }

        // B. Check for Email Linking (e.g. user sends their email directly: user@example.com)
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          const targetEmail = emailMatch[0].toLowerCase();
          try {
            const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
            if (listErr) {
              console.warn('[LINE Webhook] listUsers error:', listErr);
            }
            const foundUser = (userList?.users || []).find(
              (u) => u.email?.toLowerCase() === targetEmail
            );

            if (foundUser) {
              await admin
                .from('notification_settings')
                .upsert({
                  user_id: foundUser.id,
                  line_user_id: lineUserId,
                  line_linked_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

              const { data: profile } = await admin
                .from('profiles')
                .select('display_name')
                .eq('id', foundUser.id)
                .maybeSingle();

              const displayName = profile?.display_name || foundUser.email?.split('@')[0] || 'เพื่อนคนเก่ง';

              try {
                await admin.from('point_transactions').insert({
                  user_id: foundUser.id,
                  points_delta: 20,
                  reason: 'Linked LINE Official Account via Email',
                  idempotency_key: `line_link_${foundUser.id}`,
                });
              } catch {
                // Ignore duplicate bonus points
              }

              console.log(`[LINE Webhook] Successfully linked user ${foundUser.id} via email ${targetEmail}`);
              await sendLineReply(event.replyToken, [createLinkSuccessMessage(displayName)]);
              continue;
            } else {
              await sendLineReply(event.replyToken, [
                {
                  type: 'text',
                  text: `⚠️ ซันนี่หาอีเมล "${targetEmail}" ในระบบไม่เจอครับ\n\nลองตรวจสอบว่าสมัครสมาชิกที่แอป LifeSync ด้วยอีเมลนี้แล้วหรือยัง หรือนำรหัส 6 หลักจากหน้า Settings มาใส่แทนได้นะครับ 🌿`,
                },
              ]);
              continue;
            }
          } catch (err) {
            console.warn('Error checking email for LINE linking:', err);
          }
        }

        // C. Check if this LINE user is already linked
        const { data: notifRow } = await admin
          .from('notification_settings')
          .select('user_id, hydration_enabled, sleep_enabled')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        const linkedUserId = notifRow?.user_id;

        if (linkedUserId) {
          // Fetch user profile for personal touch
          const { data: profile } = await admin
            .from('profiles')
            .select('display_name, timezone')
            .eq('id', linkedUserId)
            .maybeSingle();

          const userName = profile?.display_name || 'เพื่อนคนเก่ง';
          const userTimezone = profile?.timezone || 'Asia/Bangkok';
          const todayDateStr = getLocalDateStr(userTimezone);
          const startOfDayISO = getStartOfDayISO(todayDateStr, userTimezone);

          // 1. Water Logging Command: e.g. "น้ำ 250", "ดื่มน้ำ 500", "+250", "250ml", "น้ำ"
          const waterMatch = text.match(/^(?:น้ำ|ดื่มน้ำ|water|\+)\s*(\d{2,4})?\s*(?:ml|มล)?$/i);
          if (waterMatch || text.toLowerCase() === 'น้ำ' || text.toLowerCase() === 'water') {
            const amount = waterMatch && waterMatch[1] ? parseInt(waterMatch[1], 10) : 250;
            const validAmount = Math.min(2000, Math.max(50, amount));

            // Insert water log
            await admin.from('water_logs').insert({
              user_id: linkedUserId,
              amount_ml: validAmount,
              logged_at: new Date().toISOString(),
            });

            // Calculate today's sum in user's timezone
            const { data: waterLogs } = await admin
              .from('water_logs')
              .select('amount_ml')
              .eq('user_id', linkedUserId)
              .gte('logged_at', startOfDayISO);

            const todayTotal = (waterLogs || []).reduce((acc, curr) => acc + curr.amount_ml, 0);
            const waterGoal = 2000;

            // Complete water quest in real-time
            const { data: waterQuest } = await admin
              .from('quests')
              .select('id, points, title')
              .eq('rule_key', 'log_water_once')
              .maybeSingle();

            if (waterQuest) {
              await admin.from('user_quests').upsert({
                user_id: linkedUserId,
                quest_id: waterQuest.id,
                quest_date: todayDateStr,
                status: 'completed',
                completed_at: new Date().toISOString(),
              }, { onConflict: 'user_id,quest_id,quest_date' });

              try {
                await admin.from('point_transactions').insert({
                  user_id: linkedUserId,
                  points_delta: waterQuest.points,
                  reason: `Quest Completed: ${waterQuest.title}`,
                  reference_id: waterQuest.id,
                  idempotency_key: `quest_${waterQuest.id}_${linkedUserId}_${todayDateStr}`,
                });
              } catch {
                // Already awarded today
              }
            }

            await sendLineReply(event.replyToken, [
              createWaterLoggedMessage(validAmount, todayTotal, waterGoal, userName),
            ]);
            continue;
          }

          // 2. Daily Summary Command: e.g. "สรุป", "summary", "status", "วันนี้", "คะแนน"
          if (['สรุป', 'summary', 'status', 'ภาพรวม', 'วันนี้', 'คะแนน'].includes(text.toLowerCase())) {
            const [waterRes, foodRes, sleepRes, pointsRes] = await Promise.all([
              admin.from('water_logs').select('amount_ml').eq('user_id', linkedUserId).gte('logged_at', startOfDayISO),
              admin.from('food_logs').select('id').eq('user_id', linkedUserId).gte('logged_at', startOfDayISO),
              admin.from('sleep_logs').select('duration_minutes').eq('user_id', linkedUserId).order('wake_time', { ascending: false }).limit(1),
              admin.from('point_transactions').select('points_delta').eq('user_id', linkedUserId),
            ]);

            const waterTotal = (waterRes.data || []).reduce((sum, w) => sum + w.amount_ml, 0);
            const mealsCount = foodRes.data?.length || 0;
            
            let sleepText = 'ยังไม่ได้บันทึก';
            if (sleepRes.data && sleepRes.data.length > 0) {
              const mins = sleepRes.data[0].duration_minutes;
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              sleepText = `${h}ชม. ${m}นาที`;
            }

            const points = (pointsRes.data || []).reduce((sum, tx) => sum + tx.points_delta, 0);

            await sendLineReply(event.replyToken, [
              createDailySummaryMessage(userName, waterTotal, 2000, mealsCount, sleepText, points),
            ]);
            continue;
          }

          // 2. Weekly Summary Digest Command: e.g. "สรุปสัปดาห์", "รายงานสัปดาห์", "weekly", "สัปดาห์นี้"
          if (['สรุปสัปดาห์', 'รายงานสัปดาห์', 'weekly', 'สัปดาห์นี้', 'ภาพรวมสัปดาห์'].some(k => text.toLowerCase().includes(k))) {
            const weeklyData = await generateWeeklySummary(linkedUserId, admin, profile?.timezone || 'Asia/Bangkok');
            await sendLineReply(event.replyToken, [
              createWeeklyDigestMessage(userName, weeklyData),
            ]);
            continue;
          }

          // 2. Food & Meal Command: e.g. "อาหาร", "กินข้าว", "ข้าว", "มื้อเที่ยง", "มื้อเย็น", "food", "meal", "ถ่ายรูปอาหาร"
          if (['อาหาร', 'ข้าว', 'กิน', 'กินข้าว', 'มื้อเช้า', 'มื้อเที่ยง', 'มื้อเย็น', 'ทานข้าว', 'food', 'meal', 'ถ่ายรูปอาหาร', 'แคลอรี่', 'สแกนอาหาร'].some(k => text.toLowerCase().includes(k))) {
            await sendLineReply(event.replyToken, [createFoodLinkMessage(userName)]);
            continue;
          }

          // 3. Sleep prompt command: e.g. "นอน", "sleep", "เข้านอน", "เข้านอนแล้ว", "ง่วง", "งีบ"
          if (['นอน', 'sleep', 'เข้านอน', 'เข้านอนแล้ว', 'ง่วง', 'ไปนอนแล้ว', 'งีบ', 'ตื่น', 'nap'].some(k => text.toLowerCase().includes(k))) {
            await sendLineReply(event.replyToken, [createSleepLinkMessage(userName)]);
            continue;
          }

          // 4. Quests & Points Command: e.g. "เควส", "ภารกิจ", "แต้ม", "คะแนน", "quest", "level", "รางวัล"
          if (['เควส', 'ภารกิจ', 'แต้ม', 'คะแนน', 'quest', 'quests', 'level', 'รางวัล'].some(k => text.toLowerCase().includes(k))) {
            const [pointsRes, userQuestsRes] = await Promise.all([
              admin.from('point_transactions').select('points_delta').eq('user_id', linkedUserId),
              admin.from('user_quests').select('id').eq('user_id', linkedUserId).eq('quest_date', todayDateStr).eq('status', 'completed'),
            ]);

            const totalPoints = (pointsRes.data || []).reduce((sum, tx) => sum + tx.points_delta, 0);
            const completedCount = userQuestsRes.data?.length || 0;

            await sendLineReply(event.replyToken, [
              createQuestLinkMessage(userName, totalPoints, completedCount),
            ]);
            continue;
          }

          // 6. Reminder check & test command: e.g. "เตือน", "เตือนดื่มน้ำ", "เตือนนอน", "การแจ้งเตือน"
          if (['เตือน', 'เตือนดื่มน้ำ', 'เตือนนอน', 'ตั้งเตือน', 'การแจ้งเตือน', 'reminder'].some(k => text.toLowerCase().includes(k))) {
            const hydrationStatus = notifRow?.hydration_enabled ? '✅ เปิดอยู่' : '❌ ปิดอยู่';
            const sleepStatus = notifRow?.sleep_enabled ? '✅ เปิดอยู่' : '❌ ปิดอยู่';

            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: `⏰ สถานะการแจ้งเตือนของคุณ ${userName} 🌿\n\n💧 เตือนจิบน้ำ: ${hydrationStatus}\n🌙 เตือนเข้านอน: ${sleepStatus}\n\nซันนี่มีตารางแวะมาสะกิดเบาๆ:\n• 08:00 น. อรุณสวัสดิ์ & น้ำแก้วแรก ☀️\n• 10:00 & 14:00 น. เตือนจิบน้ำระหว่างวัน 💧\n• 18:00 น. ชวนทานอาหารมื้อเย็น 🥗\n• 21:30 น. เตรียมตัวพักผ่อนเข้านอน 🌙\n• ทุกวันอาทิตย์ 20:00 น. รายงานสุขภาพรอบสัปดาห์ 🌈\n\nอยากให้ซันนี่ลองส่งการแจ้งเตือนตัวอย่างให้ดู แตะปุ่มด้านล่างได้เลยนะครับ! 👇`,
                quickReply: {
                  items: [
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '💧 ลองเตือนดื่มน้ำ',
                        text: 'ทดสอบเตือนน้ำ',
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '🌈 ดูสรุปสัปดาห์',
                        text: 'สรุปสัปดาห์',
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '🌙 ลองเตือนเข้านอน',
                        text: 'ทดสอบเตือนนอน',
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'uri',
                        label: '⚙️ ตั้งค่าในเว็บแอป',
                        uri: `${getAppUrl()}/settings`,
                      },
                    },
                  ],
                },
              },
            ]);
            continue;
          }

          // 6. Test Reminder Trigger from chat
          if (text === 'ทดสอบเตือนน้ำ') {
            await sendLineReply(event.replyToken, [
              createHydrationReminderMessage(userName, 750, 2000),
            ]);
            continue;
          }

          if (text === 'ทดสอบเตือนอาหาร') {
            await sendLineReply(event.replyToken, [
              createFoodLinkMessage(userName),
            ]);
            continue;
          }

          if (text === 'ทดสอบเตือนนอน') {
            await sendLineReply(event.replyToken, [
              createSleepReminderMessage(userName),
            ]);
            continue;
          }

          // 7. Conversational empathy: "เหนื่อย", "ขอบคุณ", "ซันนี่", "สวัสดี"
          if (text.includes('เหนื่อย') || text.includes('ท้อ') || text.includes('เพลีย')) {
            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: `กอดๆ น้าคุณ ${userName} 🫂🩵\nวันนี้คุณพยายามมาทั้งวันแล้ว เก่งมากๆ เลยครับ ไม่เป็นไรเลยนะถ้าจะรู้สึกเหนื่อยบ้าง\n\nหาของอร่อยๆ ทาน จิบน้ำเย็นๆ สักแก้ว แล้วพักผ่อนให้สบายใจ ซันนี่พร้อมอยู่ข้างๆ และคอยเชียร์คุณเสมอนะครับ 🌿✨`,
                quickReply: {
                  items: [
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '💧 จิบน้ำให้สดชื่น (+250ml)',
                        text: 'น้ำ 250',
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'uri',
                        label: '🌙 พักผ่อน/บันทึกการนอน',
                        uri: `${getAppUrl()}/sleep`,
                      },
                    },
                  ],
                },
              },
            ]);
            continue;
          }

          if (text.includes('ขอบคุณ') || text.includes('thank')) {
            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: `ยินดีมากๆ เลยครับคุณ ${userName}! รอยยิ้มและสุขภาพที่ดีของคุณคือกำลังใจที่ดีที่สุดของซันนี่เลยน้า มีอะไรให้ช่วยบอกซันนี่ได้ตลอดเลยนะครับ 😊🩵`,
              },
            ]);
            continue;
          }

          if (['สวัสดี', 'หวัดดี', 'hi', 'hello', 'ซันนี่', 'sunny'].includes(text.toLowerCase())) {
            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: `สวัสดีครับคุณ ${userName}! วันนี้รู้สึกสดชื่นดีไหมครับ? ☀️🌿\n\nอยากให้ซันนี่ช่วยบันทึกหรือเปิดดูข้อมูลอะไรในเว็บแอป เลือกแตะปุ่มด้านล่างได้เลยนะครับผม 👇`,
                quickReply: {
                  items: [
                    {
                      type: 'action',
                      action: {
                        type: 'uri',
                        label: '🥗 บันทึกอาหาร',
                        uri: `${getAppUrl()}/nutrition`,
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'message',
                        label: '💧 ดื่มน้ำ +250ml',
                        text: 'น้ำ 250',
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'uri',
                        label: '🌙 บันทึกการนอน',
                        uri: `${getAppUrl()}/sleep`,
                      },
                    },
                    {
                      type: 'action',
                      action: {
                        type: 'uri',
                        label: '📊 เปิดแดชบอร์ด',
                        uri: `${getAppUrl()}/dashboard`,
                      },
                    },
                  ],
                },
              },
            ]);
            continue;
          }

          // 8. AI Health Habit Coach for linked user (freeform wellness consultation)
          const aiResponse = await askSunnyCoach(text, {
            userName,
          });

          await sendLineReply(event.replyToken, [
            {
              type: 'text',
              text: aiResponse,
              quickReply: {
                items: [
                  {
                    type: 'action',
                    action: {
                      type: 'message',
                      label: '💧 จิบน้ำ +250ml',
                      text: 'น้ำ 250',
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'uri',
                      label: '🥗 บันทึกอาหาร',
                      uri: `${getAppUrl()}/nutrition`,
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'uri',
                      label: '🌙 บันทึกการนอน',
                      uri: `${getAppUrl()}/sleep`,
                    },
                  },
                  {
                    type: 'action',
                    action: {
                      type: 'uri',
                      label: '📊 ดูสถิติในเว็บแอป',
                      uri: `${getAppUrl()}/dashboard`,
                    },
                  },
                ],
              },
            },
          ]);
        } else {
          // Unlinked user sending messages
          await sendLineReply(event.replyToken, [createWelcomeMessage(getAppUrl())]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Fatal error in LINE webhook handler:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
