import { db } from '../models/database.js';

export class QueueService {
  static async getNextQueueNumber(date: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.get('SELECT MAX(queue_number) as max FROM queues WHERE booking_date = ?', [date], (err, row: any) => {
        if (err) return reject(err);
        resolve((row?.max || 0) + 1);
      });
    });
  }

  static async bookQueue(username: string, symptoms: string, date: string, time: string) {
    const queueNumber = await this.getNextQueueNumber(date);
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO queues (queue_number, customer_id, booking_date, booking_time, symptoms, status) VALUES (?, ?, ?, ?, ?, 'WAITING')`,
        [queueNumber, username, date, time, symptoms],
        function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, queueNumber });
        }
      );
    });
  }

  static async getCustomerQueues(username: string) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM queues WHERE customer_id = ? ORDER BY id DESC', [username], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static async cancelQueue(queueId: number, username: string) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE queues SET status = "CANCELLED" WHERE id = ? AND customer_id = ?', [queueId, username], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  static validateBookingSlot(dateStr: string, timeStr: string): { valid: boolean; reason?: string } {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    if (day === 0 || day === 6) {
      return { valid: false, reason: 'คลินิกปิดทำการวันเสาร์-อาทิตย์ กรุณาเลือกวันจันทร์-ศุกร์ครับ' };
    }

    if (timeStr) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0] || '0');
      const minutes = parseInt(parts[1] || '0');
      const totalMinutes = hours * 60 + minutes;
      const startMinutes = 8 * 60 + 30; // 08:30
      const endMinutes = 16 * 60 + 30; // 16:30

      if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
        return { valid: false, reason: 'กรุณาเลือกเวลาในช่วง 08:30 - 16:30 น. (เวลาราชการ) ครับ' };
      }
    }

    return { valid: true };
  }

  static async getOccupiedSlots(date: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT booking_time FROM queues WHERE booking_date = ? AND status != "CANCELLED"', [date], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows.map(r => r.booking_time));
      });
    });
  }

  static async checkDuplicate(username: string, date: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get('SELECT 1 FROM queues WHERE customer_id = ? AND booking_date = ? AND status != "CANCELLED"', [username, date], (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }
}
