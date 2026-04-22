## Running Practical 3 in VS Code + Jupyter

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
3. Save it as `practical3.ipynb`
4. In the **top right corner**, click the kernel selector → choose **"DL Lab"**

```
[ Select Kernel ]  ← click this → DL Lab ✅
```

This ensures your notebook uses the virtual environment with all installed packages.

---

### Step 5: Structure Your Notebook

Organize the code into separate cells like this:

```
┌──────────────────────────────────────┐
│ Cell 1  — Imports                    │
├──────────────────────────────────────┤
│ Cell 2  — Load CIFAR-10 Dataset      │
├──────────────────────────────────────┤
│ Cell 3  — Visualize Sample Images    │
├──────────────────────────────────────┤
│ Cell 4  — Define CNN Model           │
├──────────────────────────────────────┤
│ Cell 5  — Loss & Optimizer           │
├──────────────────────────────────────┤
│ Cell 6  — Training Loop              │
├──────────────────────────────────────┤
│ Cell 7  — Evaluation                 │
├──────────────────────────────────────┤
│ Cell 8  — Plot Training Loss         │
├──────────────────────────────────────┤
│ Cell 9  — Visualize Predictions      │
└──────────────────────────────────────┘
```

Run each cell with `Shift+Enter`.

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

When Cell 2 runs for the **first time**:

```
Downloading https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz
170MB ← this will take a minute depending on your internet
```

A `./data/` folder will be created in your project directory. **From the second run onwards**, it loads from disk instantly — no re-download.

---

### ⚠️ Important: Training Time on CPU

CIFAR-10 with 50,000 images is heavy. Expect:

| Device       | Time per Epoch | 10 Epochs Total   |
| ------------ | -------------- | ----------------- |
| CPU (no GPU) | ~3–5 minutes   | **30–50 minutes** |
| GPU (CUDA)   | ~20 seconds    | ~3 minutes        |

**To reduce training time on CPU**, add this change in Cell 2 right after loading the dataset:

```python
# ── USE SUBSET FOR FASTER TRAINING ON CPU ──
# Use only 10,000 training samples instead of 50,000
from torch.utils.data import Subset

train_dataset = Subset(train_dataset, indices=range(10000))

# Then recreate the loader
train_loader = torch.utils.data.DataLoader(
    train_dataset, batch_size=64, shuffle=True
)

print("Using subset: 10,000 training samples for faster CPU training")
```

This reduces training time to about **5–8 minutes total** with only a small accuracy drop.

---

### Add This to Top of Cell 1

```python
%matplotlib inline
```

This ensures plots render **inside the notebook** instead of opening a separate window.

---

### Common Issues & Fixes

| Problem                            | Fix                                                                  |
| ---------------------------------- | -------------------------------------------------------------------- |
| Kernel not showing "DL Lab"        | Re-run the `ipykernel install` command                               |
| `ModuleNotFoundError: torchvision` | Run `pip install torchvision` in terminal with `(dl_lab)` active     |
| `ModuleNotFoundError: torch`       | Make sure `(dl_lab)` is active before installing                     |
| Dataset download fails             | Check internet connection, re-run Cell 2                             |
| `./data/` folder not created       | Make sure your notebook is saved to a folder, not opened as untitled |
| Matplotlib plots not showing       | Add `%matplotlib inline` at the top of Cell 1                        |
| Kernel crashes during training     | Too little RAM — use the subset fix above                            |
| Training extremely slow            | Normal on CPU — use the subset fix above                             |
| Wrong Python being used            | Check bottom-left of VS Code shows correct Python path               |

---

### Tip for the Practical Exam 💡

Save your notebook as `practical3.ipynb` in a dedicated folder. Run **all cells fresh** before the exam via `Kernel → Restart & Run All` to make sure everything executes cleanly top to bottom.

---
