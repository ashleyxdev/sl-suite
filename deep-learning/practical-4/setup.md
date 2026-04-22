## Running Practical 4 in VS Code + Jupyter

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
pip install torch numpy matplotlib datasets notebook ipykernel
```

Then register the environment as a Jupyter kernel:

```bash
python -m ipykernel install --user --name=dl_lab --display-name "DL Lab"
```

---

### Step 4: Create the Notebook

1. Press `Ctrl+Shift+P` → type **"New Jupyter Notebook"** → hit Enter
2. A `.ipynb` file opens
3. Save it as `practical4.ipynb`
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
│ Cell 1  — Imports                        │
├──────────────────────────────────────────┤
│ Cell 2  — Load IMDB Dataset              │
├──────────────────────────────────────────┤
│ Cell 3  — Text Preprocessing & Vocab     │
├──────────────────────────────────────────┤
│ Cell 4  — PyTorch Dataset Class          │
├──────────────────────────────────────────┤
│ Cell 5  — RNN Model Definition           │
├──────────────────────────────────────────┤
│ Cell 6  — LSTM Model Definition          │
├──────────────────────────────────────────┤
│ Cell 7  — Training Function              │
├──────────────────────────────────────────┤
│ Cell 8  — Evaluate Function              │
├──────────────────────────────────────────┤
│ Cell 9  — Train RNN                      │
├──────────────────────────────────────────┤
│ Cell 10 — Train LSTM                     │
├──────────────────────────────────────────┤
│ Cell 11 — Plot Training Curves           │
├──────────────────────────────────────────┤
│ Cell 12 — Test on Custom Reviews         │
├──────────────────────────────────────────┤
│ Cell 13 — Final Comparison Summary       │
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
from datasets import load_dataset

print("PyTorch    :", torch.__version__)
print("NumPy      :", np.__version__)
print("Matplotlib :", matplotlib.__version__)
print("Datasets   : installed ✅")
print("GPU        :", torch.cuda.is_available())
print("All good ✅")
```

If all versions print without error → you're ready.

---

### About the Dataset Download

When Cell 2 runs for the **first time:**

```
Downloading IMDB dataset...
~80MB — takes a minute depending on internet speed
```

It gets cached locally after first download. **Subsequent runs load instantly** from cache.

If download fails, you'll see this error:

```
ConnectionError: Couldn't reach the Hub
```

Fix → check internet and re-run Cell 2.

---

### ⚠️ Important: Training Time on CPU

This practical trains **two models** (RNN and LSTM) on 25,000 text reviews — it's heavy on CPU.

| Model | Per Epoch | 5 Epochs Total |
| ----- | --------- | -------------- |
| RNN   | ~5–8 min  | ~25–40 min     |
| LSTM  | ~8–12 min | ~40–60 min     |

**Strongly recommended — use a subset for CPU:**

Add this at the **end of Cell 2**, right after loading the dataset:

```python
# ── SUBSET FOR FASTER CPU TRAINING ──
train_data = train_data.select(range(5000))  # 5000 instead of 25000
test_data  = test_data.select(range(1000))   # 1000 instead of 25000

print(f"Using subset → Train: {len(train_data)}, Test: {len(test_data)}")
```

**With subset:**

| Model | Per Epoch | 5 Epochs Total |
| ----- | --------- | -------------- |
| RNN   | ~1–2 min  | ~5–10 min      |
| LSTM  | ~2–3 min  | ~10–15 min     |

Accuracy drop is minimal — still enough to clearly see LSTM outperforming RNN.

---

### Cells That Take Time (No Output)

**Cell 3** builds the vocabulary by scanning all training reviews. You'll see no output for **30–60 seconds** — this is normal. It will print when done:

```
Building vocabulary...
Vocabulary size: 10000
```

**Cell 4** encodes all reviews into number sequences. Again, **no output for ~30 seconds** — normal. Wait for it to finish:

```
Creating datasets...
Train batches: 79
Test batches : 16
```

Do not interrupt these cells.

---

### Add This to Top of Cell 1

```python
%matplotlib inline
```

This ensures plots render **inside the notebook** instead of opening a separate window.

---

### Common Issues & Fixes

| Problem                            | Fix                                                                |
| ---------------------------------- | ------------------------------------------------------------------ |
| Kernel not showing "DL Lab"        | Re-run the `ipykernel install` command                             |
| `ModuleNotFoundError: datasets`    | Run `pip install datasets` with `(dl_lab)` active                  |
| `ModuleNotFoundError: torch`       | Make sure `(dl_lab)` is active before installing                   |
| Dataset download fails             | Check internet, re-run Cell 2                                      |
| Cell 3 seems frozen                | It's building vocabulary — wait 30–60 seconds                      |
| Cell 4 seems frozen                | It's encoding reviews — wait 30–60 seconds                         |
| `RuntimeError: CUDA out of memory` | You're on GPU but memory is low — add `device = 'cpu'` in Cell 1   |
| Kernel crashes mid-training        | RAM exhausted — make sure you're using the subset                  |
| Loss not decreasing at all         | Re-run from Cell 5 — weights may have initialized poorly           |
| `AttributeError` on dataset        | `datasets` version mismatch — run `pip install --upgrade datasets` |
| Wrong Python being used            | Check bottom-left of VS Code shows correct Python path             |

---

### Recommended Run Order for Exam 💡

Run cells in this order for a smooth demo:

```
Cell 1  → confirm imports
Cell 2  → load data (confirm sample review prints)
Cell 3  → build vocab (confirm "Vocabulary size: 10000")
Cell 4  → create datasets (confirm batch counts)
Cell 5  → define RNN (confirm model prints)
Cell 6  → define LSTM (confirm model prints)
Cell 7  → define train function (no output, just defines it)
Cell 8  → define eval function (no output, just defines it)
Cell 9  → train RNN (watch loss drop each epoch)
Cell 10 → train LSTM (watch loss drop faster than RNN)
Cell 11 → plot curves (visual comparison)
Cell 12 → custom reviews (live demo — examiner loves this)
Cell 13 → print final summary
```

Cell 12 is your **best demo cell** — you can change the review text live in front of the examiner and show the model predicting sentiment in real time.

---

### Tip for the Practical Exam 💡

Do a full clean run the night before:

`Kernel → Restart Kernel and Run All Cells`

Confirm everything runs top to bottom without errors. Pay attention that both models finish training and Cell 12 predictions make sense.

---
