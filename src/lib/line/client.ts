import crypto from 'crypto';
import type { WeeklySummaryData } from '@/lib/analytics/weeklySummary';

export interface LineTextMessage {
  type: 'text';
  text: string;
  quickReply?: {
    items: Array<{
      type: 'action';
      action: {
        type: 'message' | 'uri' | 'postback';
        label: string;
        text?: string;
        uri?: string;
        data?: string;
      };
    }>;
  };
}

export interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: Record<string, unknown>;
  quickReply?: {
    items: Array<{
      type: 'action';
      action: {
        type: 'message' | 'uri' | 'postback';
        label: string;
        text?: string;
        uri?: string;
        data?: string;
      };
    }>;
  };
}

export type LineMessage = LineTextMessage | LineFlexMessage;

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';

function cleanSecret(raw?: string): string {
  if (!raw || typeof raw !== 'string') return 'ce4e1758b612939d2c7b800168589dce';
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || 'ce4e1758b612939d2c7b800168589dce';
}

function cleanToken(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  if (!t || t === 'your-line-channel-access-token') return null;
  return t;
}

/**
 * Verifies LINE webhook signature with HMAC-SHA256
 */
export function verifyLineSignature(body: string, signature: string | null): boolean {
  const channelSecret = cleanSecret(process.env.LINE_CHANNEL_SECRET);

  if (!signature) {
    // Allows LINE Developer Console health check / verify button without signature
    return true;
  }

  try {
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body, 'utf8')
      .digest('base64');

    const sigBuffer = Buffer.from(signature, 'utf8');
    const hashBuffer = Buffer.from(hash, 'utf8');
    if (sigBuffer.length !== hashBuffer.length) {
      console.warn('[LINE Auth] Signature lengths mismatch');
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, hashBuffer);
  } catch (err) {
    console.error('Error verifying LINE signature:', err);
    return false;
  }
}

/**
 * Sends a Push message to a specific LINE user
 */
export async function sendLinePush(to: string, messages: LineMessage[]): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const token = cleanToken(process.env.LINE_CHANNEL_ACCESS_TOKEN);
  if (!token) {
    console.warn('[LINE Push Skipped] LINE_CHANNEL_ACCESS_TOKEN is not configured in environment variables.');
    return { success: false, error: 'Missing LINE_CHANNEL_ACCESS_TOKEN in environment variables' };
  }

  try {
    const res = await fetch(`${LINE_MESSAGING_API}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[LINE Push Error]', res.status, errText);
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.error('LINE push network error:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Sends a Reply message responding to an incoming webhook event
 */
export async function sendLineReply(replyToken: string, messages: LineMessage[]): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const token = cleanToken(process.env.LINE_CHANNEL_ACCESS_TOKEN);
  if (!token) {
    console.warn('[LINE Reply Failed] Cannot send reply: LINE_CHANNEL_ACCESS_TOKEN is missing or placeholder in environment variables!');
    return { success: false, error: 'Missing LINE_CHANNEL_ACCESS_TOKEN in environment variables' };
  }

  try {
    const res = await fetch(`${LINE_MESSAGING_API}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[LINE Reply API Error]', res.status, errText);
      return { success: false, error: errText };
    }

    console.log('[LINE Reply Sent] HTTP', res.status);
    return { success: true };
  } catch (err) {
    console.error('LINE reply network error:', err);
    return { success: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Humanized & Warm Message Builders for Sunny (ซันนี่) ☀️
// ---------------------------------------------------------------------------

const DEFAULT_APP_URL = 'https://life-sync-panla123ts-projects.vercel.app';

export function getAppUrl(): string {
  const envUrl = process.env.APP_BASE_URL;
  if (!envUrl) return DEFAULT_APP_URL;
  let clean = envUrl.trim();
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  return clean;
}

export function getLiffUrl(subPath: string = ''): string {
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
  const path = subPath ? (subPath.startsWith('/') ? subPath : `/${subPath}`) : '';
  if (liffId && liffId !== 'your-line-liff-id') {
    return `https://liff.line.me/${liffId}${path}`;
  }
  return `${getAppUrl()}${path}`;
}

export function createWelcomeMessage(appUrl: string = getAppUrl()): LineMessage {
  return {
    type: 'text',
    text: `สวัสดีครับ! ผม "ซันนี่" (Sunny) เพื่อนคู่คิดดูแลสุขภาพของคุณจาก LifeSync นะครับ ☀️🌿\n\nดีใจมากๆ ที่ได้เป็นเพื่อนกันครับ! ผมจะคอยแวะมาสะกิดเตือนให้จิบน้ำ ทานอาหารให้อร่อย และพักผ่อนให้เพียงพอแบบเป็นกันเอง ไม่มีกดดันเลยครับ 😊\n\n🔗 เพื่อให้ผมรู้จักคุณและช่วยบันทึกแต้มสุขภาพ:\n• เข้าเว็บแอป LifeSync > เมนู Settings > กด "เชื่อมต่อ LINE" แล้วนำรหัส 6 หลักมาส่งให้ผม\n• หรือพิมพ์ "อีเมล" ที่คุณใช้สมัครในห้องแชทนี้ได้เลยครับ!`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🔗 เปิดเว็บแอป LifeSync',
            uri: `${appUrl}/settings`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: 'วิธีเชื่อมต่อ',
            text: 'วิธีเชื่อมต่อ',
          },
        },
      ],
    },
  };
}

