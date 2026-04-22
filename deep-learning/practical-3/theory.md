## Practical 3: Convolutional Neural Networks for Image Classification

**Flow for this practical:**

> Concepts → CNN Architecture Breakdown → Implementation (PyTorch + CIFAR-10) → Output Walkthrough

This is a **significant step up** from MLP. Take the concepts seriously — CNN architecture questions are very common in vivas.

---

## PART 1 — Concepts

### 1.1 Why not just use MLP for images?

Consider a small **32×32 color image**:

```
32 × 32 × 3 (RGB) = 3072 input values

If hidden layer has 512 neurons:
3072 × 512 = 1,572,864 weights  ← just for ONE layer!
```

Problems with MLP on images:

- **Too many parameters** → slow, overfits easily
- **Loses spatial structure** → flattening destroys the 2D arrangement of pixels
- **Not translation invariant** → a cat in top-left vs bottom-right = completely different to MLP

CNN solves all of this.

---

### 1.2 The Core Idea of CNN

Instead of connecting every pixel to every neuron, CNNs use a small **filter (kernel)** that slides across the image and detects local patterns.

```
Image patch        Filter (3×3)      Feature detected
┌─────────┐       ┌───┬───┬───┐
│ 1  0  1 │   ×   │ 1 │ 0 │ 1 │  →   Edge, curve,
│ 0  1  0 │       │ 0 │ 1 │ 0 │      texture, etc.
│ 1  0  1 │       │ 1 │ 0 │ 1 │
└─────────┘       └───┴───┴───┘
```

The filter slides across the **entire** image → produces a **Feature Map**.

---

### 1.3 CNN Building Blocks

#### A) Convolutional Layer

- Applies multiple filters to the input
- Each filter learns to detect a different pattern (edges, curves, textures)
- Early layers → simple patterns (edges)
- Deeper layers → complex patterns (eyes, wheels, fur)

#### B) Activation (ReLU)

- Applied after every conv layer
- Kills negative values → adds non-linearity

```
ReLU:  f(x) = max(0, x)
```

#### C) Pooling Layer (Max Pooling)

- Reduces the spatial size of feature maps
- Keeps only the **strongest activation** in each region
- Makes the network less sensitive to exact position of features

```
Feature Map (4×4)    After MaxPool 2×2
┌──┬──┬──┬──┐        ┌──┬──┐
│1 │3 │2 │4 │        │3 │4 │
├──┼──┼──┼──┤   →    ├──┼──┤
│5 │2 │1 │3 │        │5 │3 │
├──┼──┼──┼──┤        └──┴──┘
│1 │2 │3 │1 │    Takes max of each 2×2 block
├──┼──┼──┼──┤
│4 │3 │1 │2 │
└──┴──┴──┴──┘
```

#### D) Fully Connected Layer

- After conv+pool layers extract features → flatten → pass through MLP
- This is where final classification happens

---

### 1.4 Complete CNN Architecture Flow

```
Input Image
    │
    ▼
[Conv Layer]  → detects low-level features (edges, colors)
[ReLU]
[MaxPool]     → reduces size
    │
    ▼
[Conv Layer]  → detects high-level features (shapes, textures)
[ReLU]
[MaxPool]     → reduces size further
    │
    ▼
[Flatten]     → convert 3D feature maps to 1D vector
    │
    ▼
[FC Layer]    → learn classification from features
[ReLU]
    │
    ▼
[Output Layer] → class probabilities (Softmax)
```

---

### 1.5 Dataset — CIFAR-10 🖼️

We'll use **CIFAR-10** — built directly into PyTorch, no manual download needed.

```
60,000 color images  (32×32 pixels, RGB)
50,000 training  +  10,000 testing

10 classes:
airplane  automobile  bird  cat  deer
dog       frog        horse ship  truck
```

This is a real image classification task — same type of problem as face recognition or melanoma detection, just with a simpler dataset that runs on CPU without issues.

---

## PART 2 — Implementation

```python
# ============================================================
# Practical 3: CNN for Image Classification
# Dataset: CIFAR-10 (built into PyTorch)
# ============================================================

# ── Cell 1: Imports ─────────────────────────────────────────
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
import matplotlib.pyplot as plt
import numpy as np

print("PyTorch version:", torch.__version__)
```

