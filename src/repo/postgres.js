import pkg from "pg";
import { readFileSync } from "fs";

const { Client } = pkg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const initSql = readFileSync(new URL("../../init.sql", import.meta.url), "utf-8");
await client.query(initSql);

export const findAll = async (query = {}) => {
  let sql = "SELECT id, title, done FROM tasks";
  const params = [];

  if (query.done !== undefined) {
    sql += " WHERE done = $1";
    params.push(query.done === "true");
  }

  if (query.search) {
    const searchTerm = `%${query.search}%`;
    const idx = params.length + 1;
    if (params.length > 0) {
      sql += ` AND title ILIKE $${idx}`;
    } else {
      sql += ` WHERE title ILIKE $${idx}`;
    }
    params.push(searchTerm);
  }

  const res = await client.query(sql, params);
  return res.rows;
};

export const findById = async (id) => {
  const res = await client.query("SELECT id, title, done FROM tasks WHERE id = $1", [id]);
  return res.rows[0] || null;
};

export const create = async (title) => {
  const res = await client.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING id, title, done",
    [title, false]
  );
  return res.rows[0];
};

export const update = async (id, updates) => {
  const { title, done } = updates;
  if (title !== undefined && done !== undefined) {
    const res = await client.query(
      "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING id, title, done",
      [title, done, id]
    );
    return res.rows[0] || null;
  } else if (title !== undefined) {
    const res = await client.query(
      "UPDATE tasks SET title = $1 WHERE id = $2 RETURNING id, title, done",
      [title, id]
    );
    return res.rows[0] || null;
  } else if (done !== undefined) {
    const res = await client.query(
      "UPDATE tasks SET done = $1 WHERE id = $2 RETURNING id, title, done",
      [done, id]
    );
    return res.rows[0] || null;
  }
  return null;
};

export const deleteTask = async (id) => {
  const res = await client.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
  return res.rows[0] || null;
};

export const getStats = async () => {
  const totalRes = await client.query("SELECT COUNT(*) as count FROM tasks");
  const doneRes = await client.query("SELECT COUNT(*) as count FROM tasks WHERE done = $1", [true]);
  const total = parseInt(totalRes.rows[0].count);
  const done = parseInt(doneRes.rows[0].count);
  return { total, done, open: total - done };
};

export const reset = async () => {
  await client.query("TRUNCATE TABLE tasks RESTART IDENTITY");
  await client.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2), ($3, $4), ($5, $6)",
    ["Buy groceries", false, "Walk the dog", true, "Read a book", false]
  );
};

export const ping = async () => {
  await client.query("SELECT 1");
};
