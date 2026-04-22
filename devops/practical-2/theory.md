# 📚 Part 1: Concepts

## What is Git?

Git is a **Version Control System (VCS)**. It tracks changes to your files over time so you can:
- Go back to any previous version
- Work on multiple features simultaneously (branches)
- Collaborate without overwriting each other's work

Think of it like **save checkpoints in a video game** — you can always go back to a checkpoint if something breaks.

```
Without Git:
  app_v1.py
  app_v2.py
  app_final.py
  app_final_REAL.py       ← we've all been here 😭
  app_final_REAL_v2.py

With Git:
  app.py                  ← one file, full history tracked
```

---

## What is GitHub?

Git = **local tool** on your computer that tracks changes.

GitHub = **cloud platform** that hosts your Git repositories online.

```
Git                        GitHub
----                       ------
Lives on your machine  →   Lives on the internet
Tracks history locally →   Shares history with the world
Works offline          →   Enables collaboration
Like your diary        →   Like Google Docs for code
```

> Git can exist without GitHub. GitHub cannot exist without Git.

---

# 🧠 Part 2: The Git Mental Model

This is the most important thing to understand before touching any command.

Git has **4 zones:**

```
┌─────────────────────────────────────────────────────────────┐
│                        YOUR MACHINE                         │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐   ┌───────────────┐  │
│  │   Working    │    │   Staging    │   │  Local Repo   │  │
│  │  Directory   │───▶│    Area      │──▶│  (.git folder)│  │
│  │  (your files)│    │  (git add)   │   │  (git commit) │  │
│  └──────────────┘    └──────────────┘   └───────────────┘  │
│                                                  │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │ git push
                                                   ▼
                                         ┌───────────────────┐
                                         │   Remote Repo     │
                                         │     (GitHub)      │
                                         └───────────────────┘
```

| Zone | What it is |
|---|---|
| **Working Directory** | Your actual project files you edit |
| **Staging Area** | Files you've marked "ready to snapshot" |
| **Local Repo** | The actual saved snapshots (commits) |
| **Remote Repo** | GitHub — the online backup/collaboration hub |

### The 3-step commit cycle (memorize this)

```
Edit files  →  git add  →  git commit  →  git push
              (stage)      (snapshot)     (upload)
```

---

# ⚙️ Part 3: Core Git Commands

## 🔧 One-time Setup

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

This stamps your identity on every commit you make.

---

## 📁 Starting a Repository

```bash
git init          # Start tracking a NEW project (creates .git folder)
git clone <url>   # Download an EXISTING project from GitHub
```

---

## 📸 The Commit Cycle

```bash
git status                  # See what's changed / staged
git add <filename>          # Stage a specific file
git add .                   # Stage ALL changed files
git commit -m "message"     # Save a snapshot with a description
```

---

## 🌿 Branches

Branches let you work on a feature without touching the main code.

```
main  ──●──────────────────────●── (stable code)
         \                    /
feature   ●──●──●──●──●──●──●    (your feature work)
```

```bash
git branch                    # List all branches
git branch feature-login      # Create a new branch
git checkout feature-login    # Switch to that branch
git checkout -b feature-login # Create AND switch (shorthand)
git merge feature-login       # Merge feature into current branch
```

---

## 🌐 Working with GitHub (Remote)

```bash
git remote add origin <url>   # Link your local repo to GitHub
git push origin main          # Upload commits to GitHub
git pull origin main          # Download latest changes from GitHub
git fetch                     # Check for changes (don't merge yet)
```

---

## 🔍 Inspecting History

```bash
git log                       # Full commit history
git log --oneline             # Compact one-line history
git diff                      # See unstaged changes
git diff --staged             # See staged changes
```

---

## ↩️ Undoing Things

```bash
git restore <file>            # Discard changes in working directory
git restore --staged <file>   # Unstage a file
git revert <commit-hash>      # Undo a commit (safely, keeps history)
```

---

## 🙈 `.gitignore`

A file that tells Git: **"don't track these files."**

```
__pycache__/      ← Python compiled files
*.pyc             ← Python bytecode
.env              ← Secret keys (NEVER commit these)
venv/             ← Virtual environment folder
.DS_Store         ← Mac system files
```

---

