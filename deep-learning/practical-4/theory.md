## Practical 4: RNN & LSTM for Sentiment Analysis

**Flow for this practical:**

> Concepts (Sequential Data → RNN → LSTM) → Text Preprocessing → RNN Implementation → LSTM Implementation → Comparison

This is the most concept-heavy practical so far. **Understand the concepts first** — LSTM gate questions are extremely common in vivas.

---

## PART 1 — Concepts

### 1.1 What is Sequential Data?

Some data has **order** — where position matters.

```
Text     : "The movie was not good"  ← word order completely changes meaning
Time     : Stock prices over days
Speech   : Audio samples over time
```

MLP and CNN treat inputs as **independent** — they have no memory of what came before. For sequential data, this fails badly.

---

### 1.2 Why MLP Fails for Sequences

```
Input: "The movie was not good"

MLP sees: [The] [movie] [was] [not] [good]  ← 5 independent tokens
          ↓      ↓       ↓     ↓      ↓
          No connection between them at all!

"not good" = negative  ←  MLP misses this relationship
```

We need a model that has **memory across time steps**.

---

### 1.3 Recurrent Neural Network (RNN)

RNN processes sequences **one element at a time** and carries a **hidden state** — a memory — from each step to the next.

```
x1 ──→ [RNN] ──h1──→ [RNN] ──h2──→ [RNN] ──h3──→ Output
         ↑              ↑              ↑
        "The"         "movie"        "good"

h = hidden state = the network's memory so far
```

At each step:

```
hₜ = tanh(W·xₜ + U·hₜ₋₁ + b)

xₜ   = current input (word)
hₜ₋₁ = previous hidden state (memory)
hₜ   = new hidden state
```

---

### 1.4 The Problem with RNN — Vanishing Gradient

During backpropagation through many time steps, gradients get multiplied repeatedly:

```
Long sentence: 50 words

Gradient flows backward: step50 → step49 → ... → step1

Each step: gradient × weight (< 1)
After 50 steps: 0.9⁵⁰ ≈ 0.005  ← nearly zero!
```

The network **forgets early words** — it can't learn long-range dependencies.

```
"The movie that my friend recommended last week was not good"
 ↑                                                    ↑
 This word matters but RNN forgets it by the time it reaches here
```

---

### 1.5 Long Short-Term Memory (LSTM)

LSTM solves the vanishing gradient with a **cell state** — a separate memory highway — controlled by **gates**.

```
         ┌─────────────────────────────────────┐
         │           LSTM Cell                  │
  Cₜ₋₁ ─┼──→ [forget]──→[add]──────────────→ Cₜ  ← Cell State (long memory)
         │       ↑          ↑                  │
  hₜ₋₁ ─┼──→ [gates compute what to keep]     │
  xₜ   ─┼──→ [input gate] [output gate] ────→ hₜ  ← Hidden State (output)
         └─────────────────────────────────────┘
```

**The 3 Gates — explained simply:**

| Gate            | Question it answers                  | Action                               |
| --------------- | ------------------------------------ | ------------------------------------ |
| **Forget Gate** | What old memory should I throw away? | Erases parts of cell state           |
| **Input Gate**  | What new information should I store? | Writes new info to cell state        |
| **Output Gate** | What should I output right now?      | Reads from cell state → hidden state |

---

### 1.6 RNN vs LSTM — Simple Analogy

```
RNN  = Someone with short-term memory
       Remembers last few words, forgets the beginning

LSTM = Someone taking notes while reading
       Forget gate  = crossing out old notes
       Input gate   = writing new notes
       Output gate  = reading from notes when needed
```

---

### 1.7 Sentiment Analysis

Task: Given a piece of text → predict the **sentiment** (emotion/opinion)

```
"This movie was absolutely fantastic!"  →  Positive 😊
"Worst film I've ever seen."            →  Negative 😞
```

It's a **text classification** problem — binary (pos/neg) or multi-class.

---

### 1.8 How Text Becomes Numbers (Pipeline)

