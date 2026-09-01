import Database from "better-sqlite3";

const db = new Database("tasks.db");
db.pragma("journal_mode = WAL");

db.exec(
  "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)"
);

const row = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
if (row === 0) {
  const insert = db.prepare("INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)");
  insert.run(1, "Buy groceries", 0);
  insert.run(2, "Walk the dog", 1);
  insert.run(3, "Read a book", 0);
}

export const findAll = (query = {}) => {
  let sql = "SELECT id, title, done FROM tasks";
  const params = [];

  if (query.done !== undefined) {
    sql += " WHERE done = ?";
    params.push(query.done === "true" ? 1 : 0);
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`;
    if (params.length > 0) {
      sql += " AND title LIKE ?";
    } else {
      sql += " WHERE title LIKE ?";
    }
    params.push(searchTerm);
  }

  return db.prepare(sql).all(...params);
};

export const findById = (id) => {
  return db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(id) || null;
};

export const create = (title) => {
  const maxRow = db.prepare("SELECT MAX(id) as maxId FROM tasks").get();
  const id = maxRow.maxId ? maxRow.maxId + 1 : 1;
  db.prepare("INSERT INTO tasks (id, title, done) VALUES (?, ?, 0)").run(id, title);
  return { id, title, done: false };
};

export const update = (id, updates) => {
  const task = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(id);
  if (!task) return null;

  const { title, done } = updates;
  if (title !== undefined) {
    db.prepare("UPDATE tasks SET title = ? WHERE id = ?").run(title, id);
    task.title = title;
  }
  if (done !== undefined) {
    db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(done ? 1 : 0, id);
    task.done = done;
  }
  return task;
};

export const deleteTask = (id) => {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0 ? { id } : null;
};

export const getStats = () => {
  const total = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE done = 1").get().count;
  return { total, done, open: total - done };
};

export const reset = () => {
  db.exec("DELETE FROM tasks");
  const insert = db.prepare("INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)");
  insert.run(1, "Buy groceries", 0);
  insert.run(2, "Walk the dog", 1);
  insert.run(3, "Read a book", 0);
};

export const ping = () => {
  db.prepare("SELECT 1").get();
};
