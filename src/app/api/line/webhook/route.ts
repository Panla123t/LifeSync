import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  verifyLineSignature, 
  sendLineReply, 
  createWelcomeMessage, 
  createLinkSuccessMessage, 
  createWaterLoggedMessage,
  createDailySummaryMessage
} from '@/lib/line/client';
import { verifyAndConsumeMemoryToken } from '../link-token/route';

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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 1. Verify Signature
    if (!verifyLineSignature(rawBody, signature)) {
      console.warn('Invalid LINE webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody) as { events?: LineWebhookEvent[] };
    const events = payload.events || [];

    const admin = createAdminClient();

    for (const event of events) {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      // Handle Follow / Add Friend Event
      if (event.type === 'follow') {
        const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
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

      // Handle Text Message Event
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim();

        // A. Check for 6-digit Account Link Code
        const sixDigitMatch = text.match(/\b\d{6}\b/);
        if (sixDigitMatch) {
          const code = sixDigitMatch[0];
          let matchedUserId: string | null = null;

          // Check database line_link_tokens
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
          } catch (e) {
            console.warn('Database token lookup error:', e);
          }

          // Fallback to memory store
          if (!matchedUserId) {
            matchedUserId = verifyAndConsumeMemoryToken(code);
          }

          if (matchedUserId) {
            // Update notification settings
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
              .single();

            const displayName = profile?.display_name || 'เพื่อนสุขภาพ';

            // Award 20 bonus points
            try {
              await admin.from('point_transactions').insert({
                user_id: matchedUserId,
                points_delta: 20,
                reason: 'Linked LINE Official Account',
                idempotency_key: `line_link_${matchedUserId}`,
              });
            } catch (err) {
              // Ignore duplicate bonus points
            }

            await sendLineReply(event.replyToken, [createLinkSuccessMessage(displayName)]);
            continue;
          } else {
            // Invalid or expired code
            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: '⚠️ ไม่พบรหัสเชื่อมต่อนี้ หรือรหัสอาจหมดอายุแล้ว (รหัสมีอายุ 15 นาที)\n\nกรุณาไปที่แอป LifeSync > เมนู Settings เพื่อกดสร้างรหัสเชื่อมต่อใหม่อีกครั้งนะครับ 🌿',
              },
            ]);
            continue;
          }
        }

        // B. Check if this LINE user is already linked
        const { data: notifRow } = await admin
          .from('notification_settings')
          .select('user_id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        const linkedUserId = notifRow?.user_id;

        if (linkedUserId) {
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

            // Calculate today's sum
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const { data: waterLogs } = await admin
              .from('water_logs')
              .select('amount_ml')
              .eq('user_id', linkedUserId)
              .gte('logged_at', startOfDay.toISOString());

            const todayTotal = (waterLogs || []).reduce((acc, curr) => acc + curr.amount_ml, 0);
            const waterGoal = 2000;

            await sendLineReply(event.replyToken, [
              createWaterLoggedMessage(validAmount, todayTotal, waterGoal),
            ]);
            continue;
          }

          // 2. Daily Summary Command: e.g. "สรุป", "summary", "status", "วันนี้", "คะแนน"
          if (['สรุป', 'summary', 'status', 'ภาพรวม', 'วันนี้', 'คะแนน'].includes(text.toLowerCase())) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const [profileRes, waterRes, foodRes, sleepRes, pointsRes] = await Promise.all([
              admin.from('profiles').select('display_name').eq('id', linkedUserId).single(),
              admin.from('water_logs').select('amount_ml').eq('user_id', linkedUserId).gte('logged_at', startOfDay.toISOString()),
              admin.from('food_logs').select('id').eq('user_id', linkedUserId).gte('logged_at', startOfDay.toISOString()),
              admin.from('sleep_logs').select('duration_minutes').eq('user_id', linkedUserId).order('wake_time', { ascending: false }).limit(1),
              admin.from('point_transactions').select('points_delta').eq('user_id', linkedUserId),
            ]);

            const userName = profileRes.data?.display_name || 'เพื่อนรักสุขภาพ';
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

          // 3. Sleep prompt command
          if (['นอน', 'sleep', 'เข้านอน', 'เข้านอนแล้ว'].includes(text.toLowerCase())) {
            const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
            await sendLineReply(event.replyToken, [
              {
                type: 'text',
                text: '🌙 ยอดเยี่ยมมากครับ! ขอให้หลับสบายและพักผ่อนเต็มที่ 💤\n\nเมื่อตื่นนอนตอนเช้า สามารถแตะบันทึกเวลาตื่นและเวลานอนได้ในแอป LifeSync นะครับ ✨',
                quickReply: {
                  items: [
                    {
                      type: 'action',
                      action: {
                        type: 'uri',
                        label: 'เปิดแอป LifeSync',
                        uri: `${appUrl}/sleep`,
                      },
                    },
                  ],
                },
              },
            ]);
            continue;
          }

          // 4. Fallback for linked user
          await sendLineReply(event.replyToken, [
            {
              type: 'text',
              text: `🌿 สวัสดีครับ! บัญชีของคุณเชื่อมต่อเรียบร้อยแล้ว\n\nคุณสามารถพิมพ์:\n• "น้ำ 250" หรือ "น้ำ 500" เพื่อบันทึกน้ำดื่ม\n• "สรุป" เพื่อดูรายงานสุขภาพวันนี้`,
              quickReply: {
                items: [
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
                      type: 'message',
                      label: '📊 ดูสรุปวันนี้',
                      text: 'สรุป',
                    },
                  },
                ],
              },
            },
          ]);
        } else {
          // Unlinked user sending messages
          const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
          await sendLineReply(event.replyToken, [createWelcomeMessage(appUrl)]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Fatal error in LINE webhook handler:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
