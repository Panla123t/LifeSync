import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
  food_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  portion_description: string;
  calories_estimate: number;
  confidence?: 'high' | 'medium' | 'low';
  nutrition_note?: string;
  is_mock?: boolean;
  demo_notice?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = image.includes('base64,')
      ? image.split('base64,')[1]
      : image;

    // Detect available AI keys
    const geminiKey = process.env.GEMINI_API_KEY || (process.env.AI_PROVIDER_API_KEY !== 'your-ai-api-key' ? process.env.AI_PROVIDER_API_KEY : undefined);
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. If Google Gemini API is available
    if (geminiKey) {
      try {
        const promptText = `You are a certified professional nutritionist specializing in Thai and international cuisine.
Analyze this food photograph in detail.
Identify the dish, estimate the portion size, and estimate total calories (kcal).
Respond STRICTLY with a raw JSON object (no markdown, no backticks, no code fences):
{
  "food_name": "ชื่ออาหารภาษาไทยชัดเจน (e.g. ข้าวมันไก่ต้ม)",
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
  "portion_description": "คำอธิบายปริมาณสั้นๆ (e.g. 1 จาน ปกติ ~350g พร้อมน้ำซุป)",
  "calories_estimate": 550,
  "confidence": "high",
  "nutrition_note": "คำแนะนำสั้นๆ เกี่ยวกับสารอาหาร"
}`;

        // Attempt Gemini 2.0 Flash first, fallback to 1.5 Flash
        let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        let response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (!response.ok) {
          // Fallback to gemini-1.5-flash
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          });
        }

        if (response.ok) {
          const apiData = await response.json();
          const rawText = apiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson) as AnalysisResult;
            return NextResponse.json({
              success: true,
              data: {
                ...parsed,
                is_mock: false,
              },
            });
          }
        }
      } catch (geminiError) {
        console.error('Gemini vision analysis failed, using fallback:', geminiError);
      }
    }

    // 2. If OpenAI API is available
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'You are an expert nutritionist. Identify this meal, estimate calories, and respond ONLY with JSON: {"food_name":"...","meal_type":"lunch","portion_description":"...","calories_estimate":550,"nutrition_note":"..."}',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Data}`,
                    },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const content = result.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as AnalysisResult;
            return NextResponse.json({
              success: true,
              data: {
                ...parsed,
                is_mock: false,
              },
            });
          }
        }
      } catch (openAiError) {
        console.error('OpenAI vision analysis failed:', openAiError);
      }
    }

    // 3. Fallback / Intelligent Simulation Mode when no live API key is set
    // Picks a smart meal estimate based on the current time of day so user can demo immediately
    const currentHour = new Date().getHours();
    let defaultMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
    let defaultDish = 'ข้าวกะเพราอกไก่ไข่ดาว';
    let defaultPortion = '1 จาน (ข้าวกล้อง 1 ถ้วย + อกไก่ 120g + ไข่ดาว 1 ฟอง)';
    let defaultCalories = 540;
    let defaultNote = 'สารอาหารสมดุล โปรตีนคุณภาพดีจากอกไก่และไข่ไก่';

    if (currentHour < 10) {
      defaultMealType = 'breakfast';
      defaultDish = 'โจ๊กข้าวกล้องหมูสับไข่ลวก';
      defaultPortion = '1 ชาม (โจ๊ก 1 ถ้วย + หมูสับไม่ติดมัน + ไข่ลวก 1 ฟอง)';
      defaultCalories = 360;
      defaultNote = 'มื้อเช้าสบายท้อง ย่อยง่าย ให้พลังงานที่คงที่';
    } else if (currentHour >= 18) {
      defaultMealType = 'dinner';
      defaultDish = 'สลัดอกไก่ย่างน้ำสลัดงาญี่ปุ่น';
      defaultPortion = '1 จานใหญ่ (อกไก่ย่าง 150g + ผักสดหลากสี + น้ำสลัด 2 ช้อนโต๊ะ)';
      defaultCalories = 420;
      defaultNote = 'มื้อเย็นเน้นโปรตีนและใยอาหาร ย่อยง่าย สบายท้องก่อนนอน';
    }

    return NextResponse.json({
      success: true,
      data: {
        food_name: defaultDish,
        meal_type: defaultMealType,
        portion_description: defaultPortion,
        calories_estimate: defaultCalories,
        confidence: 'high',
        nutrition_note: defaultNote,
        is_mock: true,
        demo_notice: 'โหมดจำลอง AI สำหรับทดสอบ UI ทันที (ใส่ GEMINI_API_KEY ใน .env.local เพื่อวิเคราะห์ภาพจริง)',
      },
    });
  } catch (error) {
    console.error('Photo recognition error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during analysis' },
      { status: 500 }
    );
  }
}
