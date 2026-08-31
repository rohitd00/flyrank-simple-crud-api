# Task API

A small CRUD API for managing to-do tasks, built with **Node.js + Express**.
It supports Create, Read, Update, and Delete operations and ships with
**Swagger UI** for interactive, visual testing.

Data is stored in **SQLite** (`tasks.db`), so it survives server restarts.

## Run it

```bash
npm install
npm run dev
```

The server starts on `http://localhost:4000`.

The first time you run it, a file called `tasks.db` is created automatically
in the project root, and 3 example tasks are inserted.

## Endpoints

| Method | Path          | Body                | Success | Meaning                |
|--------|---------------|---------------------|---------|------------------------|
| GET    | `/`           | —                   | 200     | API info               |
| GET    | `/health`     | —                   | 200     | Health check           |
| GET    | `/tasks`      | —                   | 200     | List all tasks         |
| GET    | `/tasks/:id`  | —                   | 200/404 | Get one task           |
| POST   | `/tasks`      | `{ "title": "..." }`| 201/400 | Create a task          |
| PUT    | `/tasks/:id`  | `{ "title?", "done?" }` | 200/400/404 | Update a task  |
| DELETE | `/tasks/:id`  | —                   | 204/404 | Delete a task          |

## Example request & response

```bash
curl -i -X POST http://localhost:4000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Content-Length: 41

{"id":4,"title":"Buy milk","done":false}
```

> Tip: if you are on Windows PowerShell, the single quotes around the JSON body
> can get mangled. Use Git Bash, WSL, or the **Swagger UI** below instead.

## Swagger UI

Open **`http://localhost:4000/docs`** in your browser.

Every endpoint is listed with a **Try it out** button that sends real requests.
You can create, list, update, and delete tasks without writing any curl.

![Swagger UI](docs/swagger.png)

## Database

- **Database file:** `tasks.db` in the project root.
- **Library:** [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — a simple, fast SQLite wrapper for Node.js.
- **Why SQLite:** no server to install, no credentials, just a single file.
- **Table:** `tasks(id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)`

### Example SQL query

List every task directly in SQLite:

```sql
SELECT id, title, done FROM tasks;
```

Or show only completed tasks:

```sql
SELECT id, title, done FROM tasks WHERE done = 1;
```

You can open `tasks.db` with any SQLite viewer (e.g. [DB Browser for SQLite](https://sqlitebrowser.org/)) and run these queries manually — the API will immediately reflect your changes.

## What changed

The endpoints are identical to the previous in-memory version.
Only the storage layer changed: the API now reads from and writes to SQLite
instead of a JavaScript array. Restarting the server no longer deletes your data.
