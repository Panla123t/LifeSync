import crypto from 'crypto';

export interface LineQuickReplyAction {
  type: 'message' | 'uri';
  label: string;
  text?: string;
  uri?: string;
}

export interface LineMessage {
  type: 'text' | 'flex';
  text?: string;
  altText?: string;
  contents?: Record<string, unknown>;
  quickReply?: {
    items: Array<{
      type: 'action';
      action: LineQuickReplyAction;
    }>;
  };
}

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';

/**
 * Verifies LINE webhook signature with HMAC-SHA256
 */
export function verifyLineSignature(body: string, signature: string | null): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret || channelSecret === 'your-line-channel-secret') {
    // Development fallback if user hasn't configured channel secret yet
    return true;
  }

  if (!signature) return false;

  try {
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    
    // Constant-time comparison
    const sigBuffer = Buffer.from(signature, 'utf8');
    const hashBuffer = Buffer.from(hash, 'utf8');
    if (sigBuffer.length !== hashBuffer.length) return false;
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
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || token === 'your-line-channel-access-token') {
    console.log('[LINE Client (Simulated Push)] To:', to, 'Messages:', JSON.stringify(messages, null, 2));
    return { success: true, simulated: true };
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
      console.error('LINE push message error:', res.status, errText);
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
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || token === 'your-line-channel-access-token') {
    console.log('[LINE Client (Simulated Reply)] Token:', replyToken, 'Messages:', JSON.stringify(messages, null, 2));
    return { success: true, simulated: true };
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
      console.error('LINE reply message error:', res.status, errText);
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.error('LINE reply network error:', err);
    return { success: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Pre-built Message Builders with Quick Replies
// ---------------------------------------------------------------------------

export function createWelcomeMessage(appUrl: string = 'http://localhost:3000'): LineMessage {
  return {
    type: 'text',
    text: `สวัสดีครับ! ยินดีต้อนรับสู่ LifeSync 🌿\nผู้ช่วยดูแลสุขภาพและบันทึกนิสัยประจำวันของคุณ\n\n🔗 ในการเชื่อมต่อบัญชี:\n1. ไปที่เมนู Settings ในแอป LifeSync\n2. กดปุ่ม "เชื่อมต่อ LINE Official Account"\n3. นำรหัส 6 หลัก มาพิมพ์ส่งในห้องแชทนี้ได้เลยครับ!`,
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
    text: `🎉 ยินดีด้วยครับคุณ ${userName}!\nบัญชี LifeSync เชื่อมต่อกับ LINE เรียบร้อยแล้ว\n\nคุณได้รับ +20 คะแนนโบนัส 🌟\n\nจากนี้คุณสามารถ:\n💧 พิมพ์ "น้ำ 250" หรือ "น้ำ 500" เพื่อบันทึกน้ำดื่มได้ทันที\n📊 พิมพ์ "สรุป" เพื่อดูภาพรวมวันนี้\n🔔 รับการแจ้งเตือนตามที่คุณตั้งค่าไว้`,
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
            label: '📊 สรุปวันนี้',
            text: 'สรุป',
          },
        },
      ],
    },
  };
}

export function createWaterLoggedMessage(amountMl: number, currentTotal: number, goalMl: number): LineMessage {
  const percent = Math.min(100, Math.round((currentTotal / goalMl) * 100));
  const remaining = Math.max(0, goalMl - currentTotal);
  
  return {
    type: 'text',
    text: `💧 บันทึกน้ำดื่มสำเร็จ: +${amountMl} ml!\n\nวันนี้คุณดื่มไปแล้ว: ${currentTotal.toLocaleString()} / ${goalMl.toLocaleString()} ml (${percent}%)\n${remaining === 0 ? '✨ ยอดเยี่ยมมาก! บรรลุเป้าหมายการดื่มน้ำของวันนี้แล้ว 🏆' : `เหลืออีกเพียง ${remaining.toLocaleString()} ml จะถึงเป้าหมาย สู้ๆ ครับ! 💪`}`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 ดื่มน้ำอีก +250ml',
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

  return {
    type: 'text',
    text: `📊 สรุปสุขภาพประจำวันของ ${userName} 🌿\n\n💧 น้ำดื่ม: ${waterMl.toLocaleString()} / ${waterGoal.toLocaleString()} ml (${waterPercent}%)\n🍽️ บันทึกอาหาร: ${mealsCount} มื้อ\n🌙 การนอน: ${sleepText}\n🔥 คะแนนสะสม: ${points} pts\n\nทำได้ดีมากครับ! บันทึกต่อเนื่องเพื่อสร้างนิสัยที่ดีไปด้วยกันนะครับ ✨`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 +250 ml',
            text: 'น้ำ 250',
          },
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💧 +500 ml',
            text: 'น้ำ 500',
          },
        },
      ],
    },
  };
}

export function createHydrationReminderMessage(userName: string, currentMl: number, goalMl: number): LineMessage {
  const remaining = Math.max(0, goalMl - currentMl);
  return {
    type: 'text',
    text: `💧 สวัสดีครับคุณ ${userName}!\nได้เวลาจิบน้ำแก้วใหม่แล้วนะครับ 🩵\n\nวันนี้ดื่มไปแล้ว: ${currentMl.toLocaleString()} / ${goalMl.toLocaleString()} ml (เหลืออีก ${remaining.toLocaleString()} ml)\n\nกดปุ่มด้านล่างเพื่อบันทึกได้ทันทีครับ 👇`,
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
            label: '📊 ตรวจสอบสถิติ',
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
    text: `🌙 คืนนี้พร้อมเข้านอนหรือยังครับคุณ ${userName}?\n\nการวางหน้าจอก่อนนอน 30 นาที และเข้านอนเวลาเดิม ช่วยให้สมองและร่างกายฟื้นฟูได้อย่างเต็มที่ 💤\n\nขอให้พักผ่อนอย่างเต็มอิ่มและหลับสบายครับ! ✨`,
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
