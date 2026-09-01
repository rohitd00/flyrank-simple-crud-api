CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO tasks (id, title, done)
VALUES (1, 'Buy groceries', false), (2, 'Walk the dog', true), (3, 'Read a book', false)
ON CONFLICT (id) DO NOTHING;
