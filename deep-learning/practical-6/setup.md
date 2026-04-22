## Running Practical 6 in VS Code + Jupyter

### Step 1: Install VS Code Extensions (if not already)

Make sure you have these two VS Code extensions installed:

- **Python** (by Microsoft)
- **Jupyter** (by Microsoft)

Check via `Ctrl+Shift+X` → search and install if missing.

---

### Step 2: Set Up Virtual Environment

Open the **VS Code terminal** (`Ctrl+backtick`) and run:

```bash
# Create virtual environment
python -m venv dl_lab

# Activate it (Windows)
dl_lab\Scripts\activate

# Activate it (Mac/Linux)
source dl_lab/bin/activate
```

You should see `(dl_lab)` in your terminal prompt.

---

### Step 3: Install Required Libraries

```bash
pip install torch numpy matplotlib gymnasium pygame notebook ipykernel
```

Then register the environment as a Jupyter kernel:

```bash
python -m ipykernel install --user --name=dl_lab --display-name "DL Lab"
```

---

### Step 4: Create the Notebook

1. Press `Ctrl+Shift+P` → type **"New Jupyter Notebook"** → hit Enter
2. A `.ipynb` file opens
3. Save it as `practical6.ipynb`
4. In the **top right corner**, click the kernel selector → choose **"DL Lab"**

```
[ Select Kernel ]  ← click this → DL Lab ✅
```

This ensures your notebook uses the virtual environment with all installed packages.

---

### Step 5: Structure Your Notebook

Organize the code into separate cells like this:

```
┌──────────────────────────────────────────┐
│ Cell 1  — Imports & Device Setup         │
├──────────────────────────────────────────┤
│ Cell 2  — Explore the Environment        │
├──────────────────────────────────────────┤
│ Cell 3  — Replay Buffer                  │
├──────────────────────────────────────────┤
│ Cell 4  — DQN Neural Network             │
├──────────────────────────────────────────┤
│ Cell 5  — DQN Agent                      │
├──────────────────────────────────────────┤
│ Cell 6  — Training Loop                  │
├──────────────────────────────────────────┤
│ Cell 7  — Plot Training Results          │
├──────────────────────────────────────────┤
│ Cell 8  — Evaluate Trained Agent         │
├──────────────────────────────────────────┤
│ Cell 9  — Visualize Q-values            │
└──────────────────────────────────────────┘
```

Run each cell with `Shift+Enter`. **Do not skip cells** — each one depends on the previous.

---

### Step 6: Verify Everything is Working

Before pasting the practical code, run this **quick check cell** first:

```python
import torch
import numpy as np
import matplotlib
import gymnasium as gym

print("PyTorch    :", torch.__version__)
print("NumPy      :", np.__version__)
print("Matplotlib :", matplotlib.__version__)
print("Gymnasium  :", gym.__version__)
print("GPU        :", torch.cuda.is_available())
print("All good ✅")
```

If all versions print without error → you're ready.

---

### About the Environment

Unlike other practicals, there is **no dataset download**. The CartPole environment is:

- Built into Gymnasium
- Runs as a physics simulation
- No internet needed after installing the package

Cell 2 creates the environment and shows what a state looks like — run it to confirm Gymnasium is set up correctly.

---

### ⚠️ Training Time on CPU

DQN on CartPole is **fast** — the environment is lightweight and no heavy data processing is needed.

| Episodes     | Time on CPU |
| ------------ | ----------- |
| 100 episodes | ~3–5 min    |
| 300 episodes | ~10–15 min  |

**300 episodes is recommended** — the agent visibly improves and the plots tell a clear story.

For a quick test, change in Cell 6:

```python
EPISODES = 100    # quick run — agent may not fully converge
```

---

### Add This to Top of Cell 1

```python
%matplotlib inline
```

This ensures plots render **inside the notebook** instead of opening a separate window.

---

### Common Issues & Fixes

| Problem                                | Fix                                                              |
| -------------------------------------- | ---------------------------------------------------------------- |
| Kernel not showing "DL Lab"            | Re-run the `ipykernel install` command                           |
| `ModuleNotFoundError: gymnasium`       | Run `pip install gymnasium pygame` with `(dl_lab)` active        |
| `ModuleNotFoundError: torch`           | Make sure `(dl_lab)` is active before installing                 |
| `NameError: name 'device' not defined` | Run Cell 1 first — it defines the device variable                |
| Plots not showing                      | Add `%matplotlib inline` at the top of Cell 1                    |
| Agent score not improving              | Normal for first 50–100 episodes — agent is exploring randomly   |
| Agent stuck at low scores after 300 ep | Re-run from Cell 5 — weights may have initialized poorly         |
| `gymnasium.error.NameNotFound`         | Typo in environment name — must be exactly `'CartPole-v1'`       |
| Wrong Python being used                | Check bottom-left of VS Code shows correct Python path           |

---

### Recommended Run Order for Exam 💡

```
Cell 1  → confirm imports
Cell 2  → explore environment (confirm state space prints)
Cell 3  → define ReplayBuffer (no output, just defines it)
Cell 4  → define DQN network (confirm architecture prints)
Cell 5  → define DQN Agent (no output, just defines it)
Cell 6  → train agent (watch scores climb each episode)
Cell 7  → plot training curves (visual proof of learning)
Cell 8  → evaluate agent (show perfect scores)
Cell 9  → Q-value plot (proves agent learned the physics)
```

Cell 9 is your **best demo cell** — it shows the agent learned that a pole tilting right needs a left push, and vice versa.

---

### Tip for the Practical Exam 💡

Do a full clean run the night before:

`Kernel → Restart Kernel and Run All Cells`

Training is fast enough (~10–15 min) that you can do a fresh run during the exam if needed.

---