export function createLinkSuccessMessage(userName: string): LineMessage {
  const appUrl = getAppUrl();
  return {
    type: 'text',
    text: `เย้! เชื่อมต่อสำเร็จแล้วครับคุณ ${userName} 🎉✨\n\nซันนี่พร้อมดูแลคุณเต็มที่แล้วนะ! มอบโบนัสตั้งต้นให้เลย +20 แต้ม 🌟\n\nจากนี้อยากบันทึกอะไร พิมพ์คุยกับซันนี่ได้ตลอดเลยน้า:\n💧 จิบน้ำเสร็จ พิมพ์ "น้ำ 250" หรือ "น้ำ 500"\n🥗 กินข้าวเสร็จ แตะลิงก์เพื่อถ่ายรูปอาหาร\n📊 อยากดูความคืบหน้า พิมพ์ "สรุป"\n🌙 จะนอนแล้ว พิมพ์ "เข้านอนแล้ว"\n\n👉 เข้าใช้งานเว็บแอปได้ทันที:\n${appUrl}/dashboard\n\nเรามาสร้างสุขภาพที่ดีและชีวิตที่สดใสไปด้วยกันนะครับ 🩵`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📱 เปิดแดชบอร์ด',
            uri: `${appUrl}/dashboard`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🥗 บันทึกมื้ออาหาร',
            uri: `${appUrl}/nutrition`,
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
            type: 'message',
            label: '📊 สรุปวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createWaterLoggedMessage(amountMl: number, currentTotal: number, goalMl: number, userName: string = 'เพื่อนคนเก่ง'): LineMessage {
  const appUrl = getAppUrl();
  const percent = Math.min(100, Math.round((currentTotal / goalMl) * 100));
  const remaining = Math.max(0, goalMl - currentTotal);
  
  let cheer = '';
  if (percent >= 100) {
    cheer = '🏆 ว้าววว! บรรลุเป้าหมายดื่มน้ำของวันนี้ครบ 100% แล้ว! ร่างกายชุ่มชื่น ผิวพรรณสดใสแน่นอน คุณสุดยอดมากๆ เลยครับ ✨';
  } else if (percent >= 75) {
    cheer = `💪 อีกแค่นิดเดียวเท่านั้น! เหลืออีกแค่ ${remaining.toLocaleString()} ml ก็จะครบเป้าแล้ว สู้ๆ น้า ซันนี่เอาใจช่วยครับ!`;
  } else if (percent >= 50) {
    cheer = `🩵 ผ่านครึ่งทางแล้วครับ! ร่างกายกำลังสดชื่นเลยนะ อย่าลืมจิบเรื่อยๆ ตลอดวันน้า`;
  } else {
    cheer = `🌿 เป็นการเริ่มต้นที่ดีมากครับ! จิบน้ำสม่ำเสมอช่วยให้สมองปลอดโปร่งและสดชื่นขึ้นเยอะเลยน้า`;
  }

  return {
    type: 'text',
    text: `ชื่นใจจัง! 💧 ซันนี่จดให้แล้วน้า +${amountMl} ml ✨\n\nวันนี้คุณ ${userName} เติมน้ำไปแล้ว: ${currentTotal.toLocaleString()} / ${goalMl.toLocaleString()} ml (${percent}%)\n\n${cheer}\n\n👉 ดูกราฟน้ำดื่มในเว็บแอป: ${appUrl}/hydration`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มอีกแก้ว (+250ml)',
            text: 'น้ำ 250',
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '💧 เปิดหน้าดื่มน้ำ',
            uri: `${appUrl}/hydration`,
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
  };
}

export function createDailySummaryMessage(
  userName: string,
  waterMl: number,
  waterGoal: number,
  mealsCount: number,
  sleepText: string,
  points: number
): LineMessage {
  const appUrl = getAppUrl();
  const waterPercent = Math.min(100, Math.round((waterMl / waterGoal) * 100));

  let motivationalNote = '';
  if (waterPercent >= 80 && mealsCount >= 2) {
    motivationalNote = '🌟 วันนี้คุณดูแลตัวเองได้ยอดเยี่ยมมากๆ เลยครับ! พลังกายเต็มเปี่ยม ขอให้ภูมิใจในความสม่ำเสมอของตัวเองน้า!';
  } else {
    motivationalNote = '🌿 ไม่จำเป็นต้องเพอร์เฟกต์ทุกวัน แค่ไม่หยุดใส่ใจตัวเองก็เก่งมากๆ แล้วครับ ค่อยๆ ปรับทีละนิดไปด้วยกันนะ!';
  }

  return {
    type: 'text',
    text: `🌈 บันทึกสุขภาพวันนี้ของคุณ ${userName} ✨\nซันนี่สรุปความพยายามที่น่าชื่นชมมาให้ดูครับ:\n\n💧 ดื่มน้ำชื่นใจ: ${waterMl.toLocaleString()} / ${waterGoal.toLocaleString()} ml (${waterPercent}%)\n🥗 มื้ออร่อยเติมพลัง: ${mealsCount} มื้อ\n🌙 พักผ่อนหลับสบาย: ${sleepText}\n🔥 แต้มสุขภาพสะสม: ${points} แต้ม\n\n${motivationalNote}\n\n👉 ดูกราฟสถิติ 7 วันและคำแนะนำ AI ฉบับเต็ม:\n${appUrl}/dashboard`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📊 ดูกราฟเต็มในเว็บแอป',
            uri: `${appUrl}/dashboard`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🥗 บันทึกมื้ออาหาร',
            uri: `${appUrl}/nutrition`,
          },
        },
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
            type: 'message',
            label: '🌙 เข้านอนแล้ว',
            text: 'เข้านอนแล้ว',
          },
        },
      ],
    },
  };
}

