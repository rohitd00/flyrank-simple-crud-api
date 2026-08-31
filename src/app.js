import express from "express";

const app = express();
const PORT = 4000

const SEED_TASK = [
  { "id": 1, "title": "Buy groceries", "done": false },
  { "id": 2, "title": "Walk the dog", "done": true },
  { "id": 3, "title": "Read a book", "done": false }
]

let tasks = []


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
})


app.get('/', (req, res) => {
    return res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] })
})

app.get('/health', (req,res) => {
    return res.json({"status" : "ok"})
})

app.get('/tasks', (req, res) => {
    return res.send(tasks);
})

app.get('/tasks/:id', (req, res) => {
    let {id} = req.params;

    const task = tasks.find(item => item.id == id);
    if (!task) {
        return res.status(404).send("Task not found");
    }

    return res.status(200).json({ item: task });
})

app.post('/tasks', (req,res) => {
    let {id, title, done} = req.body;

    if(!title) {
        return res.status(404).json({ error: "Task name not found" });
    }

    if(done === '' || !done) {
        done = false;
    }

    id = tasks.length + 1

    tasks.push({"id" : id, "title": title, "done" : done});

    return res.status(500).send("task added success");

})



app.listen(PORT, () => {
    console.log(`listening at http://localhost:${PORT}`);
    tasks = SEED_TASK;
})