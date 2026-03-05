const waitPort = require('wait-port');
const fs = require('fs');
const mysql = require('mysql2');

const {
    MYSQL_HOST: HOST,
    MYSQL_HOST_FILE: HOST_FILE,
    MYSQL_USER: USER,
    MYSQL_USER_FILE: USER_FILE,
    MYSQL_PASSWORD: PASSWORD,
    MYSQL_PASSWORD_FILE: PASSWORD_FILE,
    MYSQL_DB: DB,
    MYSQL_DB_FILE: DB_FILE,
} = process.env;

let pool;

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE) : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE) : USER;
    const password = PASSWORD_FILE
        ? fs.readFileSync(PASSWORD_FILE)
        : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE) : DB;

    await waitPort({
        host,
        port: 3306,
        timeout: 10000,
        waitForDns: true,
    });

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    return new Promise((acc, rej) => {
        pool.query(
            'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean) DEFAULT CHARSET utf8mb4',
            (err) => {
                if (err) return rej(err);

                console.log(`Connected to mysql db at host ${HOST}`);

                // Migrate: add new columns if they don't exist
                const migrations = [
                    "ALTER TABLE todo_items ADD COLUMN priority varchar(10) DEFAULT 'medium'",
                    "ALTER TABLE todo_items ADD COLUMN category varchar(50) DEFAULT ''",
                    "ALTER TABLE todo_items ADD COLUMN due_date varchar(30) DEFAULT ''",
                    "ALTER TABLE todo_items ADD COLUMN created_at varchar(30) DEFAULT ''",
                    "ALTER TABLE todo_items ADD COLUMN notes text",
                    "ALTER TABLE todo_items ADD COLUMN position integer DEFAULT 0",
                ];
                let completed = 0;
                migrations.forEach((sql) => {
                    pool.query(sql, () => {
                        completed++;
                        if (completed === migrations.length) acc();
                    });
                });
            },
        );
    });
}

async function teardown() {
    return new Promise((acc, rej) => {
        pool.end((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise((acc, rej) => {
        pool.query(
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
        pool.query(
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
        pool.query(
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
        pool.query(
            'UPDATE todo_items SET name=?, completed=?, priority=?, category=?, due_date=?, notes=?, position=? WHERE id=?',
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
        pool.query(
            'DELETE FROM todo_items WHERE id = ?',
            [id],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeCompletedItems() {
    return new Promise((acc, rej) => {
        pool.query(
            'DELETE FROM todo_items WHERE completed = 1',
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updatePositions(items) {
    return new Promise((acc, rej) => {
        let completed = 0;
        if (items.length === 0) return acc();
        items.forEach((item) => {
            pool.query(
                'UPDATE todo_items SET position = ? WHERE id = ?',
                [item.position, item.id],
                (err) => {
                    if (err) return rej(err);
                    completed++;
                    if (completed === items.length) acc();
                },
            );
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
