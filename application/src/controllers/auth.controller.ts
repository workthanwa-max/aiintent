import { db } from '../models/database.js';

export const login = (req: any, res: any) => {
    let { username, password } = req.body;
    console.log('[Login Attempt] Raw payload:', JSON.stringify(req.body));
    username = (username || '').trim();
    password = (password || '').trim();
    console.log(`[Login Attempt] Trimmed: "${username}" / "${password}"`);
    
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        
        res.json({
            success: true,
            user: {
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    });
};

export const healthCheck = (req: any, res: any) => {
    db.get('SELECT 1 as val', (err) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                backend: 'connected',
                database: 'disconnected',
                error: err.message
            });
        }
        res.status(200).json({
            status: 'ok',
            backend: 'connected',
            database: 'connected'
        });
    });
};
