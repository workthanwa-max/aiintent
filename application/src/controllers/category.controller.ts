import { db } from '../models/database.js';

export const getCategories = (req: any, res: any) => {
  db.all('SELECT * FROM service_categories ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

export const addCategory = (req: any, res: any) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'ชื่อหมวดหมู่ห้ามว่าง' });
  
  db.run('INSERT INTO service_categories (name) VALUES (?)', [name.trim()], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'หมวดหมู่นี้มีอยู่แล้ว' });
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name: name.trim(), is_active: 1 });
  });
};

export const toggleCategory = (req: any, res: any) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  db.run('UPDATE service_categories SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
};

export const deleteCategory = (req: any, res: any) => {
  const { id } = req.params;
  db.run('DELETE FROM service_categories WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
};