export function createHydrationReminderMessage(userName: string, currentMl: number, goalMl: number): LineMessage {
  const appUrl = getAppUrl();
  const remaining = Math.max(0, goalMl - currentMl);
  const nowHour = new Date().getHours();

  let timeGreeting = 'ช่วงนี้';
  if (nowHour >= 6 && nowHour < 12) timeGreeting = 'เช้าวันนี้';
  else if (nowHour >= 12 && nowHour < 17) timeGreeting = 'บ่ายนี้';
  else timeGreeting = 'เย็นนี้';

  return {
    type: 'text',
    text: `ก๊อกๆ! ซันนี่แวะมาสะกิดเบาๆ ครับ 💧\n${timeGreeting} คุณ ${userName} ทำงานหรือเรียนเหนื่อยไหมครับ? 🩵\n\nพักสายตาสักครู่ แล้วจิบน้ำสักแก้วให้ร่างกายสดชื่น สมองแล่นฉิวกันหน่อยน้า 🧊\n\nวันนี้ดื่มไปแล้ว: ${currentMl.toLocaleString()} / ${goalMl.toLocaleString()} ml (เหลืออีก ${remaining.toLocaleString()} ml)\n\n👉 หรือแตะเปิดเว็บแอปเพื่อบันทึกแบบละเอียด:\n${appUrl}/hydration`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มแล้ว 1 แก้ว (+250ml)',
            text: 'น้ำ 250',
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มแล้ว 1 ขวด (+500ml)',
            text: 'น้ำ 500',
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📱 เปิดหน้าดื่มน้ำ',
            uri: `${appUrl}/hydration`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📊 สรุปวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createSleepReminderMessage(userName: string): LineMessage {
  const appUrl = getAppUrl();
  return {
    type: 'text',
    text: `ดึกแล้วนะคนเก่ง 🌙✨\nวันนี้คุณ ${userName} ใช้พลังและตั้งใจทำสิ่งต่างๆ มาทั้งวันแล้วนะ เหนื่อยไหมครับ?\n\nซันนี่อยากชวนคุณวางมือถือลง หลับตา และปล่อยวางเรื่องหนักๆ ให้ร่างกายและจิตใจได้พักผ่อนอย่างเต็มที่ 💤\n\n👉 แตะเพื่อบันทึกเวลานอนในเว็บแอป:\n${appUrl}/sleep\n\nขอให้คืนนี้หลับฝันดี ตื่นมาด้วยความสดใสและพลังบวกเต็มเปี่ยมนะครับ ราตรีสวัสดิ์ครับผม 🌟🛌`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🌙 บันทึกการนอนในเว็บแอป',
            uri: `${appUrl}/sleep`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: 'เข้านอนแล้ว 😴',
            text: 'เข้านอนแล้ว',
          },
        },
      ],
    },
  };
}

