# Task API

A small in-memory CRUD API for managing to-do tasks, built with **Node.js + Express**.
It supports the four CRUD operations (Create, Read, Update, Delete) and ships with
**Swagger UI** for interactive, visual testing.

> Data lives only in memory. Restarting the server resets the list back to the 3
> seed tasks — that is expected (no database yet).

## Run it

```bash
npm install
npm run dev
```

The server starts on `http://localhost:4000`.

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
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 41
Date: Mon, 31 Aug 2026 12:00:00 GMT
Connection: keep-alive

{"id":4,"title":"Buy milk","done":false}
```

> Tip: if you are on Windows PowerShell, the single quotes around the JSON body
> can get mangled. Use Git Bash, WSL, or the **Swagger UI** below instead.

## Swagger UI

Open **`http://localhost:4000/docs`** in your browser.

Every endpoint is listed with a **Try it out** button that sends real requests.
You can create, list, update, and delete tasks without writing any curl.

![Swagger UI](docs/swagger.png)

> Add your own screenshot at `docs/swagger.png` (open `/docs`, run the full
> CRUD cycle, and paste the capture here).