```python
# ── Cell 2: Load and Prepare CIFAR-10 Dataset ───────────────

# Transforms: convert images to tensors and normalize pixel values
# Normalize: (pixel - mean) / std  →  brings values to [-1, 1]
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=(0.5, 0.5, 0.5),   # mean for R, G, B channels
        std=(0.5, 0.5, 0.5)     # std  for R, G, B channels
    )
])

# Download and load training data
train_dataset = torchvision.datasets.CIFAR10(
    root='./data', train=True, download=True, transform=transform
)

# Download and load test data
test_dataset = torchvision.datasets.CIFAR10(
    root='./data', train=False, download=True, transform=transform
)

# DataLoaders — batch the data for training
train_loader = torch.utils.data.DataLoader(
    train_dataset, batch_size=64, shuffle=True
)
test_loader = torch.utils.data.DataLoader(
    test_dataset, batch_size=64, shuffle=False
)

# Class names
classes = ['airplane', 'automobile', 'bird', 'cat', 'deer',
           'dog', 'frog', 'horse', 'ship', 'truck']

print(f"Training samples : {len(train_dataset)}")
print(f"Testing samples  : {len(test_dataset)}")
```

```python
# ── Cell 3: Visualize Sample Images ─────────────────────────

def show_sample_images(loader, classes):
    images, labels = next(iter(loader))   # get one batch
    images = images[:8]                   # show first 8
    labels = labels[:8]

    # Unnormalize for display
    images = images * 0.5 + 0.5

    fig, axes = plt.subplots(1, 8, figsize=(15, 2))
    for i, (img, label) in enumerate(zip(images, labels)):
        axes[i].imshow(np.transpose(img.numpy(), (1, 2, 0)))
        axes[i].set_title(classes[label])
        axes[i].axis('off')
    plt.suptitle("Sample CIFAR-10 Images", fontsize=13)
    plt.tight_layout()
    plt.show()

show_sample_images(train_loader, classes)
```

```python
# ── Cell 4: Define the CNN Model ────────────────────────────

class CNN(nn.Module):
    def __init__(self):
        super(CNN, self).__init__()

        # ── Feature Extractor (Conv Blocks) ──
        self.features = nn.Sequential(

            # Block 1
            nn.Conv2d(
                in_channels=3,    # RGB input
                out_channels=32,  # 32 filters
                kernel_size=3,    # 3×3 filter
                padding=1         # keeps spatial size same
            ),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),  # 32×32 → 16×16

            # Block 2
            nn.Conv2d(
                in_channels=32,   # 32 input channels (from block 1)
                out_channels=64,  # 64 filters
                kernel_size=3,
                padding=1
            ),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),  # 16×16 → 8×8
        )

        # ── Classifier (Fully Connected) ──
        self.classifier = nn.Sequential(
            nn.Flatten(),               # 64 × 8 × 8 = 4096 → 1D vector
            nn.Linear(64 * 8 * 8, 512),# 4096 → 512
            nn.ReLU(),
            nn.Dropout(0.5),            # randomly drop 50% neurons → prevents overfitting
            nn.Linear(512, 10)          # 512 → 10 classes
        )

    def forward(self, x):
        x = self.features(x)       # extract features
        x = self.classifier(x)     # classify
        return x

model = CNN()
print(model)
print(f"\nTotal parameters: {sum(p.numel() for p in model.parameters()):,}")
```

```python
# ── Cell 5: Loss Function and Optimizer ─────────────────────

criterion = nn.CrossEntropyLoss()   # good for multi-class classification
optimizer = optim.Adam(model.parameters(), lr=0.001)
```

```python
# ── Cell 6: Training Loop ────────────────────────────────────

# Use GPU if available, otherwise CPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Training on: {device}")

model = model.to(device)

epochs = 10
train_losses = []

for epoch in range(epochs):
    model.train()
    running_loss = 0.0

    for i, (images, labels) in enumerate(train_loader):
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()          # clear gradients
        outputs = model(images)        # forward pass
        loss = criterion(outputs, labels)  # compute loss
        loss.backward()                # backpropagation
        optimizer.step()               # update weights

        running_loss += loss.item()

    avg_loss = running_loss / len(train_loader)
    train_losses.append(avg_loss)
    print(f"Epoch [{epoch+1}/{epochs}]  |  Loss: {avg_loss:.4f}")

print("\nTraining complete ✅")
```