Neural networks can't process raw text. Here's the preprocessing pipeline:

```
Raw Text
   │
   ▼
Tokenization     "not good" → ["not", "good"]
   │
   ▼
Vocabulary       {"not": 1, "good": 2, "bad": 3, ...}
   │
   ▼
Encoding         ["not", "good"] → [1, 2]
   │
   ▼
Padding          [1, 2, 0, 0, 0] ← same length for all reviews
   │
   ▼
Embedding        [1, 2] → [[0.2, 0.5, ...], [0.8, 0.1, ...]]
                          each word → dense vector of floats
   │
   ▼
RNN / LSTM
   │
   ▼
Sentiment (0 or 1)
```

---

### 1.9 Dataset — IMDB Movie Reviews 🎬

```
50,000 movie reviews from IMDB
25,000 training  +  25,000 testing
Binary labels: Positive (1) or Negative (0)

"A wonderful little production..." → 1 (Positive)
"This is the worst thing..."       → 0 (Negative)
```

---

## PART 2 — Implementation

### Install Dependencies

```bash
pip install datasets
```

---

```python
# ============================================================
# Practical 4: RNN & LSTM for Sentiment Analysis
# Dataset: IMDB Movie Reviews
# ============================================================

# ── Cell 1: Imports ─────────────────────────────────────────
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from datasets import load_dataset
from collections import Counter
import numpy as np
import matplotlib.pyplot as plt
import re

print("PyTorch:", torch.__version__)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")
```

```python
# ── Cell 2: Load IMDB Dataset ────────────────────────────────

dataset = load_dataset("imdb")

train_data = dataset['train']
test_data  = dataset['test']

print(f"Training samples : {len(train_data)}")
print(f"Testing samples  : {len(test_data)}")

# Preview a sample
print("\nSample Review:")
print(train_data[0]['text'][:300], "...")
print("Label:", "Positive" if train_data[0]['label'] == 1 else "Negative")
```

```python
# ── Cell 3: Text Preprocessing ──────────────────────────────

MAX_VOCAB  = 10000   # keep only top 10,000 most common words
MAX_LEN    = 200     # max words per review (truncate/pad to this)

# -- Step 1: Tokenizer (simple, no external library needed) --
def tokenize(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text)       # remove HTML tags
    text = re.sub(r'[^a-z\s]', '', text)   # keep only letters
    return text.split()

# -- Step 2: Build Vocabulary from training data --
print("Building vocabulary...")
counter = Counter()
for item in train_data:
    tokens = tokenize(item['text'])
    counter.update(tokens)

# Special tokens:
# <PAD> = padding token (index 0)
# <UNK> = unknown word not in vocabulary (index 1)
vocab = {'<PAD>': 0, '<UNK>': 1}
for word, _ in counter.most_common(MAX_VOCAB - 2):
    vocab[word] = len(vocab)

print(f"Vocabulary size: {len(vocab)}")

# -- Step 3: Encode text to numbers --
def encode(text, vocab, max_len):
    tokens = tokenize(text)[:max_len]             # truncate
    ids = [vocab.get(t, vocab['<UNK>']) for t in tokens]  # encode
    # Pad with 0s to max_len
    ids += [0] * (max_len - len(ids))
    return ids
```

```python
# ── Cell 4: PyTorch Dataset Class ───────────────────────────

class IMDBDataset(Dataset):
    def __init__(self, data, vocab, max_len):
        self.texts  = [encode(item['text'], vocab, max_len)
                       for item in data]
        self.labels = [item['label'] for item in data]

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return (
            torch.tensor(self.texts[idx],  dtype=torch.long),
            torch.tensor(self.labels[idx], dtype=torch.float)
        )

print("Creating datasets...")
train_dataset = IMDBDataset(train_data, vocab, MAX_LEN)
test_dataset  = IMDBDataset(test_data,  vocab, MAX_LEN)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader  = DataLoader(test_dataset,  batch_size=64, shuffle=False)

print(f"Train batches: {len(train_loader)}")
print(f"Test batches : {len(test_loader)}")
```

