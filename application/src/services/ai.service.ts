import OpenAI from 'openai';

export async function getChatCompletion(userMessage: string, history: any[] = [], context: any = {}) {
  const openai = new OpenAI({
    apiKey: process.env.TYPHOON_API_KEY,
    baseURL: 'https://api.opentyphoon.ai/v1',
  });

  const { currentTime, occupiedSlots, date, categories } = context;
  const allSlots = ['08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
  const booked = new Set(occupiedSlots || []);
  const freeSlots = allSlots.filter(s => !booked.has(s)).join(', ');
  
  const clinicServices = (categories && categories.length > 0) ? categories.join(', ') : 'ตรวจโรคทั่วไป';

  const systemPrompt = [
    'คุณคือน้องนิด ผู้ช่วยคลินิก ตอบภาษาไทย สุภาพ กระชับ',
    `เวลาปัจจุบัน: ${currentTime}`,
    `วันนี้: ${date}`,
    `สล็อตว่าง: ${freeSlots || 'ไม่มี'}`,
    `สล็อตจองแล้ว: ${[...(occupiedSlots || [])].join(', ') || 'ยังไม่มี'}`,
    `บริการของคลินิก: ${clinicServices}`,
    'เวลาราชการ: 08:30-16:30 จ-ศ ทุก 30 นาที',
    '',
    'กติกา:',
    '1. ถามข้อมูลทีละขั้น: อาการ -> วัน -> เวลา',
    '2. ถ้าข้อมูลยังไม่ครบ ให้ถามต่อ ห้ามเดาเอง',
    '3. สล็อตที่จองแล้วเสนอสล็อตใกล้เคียงแทน',
    '4. สรุปข้อมูลและถามยืนยันก่อนจอง',
    '5. จอง BOOK ได้เมื่อผู้ใช้พูดว่า ยืนยัน ตกลง ใช่ เท่านั้น',
    '6. **สำคัญมาก**: หากผู้ใช้ต้องการรับบริการที่ไม่อยู่ใน "บริการของคลินิก" ให้แจ้งปฏิเสธอย่างสุภาพทันทีว่า "ทางคลินิกไม่มีบริการดังกล่าวค่ะ" ห้ามรับจองเด็ดขาด',
    '7. การแปลงเวลาไทย: บ่ายโมง=13:00, บ่ายสอง=14:00, บ่ายสาม=15:00, สี่โมงเย็น=16:00',
    '8. **การเช็กคิว**: หากผู้ใช้ถาม "เช็กคิว", "ดูนัด", "ตรวจสอบเวลา", "มีจองไหม" ให้ใช้ action "CHECK"',
    '9. **การยกเลิก**: หากผู้ใช้พูดว่า "ยกเลิก", "ไม่ไปแล้ว", "ลบนัด" ให้ถามยืนยัน "ยืนยันการยกเลิกนัดหมายใช่ไหมคะ?" เมื่อผู้ใช้ยืนยันว่า "ใช่/ตกลง/ยืนยัน" **คุณต้องส่ง action {"type":"CANCEL"} มาใน JSON เท่านั้น** มิเช่นนั้นนัดหมายจะไม่ถูกลบจริง',
    '',
    'ตอบเป็น JSON เสมอ รูปแบบ:',
    '{"reply":"ข้อความตอบ","action":{"type":"NONE|BOOK|CANCEL|CHECK|CHECK_SLOTS","symptoms":"","date":"YYYY-MM-DD","time":"HH:MM","queue_id":""}}'
  ].join('\n');

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    console.log('[AI] Calling Typhoon API via fetch...');
    
    const response = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TYPHOON_API_KEY}`
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages,
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI] Fetch Error:', response.status, errText);
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const raw = json.choices?.[0]?.message?.content || '{}';
    console.log('[AI] Response:', raw.substring(0, 150));
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : raw;

  } catch (error: any) {
    console.error('[AI] Error:', error?.status, error?.message);
    if (error?.error) console.error('[AI] Error detail:', JSON.stringify(error.error));
    return JSON.stringify({
      reply: 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ',
      action: { type: 'NONE' }
    });
  }
}
