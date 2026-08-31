import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";

const app = express();
const PORT = 4000;

const SEED_TASKS = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Walk the dog", done: true },
  { id: 3, title: "Read a book", done: false }
];

let tasks = [];

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

// ---- Stage 2: Read ----

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.json(task);
});

// ---- Stage 3: Create ----

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const id = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  const task = { id, title: title.trim(), done: false };
  tasks.push(task);

  res.status(201).json(task);
});

// ---- Stage 4: Update & Delete ----

app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
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
    task.title = title.trim();
  }
  if (done !== undefined) task.done = Boolean(done);

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

// ---- Stage 5: Swagger UI ----

const swaggerDocument = JSON.parse(
  readFileSync(new URL("./openapi.json", import.meta.url))
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  tasks = SEED_TASKS;
  console.log(`listening at http://localhost:${PORT}`);
  console.log(`swagger at http://localhost:${PORT}/docs`);
});
