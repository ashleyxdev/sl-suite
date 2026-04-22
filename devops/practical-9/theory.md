# 📚 Part 1: What is Selenium?

Selenium is a **browser automation tool.** It lets you write code that controls a real browser — clicking buttons, filling forms, reading text — exactly like a human user would, but automatically.

```
Without Selenium (manual testing):
  Developer opens browser
  Types in the form
  Clicks submit
  Checks if success page shows
  Repeats this 50 times for every change 😫

With Selenium (automated testing):
  Script opens browser
  Types in the form
  Clicks submit
  Checks if success page shows
  Repeats this 50 times in 30 seconds ✅
```

---

## What Selenium is NOT

```
❌ Not a testing framework (like Jest or Mocha)
❌ Not a tool for unit testing functions
✅ It is a browser controller
✅ Used for end-to-end (E2E) testing
✅ Tests the app the way a real user uses it
```

---

## Types of Testing (context)

```
Unit Tests        →  test one function in isolation
Integration Tests →  test multiple modules together
E2E Tests         →  test the whole app through the browser  ← Selenium lives here
```

---

# 🏗️ Part 2: Selenium Architecture

```
Your Test Script (JS)
        │
        │  sends commands
        ▼
  Selenium WebDriver
        │
        │  talks via WebDriver Protocol (HTTP)
        ▼
  ChromeDriver / GeckoDriver
  (browser-specific driver)
        │
        │  controls
        ▼
  Real Browser (Chrome / Firefox)
        │
        │  loads
        ▼
  Your Web Application
```

| Component | Role |
|---|---|
| **Test Script** | Your code — what to click, what to type, what to check |
| **WebDriver** | The library (`selenium-webdriver` npm package) |
| **ChromeDriver** | Bridge between WebDriver and Chrome specifically |
| **Browser** | The actual Chrome window that opens and runs |

---

# 💻 Part 3: Project Structure

```
practical-9/
│
├── app.js              ← Express.js Content Manager app
├── Dockerfile          ← Docker recipe to containerize the app
├── views/
│   └── index.ejs       ← EJS template (the UI)
├── test.js             ← Selenium test script
├── package.json        ← Node.js dependencies
└── package-lock.json   ← Lockfile
```

This practical is different from Practical 8 — here the app is a **full Express.js server** running **inside a Docker container**, and you test it with Selenium from outside the container.

```
[ Your Machine ]
     │
     ├── Docker Container (port 5000)
     │       └── Express.js (Content Manager)
     │               └── reads/writes /data/posts.json
     │
     └── Selenium test.js
             └── opens headless Chrome → tests the app at localhost:5000
```

---

# 📝 Part 4: The Code

## `app.js`

A simple CRUD app — create posts, view posts, delete posts. Data is stored in a JSON file.

```javascript
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app       = express();
const DATA_DIR  = '/data';
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helpers
function readPosts() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writePosts(posts) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// Routes
app.get('/', (req, res) => {
    const posts = readPosts();
    res.render('index', { posts });
});

app.post('/add', (req, res) => {
    const { title, content } = req.body;
    if (title && content) {
        const posts = readPosts();
        posts.push({
            id: crypto.randomUUID().slice(0, 8),
            title,
            content,
            created_at: new Date().toLocaleString()
        });
        writePosts(posts);
    }
    res.redirect('/');
});

app.get('/delete/:id', (req, res) => {
    const posts = readPosts().filter(p => p.id !== req.params.id);
    writePosts(posts);
    res.redirect('/');
});

app.listen(5000, '0.0.0.0', () => {
    console.log('Content Manager running on http://0.0.0.0:5000');
});
```

> `0.0.0.0` lets Docker forward traffic into the container — same reason as Practical 1.

---