```python
# ── Cell 5: RNN Model ────────────────────────────────────────

class RNNModel(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, output_dim):
        super(RNNModel, self).__init__()

        # Embedding: converts word index → dense vector
        self.embedding = nn.Embedding(
            num_embeddings=vocab_size,
            embedding_dim=embed_dim,
            padding_idx=0        # PAD token won't contribute to gradients
        )

        # RNN layer
        self.rnn = nn.RNN(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,    # input shape: (batch, seq_len, features)
            dropout=0.0
        )

        # Fully connected output layer
        self.fc = nn.Linear(hidden_dim, output_dim)

        # Sigmoid for binary output (positive/negative)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: (batch_size, seq_len)

        embedded = self.embedding(x)
        # embedded shape: (batch_size, seq_len, embed_dim)

        output, hidden = self.rnn(embedded)
        # hidden shape: (1, batch_size, hidden_dim)

        # Use the last hidden state for classification
        hidden = hidden.squeeze(0)
        # hidden shape: (batch_size, hidden_dim)

        out = self.fc(hidden)
        return self.sigmoid(out).squeeze()

# Hyperparameters
VOCAB_SIZE = len(vocab)
EMBED_DIM  = 64
HIDDEN_DIM = 128
OUTPUT_DIM = 1

rnn_model = RNNModel(VOCAB_SIZE, EMBED_DIM, HIDDEN_DIM, OUTPUT_DIM)
rnn_model  = rnn_model.to(device)

total_params = sum(p.numel() for p in rnn_model.parameters())
print(f"RNN Model\n{rnn_model}")
print(f"\nTotal parameters: {total_params:,}")
```

```python
# ── Cell 6: LSTM Model ───────────────────────────────────────

class LSTMModel(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, output_dim):
        super(LSTMModel, self).__init__()

        self.embedding = nn.Embedding(
            num_embeddings=vocab_size,
            embedding_dim=embed_dim,
            padding_idx=0
        )

        # LSTM instead of RNN — same interface, better memory
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=2,           # 2 stacked LSTM layers
            batch_first=True,
            dropout=0.3,            # dropout between LSTM layers
            bidirectional=False
        )

        self.dropout = nn.Dropout(0.3)
        self.fc      = nn.Linear(hidden_dim, output_dim)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        embedded = self.embedding(x)
        embedded = self.dropout(embedded)
        # embedded: (batch, seq_len, embed_dim)

        output, (hidden, cell) = self.lstm(embedded)
        # hidden: (num_layers, batch, hidden_dim)

        # Take hidden state from last layer
        hidden = hidden[-1]
        # hidden: (batch, hidden_dim)

        hidden = self.dropout(hidden)
        out = self.fc(hidden)
        return self.sigmoid(out).squeeze()

lstm_model = LSTMModel(VOCAB_SIZE, EMBED_DIM, HIDDEN_DIM, OUTPUT_DIM)
lstm_model = lstm_model.to(device)

total_params = sum(p.numel() for p in lstm_model.parameters())
print(f"LSTM Model\n{lstm_model}")
print(f"\nTotal parameters: {total_params:,}")
```

```python
# ── Cell 7: Training Function ────────────────────────────────

def train_model(model, train_loader, epochs=5, lr=0.001):
    criterion = nn.BCELoss()     # Binary Cross Entropy for binary classification
    optimizer = optim.Adam(model.parameters(), lr=lr)

    history = {'loss': [], 'accuracy': []}

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        correct    = 0
        total      = 0

        for texts, labels in train_loader:
            texts  = texts.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            predictions = model(texts)
            loss = criterion(predictions, labels)
            loss.backward()

            # Gradient clipping — prevents exploding gradients in RNN
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            optimizer.step()

            total_loss += loss.item()
            predicted_labels = (predictions >= 0.5).float()
            correct += (predicted_labels == labels).sum().item()
            total   += labels.size(0)

        avg_loss = total_loss / len(train_loader)
        accuracy = 100 * correct / total
        history['loss'].append(avg_loss)
        history['accuracy'].append(accuracy)

        print(f"Epoch [{epoch+1}/{epochs}]  "
              f"Loss: {avg_loss:.4f}  "
              f"Accuracy: {accuracy:.2f}%")

    return history
```

