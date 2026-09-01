import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import repo from "./repo/index.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", async (req, res) => {
  try {
    await repo.ping();
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

app.get("/tasks", async (req, res) => {
  res.json(await repo.findAll(req.query));
});

app.get("/tasks/:id", async (req, res) => {
  const task = await repo.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.json(task);
});

app.post("/tasks", async (req, res) => {
  const { title } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const task = await repo.create(title.trim());
  res.status(201).json(task);
});

app.put("/tasks/:id", async (req, res) => {
  const task = await repo.findById(req.params.id);
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
  }

  const updated = await repo.update(req.params.id, { title: title?.trim(), done });
  if (!updated) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  res.json(updated);
});

app.delete("/tasks/:id", async (req, res) => {
  const result = await repo.deleteTask(req.params.id);
  if (!result) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.status(204).send();
});

app.get("/stats", async (req, res) => {
  res.json(await repo.getStats());
});

app.post("/reset", async (req, res) => {
  await repo.reset();
  res.status(201).json({ message: "Tasks reset to defaults" });
});

const swaggerDocument = JSON.parse(
  readFileSync(new URL("./openapi.json", import.meta.url))
);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
  console.log(`swagger at http://localhost:${PORT}/docs`);
});
