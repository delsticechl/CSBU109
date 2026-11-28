// server.js - Task Manager REST API (in-memory storage)
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

// FIX #1 + #2: allow the real origin of the Web UI 
// and every method the UI uses (PUT, DELETE and the OPTIONS preflight were missing).
app.use(cors({
  origin: '*', // in production, list exact origins, e.g. 'http://127.0.0.1:5500'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// FIX #3: parse JSON request bodies 
app.use(express.json());

// ---------- In-memory "database" ----------
let tasks = [
  { id: 1, title: 'Read the Express routing docs', done: true, createdAt: '2026-09-20T08:00:00.000Z' },
  { id: 2, title: 'Install Postman', done: false, createdAt: '2026-09-21T09:30:00.000Z' },
  { id: 3, title: 'Finish Lab 4 exercise 3', done: false, createdAt: '2026-09-22T14:15:00.000Z' },
  { id: 4, title: 'Review HTTP status codes', done: false, createdAt: '2026-09-23T10:45:00.000Z' }
];
let nextId = 5;

// Shape a task for the API response
const toDto = (task) => ({
  id: task.id,
  title: task.title, // FIX #4: the contract (and the UI) use "title", not "name"
  done: task.done,
  createdAt: task.createdAt
});

// ---------- Routes ----------

// GET /api/tasks?status=all|active|done
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;

  if (status === 'active') {
    return res.json({ success: true, data: tasks.filter((t) => !t.done).map(toDto) });
  }

  // FIX #5: this branch only logged and never sent a response, so the request hung (pending)
  if (status === 'done') {
    const doneTasks = tasks.filter((t) => t.done);
    console.log(`Found ${doneTasks.length} completed task(s)`);
    return res.json({ success: true, data: doneTasks.map(toDto) });
  }

  if (!status || status === 'all') {
    return res.json({ success: true, data: tasks.map(toDto) });
  }

  // Unknown status values used to fall through with no response at all
  res.status(400).json({ success: false, message: 'Invalid status. Use all, active or done' });
});

// GET /api/tasks/stats
app.get('/api/tasks/stats', (req, res) => {
  const total = tasks.length;
  // FIX #6: the two filters were swapped
  const done = tasks.filter((t) => t.done).length;
  const active = tasks.filter((t) => !t.done).length;
  res.json({ success: true, data: { total, active, done } });
});

// POST /api/tasks  body: { title }
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;

  if (typeof title !== 'string' || !title.trim()) {
    // FIX #7: "return" was missing, so the code kept running after sending the 400
    // (it tried to create the task and sent a second response)
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const task = {
    id: nextId++,
    title: title.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.status(201).json({ success: true, data: toDto(task) });
});

// PUT /api/tasks/:id  body: { title?, done? }
app.put('/api/tasks/:id', (req, res) => {
  // FIX #8: req.params.id is a string, task ids are numbers, so === never matched (always 404)
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const { title, done } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title cannot be blank' });
    }
    task.title = title.trim();
  }

  // FIX #9: "done || task.done" could never set done back to false (un-ticking did nothing)
  if (done !== undefined) {
    task.done = Boolean(done);
  }

  res.json({ success: true, data: toDto(task) });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  // FIX #10: splice(id, 1) used the task id as an array index and removed the wrong task
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks.splice(index, 1);
  res.json({ success: true, message: 'Task deleted' });
});

app.listen(PORT, () => {
  console.log(`Task API running at http://localhost:${PORT}`);
});
