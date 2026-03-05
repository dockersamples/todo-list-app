const db = require('../persistence');

module.exports = async (req, res) => {
    await db.updateItem(req.params.id, {
        name: req.body.name,
        completed: req.body.completed,
        priority: req.body.priority || 'medium',
        category: req.body.category || '',
        due_date: req.body.due_date || '',
        notes: req.body.notes || '',
        position: req.body.position != null ? req.body.position : 0,
    });
    const item = await db.getItem(req.params.id);
    res.send(item);
};
