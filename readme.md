# TaskFlow API

A lightweight productivity web service with task management and **Supabase Auth**.
Guest users can explore public endpoints; registered users get a private space
to manage their daily tasks.

Built with **Node.js + Express**. Data is stored in **SQLite** by default, or
**PostgreSQL** when `DATABASE_URL` is set. Both survive server restarts.

## Run it

```bash
npm install
npm run dev
```

The server starts on `http://localhost:4000`.

## Supabase setup (required for auth)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, go to **Project Settings → API** and copy your **Project URL** and **anon key**.
3. Add them to your `.env`:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

4. In **Authentication → Sign In / Providers → Email**, turn **Confirm email** off
   (so signups work immediately in this practice project).

## Endpoints

### Public

| Method | Path          | Body                | Success | Meaning                |
|--------|---------------|---------------------|---------|------------------------|
| GET    | `/`           | —                   | 200     | API info               |
| GET    | `/health`     | —                   | 200     | Health check           |
| GET    | `/public/info`| —                   | 200     | Public app info        |

### Auth

| Method | Path          | Body                | Success | Meaning                |
|--------|---------------|---------------------|---------|------------------------|
| POST   | `/auth/signup`| `{ "email", "password" }` | 201/400 | Create account |
| POST   | `/auth/login` | `{ "email", "password" }` | 200/400/401 | Login, returns JWT |
| POST   | `/auth/logout`| —                   | 204/401 | End session            |

### Protected (requires `Authorization: Bearer <token>`)

| Method | Path               | Success | Meaning                |
|--------|--------------------|---------|------------------------|
| GET    | `/protected/profile` | 200/401 | Current user profile   |
| GET    | `/protected/dashboard`| 200/401 | User dashboard         |

### Tasks

| Method | Path          | Body                | Success | Meaning                |
|--------|---------------|---------------------|---------|------------------------|
| GET    | `/tasks`      | —                   | 200     | List all tasks         |
| GET    | `/tasks/:id`  | —                   | 200/404 | Get one task           |
| POST   | `/tasks`      | `{ "title": "..." }`| 201/400 | Create a task          |
| PUT    | `/tasks/:id`  | `{ "title?", "done?" }` | 200/400/404 | Update a task |
| DELETE | `/tasks/:id`  | —                   | 204/404 | Delete a task          |
| GET    | `/tasks`      | `?done=true`        | 200     | Filter by done status  |
| GET    | `/tasks`      | `?search=milk`      | 200     | Search by title        |
| GET    | `/stats`      | —                   | 200     | Get task statistics    |
| POST   | `/reset`      | —                   | 201     | Reset to seed data     |

## Example requests

### Sign up

```bash
curl -i -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Log in

```bash
curl -i -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Returns `access_token` and `refresh_token`.

### Call a protected route

```bash
curl -i http://localhost:4000/protected/profile \
  -H "Authorization: Bearer <PASTE_ACCESS_TOKEN>"
```

### Create a task

```bash
curl -i -X POST http://localhost:4000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
```

## Swagger UI

Open **`http://localhost:4000/docs`** in your browser.

- Public endpoints are open.
- Protected endpoints show a **lock icon**.
- Click **Authorize**, paste your JWT access token, then use **Try it out**.

![Swagger UI](docs/swagger.png)

## Authentication flow

1. **Sign up** — client sends email + password to Supabase.
2. **Log in** — Supabase returns a short-lived JWT (`access_token`) and a longer-lived `refresh_token`.
3. **Protected requests** — client sends `Authorization: Bearer <access_token>`.
4. **Verification** — the middleware calls `supabase.auth.getUser(token)` to verify the token is real.
5. **Log out** — calls `supabase.auth.signOut()` and returns 204.

### Status codes

| Code | Meaning |
|------|---------|
| 201 | Account created |
| 200 | Login successful / protected data returned |
| 204 | Logged out / deleted |
| 400 | Missing or invalid input |
| 401 | Missing, malformed, or invalid/expired token |
| 404 | Task not found |

### 401 vs 403

- **401 Unauthorized** = "I don't know who you are" (no token or bad token).
- **403 Forbidden** = "I know who you are, but you may not" (authenticated but not allowed).

## Storage

| Assignment | Storage | How to run |
|------------|---------|------------|
| A1 | In-memory array | `node src/app.js` |
| A2 | SQLite file (`tasks.db`) | `npm run dev` |
| A3 | PostgreSQL in Docker | `docker compose up` |
| A4 (this) | Same as above + Supabase Auth | `npm run dev` |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | _(none)_ | Your Supabase project URL |
| `SUPABASE_KEY` | _(none)_ | Your Supabase anon key (public, safe for the app) |
| `DATABASE_URL` | _(none)_ | Postgres connection string. When set, the app uses Postgres; otherwise SQLite. |
| `PORT` | `4000` | Server port |

`.env` is git-ignored. Copy `.env.example` to `.env` and fill in your values.

## What changed

The task CRUD endpoints are identical to A1/A2/A3.
The auth layer is new:
- `src/middleware/auth.js` — reusable auth guard
- `src/app.js` — auth routes and protected task routes
- `src/openapi.json` — bearer security scheme for Swagger

Your storage layer did not change. This is the same repo growing.
