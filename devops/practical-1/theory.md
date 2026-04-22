# 📚 Part 1: Concepts

## What is Flask?

Flask is a **micro web framework** written in Python. "Micro" means it gives you just the essentials — routing, request handling, templating — without forcing a project structure on you.

Think of it like **Express.js but for Python.**

```
Express.js (Node)          Flask (Python)
-----------                -----
app.get('/route', fn)  →   @app.route('/route')
req, res               →   request, return response
app.listen(3000)       →   app.run(port=5000)
```

---

## What is Docker?

Right now, if you run your Flask app on your machine, it works. But if your friend runs it on theirs — maybe they don't have Python, or they have a different version, or a missing library — **it breaks.**

Docker solves this with the concept of a **container.**

```
Without Docker:
  Your Machine          Friend's Machine
  [Python 3.11]         [Python 3.8]
  [Flask 3.x]           [Flask missing]
  App works ✅           App breaks ❌

With Docker:
  Your Machine          Friend's Machine
  [Docker]              [Docker]
    └── Container          └── Container
         [Python 3.11]          [Python 3.11]
         [Flask 3.x]            [Flask 3.x]
         [Your App]             [Your App]
  App works ✅           App works ✅
```

A container is like a **lightweight, portable box** that contains your app + everything it needs to run.

---

## Key Docker Terms (just 4 for now)

| Term | Simple Meaning |
|---|---|
| **Dockerfile** | A recipe — instructions to build your container |
| **Image** | The built result of that recipe (like a snapshot) |
| **Container** | A running instance of that image |
| **Port Mapping** | Connecting container's port to your machine's port |

```
Dockerfile  →  (docker build)  →  Image  →  (docker run)  →  Container
 (recipe)                        (snapshot)                   (running app)
```

---

# 🏗️ Part 2: Architecture

Here's what we're building:

```
[ Browser ]
    |
    |  http://localhost:5000
    |
[ Docker Container ]
    |
    ├── Flask App (Python)
    |       ├── GET  /        → Show registration form
    |       └── POST /submit  → Handle form submission
    |
    └── Templates folder
            └── form.html
```

---

# 💻 Part 3: Project Structure

```
event-registration/
│
├── app.py                  ← Flask application
├── requirements.txt        ← Python dependencies
├── Dockerfile              ← Docker recipe
└── templates/
    ├── form.html           ← Registration form
    └── success.html        ← Success page
```

---

# 🐍 Part 4: The Code

## `requirements.txt`
```
flask
```
This tells pip (Python's npm) what to install.

---

## `app.py`
```python
from flask import Flask, render_template, request

app = Flask(__name__)

# Route 1: Show the form
@app.route('/')
def index():
    return render_template('form.html')

# Route 2: Handle form submission
@app.route('/submit', methods=['POST'])
def submit():
    name  = request.form.get('name')
    email = request.form.get('email')
    event = request.form.get('event')

    return render_template('success.html', name=name, email=email, event=event)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

> ⚠️ Note `host='0.0.0.0'` — this is important for Docker. We'll explain why after.

---

## `templates/form.html`
```html
<!DOCTYPE html>
<html>
<head>
    <title>Event Registration</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 60px auto; }
        input, select { width: 100%; padding: 8px; margin: 8px 0 16px; box-sizing: border-box; }
        button { background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h2>🎟️ Event Registration</h2>
    <form action="/submit" method="POST">

        <label>Full Name</label>
        <input type="text" name="name" placeholder="John Doe" required />

        <label>Email</label>
        <input type="email" name="email" placeholder="john@example.com" required />

        <label>Select Event</label>
        <select name="event">
            <option value="DevOps Workshop">DevOps Workshop</option>
            <option value="AI Summit">AI Summit</option>
            <option value="Hackathon">Hackathon</option>
        </select>

        <button type="submit">Register</button>
    </form>
</body>
</html>
```

---

## `templates/success.html`
```html
<!DOCTYPE html>
<html>
<head>
    <title>Registration Successful</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 60px auto; }
        .card { background: #f0f8f0; border-left: 4px solid #4CAF50; padding: 20px; }
    </style>
</head>
<body>
    <h2>✅ Registration Successful!</h2>
    <div class="card">
        <p><strong>Name:</strong>  {{ name }}</p>
        <p><strong>Email:</strong> {{ email }}</p>
        <p><strong>Event:</strong> {{ event }}</p>
    </div>
    <br>
    <a href="/">← Register another</a>
</body>
</html>
```

> `{{ name }}` is **Jinja2 templating** — Flask's way of injecting Python variables into HTML. Like template literals in JS.

---

# 🐳 Part 5: The Dockerfile

```dockerfile
# Step 1: Start from an official Python base image
FROM python:3.11-slim

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Step 4: Copy rest of the project into the container
COPY . .

# Step 5: Tell Docker which port the app will use
EXPOSE 5000

# Step 6: Command to run when container starts
CMD ["python", "app.py"]
```

Think of each `FROM / RUN / COPY` as a layer being added on top:

```
Layer 5 → CMD (run the app)
Layer 4 → COPY . . (your code)
Layer 3 → pip install (dependencies)
Layer 2 → COPY requirements.txt
Layer 1 → python:3.11-slim (base OS + Python)
```

---

# ▶️ Part 6: Build & Run

Open terminal in your project folder and run:

```bash
# Build the image (execute this once, or when code changes)
docker build -t event-registration .

# Run a container from that image
docker run -p 5000:5000 event-registration
```

Then open your browser: **http://localhost:5000**

---

# 🔍 Part 7: Understanding — What Just Happened?

## The `host='0.0.0.0'` question

By default Flask listens on `127.0.0.1` (localhost) — which inside a container means *"only accept requests from inside the container itself."* 

Setting `0.0.0.0` means *"accept requests from anywhere"* — which allows Docker to forward your machine's traffic into it.

```
Your Browser → localhost:5000 (your machine)
                     ↓ port mapping -p 5000:5000
              Container port 5000
                     ↓ 0.0.0.0 allows this
              Flask App receives request ✅
```

## The `-p 5000:5000` flag

```
-p  HOST_PORT : CONTAINER_PORT
-p  5000      : 5000

"Map my machine's port 5000 to the container's port 5000"
```

## Why `WORKDIR /app`?

It sets the working directory inside the container. All subsequent `COPY` and `RUN` commands happen relative to this path. Clean organization.

## The Jinja2 `{{ }}` syntax

When Flask calls `render_template('success.html', name=name)`, it processes the HTML and replaces `{{ name }}` with the actual value before sending it to the browser.

---

# ✅ Summary

```
You wrote:
  app.py          → Flask handles routing & form data
  form.html       → User fills out the form
  success.html    → Confirmation page with Jinja2 variables
  Dockerfile      → Recipe to containerize everything

You ran:
  docker build    → Creates a portable image
  docker run -p   → Starts the container, maps port to your machine
```

The big DevOps takeaway: **your app now runs identically on any machine that has Docker — no "it works on my machine" problem.** 🎯

---

Ready for **Practical 2** whenever you are!