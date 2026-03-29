import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { db } from './models/database.js';
import * as authController from './controllers/auth.controller.js';
import * as chatController from './controllers/chat.controller.js';
import * as categoryController from './controllers/category.controller.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', authController.healthCheck);
app.post('/api/login', authController.login);
app.post('/api/chat', chatController.handleChat);
app.get('/api/chat/history/:username', chatController.getHistory);
app.delete('/api/chat/history/:username', chatController.clearHistory);

// Category Management
app.get('/api/categories', categoryController.getCategories);
app.post('/api/categories', categoryController.addCategory);
app.put('/api/categories/:id', categoryController.toggleCategory);
app.delete('/api/categories/:id', categoryController.deleteCategory);

// Staff Dashboard Data - Now showing all active/future queues
app.get('/api/queues/active', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    db.all(`
        SELECT q.*, u.name as customer_name 
        FROM queues q 
        JOIN users u ON q.customer_id = u.username 
        WHERE q.status != 'CANCELLED' 
        AND q.booking_date >= ?
        ORDER BY q.booking_date ASC, q.queue_number ASC
    `, [today], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Keep legacy today endpoint for compatibility if needed, but pointing to the same logic
app.get('/api/queues/today', (req, res) => {
    res.redirect('/api/queues/active');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
