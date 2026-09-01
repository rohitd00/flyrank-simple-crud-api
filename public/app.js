const API_BASE = window.location.origin;

const state = {
  token: localStorage.getItem('taskflow_token') || null,
  tasks: [],
  stats: null
};

const views = {
  landing: document.getElementById('landing'),
  signup: document.getElementById('signup'),
  login: document.getElementById('login'),
  dashboard: document.getElementById('dashboard'),
  stats: document.getElementById('stats')
};

const navbar = document.getElementById('navbar');

function showView(name) {
  Object.values(views).forEach(el => el.classList.add('hidden'));
  views[name].classList.remove('hidden');

  if (name === 'dashboard' || name === 'stats') {
    navbar.classList.remove('hidden');
  } else {
    navbar.classList.add('hidden');
  }

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  if (name === 'dashboard') document.getElementById('nav-dashboard').classList.add('active');
  if (name === 'stats') document.getElementById('nav-stats').classList.add('active');
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
  setTimeout(() => el.classList.remove('hidden'), 3000);
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  return headers;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ---- Auth ----

document.getElementById('btn-go-signup').addEventListener('click', () => showView('signup'));
document.getElementById('btn-go-login').addEventListener('click', () => showView('login'));
document.getElementById('btn-to-login').addEventListener('click', () => showView('login'));
document.getElementById('btn-to-signup').addEventListener('click', () => showView('signup'));

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errorEl = document.getElementById('signup-error');

  try {
    await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    errorEl.classList.add('hidden');
    toast('Account created! Please log in.');
    showView('login');
  } catch (err) {
    errorEl.textContent = err.error || 'Signup failed';
    errorEl.classList.remove('hidden');
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    state.token = data.access_token;
    localStorage.setItem('taskflow_token', state.token);
    errorEl.classList.add('hidden');
    toast('Welcome back!');
    loadTasks();
    showView('dashboard');
  } catch (err) {
    errorEl.textContent = err.error || 'Login failed';
    errorEl.classList.remove('hidden');
  }
});

document.getElementById('nav-logout').addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  state.token = null;
  localStorage.removeItem('taskflow_token');
  toast('Logged out');
  showView('landing');
});

// ---- Tasks ----

async function loadTasks() {
  try {
    state.tasks = await api('/tasks');
    renderTasks();
  } catch (err) {
    if (err.status === 401) {
      state.token = null;
      localStorage.removeItem('taskflow_token');
      showView('landing');
    }
  }
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  if (state.tasks.length === 0) {
    list.innerHTML = '<div class="task-empty">No tasks yet. Add one above.</div>';
    return;
  }

  list.innerHTML = state.tasks.map(task => `
    <div class="task-item" data-id="${task.id}">
      <button class="task-checkbox ${task.done ? 'checked' : ''}" data-id="${task.id}">
        ${task.done ? '✓' : ''}
      </button>
      <span class="task-text ${task.done ? 'done' : ''}">${escapeHtml(task.title)}</span>
      <button class="task-delete" data-id="${task.id}">×</button>
    </div>
  `).join('');

  list.querySelectorAll('.task-checkbox').forEach(btn => {
    btn.addEventListener('click', () => toggleTask(Number(btn.dataset.id)));
  });

  list.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(Number(btn.dataset.id)));
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('btn-add-task').addEventListener('click', async () => {
  const input = document.getElementById('task-title');
  const title = input.value.trim();
  if (!title) return;

  try {
    const task = await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    state.tasks.push(task);
    input.value = '';
    renderTasks();
    toast('Task added');
  } catch (err) {
    toast(err.error || 'Failed to add task');
  }
});

async function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  try {
    const updated = await api(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ done: !task.done })
    });
    Object.assign(task, updated);
    renderTasks();
  } catch (err) {
    toast(err.error || 'Failed to update');
  }
}

async function deleteTask(id) {
  try {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTasks();
    toast('Task deleted');
  } catch (err) {
    toast(err.error || 'Failed to delete');
  }
}

// ---- Stats ----

async function loadStats() {
  try {
    state.stats = await api('/stats');
    document.getElementById('stat-total').textContent = state.stats.total;
    document.getElementById('stat-done').textContent = state.stats.done;
    document.getElementById('stat-open').textContent = state.stats.open;
  } catch {
    // ignore
  }
}

// ---- Navigation ----

document.getElementById('nav-dashboard').addEventListener('click', () => {
  loadTasks();
  showView('dashboard');
});

document.getElementById('nav-stats').addEventListener('click', () => {
  loadStats();
  showView('stats');
});

// ---- Init ----

if (state.token) {
  loadTasks();
  showView('dashboard');
} else {
  showView('landing');
}
