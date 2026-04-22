## Running Practical 5 in VS Code + Jupyter

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
pip install torch torchvision matplotlib numpy notebook ipykernel
```

Then register the environment as a Jupyter kernel:

```bash
python -m ipykernel install --user --name=dl_lab --display-name "DL Lab"
```

---

### Step 4: Create the Notebook

1. Press `Ctrl+Shift+P` → type **"New Jupyter Notebook"** → hit Enter
2. A `.ipynb` file opens
3. Save it as `practical5.ipynb`
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
│ Cell 2  — Load MNIST Dataset             │
├──────────────────────────────────────────┤
│ Cell 3  — Visualize Real Samples         │
├──────────────────────────────────────────┤
│ Cell 4  — Weight Initialization          │
├──────────────────────────────────────────┤
│ Cell 5  — Generator Model                │
├──────────────────────────────────────────┤
│ Cell 6  — Discriminator Model            │
├──────────────────────────────────────────┤
│ Cell 7  — Loss & Optimizers              │
├──────────────────────────────────────────┤
│ Cell 8  — Training Loop                  │
├──────────────────────────────────────────┤
│ Cell 9  — Plot Training Losses           │
├──────────────────────────────────────────┤
│ Cell 10 — Visualize Generated Images     │
├──────────────────────────────────────────┤
│ Cell 11 — Real vs Fake Side-by-Side      │
├──────────────────────────────────────────┤
│ Cell 12 — Generate from Custom Noise     │
└──────────────────────────────────────────┘
```

Run each cell with `Shift+Enter`. **Do not skip cells** — each one depends on the previous.

---

### Step 6: Verify Everything is Working

Before pasting the practical code, run this **quick check cell** first:

```python
import torch
import torchvision
import matplotlib
import numpy as np

print("PyTorch     :", torch.__version__)
print("Torchvision :", torchvision.__version__)
print("Matplotlib  :", matplotlib.__version__)
print("NumPy       :", np.__version__)
print("GPU available:", torch.cuda.is_available())
print("All good ✅")
```

If all versions print without error → you're ready.

---

### About the Dataset Download

When Cell 2 runs for the **first time:**

```
Downloading http://yann.lecun.com/exdb/mnist/...
~12MB — downloads quickly
```

A `./data/` folder will be created in your project directory. **From the second run onwards**, it loads from disk instantly — no re-download.

---

### ⚠️ Important: Training Time on CPU

DCGAN trains **two networks simultaneously** (Generator and Discriminator) on 60,000 images — it's the heaviest practical.

| Epochs    | Time on CPU    |
| --------- | -------------- |
| 5 epochs  | ~15–20 min     |
| 20 epochs | ~60–80 min     |

**For the exam — use 5 epochs.**

Change in Cell 8:

```python
EPOCHS = 5    # quick run — images will be blurry but visible
```

Even at 5 epochs you'll see the Generator starting to produce digit-like shapes — enough to demonstrate the concept clearly to an examiner.

---

### Add This to Top of Cell 1

```python
%matplotlib inline
```

This ensures plots render **inside the notebook** instead of opening a separate window.

---

### Common Issues & Fixes

| Problem                             | Fix                                                                  |
| ----------------------------------- | -------------------------------------------------------------------- |
| Kernel not showing "DL Lab"         | Re-run the `ipykernel install` command                               |
| `ModuleNotFoundError: torchvision`  | Run `pip install torchvision` with `(dl_lab)` active                 |
| `ModuleNotFoundError: torch`        | Make sure `(dl_lab)` is active before installing                     |
| MNIST download fails                | Check internet connection, re-run Cell 2                             |
| Matplotlib plots not showing        | Add `%matplotlib inline` at the top of Cell 1                        |
| Training extremely slow             | Normal on CPU — reduce `EPOCHS = 5`                                  |
| Kernel crashes during training      | Too little RAM — reduce `batch_size` to 64 in Cell 2                 |
| Generated images are all noise      | Normal at epoch 1–2 — let training continue                          |
| `./data/` folder not created        | Make sure your notebook is saved to a folder, not opened as untitled |
| Wrong Python being used             | Check bottom-left of VS Code shows correct Python path               |

---

### Tip for the Practical Exam 💡

Save your notebook as `practical5.ipynb` in a dedicated folder. Do a full clean run the night before:

`Kernel → Restart Kernel and Run All Cells`

Confirm everything runs top to bottom without errors. Cell 10 and 11 are your **best demo cells** — they show generated digits side-by-side with real ones.

---
