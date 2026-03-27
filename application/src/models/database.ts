import sqlite3 from 'sqlite3';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const { Database } = sqlite3;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

export const db = new Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ', err.message);
    } else {
        console.log('Database connected.');
        initSchema();
    }
});

function initSchema() {
    db.serialize(() => {
        // ตารางผู้ใช้งาน (Users)
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                name TEXT,
                role TEXT DEFAULT 'CUSTOMER', /* Roles: CUSTOMER, STAFF */
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ตารางคิว (Queues)
        db.run(`
            CREATE TABLE IF NOT EXISTS queues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                queue_number INTEGER NOT NULL,
                customer_id TEXT NOT NULL,
                status TEXT DEFAULT 'WAITING',
                booking_date TEXT NOT NULL,
                booking_time TEXT,
                symptoms TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES users (username)
            )
        `);

        // ตารางประวัติการแชท (Chat History)
        db.run(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                role TEXT NOT NULL, /* user, assistant */
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES users (username)
            )
        `);

        // ตารางหมวดหมู่บริการ (Service Categories)
        db.run(`
            CREATE TABLE IF NOT EXISTS service_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, () => {
            seedData();
        });

        console.log('Database schema initialized.');
    });
}

function seedData() {
    const users = [
        ['user1', '1234', 'สุกรี', 'CUSTOMER'],
        ['staff1', '1234', 'เจ้าหน้าที่นิด', 'STAFF']
    ];

    users.forEach(user => {
        db.run(`INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`, user);
    });

    const categories = ['ตรวจโรคทั่วไป', 'ทันตกรรม', 'ฝากครรภ์'];
    categories.forEach(name => {
        db.run(`INSERT OR IGNORE INTO service_categories (name) VALUES (?)`, [name]);
    });
    
    console.log('Seed data checked/inserted.');
}