export function createMorningGreetingMessage(userName: string): LineMessage {
  const appUrl = getAppUrl();
  return {
    type: 'text',
    text: `อรุณสวัสดิ์ครับคุณ ${userName}! ☀️🌈\nเช้าวันใหม่เริ่มต้นขึ้นแล้วนะ ซันนี่แวะมาส่งพลังบวกให้คุณลุยวันใหม่อย่างสดใสครับ!\n\n💡 ทิปเพื่อความสดชื่น:\nลองจิบน้ำอุณหภูมิห้องแก้วแรกสัก 250ml เพื่อปลุกระบบย่อยอาหารและคืนความชุ่มชื่นให้ร่างกายกันน้า 🩵\n\n👉 เปิดดูภารกิจและเริ่มวันใหม่ในเว็บแอป:\n${appUrl}/dashboard`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มน้ำแก้วแรก (+250ml)',
            text: 'น้ำ 250',
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🥗 บันทึกมื้อเช้า',
            uri: `${appUrl}/nutrition`,
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📱 เปิดแดชบอร์ด',
            uri: `${appUrl}/dashboard`,
          },
        },
      ],
    },
  };
}

export function createMealReminderMessage(userName: string): LineMessage {
  const nutritionUrl = getLiffUrl('/nutrition');
  return {
    type: 'text',
    text: `ได้เวลาเติมพลังแล้วครับคุณ ${userName}! 🥗🍲\nทำงานเพลินจนลืมเวลาหรือเปล่าเอ่ย? แวะทานอาหารที่มีประโยชน์ให้อิ่มอร่อยและมีพลังกันน้า 😋\n\nทานมื้อนี้แล้ว แตะลิงก์เพื่อเข้าเว็บแอป LifeSync ไปถ่ายรูปอาหารให้ AI ช่วยคำนวณแคลอรี่ หรือพิมพ์จดเก็บแต้มเควสต์ได้เลยนะครับ 📸✨\n\n👉 บันทึกอาหาร:\n${nutritionUrl}`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📸 บันทึกอาหารในเว็บแอป',
            uri: nutritionUrl,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มน้ำหลังอาหาร (+250ml)',
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
  };
}

export function createFoodLinkMessage(userName: string): LineMessage {
  const nutritionUrl = getLiffUrl('/nutrition');
  return {
    type: 'text',
    text: `หิวแล้วใช่ไหมครับคุณ ${userName}! 🥗🍲\nซันนี่พร้อมช่วยบันทึกมื้ออร่อยแล้ว แตะลิงก์ด้านล่างเพื่อเปิดเว็บแอป ถ่ายรูปอาหารให้ AI Vision สแกนประเมินแคลอรี่และสารอาหาร หรือพิมพ์เลือกประเภทมื้อได้ทันทีเลยครับ ✨\n\n👉 บันทึกมื้ออาหาร:\n${nutritionUrl}`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📸 ถ่ายรูป/บันทึกอาหาร',
            uri: nutritionUrl,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 จิบน้ำก่อนอาหาร (+250ml)',
            text: 'น้ำ 250',
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📊 สรุปวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createSleepLinkMessage(userName: string): LineMessage {
  const sleepUrl = getLiffUrl('/sleep');
  return {
    type: 'text',
    text: `พักผ่อนให้สบายใจนะครับคุณ ${userName} 🌙💤\nไม่ว่าจะเข้านอนรอบดึก หรือแวะงีบชาร์จพลังสั้นๆ (Power Nap) 20-30 นาที แตะลิงก์เพื่อบันทึกในเว็บแอปได้เลยครับ:\n\n👉 บันทึกการนอนและงีบหลับ:\n${sleepUrl}`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🌙 เปิดหน้าบันทึกการนอน',
            uri: sleepUrl,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: 'เข้านอนแล้ว 😴',
            text: 'เข้านอนแล้ว',
          },
        },
      ],
    },
  };
}

