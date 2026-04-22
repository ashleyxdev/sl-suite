# 🛠️ Part 4: Apply to Practical 1

Let's now manage the Flask + Docker project with Git. Follow these steps:

---

### Step 1 — Initialize Git in your project

```bash
cd event-registration
git init
```

You'll see:
```
Initialized empty Git repository in .../event-registration/.git/
```

The `.git` folder is now created. This is where Git stores all history. **Never delete it.**

---

### Step 2 — Create `.gitignore`

Create a file named `.gitignore` in the project root:

```
__pycache__/
*.pyc
.env
venv/
.DS_Store
```

This prevents Python cache files and secrets from being committed.

---

### Step 3 — Check the status

```bash
git status
```

Output:
```
Untracked files:
  .gitignore
  app.py
  Dockerfile
  requirements.txt
  templates/
```

All your files are in the **Working Directory** — not yet staged.

---

### Step 4 — Stage all files

```bash
git add .
git status
```

Output now shows:
```
Changes to be committed:
  new file: .gitignore
  new file: app.py
  new file: Dockerfile
  new file: requirements.txt
  new file: templates/form.html
  new file: templates/success.html
```

Files are now in the **Staging Area.**

---

### Step 5 — Make your first commit

```bash
git commit -m "Initial commit: Flask event registration with Docker"
```

Output:
```
[main (root-commit) a3f1c2d] Initial commit: Flask event registration with Docker
 6 files changed, 80 insertions(+)
```

You now have your first **snapshot** in the Local Repo.

---

### Step 6 — Create a GitHub Repository

1. Go to **github.com** → Click **New Repository**
2. Name it: `event-registration`
3. Keep it **Public**, don't initialize with README (we already have code)
4. Click **Create Repository**

GitHub will show you commands. Use these:

---

### Step 7 — Link local repo to GitHub

```bash
git remote add origin https://github.com/<your-username>/event-registration.git
git branch -M main
git push -u origin main
```

- `remote add origin` → tells Git "this URL is my remote, nickname it `origin`"
- `branch -M main` → renames branch to `main`
- `push -u origin main` → uploads to GitHub, `-u` sets the default upstream (so future `git push` works without arguments)

---

### Step 8 — Practice branching (feature workflow)

Now let's simulate making a change in a real-world way:

```bash
# Create and switch to a new branch
git checkout -b feature/add-phone-field
```

Now edit `templates/form.html` — add a phone number field:

```html
<label>Phone Number</label>
<input type="tel" name="phone" placeholder="+91 98765 43210" />
```

Also update `app.py` to capture it:

```python
phone = request.form.get('phone')
return render_template('success.html', name=name, email=email, event=event, phone=phone)
```

And `success.html`:

```html
<p><strong>Phone:</strong> {{ phone }}</p>
```

Now commit and push this branch:

```bash
git add .
git commit -m "feat: add phone number field to registration form"
git push origin feature/add-phone-field
```

---

### Step 9 — Merge into main

```bash
git checkout main
git merge feature/add-phone-field
git push origin main
```

---

### Step 10 — View your history

```bash
git log --oneline
```

Output:
```
b7e2d1a (HEAD -> main, origin/main) feat: add phone number field to registration form  
a3f1c2d Initial commit: Flask event registration with Docker
```

---

# 🔍 Part 5: Understand — What Just Happened?

## The complete picture

```
Your Project (event-registration/)
│
├── .git/              ← Git's brain — stores ALL history
│    ├── commits        (snapshots)
│    ├── branches       (pointers to commits)
│    └── remote info    (link to GitHub)
│
├── app.py
├── Dockerfile
├── requirements.txt
├── .gitignore
└── templates/
```

## Why stage before commit?

Staging gives you **selective control.** Imagine you changed 5 files but only 3 are ready. You can stage just those 3 and commit them as one logical unit. The other 2 wait in the working directory.

```
Changed:  app.py ✅  form.html ✅  success.html ✅  test.py ⏳  notes.txt ⏳
Stage:    git add app.py form.html success.html
Commit:   "feat: add phone field"   ← clean, focused commit
```

## Why branches?

```
main        = production-ready code (always stable)
feature/*   = work in progress (can be messy)
bugfix/*    = fixing a specific bug
```

The real power: **10 developers can each have their own branch, work in parallel, and merge when ready — without ever breaking each other's work.**

## What is `HEAD`?

`HEAD` is just a pointer that says **"you are here."**

```
main ──●──────●──────●
                     ↑
                   HEAD   ← you're on the latest commit of main

feature ──●──●──●
               ↑
             HEAD         ← after git checkout feature
```

---

# ✅ Summary

```
Commands You Used:
  git init          → Started tracking the project
  git add .         → Staged all files
  git commit -m     → Saved a snapshot
  git remote add    → Linked to GitHub
  git push          → Uploaded to GitHub
  git checkout -b   → Created a new branch
  git merge         → Combined branches
  git log --oneline → Viewed history

Workflow You Practiced:
  Local changes → Stage → Commit → Push → GitHub ✅
  Feature branch → Work → Commit → Merge → main  ✅
```

**The DevOps connection:** In real teams, nobody pushes directly to `main`. Code goes through branches → Pull Requests → Code Review → Merge. Git is the foundation that makes this entire collaboration model possible. 🎯

---