## `views/index.ejs`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Content Manager</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; background: #f5f5f5; }
        h1   { color: #333; }
        .form-box  { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .post-card { background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;
                     border-left: 4px solid #4CAF50; }
        input, textarea { width: 100%; padding: 8px; margin: 6px 0 12px; box-sizing: border-box; }
        textarea { height: 80px; }
        .btn-add { background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; }
        .btn-del { background: #e74c3c; color: white; padding: 6px 12px; border: none;
                   cursor: pointer; border-radius: 4px; float: right; text-decoration: none; }
        .meta    { color: #999; font-size: 0.85em; }
    </style>
</head>
<body>
    <h1>📝 Content Manager</h1>

    <div class="form-box">
        <h3>Add New Post</h3>
        <form action="/add" method="POST">
            <input   type="text" name="title"   placeholder="Post title"   required />
            <textarea            name="content" placeholder="Post content" required></textarea>
            <button class="btn-add" type="submit">➕ Add Post</button>
        </form>
    </div>

    <% if (posts.length > 0) { %>
        <% posts.forEach(post => { %>
        <div class="post-card">
            <a class="btn-del" href="/delete/<%= post.id %>">🗑 Delete</a>
            <h3><%= post.title %></h3>
            <p><%= post.content %></p>
            <p class="meta">🕐 <%= post.created_at %> &nbsp;|&nbsp; ID: <%= post.id %></p>
        </div>
        <% }) %>
    <% } else { %>
        <p>No posts yet. Add one above!</p>
    <% } %>
</body>
</html>
```

> `<%= post.title %>` is **EJS templating** — Express's way of injecting JavaScript variables into HTML. Like `{{ }}` in Flask/Jinja2.

---

## `Dockerfile`

```dockerfile
FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json .
RUN npm install

# Copy rest of the project
COPY . .

# Data directory for volume mount
RUN mkdir -p /data

EXPOSE 5000

CMD ["node", "app.js"]
```

> `RUN mkdir -p /data` creates the directory where posts.json will be stored inside the container.

---

## `test.js` — Selenium Test Script

**Test cases covered:**

| # | Test | What it checks |
|---|---|---|
| TC01 | App Reachable | Container is running, page title is "Content Manager" |
| TC02 | Page Heading | h1 says "Content Manager" |
| TC03 | Form Elements | Title input, content textarea, submit button exist |
| TC04 | Add Post | Creates a post, checks it appears on page |
| TC05 | Post Content | Content text is displayed correctly |
| TC06 | Post Metadata | Timestamp and ID are visible |
| TC07 | Delete Button | Delete button exists on post cards |
| TC08 | Multiple Posts | Adds 2 more posts, confirms all 3 appear |
| TC09 | Delete Post | Deletes a post, confirms count decreases |
| TC10 | Empty Validation | Empty title prevented by HTML required attribute |
| TC11 | Data Persistence | Posts survive a page refresh (volume test) |

> The full `test.js` is in the downloaded files. It follows the same pattern as Practical 8 — open browser → interact → assert results.

---

# ▶️ Part 5: Prerequisites

### 1. Docker

```bash
# Check if Docker is installed
docker --version
```

If not installed:

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker

# Windows / Mac
# Download Docker Desktop from https://www.docker.com/products/docker-desktop/
```

### 2. Google Chrome

```bash
# Check if Chrome is installed
google-chrome --version
```

If not installed:

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y google-chrome-stable

# Windows / Mac
# Download from https://www.google.com/chrome/
```

### 3. Node.js

Needed only for running `test.js` (the app itself runs inside Docker).

```bash
# Check if Node.js is installed
node --version
```

If not installed, download from [https://nodejs.org](https://nodejs.org) (LTS version recommended).

---

# 🚀 Part 6: Running the Practical

### Step 1: Build the Docker Image

```bash
cd practical-9

docker build -t content-manager .
```

---

### Step 2: Run the Container

```bash
docker run -p 5000:5000 content-manager
```

You should see:

```
Content Manager running on http://0.0.0.0:5000
```

Open **http://localhost:5000** in your browser to verify the app is working. Keep this terminal open.

---

### Step 3: Install Test Dependencies

Open a **second terminal**:

```bash
cd practical-9

npm install
```

---

### Step 4: Run the Selenium Tests

```bash
node test.js
```

---

### Expected Output

```
🧪 Running Content Manager Tests (Containerized App)...

TC01: Container is Running and App is Reachable
  ✅ PASS: Page title: "Content Manager"

TC02: Page Heading
  ✅ PASS: Heading: "📝 Content Manager"

TC03: Add Post Form Elements Exist
  ✅ PASS: Title input exists
  ✅ PASS: Content textarea exists
  ✅ PASS: Submit button exists

TC04: Add a New Post
  ✅ PASS: New post appears on page after submission

TC05: Post Content is Displayed Correctly
  ✅ PASS: Post content displayed on page

TC06: Post Has Metadata
  ✅ PASS: Post metadata (timestamp/ID) is visible

TC07: Delete Button Exists
  ✅ PASS: Delete button present on post card

TC08: Add Multiple Posts
  ✅ PASS: Multiple posts displayed (found 3)

TC09: Delete a Post
  ✅ PASS: Post deleted (3 → 2 posts)

TC10: Empty Form - Required Field Validation
  ✅ PASS: Empty title prevented form submission

TC11: Data Persists After Page Refresh
  ✅ PASS: Posts persist after refresh (2 posts)

─────────────────────────────
📊 Results: 13 passed, 0 failed
─────────────────────────────
```

---

### Common Issues & Fixes

| Problem | Fix |
|---|---|
| `docker: command not found` | Install Docker — see prerequisites above |
| `Cannot connect to Docker daemon` | Start Docker service: `sudo systemctl start docker` |
| `Connection refused localhost:5000` | Container isn't running — run `docker run -p 5000:5000 content-manager` |
| `ChromeDriver not found` | Run `npm install` to download chromedriver |
| `ChromeDriver version mismatch` | Run `npm update chromedriver` to match your Chrome version |
| `Chrome not found` | Install Google Chrome on your machine |
| Port 5000 already in use | Stop the old container: `docker ps` then `docker stop <container_id>` |

---

### Cleanup

After you're done:

```bash
# Stop the running container (Ctrl+C in the first terminal, or:)
docker ps                          # find the container ID
docker stop <container_id>         # stop it

# Optional: remove the image
docker rmi content-manager
```

---

# ✅ Summary

```
What you have:
  app.js         → Express.js Content Manager (CRUD)
  index.ejs      → EJS template for the UI
  Dockerfile     → Containerizes the app
  test.js        → 11 Selenium test cases

What you did:
  docker build   → Created a portable image of the app
  docker run     → Started the container, app running on port 5000
  node test.js   → Selenium tested the containerized app through Chrome

Key takeaway:
  The app runs inside Docker — Selenium tests it from outside.
  This is how real-world CI/CD pipelines work:
  build container → deploy → run automated tests → pass/fail.
```

---
