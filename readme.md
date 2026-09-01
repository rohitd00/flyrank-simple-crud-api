# Task API

A small CRUD API for managing to-do tasks, built with **Node.js + Express**.
It supports Create, Read, Update, and Delete operations and ships with
**Swagger UI** for interactive, visual testing.

Data is stored in **SQLite** by default, or **PostgreSQL** when `DATABASE_URL` is set.
Both survive server restarts.

## Run it

### Option A: Local (SQLite)

```bash
npm install
npm run dev
```

The server starts on `http://localhost:4000`.

### Option B: Docker (PostgreSQL)

```bash
cp .env.example .env
docker compose up
```

The whole stack (app + Postgres) starts with one command.

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
| GET    | `/tasks`      | `?done=true`        | 200     | Filter by done status  |
| GET    | `/tasks`      | `?search=milk`      | 200     | Search by title        |
| GET    | `/stats`      | —                   | 200     | Get task statistics    |
| POST   | `/reset`      | —                   | 201     | Reset to seed data     |

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

## Storage

This project has swapped storage three times:

| Assignment | Storage | How to run |
|------------|---------|------------|
| A1 | In-memory array | `node src/app.js` |
| A2 | SQLite file (`tasks.db`) | `npm run dev` |
| A3 (this) | PostgreSQL in Docker | `docker compose up` |

The routes and request/response shapes are identical across all three.
Only the storage layer changed — that's the point.

### Local (SQLite)

- **Database file:** `tasks.db` in the project root.
- **Library:** [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

### Docker (PostgreSQL)

- **Image:** `postgres:16-alpine`
- **Volume:** `taskdata` mounted at `/var/lib/postgresql/data`
- **Connection:** `postgres://postgres:dev@db:5432/tasks` (inside compose network)
- **Init script:** `init.sql` creates the `tasks` table and seeds 3 rows

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | _(none)_ | Postgres connection string. When set, the app uses Postgres; otherwise it falls back to SQLite. |
| `PORT` | `4000` | Server port |

A `.env` file is git-ignored. Copy `.env.example` to `.env` and fill in your values.

## Database viewer

Open `tasks.db` with [DB Browser for SQLite](https://sqlitebrowser.org/) (local),
or connect to `localhost:5432` with any Postgres client (Docker mode).

## Persistence proof

With Docker:

```bash
# Create a few tasks via curl or Swagger
curl http://localhost:4000/tasks

# Restart the whole stack
docker compose down
docker compose up

# Data is still there
curl http://localhost:4000/tasks
```

The `taskdata` volume keeps the Postgres rows across container restarts.

## What changed

The endpoints are identical to A1 and A2.
The storage layer is now swappable via `DATABASE_URL`:
- No env var → SQLite file on disk.
- Env var set → PostgreSQL in Docker.

Only `src/repo/` and the infrastructure files changed.
Your routes in `src/app.js` did not.
