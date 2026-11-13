import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] }: { message: string; history?: ChatMessage[] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Fetch user data context from Supabase if authenticated
    let userContextStr = 'ผู้ใช้งานทั่วไป (ยังไม่ได้ล็อกอิน)';
    let userName = 'เพื่อนสุขภาพ';
    let waterTodayMl = 0;
    let mealsTodayCount = 0;
    let sleepHours = 0;
    let currentStreak = 0;
    let totalPoints = 0;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Profile
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
        if (prof?.display_name) userName = prof.display_name;

        // Today's date
        const today = new Intl.DateTimeFormat('en-CA').format(new Date());

        // Water
        const { data: waters } = await supabase
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', user.id)
          .gte('logged_at', `${today}T00:00:00Z`);
        if (waters) {
          waterTodayMl = waters.reduce((acc, curr) => acc + curr.amount_ml, 0);
        }

        // Meals
        const { data: meals } = await supabase
          .from('food_logs')
          .select('food_name, calories_estimate')
          .eq('user_id', user.id)
          .gte('logged_at', `${today}T00:00:00Z`);
        if (meals) {
          mealsTodayCount = meals.length;
        }

        // Sleep (last night)
        const { data: sleeps } = await supabase
          .from('sleep_logs')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (sleeps && sleeps.length > 0) {
          sleepHours = Math.round((sleeps[0].duration_minutes / 60) * 10) / 10;
        }

        // Points
        const { data: pointTxs } = await supabase
          .from('point_transactions')
          .select('points_delta')
          .eq('user_id', user.id);
        if (pointTxs) {
          totalPoints = pointTxs.reduce((acc, curr) => acc + curr.points_delta, 0);
        }

        userContextStr = `
- ชื่อผู้ใช้: ${userName}
- ปริมาณน้ำดื่มวันนี้: ${waterTodayMl} ml (เป้าหมาย 2,000 ml)
- มื้ออาหารที่บันทึกวันนี้: ${mealsTodayCount} มื้อ
- เวลานอนล่าสุด: ${sleepHours > 0 ? `${sleepHours} ชั่วโมง` : 'ยังไม่ได้บันทึกเมื่อคืน'}
- คะแนนสะสม: ${totalPoints} pts
`;
      }
    } catch (dbErr) {
      console.warn('[Coach API] DB context fetch error:', dbErr);
    }

    // 2. Call Gemini API if available
    const geminiKey = process.env.GEMINI_API_KEY || (process.env.AI_PROVIDER_API_KEY !== 'your-ai-api-key' ? process.env.AI_PROVIDER_API_KEY : undefined);

    if (geminiKey) {
      try {
        const systemInstruction = `You are "Sunny" (ซันนี่), the warm, enthusiastic, empathetic AI health coach and mascot of LifeSync.
Your mission is to motivate users to build daily consistency across 3 health pillars: Hydration, Nutrition, and Sleep.

Personality:
- Warm, joyful, supportive, and kind.
- Speak in natural, friendly Thai (use polite particles like ครับ appropriately).
- Keep answers actionable, science-backed, and concise (2-4 short sentences or bullet points).
- When applicable, reference the user's real today data provided in the context below to make your advice super relevant!
- CRITICAL HEALTH NOTICE: You are a wellness habit coach, NOT a medical doctor. If a user asks about serious illnesses, acute chest pain, depression, or asks for clinical prescriptions, gently remind them to see a medical professional.

Current User Context Today:
${userContextStr}`;

        // Format contents
        const contents = [];
        // Add past 3 turns history if provided
        for (const h of history.slice(-4)) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          });
        }
        // Current user message
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        // Attempt gemini-flash-lite-latest first (fast, no token budget exhaustion), fallback to gemini-3.5-flash
        const candidateModels = ['gemini-flash-lite-latest', 'gemini-3.5-flash'];
        for (const model of candidateModels) {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const aiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              },
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const replyText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              return NextResponse.json({ success: true, reply: replyText.trim() });
            }
          } else {
            console.warn(`[Coach API] ${model} returned status:`, aiRes.status);
          }
        }
      } catch (geminiErr) {
        console.warn('[Coach API] Gemini call error:', geminiErr);
      }
    }

    // 3. Intelligent rule-based contextual fallback
    const lower = message.toLowerCase();
    let fallbackReply = `สวัสดีครับคุณ ${userName}! ซันนี่พร้อมช่วยเหลือเสมอครับ`;

    if (lower.includes('น้ำ') || lower.includes('water')) {
      if (waterTodayMl >= 2000) {
        fallbackReply = `สุดยอดมากครับคุณ ${userName}! วันนี้ดื่มน้ำไปแล้ว ${waterTodayMl} ml ครบเป้าหมาย 2 ลิตรเรียบร้อย ร่างกายสดชื่นแน่นอนครับ! 💧✨`;
      } else {
        const remaining = 2000 - waterTodayMl;
        fallbackReply = `วันนี้คุณ ${userName} ดื่มน้ำไปแล้ว ${waterTodayMl} ml ครับ ขาดอีกเพียง ${remaining} ml จะครบ 2,000 ml พกกระบอกน้ำจิบบ่อยๆ ระหว่างวันนะ ซันนี่เป็นกำลังใจให้ครับ! 💧`;
      }
    } else if (lower.includes('อาหาร') || lower.includes('กิน') || lower.includes('food') || lower.includes('มื้อ')) {
      if (mealsTodayCount === 0) {
        fallbackReply = `วันนี้ยังไม่ได้บันทึกมื้ออาหารเลยครับ อย่าลืมถ่ายรูปอาหารหรือกดบันทึกในหน้าอาหารนะ ซันนี่จะช่วยประมาณการสารอาหารให้ทันทีครับ 🥗📸`;
      } else {
        fallbackReply = `วันนี้บันทึกไปแล้ว ${mealsTodayCount} มื้อครับ แนะนำให้เน้นโปรตีนไม่ติดมันและผักหลากสี ดื่มน้ำตามหลังมื้ออาหารสัก 1 แก้ว ช่วยระบบย่อยได้ดีมากครับ 🥑`;
      }
    } else if (lower.includes('นอน') || lower.includes('sleep') || lower.includes('เหนื่อย') || lower.includes('เพลีย')) {
      fallbackReply = `การนอนคือหัวใจของการฟื้นฟูร่างกายครับ แนะนำให้เริ่มหรี่ไฟและงดหน้าจอก่อนเข้านอน 30 นาที และพยายามเข้านอนเวลาเดิมทุกวัน คืนนี้พักผ่อนให้เต็มที่นะครับ 😴🌙`;
    } else if (lower.includes('แต้ม') || lower.includes('ภารกิจ') || lower.includes('คะแนน') || lower.includes('points')) {
      fallbackReply = `ตอนนี้คุณ ${userName} มีคะแนนสะสม ${totalPoints} แต้มแล้วครับ! ทุกครั้งที่บันทึกน้ำ อาหาร หรือการนอน จะได้รับแต้มเพิ่มและช่วยรักษา Streak ด้วยนะครับ 🔥🏆`;
    } else {
      fallbackReply = `ยินดีที่ได้คุยกันครับคุณ ${userName}! วันนี้ดื่มน้ำไปแล้ว ${waterTodayMl} ml และบันทึกอาหาร ${mealsTodayCount} มื้อ วันนี้มีความคืบหน้าที่ดีมาก มีอะไรให้ซันนี่ช่วยแนะนำเพิ่มเติม ถามได้ตลอดเวลาเลยนะครับ! 🌟`;
    }

    return NextResponse.json({ success: true, reply: fallbackReply });
  } catch (err: unknown) {
    console.error('[Coach API] Internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
