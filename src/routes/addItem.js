const db = require('../persistence');
const { v4: uuid } = require('uuid');

module.exports = async (req, res) => {
    const item = {
        id: uuid(),
        name: req.body.name,
        completed: false,
        priority: req.body.priority || 'medium',
        category: req.body.category || '',
        due_date: req.body.due_date || '',
        created_at: new Date().toISOString(),
        notes: req.body.notes || '',
        position: req.body.position || 0,
    };

    await db.storeItem(item);
    res.send(item);
};
