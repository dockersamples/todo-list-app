const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const location = process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';

let db, dbAll, dbRun;

function init() {
    const dirName = require('path').dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    return new Promise((acc, rej) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) return rej(err);

            if (process.env.NODE_ENV !== 'test')
                console.log(`Using sqlite database at ${location}`);

            db.run(
                'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)',
                (err) => {
                    if (err) return rej(err);
                    // Migrate: add new columns if they don't exist
                    const migrations = [
                        "ALTER TABLE todo_items ADD COLUMN priority varchar(10) DEFAULT 'medium'",
                        "ALTER TABLE todo_items ADD COLUMN category varchar(50) DEFAULT ''",
                        "ALTER TABLE todo_items ADD COLUMN due_date varchar(30) DEFAULT ''",
                        "ALTER TABLE todo_items ADD COLUMN created_at varchar(30) DEFAULT ''",
                        "ALTER TABLE todo_items ADD COLUMN notes text DEFAULT ''",
                        "ALTER TABLE todo_items ADD COLUMN position integer DEFAULT 0",
                    ];
                    let completed = 0;
                    migrations.forEach((sql) => {
                        db.run(sql, () => {
                            completed++;
                            if (completed === migrations.length) acc();
                        });
                    });
                },
            );
        });
    });
}

async function teardown() {
    return new Promise((acc, rej) => {
        db.close((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise((acc, rej) => {
        db.all(
            'SELECT * FROM todo_items ORDER BY position ASC, created_at DESC',
            (err, rows) => {
                if (err) return rej(err);
                acc(
                    rows.map((item) =>
                        Object.assign({}, item, {
                            completed: item.completed === 1,
                        }),
                    ),
                );
            },
        );
    });
}

async function getItem(id) {
    return new Promise((acc, rej) => {
        db.all(
            'SELECT * FROM todo_items WHERE id=?',
            [id],
            (err, rows) => {
                if (err) return rej(err);
                acc(
                    rows.map((item) =>
                        Object.assign({}, item, {
                            completed: item.completed === 1,
                        }),
                    )[0],
                );
            },
        );
    });
}

async function storeItem(item) {
    return new Promise((acc, rej) => {
        db.run(
            'INSERT INTO todo_items (id, name, completed, priority, category, due_date, created_at, notes, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                item.id,
                item.name,
                item.completed ? 1 : 0,
                item.priority || 'medium',
                item.category || '',
                item.due_date || '',
                item.created_at || new Date().toISOString(),
                item.notes || '',
                item.position || 0,
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(id, item) {
    return new Promise((acc, rej) => {
        db.run(
            'UPDATE todo_items SET name=?, completed=?, priority=?, category=?, due_date=?, notes=?, position=? WHERE id = ?',
            [
                item.name,
                item.completed ? 1 : 0,
                item.priority || 'medium',
                item.category || '',
                item.due_date || '',
                item.notes || '',
                item.position != null ? item.position : 0,
                id,
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id) {
    return new Promise((acc, rej) => {
        db.run('DELETE FROM todo_items WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

async function removeCompletedItems() {
    return new Promise((acc, rej) => {
        db.run('DELETE FROM todo_items WHERE completed = 1', (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

async function updatePositions(items) {
    return new Promise((acc, rej) => {
        const stmt = db.prepare(
            'UPDATE todo_items SET position = ? WHERE id = ?',
        );
        items.forEach((item) => {
            stmt.run([item.position, item.id]);
        });
        stmt.finalize((err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
    removeCompletedItems,
    updatePositions,
};
