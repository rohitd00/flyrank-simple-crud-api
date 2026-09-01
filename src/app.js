import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import repo from "./repo/index.js";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "./middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.static(join(__dirname, "..", "public"), { index: false }));

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
}

// ---- Stage 1: front door ----

app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.sendFile(join(__dirname, "..", "public", "index.html"));
  }
  res.json({ name: "TaskFlow", version: "1.0.0", endpoints: ["/tasks", "/auth"] });
});

app.get("/health", async (req, res) => {
  try {
    await repo.ping();
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

// ---- Auth routes ----

app.post("/auth/signup", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY in .env" });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ user: data.user });
});

app.post("/auth/login", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY in .env" });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: "Invalid login credentials" });
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});

app.post("/auth/logout", requireAuth, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }
  await supabase.auth.signOut();
  res.status(204).send();
});

// ---- Public route ----

app.get("/public/info", (req, res) => {
  res.json({
    appName: "TaskFlow",
    version: "1.0.0",
    message: "Welcome to TaskFlow! Sign up to organize your daily tasks.",
    totalUsers: 1250
  });
});

// ---- Protected routes ----

app.get("/protected/profile", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at,
    profile: {
      theme: "dark",
      pendingTasks: 4
    }
  });
});

app.get("/protected/dashboard", requireAuth, (req, res) => {
  res.json({
    userId: req.user.id,
    message: "This is your private dashboard",
    stats: {
      tasksCompleted: 12,
      currentStreak: 3
    }
  });
});

// ---- Task CRUD routes ----

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
