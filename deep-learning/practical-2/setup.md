## Running Practical 2 in VS Code + Jupyter

### Step 1: Install Python Extension (if not already)

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
pip install torch numpy scikit-learn notebook ipykernel
```

Then register the environment as a Jupyter kernel:

```bash
python -m ipykernel install --user --name=dl_lab --display-name "DL Lab"
```

---

### Step 4: Create the Notebook

1. Press `Ctrl+Shift+P` → type **"New Jupyter Notebook"** → hit Enter
2. A `.ipynb` file opens
3. In the **top right corner**, click the kernel selector → choose **"DL Lab"**

```
[ Select Kernel ]  ← click this → DL Lab ✅
```

This ensures your notebook uses the virtual environment with all installed packages.

---

### Step 5: Structure Your Notebook

Organize the code into separate cells like this:

```
┌─────────────────────────────────┐
│ Cell 1 — Imports & Data         │
├─────────────────────────────────┤
│ Cell 2 — Activation Functions   │  ← NumPy part
├─────────────────────────────────┤
│ Cell 3 — Initialize Weights     │
├─────────────────────────────────┤
│ Cell 4 — Training Loop          │
├─────────────────────────────────┤
│ Cell 5 — Evaluate               │
├─────────────────────────────────┤
│ Cell 6 — PyTorch: Data Prep     │
├─────────────────────────────────┤
│ Cell 7 — PyTorch: Model         │  ← PyTorch part
├─────────────────────────────────┤
│ Cell 8 — PyTorch: Train & Eval  │
└─────────────────────────────────┘
```

Run each cell with `Shift+Enter`.

---

### Step 6: Verify Everything is Working

Before pasting the practical code, run this **quick check cell** first:

```python
import torch
import numpy as np
import sklearn

print("PyTorch  :", torch.__version__)
print("NumPy    :", np.__version__)
print("Sklearn  :", sklearn.__version__)
print("All good ✅")
```

If all versions print without error → you're ready.

---

### Common Issues & Fixes

| Problem                      | Fix                                                    |
| ---------------------------- | ------------------------------------------------------ |
| Kernel not showing "DL Lab"  | Re-run the `ipykernel install` command                 |
| `ModuleNotFoundError: torch` | Make sure `(dl_lab)` is active before installing       |
| Kernel keeps dying           | Restart kernel via `Ctrl+Shift+P` → "Restart Kernel"   |
| Wrong Python being used      | Check bottom-left of VS Code shows correct Python path |

---

### Tip for the Practical Exam 💡

Save your notebook as `practical2.ipynb` in a dedicated folder:

```
dl_lab/
├── practical1.ipynb
├── practical2.ipynb   ← structured, clean, ready to run
└── ...
```

Run **all cells fresh** before the exam via `Kernel → Restart & Run All` to make sure everything executes cleanly top to bottom.

---