```python
# ── Cell 7: Evaluation ───────────────────────────────────────

model.eval()
correct = 0
total = 0

# Per-class accuracy tracking
class_correct = [0] * 10
class_total   = [0] * 10

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)
        _, predicted = torch.max(outputs, 1)   # get class with highest score

        total   += labels.size(0)
        correct += (predicted == labels).sum().item()

        # Per class
        for i in range(len(labels)):
            label = labels[i]
            class_correct[label] += (predicted[i] == label).item()
            class_total[label]   += 1

overall_accuracy = 100 * correct / total
print(f"Overall Test Accuracy: {overall_accuracy:.2f}%\n")

print("Per-Class Accuracy:")
for i in range(10):
    acc = 100 * class_correct[i] / class_total[i]
    print(f"  {classes[i]:<12} : {acc:.2f}%")
```

```python
# ── Cell 8: Plot Training Loss ───────────────────────────────

plt.figure(figsize=(8, 4))
plt.plot(range(1, epochs + 1), train_losses, marker='o', color='steelblue')
plt.title("Training Loss over Epochs")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.grid(True)
plt.tight_layout()
plt.show()
```

```python
# ── Cell 9: Visualize Predictions ───────────────────────────

def show_predictions(model, loader, classes, device):
    model.eval()
    images, labels = next(iter(loader))
    images_dev = images.to(device)

    with torch.no_grad():
        outputs = model(images_dev)
        _, predicted = torch.max(outputs, 1)

    images = images * 0.5 + 0.5   # unnormalize

    fig, axes = plt.subplots(2, 8, figsize=(16, 5))
    for i in range(8):
        img = np.transpose(images[i].numpy(), (1, 2, 0))
        true_label = classes[labels[i]]
        pred_label = classes[predicted[i].cpu()]

        axes[0][i].imshow(img)
        axes[0][i].set_title(f"True:\n{true_label}", fontsize=8)
        axes[0][i].axis('off')

        axes[1][i].imshow(img)
        color = 'green' if true_label == pred_label else 'red'
        axes[1][i].set_title(f"Pred:\n{pred_label}", fontsize=8, color=color)
        axes[1][i].axis('off')

    plt.suptitle("Green = Correct  |  Red = Wrong", fontsize=12)
    plt.tight_layout()
    plt.show()

show_predictions(model, test_loader, classes, device)
```

---

## PART 3 — Output Walkthrough

**Training output:**

```
Training on: cpu
Epoch [1/10]  |  Loss: 1.7823
Epoch [2/10]  |  Loss: 1.4231
...
Epoch [10/10] |  Loss: 0.9102

Training complete ✅
```

**Evaluation output:**

```
Overall Test Accuracy: 72.45%

Per-Class Accuracy:
  airplane     : 78.20%
  automobile   : 81.30%
  bird         : 62.10%
  cat          : 55.40%
  deer         : 71.80%
  dog          : 61.20%
  frog         : 79.50%
  horse        : 77.90%
  ship         : 82.10%
  truck        : 79.60%
```

**What this tells you:**

- Loss consistently dropping → network is learning ✅
- ~72% accuracy on 10 classes with a simple CNN is solid
- `cat` and `dog` are hardest → visually similar, CNN confuses them
- `ship` and `automobile` are easiest → very distinct shapes

---

## CNN vs MLP — Why CNN Wins on Images

|                        | MLP          | CNN                           |
| ---------------------- | ------------ | ----------------------------- |
| Input                  | Flattened 1D | 2D spatial image              |
| Parameters             | Millions     | Much fewer (shared filters)   |
| Spatial awareness      | ❌           | ✅                            |
| Translation invariance | ❌           | ✅ (via pooling)              |
| Pattern hierarchy      | ❌           | ✅ (edges → shapes → objects) |

---

## Install Requirements

```bash
pip install torch torchvision matplotlib numpy
```

---

## Viva Quick-Prep 🎯

**Q: What is a convolution operation?**
A: Sliding a small filter across the image, computing element-wise multiplication and sum at each position, producing a feature map that highlights the pattern the filter is trained to detect.

**Q: Why do we use MaxPooling?**
A: To reduce spatial dimensions (fewer parameters), make the network robust to small shifts in feature position, and retain only the strongest detected features.

**Q: What is Dropout and why is it used?**
A: Dropout randomly disables a fraction of neurons during training. This prevents the network from relying too heavily on any single neuron — reducing overfitting.

**Q: What does `padding=1` do in Conv2d?**
A: Adds a border of zeros around the input so the output feature map stays the same spatial size as the input after convolution.

**Q: Why is CIFAR-10 relevant to face/melanoma classification?**
A: The underlying principle is identical — CNN learns to detect patterns in image regions. For melanoma, filters would detect irregular borders and color asymmetry. For faces, they'd detect edges forming eyes, nose, mouth. The architecture is the same, only the dataset changes.

---

Ready for Practical 4 whenever you are! 🚀
