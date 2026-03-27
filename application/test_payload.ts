import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  const systemPrompt = [
    'คุณคือน้องนิด ผู้ช่วยคลินิก',
    'ตอบเป็น JSON เสมอ รูปแบบ:',
    '{"reply":"ข้อความตอบ","action":{"type":"NONE"}}'
  ].join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'สวัสดี' }
  ];

  const payload = {
    model: 'typhoon-v2.5-30b-a3b-instruct',
    messages,
    temperature: 0.3,
    max_tokens: 500
  };

  console.log('[DEBUG] Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TYPHOON_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log('[DEBUG] Status:', response.status);
  console.log('[DEBUG] Body:', text);
}
run();
