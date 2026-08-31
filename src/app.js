import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import Database from "better-sqlite3";

const app = express();
const PORT = 4000;

const db = new Database("tasks.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const row = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
if (row === 0) {
  const insert = db.prepare("INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)");
  insert.run(1, "Buy groceries", 0);
  insert.run(2, "Walk the dog", 1);
  insert.run(3, "Read a book", 0);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ---- Stage 1: front door ----

app.get("/", (req, res) => {
  res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---- Stage 1: Read ----

// ---- Extras: query params, stats, reset ----

app.get("/tasks", (req, res) => {
  const { done, search } = req.query;
  let sql = "SELECT id, title, done FROM tasks";
  const params = [];

  if (done !== undefined) {
    sql += " WHERE done = ?";
    params.push(done === "true" ? 1 : 0);
  }

  if (search !== undefined) {
    const searchTerm = `%${String(search)}%`;
    if (params.length > 0) {
      sql += " AND title LIKE ?";
    } else {
      sql += " WHERE title LIKE ?";
    }
    params.push(searchTerm);
  }

  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

app.get("/stats", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
  const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE done = 1").get().count;
  res.json({ total, done, open: total - done });
});

app.post("/reset", (req, res) => {
  db.exec("DELETE FROM tasks");
  const insert = db.prepare("INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)");
  insert.run(1, "Buy groceries", 0);
  insert.run(2, "Walk the dog", 1);
  insert.run(3, "Read a book", 0);
  res.status(201).json({ message: "Tasks reset to defaults" });
});

app.get("/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.json(task);
});

// ---- Stage 2: Create ----

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const maxRow = db.prepare("SELECT MAX(id) as maxId FROM tasks").get();
  const id = maxRow.maxId ? maxRow.maxId + 1 : 1;

  db.prepare("INSERT INTO tasks (id, title, done) VALUES (?, ?, 0)").run(id, title.trim());

  const task = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(id);
  res.status(201).json(task);
});

// ---- Stage 3: Update & Delete ----

app.put("/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT id, title, done FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const { title, done } = req.body || {};
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Provide title or done to update" });
  }

  if (title !== undefined) {
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }
    db.prepare("UPDATE tasks SET title = ? WHERE id = ?").run(title.trim(), task.id);
    task.title = title.trim();
  }
  if (done !== undefined) {
    db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(done ? 1 : 0, task.id);
    task.done = done;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.status(204).send();
});

// ---- Stage 5: Swagger UI ----

const swaggerDocument = JSON.parse(
  readFileSync(new URL("./openapi.json", import.meta.url))
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
  console.log(`swagger at http://localhost:${PORT}/docs`);
});
