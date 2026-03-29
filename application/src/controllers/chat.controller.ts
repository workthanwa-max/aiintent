import { getChatCompletion } from '../services/ai.service.js';
import { QueueService } from '../services/queue.service.js';
import { db } from '../models/database.js';

export const handleChat = async (req: any, res: any) => {
  const { message, username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // 1. Save user message to history FIRST
  db.run('INSERT INTO chat_history (username, role, message) VALUES (?, ?, ?)', [username, 'user', message]);

  // 2. Prepare Context
  const today = new Date().toISOString().split('T')[0];
  const occupiedSlots = await QueueService.getOccupiedSlots(today);
  
  // Fetch current user's real name
  const userData: any = await new Promise((resolve) => {
    db.get('SELECT name FROM users WHERE username = ?', [username], (err, row) => resolve(row));
  });

  const context = {
    currentTime: new Date().toLocaleString('th-TH'),
    occupiedSlots,
    date: today,
    userName: userData?.name || ''
  };

  // 3. Load active service categories for AI context
  const activeCategories: string[] = await new Promise((resolve) => {
    db.all('SELECT name FROM service_categories WHERE is_active = 1', [], (err, rows: any[]) => {
      if (err) resolve([]);
      else resolve(rows.map(r => r.name));
    });
  });

  // 4. Load DB chat history for AI context (last 14 turns)
  const dbHistory: any = await new Promise((resolve) => {
    db.all(
      'SELECT role, message as content FROM chat_history WHERE username = ? ORDER BY created_at DESC LIMIT 14',
      [username],
      (err, rows) => resolve(err ? [] : (rows as any[]).reverse())
    );
  });

  // 5. Call AI — response is always JSON now
  const rawAiResponse = await getChatCompletion(message, dbHistory, { 
    ...context,
    categories: activeCategories 
  });

  console.log(`[Chat] AI Response for ${username}:`, rawAiResponse);

  let replyText = 'ขออภัยค่ะ เกิดข้อผิดพลาดชั่วคราว';
  let action: any = { type: 'NONE' };
  let actionResultPayload: any = null;

  try {
    const parsed = JSON.parse(rawAiResponse);
    replyText = parsed.reply || replyText;
    action = parsed.action || { type: 'NONE' };

    // Update user's real name if provided by AI
    if (action.name && action.name.trim().length > 0) {
      console.log(`[Chat] Updating name for ${username} to: ${action.name}`);
      db.run('UPDATE users SET name = ? WHERE username = ?', [action.name, username]);
    }
  } catch (e) {
    console.error('[Chat] Failed to parse AI JSON, raw:', rawAiResponse?.substring(0, 200));
    
    // Fallback: Try to extract only "reply" using regex if JSON parse fails
    const replyMatch = rawAiResponse.match(/"reply"\s*:\s*"([^"]+)"/);
    if (replyMatch && replyMatch[1]) {
      replyText = replyMatch[1];
      console.log('[Chat] Rescued reply via regex:', replyText);
    } else if (rawAiResponse && rawAiResponse.length < 500 && !rawAiResponse.includes('{')) {
      replyText = rawAiResponse;
    } else {
      replyText = 'ขออภัยค่ะ ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองพิมพ์ใหม่อีกครั้งนะคะ';
    }
  }

  // 5. Execute Action if needed
  try {
    if (action.type === 'BOOK') {
      const bookingDate: string = action.date || today;
      const validation = QueueService.validateBookingSlot(bookingDate, action.time);

      if (validation.valid) {
        const isDuplicate = await QueueService.checkDuplicate(username, bookingDate);
        const takenSlots = await QueueService.getOccupiedSlots(bookingDate);

        if (isDuplicate) {
          replyText = `ขออภัยค่ะ คุณมีการนัดหมายในวันที่ ${bookingDate} แล้ว ไม่สามารถจองซ้ำได้ค่ะ`;
        } else if (takenSlots.includes(action.time)) {
          replyText = `ขออภัยค่ะ เวลา ${action.time} ถูกจองไปแล้ว กรุณาเลือกเวลาอื่นนะคะ`;
        } else {
          const result: any = await QueueService.bookQueue(username, action.symptoms || '', bookingDate, action.time);
          replyText = `✅ จองนัดหมายสำเร็จค่ะ! หมายเลขคิวของคุณคือ **Q${result.queueNumber}** วันที่ ${bookingDate} เวลา ${action.time} น. หากต้องการยกเลิกหรือเปลี่ยนแปลง แจ้งน้องนิดได้เลยนะคะ 😊`;
          actionResultPayload = { type: 'BOOK_SUCCESS', data: [result] };
        }
      } else {
        replyText = `ขออภัยค่ะ ${validation.reason}`;
      }
    } else if (action.type === 'CHECK_SLOTS') {
      const checkDate: string = action.date || today;
      const slots = await QueueService.getOccupiedSlots(checkDate);
      const allSlots = ['08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
      const freeSlots = allSlots.filter(s => !slots.includes(s));
      replyText = `สล็อตที่ว่างวันที่ ${checkDate} ได้แก่: ${freeSlots.join(', ') || 'ไม่มีสล็อตว่างแล้วค่ะ'} สะดวกเวลาใดคะ?`;
    } else if (action.type === 'CHECK') {
      const queues: any = await new Promise((resolve, reject) => {
        db.all(
          `SELECT q.id, q.queue_number, q.booking_date, q.booking_time, q.symptoms, q.status 
           FROM queues q WHERE q.customer_id = ? AND q.status != 'CANCELLED' ORDER BY q.booking_date, q.booking_time`,
          [username],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });
      if (queues.length > 0) {
        replyText = `ข้อมูลนัดหมายของคุณที่กำลังใช้งานอยู่ค่ะ:`;
        actionResultPayload = { type: 'CHECK_SURE', data: queues };
      } else {
        replyText = 'คุณยังไม่มีนัดหมายที่ใช้งานอยู่นะคะ ต้องการจองคิวเลยไหมคะ?';
      }
    } else if (action.type === 'CANCEL') {
      const activeQueues: any[] = await new Promise((resolve) => {
        db.all('SELECT id FROM queues WHERE customer_id = ? AND status != "CANCELLED"', [username], (err, rows) => {
          resolve(err ? [] : rows);
        });
      });

      console.log(`[Chat] Found ${activeQueues.length} active queues for cancellation for ${username}`);

      if (activeQueues.length > 0) {
        for (const q of activeQueues) {
          await QueueService.cancelQueue(q.id, username);
        }
        // Keep AI's replyText if it provided one, otherwise use default
        if (!replyText || replyText.includes('ขออภัย')) {
           replyText = `ยกเลิกนัดหมายให้เรียบร้อยแล้วค่ะ หวังว่าคงจะได้มีโอกาสดูแลคุณอีกครั้งนะคะ`;
        }
        actionResultPayload = { type: 'CANCEL_SUCCESS' };
      } else {
        replyText = `ไม่พบรายการนัดหมายที่สามารถยกเลิกได้ในขณะนี้ค่ะ`;
      }
    }
  } catch (dbError) {
    console.error('[Chat] Action execution failed:', dbError);
    replyText = 'ขออภัยค่ะ เกิดข้อผิดพลาดในระบบฐานข้อมูลชั่วคราว ไม่สามารถทำรายการได้ในขณะนี้';
  }

  // 6. Save AI reply to history
  const dbMessage = JSON.stringify({ text: replyText, action_result: actionResultPayload });
  db.run('INSERT INTO chat_history (username, role, message) VALUES (?, ?, ?)', [username, 'assistant', dbMessage]);

  res.json({ reply: replyText, action_result: actionResultPayload });
};

export const getHistory = async (req: any, res: any) => {
  const { username } = req.params;
  db.all('SELECT role, message as content FROM chat_history WHERE username = ? ORDER BY created_at ASC', [username], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

export const clearHistory = async (req: any, res: any) => {
  const { username } = req.params;
  db.run('DELETE FROM chat_history WHERE username = ?', [username], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
};
