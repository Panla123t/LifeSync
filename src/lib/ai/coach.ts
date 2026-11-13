export interface CoachContext {
  userName: string;
  waterTodayMl?: number;
  overallStreak?: number;
}

const SUNNY_SYSTEM_PROMPT = `คุณคือ "ซันนี่" (Sunny) ☀️🌿 เพื่อนคู่คิดดูแลสุขภาพประจำตัวจาก LifeSync
บุคลิกและแนวทางการตอบ:
1. สุภาพ อบอุ่น เป็นกันเอง พูดจาไพเราะ ใช้คำลงท้าย "ครับ", "น้า", "ผมซันนี่ครับ" และใส่อีโมจิน่ารักๆ (☀️, 🌿, 🩵, 💧, 🥗, 🌙)
2. หลักการของ LifeSync: เน้นการสร้างวินัยและความสม่ำเสมอใน 3 ด้านหลัก — การดื่มน้ำ (Hydration), อาหารที่มีประโยชน์ (Nutrition), และการนอนหลับพักผ่อน (Sleep + Power Nap)
3. ขอบเขตทางการแพทย์ (สำคัญมาก): คุณเป็นโค้ชพฤติกรรมสุขภาพ ไม่ใช่แพทย์ ห้ามวินิจฉัยโรค ห้ามสั่งยา หรือจ่ายแผนการรักษาทางการแพทย์เด็ดขาด หากผู้ใช้ถามเรื่องอาการเจ็บป่วยรุนแรง ให้แนะนำด้วยความห่วงใยให้ปรึกษาแพทย์
4. ตอบให้กระชับ เข้าใจง่าย นำไปปฏิบัติได้จริง (ความยาวประมาณ 2-3 ย่อหน้าสั้นๆ เหมาะกับการอ่านบนมือถือในแอป LINE)
5. ให้กำลังใจเสมอ เน้นความก้าวหน้าทีละนิด ไม่กดดัน`;

/**
 * Intelligent rule-based fallback when Gemini API key is not configured or network fails
 */
function getSmartFallbackResponse(question: string, userName: string): string {
  const q = question.toLowerCase();

  if (q.includes('นอน') || q.includes('หลับ') || q.includes('เพลีย') || q.includes('ตื่น')) {
    return `ซันนี่เข้าใจเลยครับคุณ ${userName} 🌙💤 เรื่องการนอนส่งผลต่อพลังงานทั้งวันจริงๆ น้า\n\n💡 ทริกสุขภาพง่ายๆ:\n• หากคืนนี้นอนไม่หลับ ลองงดจอมือถือก่อนนอน 30 นาที และปรับไฟห้องให้อุ่นสลัวๆ ดูนะครับ\n• หากระหว่างวันรู้สึกง่วง ลองแวะงีบชาร์จพลังสั้นๆ (Power Nap) สัก 15-20 นาทีก่อนบ่าย 3 โมง จะช่วยให้สมองไบรท์ขึ้นมากเลยครับผม ✨`;
  }

  if (q.includes('น้ำ') || q.includes('จิบ') || q.includes('กระหาย') || q.includes('ผิว')) {
    return `น้ำเปล่าคือยาวิเศษของร่างกายเลยครับคุณ ${userName}! 💧✨\n\nการจิบน้ำสม่ำเสมอชั่วโมงละ 1 แก้ว (ประมาณ 200-250 ml) ดีกว่าการดื่มรวดเดียวเยอะๆ น้า ช่วยให้ไตทำงานสบาย ผิวพรรณชุ่มชื่น และสมองปลอดโปร่งสุดๆ เลยครับ 🧊\n\nจิบเสร็จแล้ว แตะปุ่ม "จิบน้ำ +250ml" ตรงเมนูด้านล่างให้ซันนี่จดแต้มได้เลยน้า!`;
  }

  if (q.includes('อาหาร') || q.includes('กิน') || q.includes('มื้อ') || q.includes('อ้วน') || q.includes('ลดน้ำหนัก') || q.includes('แคลอรี่')) {
    return `เรื่องอาหารการกิน ซันนี่แนะนำให้เน้น "ความสมดุล" เป็นหลักนะครับคุณ ${userName} 🥗🍲\n\nลองจัดจานแบบง่ายๆ:\n• ผักหลากสี 2 ส่วน 🥦🥕\n• โปรตีนคุณภาพดี 1 ส่วน (อกไก่, ไข่, ปลา, เต้าหู้) 🍗\n• คาร์โบไฮเดรตเชิงซ้อน 1 ส่วน (ข้าวกล้อง, มันหวาน) 🍚\n\nทานมื้อนี้แล้ว อย่าลืมเปิดเมนู "บันทึกอาหาร" ด้านล่างมาถ่ายรูปให้อัลกอริทึม AI ช่วยดูแคลอรี่ได้เลยนะครับ!`;
  }

  return `ซันนี่ได้รับคำถามของคุณ ${userName} แล้วนะครับ! ☀️🌿\n\nไม่ว่าจะเรื่องการดื่มน้ำ อาหาร หรือการนอนหลับ ซันนี่พร้อมอยู่เคียงข้างเสมอครับ การดูแลตัวเองไม่จำเป็นต้องทำทุกอย่างให้สมบูรณ์แบบ แค่ค่อยๆ ปรับพฤติกรรมเล็กๆ วันละนิด ก็สร้างความเปลี่ยนแปลงที่ยิ่งใหญ่ให้ร่างกายได้แล้วครับผม 🩵✨\n\nคุณ ${userName} สามารถแตะเมนูริชเมนูด้านล่างเพื่อบันทึกสุขภาพหรือเช็คแต้มได้ตลอดเวลาเลยนะครับ!`;
}

/**
 * Asks Sunny Health Coach a freeform wellness question powered by Gemini API
 */
export async function askSunnyCoach(question: string, context: CoachContext): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || (process.env.AI_PROVIDER_API_KEY !== 'your-ai-api-key' ? process.env.AI_PROVIDER_API_KEY : undefined);

  if (!geminiKey) {
    return getSmartFallbackResponse(question, context.userName);
  }

  try {
    const userPrompt = `ผู้ใช้ชื่อ: "${context.userName}"
สถิติปัจจุบัน: วินัยสะสม ${context.overallStreak || 0} วัน, ดื่มน้ำวันนี้ ${context.waterTodayMl || 0} ml
คำถามของผู้ใช้: "${question}"

กรุณาตอบคำถามในฐานะน้องซันนี่ (Sunny) ตามบุคลิกและแนวทางที่กำหนด`;

    // Attempt gemini-flash-lite-latest first (fast, complete), fallback to gemini-3.5-flash
    const candidateModels = ['gemini-flash-lite-latest', 'gemini-3.5-flash'];
    for (const model of candidateModels) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: SUNNY_SYSTEM_PROMPT },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && typeof text === 'string' && text.trim().length > 0) {
            return text.trim();
          }
        }
      } catch (callErr) {
        console.warn(`[Sunny Coach ${model} Error]:`, callErr);
      }
    }

    return getSmartFallbackResponse(question, context.userName);
  } catch (err) {
    console.warn('[Sunny Coach AI Error]:', err);
    return getSmartFallbackResponse(question, context.userName);
  }
}