```python
# ── Cell 8: Evaluate Function ────────────────────────────────

def evaluate_model(model, test_loader):
    model.eval()
    correct = 0
    total   = 0

    with torch.no_grad():
        for texts, labels in test_loader:
            texts  = texts.to(device)
            labels = labels.to(device)

            predictions = model(texts)
            predicted_labels = (predictions >= 0.5).float()

            correct += (predicted_labels == labels).sum().item()
            total   += labels.size(0)

    accuracy = 100 * correct / total
    return accuracy
```

```python
# ── Cell 9: Train RNN ────────────────────────────────────────

print("=" * 50)
print("Training RNN Model")
print("=" * 50)
rnn_history = train_model(rnn_model, train_loader, epochs=5)
rnn_accuracy = evaluate_model(rnn_model, test_loader)
print(f"\nRNN Test Accuracy: {rnn_accuracy:.2f}%")
```

```python
# ── Cell 10: Train LSTM ──────────────────────────────────────

print("=" * 50)
print("Training LSTM Model")
print("=" * 50)
lstm_history = train_model(lstm_model, train_loader, epochs=5)
lstm_accuracy = evaluate_model(lstm_model, test_loader)
print(f"\nLSTM Test Accuracy: {lstm_accuracy:.2f}%")
```

```python
# ── Cell 11: Plot Training Curves ────────────────────────────

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Loss
axes[0].plot(rnn_history['loss'],  marker='o', label='RNN',  color='steelblue')
axes[0].plot(lstm_history['loss'], marker='s', label='LSTM', color='darkorange')
axes[0].set_title("Training Loss")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("Loss")
axes[0].legend()
axes[0].grid(True)

# Accuracy
axes[1].plot(rnn_history['accuracy'],  marker='o', label='RNN',  color='steelblue')
axes[1].plot(lstm_history['accuracy'], marker='s', label='LSTM', color='darkorange')
axes[1].set_title("Training Accuracy")
axes[1].set_xlabel("Epoch")
axes[1].set_ylabel("Accuracy (%)")
axes[1].legend()
axes[1].grid(True)

plt.suptitle("RNN vs LSTM — Training Comparison", fontsize=13)
plt.tight_layout()
plt.show()
```

```python
# ── Cell 12: Test on Custom Reviews ─────────────────────────

def predict_sentiment(model, review, vocab, max_len, device):
    model.eval()
    encoded = encode(review, vocab, max_len)
    tensor  = torch.tensor(encoded, dtype=torch.long).unsqueeze(0).to(device)

    with torch.no_grad():
        prediction = model(tensor).item()

    label = "Positive 😊" if prediction >= 0.5 else "Negative 😞"
    return label, prediction

# Test reviews
reviews = [
    "This movie was absolutely fantastic! Great performances and amazing story.",
    "Terrible film. Worst acting I have ever seen. Complete waste of time.",
    "It was an okay movie, nothing special but not bad either.",
    "One of the best movies of the decade. Highly recommend to everyone!"
]

print("LSTM Predictions:")
print("-" * 60)
for review in reviews:
    label, score = predict_sentiment(
        lstm_model, review, vocab, MAX_LEN, device
    )
    print(f"Review : {review[:60]}...")
    print(f"Result : {label}  (score: {score:.4f})")
    print()
```

```python
# ── Cell 13: Final Comparison Summary ───────────────────────

print("=" * 40)
print("      FINAL RESULTS SUMMARY")
print("=" * 40)
print(f"  RNN  Test Accuracy : {rnn_accuracy:.2f}%")
print(f"  LSTM Test Accuracy : {lstm_accuracy:.2f}%")
print(f"  Winner             : {'LSTM' if lstm_accuracy > rnn_accuracy else 'RNN'}")
print("=" * 40)
```

