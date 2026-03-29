import OpenAI from 'openai';

export async function getChatCompletion(userMessage: string, history: any[] = [], context: any = {}) {
  const openai = new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY,
    baseURL: 'https://api.opentyphoon.ai/v1',
  });

  const { currentTime, occupiedSlots, date, categories, userName } = context;
  const allSlots = ['08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
  const booked = new Set(occupiedSlots || []);
  const freeSlots = allSlots.filter(s => !booked.has(s)).join(', ');
  
  const clinicServices = (categories && categories.length > 0) ? categories.join(', ') : 'ตรวจโรคทั่วไป';

  const systemPrompt = [
    'คุณคือน้องนิด ผู้ช่วยคลินิก ตอบภาษาไทย สุภาพ กระชับ',
    `เวลาปัจจุบัน: ${currentTime}`,
    `วันนี้: ${date}`,
    `ชื่อจริงปัจจุบันของผู้ใช้: ${userName || 'ยังไม่มี (กรุณาสอบถาม)'}`,
    `สล็อตว่าง: ${freeSlots || 'ไม่มี'}`,
    `บริการของคลินิก: ${clinicServices}`,
    'เวลาราชการ: 08:30-16:30 จ-ศ ทุก 30 นาที',
    '',
    'กติกาการสนทนา (FAST BOOKING):',
    '1. เน้นจองให้เร็วที่สุด: หากผู้ใช้บอกข้อมูลมาครบ (อาการ/บริการ, วัน, เวลา) ให้สรุปและถามยืนยันทันที',
    '2. ตรวจสอบชื่อจริง: หาก "ชื่อจริงปัจจุบันของผู้ใช้" ยังไม่มีหรือเป็นค่าว่าง คุณต้องเนียนถามชื่อ-นามสกุลจริงของผู้ใช้ก่อนที่จะทำการจอง (Action BOOK) เสมอ เพื่อใช้แสดงในหน้าเจ้าหน้าที่',
    '3. รวบยอดคำถาม: หากข้อมูลขาดหลายอย่าง (เช่น อาการ, เวลา, ชื่อจริง) ให้ถามรวมในครั้งเดียว ไม่ต้องแยกพ่นหลายรอบ',
    '4. การเดาวันที่: ถ้าผู้ใช้ไม่ระบุวัน ให้ถือว่าเป็น "วันนี้" (${date}) แต่ถ้าสล็อตวันนี้เต็มให้เสนอพรุ่งนี้ทันที',
    '5. สล็อตที่จองแล้ว: หากเวลาที่ขอไม่ว่าง ให้เสนอเวลาที่ใกล้เคียงที่สุดที่ยังว่างอยู่ทันที',
    '6. จอง BOOK ได้เมื่อผู้ใช้พูดว่า ยืนยัน ตกลง ใช่ หรือแสดงเจตนาชัดเจนหลังจากสรุปข้อมูลแล้ว',
    '7. บริการที่ไม่มี: หากขอรับบริการที่ไม่อยู่ใน "บริการของคลินิก" ให้แจ้งปฏิเสธอย่างสุภาพทันที',
    '8. การยกเลิก/เช็กคิว: ทำตาม action CANCEL หรือ CHECK ตามความเหมาะสม',
    '',
    'สำคัญ: ตอบเป็น JSON เสมอ ห้ามมีข้อความอื่นนอก JSON',
    'รูปแบบ JSON:',
    '{"reply":"ข้อความตอบ","action":{"type":"NONE|BOOK|CANCEL|CHECK|CHECK_SLOTS","name":"ใส่ชื่อจริงที่ได้จากผู้ใช้","symptoms":"","date":"YYYY-MM-DD","time":"HH:MM","queue_id":""}}'
  ].join('\n');

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    console.log('[AI] Calling Typhoon API...');
    
    const response = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TYPHOON_API_KEY}`
      },
      signal: AbortSignal.timeout(60000), // Increased to 60s for stability
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages,
        temperature: 0.1, // Even lower for stability
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI] Fetch Error:', response.status, errText);
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const json = await response.json();
    let raw = json.choices?.[0]?.message?.content || '{}';
    console.log('[AI] Raw Content:', raw.substring(0, 200));

    // Clean up: Remove potential literal newlines or control characters that break JSON.parse
    // Replace literal newlines with space, but keep \n as \n
    raw = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, " "); 

    // Improved JSON extraction: find the first balanced JSON object
    const firstBrace = raw.indexOf('{');
    if (firstBrace !== -1) {
      let count = 0;
      let found = false;
      for (let i = firstBrace; i < raw.length; i++) {
        if (raw[i] === '{') count++;
        else if (raw[i] === '}') count--;
        
        if (count === 0 && i > firstBrace) {
          raw = raw.substring(firstBrace, i + 1);
          found = true;
          break;
        }
      }
      if (!found) {
        const lastBrace = raw.lastIndexOf('}');
        if (lastBrace > firstBrace) {
           raw = raw.substring(firstBrace, lastBrace + 1);
        }
      }
    }
    
    return raw;

  } catch (error: any) {
    console.error('[AI] Error:', error?.message);
    return JSON.stringify({
      reply: 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ',
      action: { type: 'NONE' }
    });
  }
}