export function createQuestLinkMessage(userName: string, points: number, completedCount: number): LineMessage {
  const questsUrl = getLiffUrl('/quests');
  return {
    type: 'text',
    text: `🏆 ภารกิจและแต้มสุขภาพของคุณ ${userName} ✨\n\n🔥 แต้มสะสมปัจจุบัน: ${points} แต้ม\n🎯 ภารกิจวันนี้ทำเสร็จแล้ว: ${completedCount} / 4 ภารกิจ\n\nแตะเข้าไปดูรายการภารกิจประจำวันเพื่อพิชิตแต้มและอัปเลเวลในเว็บแอปได้เลยครับ:\n👉 ${questsUrl}`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🏆 เปิดดูภารกิจ & เลเวล',
            uri: questsUrl,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มน้ำทำเควส (+250ml)',
            text: 'น้ำ 250',
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📊 สรุปวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createWeeklyDigestMessage(userName: string, data: WeeklySummaryData): LineMessage {
  const dashboardUrl = getLiffUrl('/dashboard');
  const questsUrl = getLiffUrl('/quests');
  const sleepText = data.sleepAvgHours > 0 || data.sleepAvgMins > 0
    ? `${data.sleepAvgHours} ชม. ${data.sleepAvgMins} น./คืน`
    : 'ไม่มีข้อมูล';

  const napText = data.sleepNapsCount > 0 ? ` (+งีบ ${data.sleepNapsCount} ครั้ง)` : '';

  // Determine weekly performance grade
  let grade = 'B';
  let gradeColor = '#F59E0B';
  if (data.waterGoalDays >= 5 && data.overallStreak >= 5) {
    grade = 'A+';
    gradeColor = '#10B981';
  } else if (data.waterGoalDays >= 4 || data.overallStreak >= 3) {
    grade = 'A';
    gradeColor = '#0D9488';
  } else if (data.waterGoalDays >= 2) {
    grade = 'B+';
    gradeColor = '#0284C7';
  }

  const waterPct = Math.min(100, Math.max(10, Math.round((data.waterGoalDays / 7) * 100)));

  const altText = `🌈 สรุปสุขภาพรอบสัปดาห์ของคุณ ${userName}: ดื่มน้ำ ${data.waterTotalMl.toLocaleString()}ml (ถึงเป้า ${data.waterGoalDays}/7 วัน), นอนเฉลี่ย ${sleepText}, บันทึก ${data.mealsTotalCount} มื้อ, วินัยต่อเนื่อง ${data.overallStreak} วัน (+${data.pointsEarned} แต้ม)`;

  return {
    type: 'flex',
    altText,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#059669',
        paddingAll: '20px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '☀️ LIFESYNC WEEKLY REPORT',
                    color: '#A7F3D0',
                    weight: 'bold',
                    size: 'xxs',
                    letterSpacing: '1px',
                  },
                  {
                    type: 'text',
                    text: 'สรุปสุขภาพ 7 วัน',
                    color: '#FFFFFF',
                    weight: 'bold',
                    size: 'xl',
                    margin: 'xs',
                  },
                  {
                    type: 'text',
                    text: `ประจำสัปดาห์ • คุณ ${userName}`,
                    color: '#E6FFFA',
                    size: 'xs',
                    margin: 'xs',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                cornerRadius: '16px',
                backgroundColor: '#FFFFFF',
                paddingAll: '6px',
                alignItems: 'center',
                justifyContent: 'center',
                width: '68px',
                height: '68px',
                contents: [
                  {
                    type: 'text',
                    text: 'GRADE',
                    size: 'xxs',
                    color: '#64748B',
                    weight: 'bold',
                  },
                  {
                    type: 'text',
                    text: grade,
                    size: 'xl',
                    color: gradeColor,
                    weight: 'bold',
                  },
                ],
              },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        spacing: 'lg',
        contents: [
          // 1. Water Section
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '💧 ดื่มน้ำรวม (Hydration)',
                    size: 'xs',
                    color: '#0284C7',
                    weight: 'bold',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: `${data.waterTotalMl.toLocaleString()} ml`,
                    size: 'xs',
                    color: '#0F172A',
                    weight: 'bold',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'text',
                text: `ถึงเป้า ${data.waterGoalDays} จาก 7 วัน (เฉลี่ย ${data.waterDailyAvgMl.toLocaleString()} ml/วัน)`,
                size: 'xxs',
                color: '#64748B',
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#E0F2FE',
                height: '6px',
                cornerRadius: '3px',
                margin: 'sm',
                contents: [
                  {
                    type: 'box',
                    layout: 'vertical',
                    backgroundColor: '#0284C7',
                    width: `${waterPct}%`,
                    height: '6px',
                    cornerRadius: '3px',
                    contents: [],
                  },
                ],
              },
            ],
          },
          // 2. Sleep Section
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🌙 การนอนหลับ (Sleep)',
                    size: 'xs',
                    color: '#6366F1',
                    weight: 'bold',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: sleepText,
                    size: 'xs',
                    color: '#0F172A',
                    weight: 'bold',
                    align: 'end',
                  },
                ],
              },
              {
                type: 'text',
                text: `พักผ่อนอย่างสม่ำเสมอ${napText}`,
                size: 'xxs',
                color: '#64748B',
              },
            ],
          },
          // 3. Nutrition & Streak Section
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                backgroundColor: '#F8FAFC',
                paddingAll: '10px',
                cornerRadius: '12px',
                contents: [
                  {
                    type: 'text',
                    text: '🥗 อาหารที่บันทึก',
                    size: 'xxs',
                    color: '#64748B',
                  },
                  {
                    type: 'text',
                    text: `${data.mealsTotalCount} มื้อ`,
                    size: 'sm',
                    color: '#059669',
                    weight: 'bold',
                    margin: 'xs',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                backgroundColor: '#F8FAFC',
                paddingAll: '10px',
                cornerRadius: '12px',
                contents: [
                  {
                    type: 'text',
                    text: '🔥 วินัยสะสมต่อเนื่อง',
                    size: 'xxs',
                    color: '#64748B',
                  },
                  {
                    type: 'text',
                    text: `${data.overallStreak} วัน`,
                    size: 'sm',
                    color: '#EA580C',
                    weight: 'bold',
                    margin: 'xs',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                backgroundColor: '#F8FAFC',
                paddingAll: '10px',
                cornerRadius: '12px',
                contents: [
                  {
                    type: 'text',
                    text: '🌟 แต้มสัปดาห์นี้',
                    size: 'xxs',
                    color: '#64748B',
                  },
                  {
                    type: 'text',
                    text: `+${data.pointsEarned}`,
                    size: 'sm',
                    color: '#D97706',
                    weight: 'bold',
                    margin: 'xs',
                  },
                ],
              },
            ],
          },
          // 4. AI Coach Sunny Tip
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F0FDF4',
            cornerRadius: '14px',
            paddingAll: '12px',
            borderColor: '#BBF7D0',
            borderWidth: '1px',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: '💡 คำแนะนำจากซันนี่ (AI Coach):',
                    size: 'xxs',
                    color: '#15803D',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'text',
                text: `"${data.aiTipTh}"`,
                size: 'xs',
                color: '#166534',
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '📊 ดูกราฟแนวโน้มในเว็บแอป',
              uri: dashboardUrl,
            },
            style: 'primary',
            color: '#059669',
            height: 'sm',
          },
        ],
      },
    },
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📊 ดูกราฟในเว็บแอป',
            uri: dashboardUrl,
          },
        },
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '🏆 ดูภารกิจ & เหรียญ',
            uri: questsUrl,
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มน้ำแก้วใหม่ (+250ml)',
            text: 'น้ำ 250',
          },
        },
      ],
    },
  };
}