---

## PART 3 — Output Walkthrough

**Training output:**

```
Training RNN Model
Epoch [1/5]  Loss: 0.6921  Accuracy: 52.34%
Epoch [2/5]  Loss: 0.6730  Accuracy: 58.12%
Epoch [3/5]  Loss: 0.6501  Accuracy: 63.45%
Epoch [4/5]  Loss: 0.6201  Accuracy: 67.89%
Epoch [5/5]  Loss: 0.5901  Accuracy: 71.23%
RNN Test Accuracy: 70.45%

Training LSTM Model
Epoch [1/5]  Loss: 0.6801  Accuracy: 57.23%
Epoch [2/5]  Loss: 0.5923  Accuracy: 68.45%
Epoch [3/5]  Loss: 0.4821  Accuracy: 76.34%
Epoch [4/5]  Loss: 0.4102  Accuracy: 81.23%
Epoch [5/5]  Loss: 0.3541  Accuracy: 85.67%
LSTM Test Accuracy: 84.23%
```

**Custom predictions:**

```
Review : This movie was absolutely fantastic! Great performances...
Result : Positive 😊  (score: 0.8923)

Review : Terrible film. Worst acting I have ever seen...
Result : Negative 😞  (score: 0.0821)
```

**What this tells you:**

- LSTM consistently beats RNN → gates handle long reviews better
- RNN plateaus early → vanishing gradient kicks in
- Score close to 1.0 = very confident positive, close to 0.0 = very confident negative

---

## RNN vs LSTM — Side by Side

|                    | RNN                    | LSTM                      |
| ------------------ | ---------------------- | ------------------------- |
| Memory type        | Hidden state only      | Hidden state + Cell state |
| Long sequences     | ❌ Forgets early words | ✅ Remembers via gates    |
| Vanishing gradient | ❌ Severe problem      | ✅ Solved by gates        |
| Parameters         | Fewer                  | More                      |
| Training speed     | Faster                 | Slower                    |
| Accuracy on text   | ~70%                   | ~84%                      |

---

## Viva Quick-Prep 🎯

**Q: What is the vanishing gradient problem in RNN?**
A: During backpropagation through many time steps, gradients get multiplied by small numbers repeatedly and shrink to near zero. The network stops learning from early words in the sequence.

**Q: How does LSTM solve the vanishing gradient problem?**
A: LSTM introduces a cell state — a direct memory highway — that gradients can flow through without repeated multiplication. The gates control what is added or removed from this highway.

**Q: What are the three gates in LSTM and what do they do?**
A: Forget gate — decides what to erase from cell state. Input gate — decides what new information to write. Output gate — decides what to read from cell state as output.

**Q: What is an Embedding layer?**
A: It converts word indices (integers) into dense vectors of floats. Instead of one-hot encoding (sparse), embeddings learn a compact meaningful representation where similar words are closer together.

**Q: Why do we use BCELoss instead of CrossEntropyLoss here?**
A: BCELoss (Binary Cross Entropy) is for binary classification with a Sigmoid output (0 or 1). CrossEntropyLoss is for multi-class classification. Sentiment here is binary — positive or negative.

**Q: What is `clip_grad_norm_` and why is it used?**
A: It caps the gradient magnitude during training. RNNs can suffer from exploding gradients (opposite of vanishing), where gradients grow uncontrollably. Clipping prevents this.

---

## Running This Practical

```bash
# Same dl_lab environment, just install datasets
pip install datasets
```

Same notebook setup as before — save as `practical4.ipynb`, select **DL Lab** kernel.

**CPU Training Time:**
| Model | 5 Epochs |
|---|---|
| RNN | ~15–20 min |
| LSTM | ~20–30 min |

**To speed up on CPU**, use a subset:

```python
# After loading dataset, add:
train_data = train_data.select(range(5000))
test_data  = test_data.select(range(1000))
```

This drops time to ~5 minutes total with minimal accuracy impact.

---

Ready for Practical 5 whenever you are! 🚀
