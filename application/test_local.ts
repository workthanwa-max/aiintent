import { getChatCompletion } from './src/services/ai.service.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  console.log('[DEBUG] Testing AI connection with Key:', process.env.TYPHOON_API_KEY ? 'EXISTS' : 'UNDEFINED');
  try {
    const res = await getChatCompletion('สวัสดีครับ');
    console.log('[DEBUG] SUCCESS:', res);
  } catch (e: any) {
    console.error('[DEBUG] FATAL ERROR:', e);
  }
}
run();
