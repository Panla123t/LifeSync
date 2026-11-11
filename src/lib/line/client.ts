import crypto from 'crypto';

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

export type LineMessage = LineTextMessage;

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

export function createWelcomeMessage(appUrl: string = 'https://life-sync-panla123ts-projects.vercel.app'): LineMessage {
  return {
    type: 'text',
    text: `สวัสดีครับ! ผม "ซันนี่" (Sunny) เพื่อนคู่คิดดูแลสุขภาพของคุณจาก LifeSync นะครับ ☀️🌿\n\nดีใจมากๆ ที่ได้เป็นเพื่อนกันครับ! ผมจะคอยแวะมาสะกิดเตือนให้จิบน้ำ ทานอาหารให้อร่อย และพักผ่อนให้เพียงพอแบบเป็นกันเอง ไม่มีกดดันเลยครับ 😊\n\n🔗 เพื่อให้ผมรู้จักคุณและช่วยบันทึกแต้มสุขภาพ:\n• เข้าแอป LifeSync > เมนู Settings > กด "เชื่อมต่อ LINE" แล้วนำรหัส 6 หลักมาส่งให้ผม\n• หรือพิมพ์ "อีเมล" ที่คุณใช้สมัครในห้องแชทนี้ได้เลยครับ!`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: 'เปิดแอป LifeSync',
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
  return {
    type: 'text',
    text: `เย้! เชื่อมต่อสำเร็จแล้วครับคุณ ${userName} 🎉✨\n\nซันนี่พร้อมดูแลคุณเต็มที่แล้วนะ! มอบโบนัสตั้งต้นให้เลย +20 แต้ม 🌟\n\nจากนี้อยากบันทึกอะไร พิมพ์คุยกับซันนี่ได้ตลอดเลยน้า:\n💧 จิบน้ำเสร็จ พิมพ์ "น้ำ 250" หรือ "น้ำ 500"\n📊 อยากดูความคืบหน้า พิมพ์ "สรุป"\n🌙 จะนอนแล้ว พิมพ์ "เข้านอนแล้ว"\n\nเรามาสร้างสุขภาพที่ดีและชีวิตที่สดใสไปด้วยกันนะครับ 🩵`,
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
            label: '💧 ดื่มน้ำ +500ml',
            text: 'น้ำ 500',
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📊 สรุปสุขภาพวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createWaterLoggedMessage(amountMl: number, currentTotal: number, goalMl: number, userName: string = 'เพื่อนคนเก่ง'): LineMessage {
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
    text: `ชื่นใจจัง! 💧 ซันนี่จดให้แล้วน้า +${amountMl} ml ✨\n\nวันนี้คุณ ${userName} เติมน้ำไปแล้ว: ${currentTotal.toLocaleString()} / ${goalMl.toLocaleString()} ml (${percent}%)\n\n${cheer}`,
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
  const waterPercent = Math.min(100, Math.round((waterMl / waterGoal) * 100));

  let motivationalNote = '';
  if (waterPercent >= 80 && mealsCount >= 2) {
    motivationalNote = '🌟 วันนี้คุณดูแลตัวเองได้ยอดเยี่ยมมากๆ เลยครับ! พลังกายเต็มเปี่ยม ขอให้ภูมิใจในความสม่ำเสมอของตัวเองน้า!';
  } else {
    motivationalNote = '🌿 ไม่จำเป็นต้องเพอร์เฟกต์ทุกวัน แค่ไม่หยุดใส่ใจตัวเองก็เก่งมากๆ แล้วครับ ค่อยๆ ปรับทีละนิดไปด้วยกันนะ!';
  }

  return {
    type: 'text',
    text: `🌈 บันทึกสุขภาพวันนี้ของคุณ ${userName} ✨\nซันนี่สรุปความพยายามที่น่าชื่นชมมาให้ดูครับ:\n\n💧 ดื่มน้ำชื่นใจ: ${waterMl.toLocaleString()} / ${waterGoal.toLocaleString()} ml (${waterPercent}%)\n🥗 มื้ออร่อยเติมพลัง: ${mealsCount} มื้อ\n🌙 พักผ่อนหลับสบาย: ${sleepText}\n🔥 แต้มสุขภาพสะสม: ${points} แต้ม\n\n${motivationalNote}`,
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
  const remaining = Math.max(0, goalMl - currentMl);
  const nowHour = new Date().getHours();

  let timeGreeting = 'ช่วงนี้';
  if (nowHour >= 6 && nowHour < 12) timeGreeting = 'เช้าวันนี้';
  else if (nowHour >= 12 && nowHour < 17) timeGreeting = 'บ่ายนี้';
  else timeGreeting = 'เย็นนี้';

  return {
    type: 'text',
    text: `ก๊อกๆ! ซันนี่แวะมาสะกิดเบาๆ ครับ 💧\n${timeGreeting} คุณ ${userName} ทำงานหรือเรียนเหนื่อยไหมครับ? 🩵\n\nพักสายตาสักครู่ แล้วจิบน้ำสักแก้วให้ร่างกายสดชื่น สมองแล่นฉิวกันหน่อยน้า 🧊\n\nวันนี้ดื่มไปแล้ว: ${currentMl.toLocaleString()} / ${goalMl.toLocaleString()} ml (เหลืออีก ${remaining.toLocaleString()} ml)\n\nจิบเสร็จแล้วแตะบอกซันนี่ตรงปุ่มด้านล่างได้เลยนะครับ 👇`,
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
            type: 'message',
            label: '📊 ดูสถิติวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createSleepReminderMessage(userName: string): LineMessage {
  return {
    type: 'text',
    text: `ดึกแล้วนะคนเก่ง 🌙✨\nวันนี้คุณ ${userName} ใช้พลังและตั้งใจทำสิ่งต่างๆ มาทั้งวันแล้วนะ เหนื่อยไหมครับ?\n\nซันนี่อยากชวนคุณวางมือถือลง หลับตา และปล่อยวางเรื่องหนักๆ ให้ร่างกายและจิตใจได้พักผ่อนอย่างเต็มที่ 💤\n\nขอให้คืนนี้หลับฝันดี ตื่นมาด้วยความสดใสและพลังบวกเต็มเปี่ยมนะครับ ราตรีสวัสดิ์ครับผม 🌟🛌`,
    quickReply: {
      items: [
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
  return {
    type: 'text',
    text: `อรุณสวัสดิ์ครับคุณ ${userName}! ☀️🌈\nเช้าวันใหม่เริ่มต้นขึ้นแล้วนะ ซันนี่แวะมาส่งพลังบวกให้คุณลุยวันใหม่อย่างสดใสครับ!\n\n💡 ทิปเพื่อความสดชื่น:\nลองจิบน้ำอุณหภูมิห้องแก้วแรกสัก 250ml เพื่อปลุกระบบย่อยอาหารและคืนความชุ่มชื่นให้ร่างกายกันน้า 🩵\n\nวันนี้พร้อมลุยไปด้วยกันไหมครับ? แตะบันทึกน้ำแก้วแรกได้เลย! 👇`,
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
            type: 'message',
            label: '📊 สรุปสุขภาพ',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createMealReminderMessage(userName: string): LineMessage {
  return {
    type: 'text',
    text: `ได้เวลาเติมพลังแล้วครับคุณ ${userName}! 🥗🍲\nทำงานเพลินจนลืมเวลาหรือเปล่าเอ่ย? แวะทานอาหารที่มีประโยชน์ให้อิ่มอร่อยและมีพลังกันน้า 😋\n\nทานมื้อนี้แล้ว เข้าแอป LifeSync ไปสแกนรูปอาหารหรือพิมพ์บันทึกเก็บแต้มเควสต์ประจำวันได้เลยนะครับ 📸✨`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'uri',
            label: '📸 บันทึกอาหารในแอป',
            uri: 'https://life-sync-panla123ts-projects.vercel.app/nutrition',
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
      ],
    },
  };
}
