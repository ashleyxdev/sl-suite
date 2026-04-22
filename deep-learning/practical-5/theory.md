## Practical 5: Deep Convolutional GAN (DCGAN)

**Flow for this practical:**

> The Story of GANs → GAN Concepts → DCGAN Architecture → Implementation → Output Walkthrough

This practical is **conceptually unique** — unlike all previous practicals, there is no "correct answer" to learn from. The network learns by competing with itself. Understand the game theory behind it first.

---

## PART 1 — Concepts

### 1.1 The Story — Ian Goodfellow & the Birth of GANs

In **2014**, Ian Goodfellow invented Generative Adversarial Networks at a bar in Montreal, after a debate with colleagues about whether machines could generate realistic data.

He went home that same night and coded the first GAN — it worked on the first try.

The paper **"Generative Adversarial Networks"** (Goodfellow et al., 2014) is one of the most cited papers in deep learning history. Yann LeCun (Chief AI Scientist at Meta) called it:

> _"The most interesting idea in the last 10 years in machine learning."_

---

### 1.2 What is a GAN?

A GAN consists of **two neural networks** competing against each other in a zero-sum game.

```
GENERATOR (G)                    DISCRIMINATOR (D)
─────────────                    ─────────────────
Takes random noise               Takes an image
Generates fake images            Decides: Real or Fake?

Goal: Fool the Discriminator     Goal: Catch the Generator
```

They train simultaneously — each getting better by trying to beat the other.

---

### 1.3 The Counterfeiter Analogy

This is the most intuitive way to understand GANs:

```
┌─────────────────────────────────────────────────────┐
│  Generator   =  Counterfeiter                        │
│  Makes fake currency, tries to pass it as real       │
│                                                      │
│  Discriminator = Detective / Police                  │
│  Examines currency, catches fakes                    │
│                                                      │
│  Training loop:                                      │
│  Counterfeiter gets better → Detective gets better   │
│  Detective gets better     → Counterfeiter improves  │
│                                                      │
│  End result: Counterfeiter so good that Detective    │
│  can no longer tell real from fake                   │
└─────────────────────────────────────────────────────┘
```

---

### 1.4 GAN Training — The Minimax Game

The two networks play a mathematical game:

```
D tries to MAXIMIZE its ability to distinguish real vs fake
G tries to MINIMIZE D's ability to do that

min_G  max_D  [ log D(x) + log(1 - D(G(z))) ]

Where:
  x = real image
  z = random noise vector
  G(z) = fake image generated from noise
  D(x) = probability D assigns to real image being real
  D(G(z)) = probability D assigns to fake image being real
```

In plain English:

- D wants `D(real) → 1` and `D(fake) → 0`
- G wants `D(fake) → 1` (fool D into thinking fake is real)

---

### 1.5 The Training Loop Step by Step

```
Step 1: Sample random noise z
        z = [0.2, -0.8, 1.3, ...]  (latent vector)

Step 2: Generator creates fake image
        fake_image = G(z)

Step 3: Train Discriminator
        Real images → D should output 1
        Fake images → D should output 0
        Update D weights

Step 4: Train Generator
        Feed fake images to D
        G wants D to output 1
        Update G weights (D weights frozen)

Step 5: Repeat thousands of times
```

---

### 1.6 What is DCGAN?

**DCGAN = Deep Convolutional GAN** (Radford et al., 2015)

Regular GAN used fully connected layers. DCGAN replaced them with **convolutional layers** — making it much better at generating images.

Key DCGAN rules:

```
1. Replace pooling with strided convolutions (D)
   and transposed convolutions (G)
2. Use Batch Normalization in both G and D
3. No fully connected hidden layers
4. ReLU in Generator, LeakyReLU in Discriminator
5. Tanh at Generator output, Sigmoid at Discriminator output
```

---

### 1.7 Generator Architecture

Generator takes **random noise → builds image** using Transposed Convolutions (upsampling):

```
Noise Vector (100,)
      │
      ▼
[ConvTranspose2d]  →  4×4
[BatchNorm][ReLU]

      │
      ▼
[ConvTranspose2d]  →  8×8
[BatchNorm][ReLU]

      │
      ▼
[ConvTranspose2d]  →  16×16
[BatchNorm][ReLU]

      │
      ▼
[ConvTranspose2d]  →  32×32
[Tanh]             →  pixel values in [-1, 1]

Output: Fake Image (1×32×32)  ← grayscale
```

---

### 1.8 Discriminator Architecture

Discriminator takes **image → Real or Fake** using regular Convolutions (downsampling):

```
Input Image (1×32×32)
      │
      ▼
[Conv2d][LeakyReLU]  →  16×16

      │
      ▼
[Conv2d][BatchNorm][LeakyReLU]  →  8×8

      │
      ▼
[Conv2d][BatchNorm][LeakyReLU]  →  4×4

      │
      ▼
[Conv2d][Sigmoid]  →  single value (0 to 1)

Output: Probability of being Real
```

---

### 1.9 Dataset — MNIST ✏️

We use **MNIST** (handwritten digits) for DCGAN:

```
70,000 grayscale images (28×28 pixels)
60,000 training + 10,000 testing
10 digit classes: 0 through 9

We resize to 32×32 for clean DCGAN architecture
Goal: Generate realistic handwritten digits from noise
```

MNIST is ideal for CPU — simple enough to show meaningful results in reasonable time.

---

## PART 2 — Implementation

```python
# ============================================================
# Practical 5: DCGAN — Generate Handwritten Digits
# Dataset: MNIST
# ============================================================

# ── Cell 1: Imports ─────────────────────────────────────────
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
import matplotlib.pyplot as plt
import numpy as np
import os

# Device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Fixed noise for visualization (same noise across epochs to track progress)
LATENT_DIM = 100    # size of the random noise vector
FIXED_NOISE = torch.randn(64, LATENT_DIM, 1, 1, device=device)
```

```python
# ── Cell 2: Load MNIST Dataset ───────────────────────────────

transform = transforms.Compose([
    transforms.Resize(32),             # resize 28×28 → 32×32
    transforms.ToTensor(),             # pixel values 0-255 → 0-1
    transforms.Normalize((0.5,), (0.5,))  # normalize to [-1, 1] (matches Tanh output)
])

train_dataset = torchvision.datasets.MNIST(
    root='./data', train=True, download=True, transform=transform
)

train_loader = torch.utils.data.DataLoader(
    train_dataset,
    batch_size=128,
    shuffle=True,
    num_workers=0      # set 0 to avoid multiprocessing issues on Windows
)

print(f"Dataset size : {len(train_dataset)}")
print(f"Batches      : {len(train_loader)}")
print(f"Image shape  : {train_dataset[0][0].shape}")
```

```python
# ── Cell 3: Visualize Real Samples ──────────────────────────

real_images, _ = next(iter(train_loader))
grid = torchvision.utils.make_grid(
    real_images[:32], nrow=8, normalize=True
)

plt.figure(figsize=(10, 4))
plt.imshow(grid.permute(1, 2, 0).numpy(), cmap='gray')
plt.title("Real MNIST Images (what we want to generate)")
plt.axis('off')
plt.tight_layout()
plt.show()
```

```python
# ── Cell 4: Weight Initialization ───────────────────────────

# DCGAN paper specifies: initialize weights from
# Normal distribution with mean=0, std=0.02
def initialize_weights(model):
    for module in model.modules():
        if isinstance(module, (nn.Conv2d, nn.ConvTranspose2d)):
            nn.init.normal_(module.weight.data, mean=0.0, std=0.02)
        elif isinstance(module, nn.BatchNorm2d):
            nn.init.normal_(module.weight.data, mean=1.0, std=0.02)
            nn.init.constant_(module.bias.data, 0)
```

```python
# ── Cell 5: Generator Model ──────────────────────────────────

class Generator(nn.Module):
    def __init__(self, latent_dim):
        super(Generator, self).__init__()

        # Takes noise vector (latent_dim, 1, 1)
        # Progressively upsamples to (1, 32, 32)
        self.network = nn.Sequential(

            # Layer 1: latent_dim → 256 feature maps, 4×4
            nn.ConvTranspose2d(
                in_channels=latent_dim,
                out_channels=256,
                kernel_size=4,
                stride=1,
                padding=0,
                bias=False
            ),
            nn.BatchNorm2d(256),
            nn.ReLU(True),
            # Output: (256, 4, 4)

            # Layer 2: 256 → 128, 8×8
            nn.ConvTranspose2d(256, 128, 4, 2, 1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(True),
            # Output: (128, 8, 8)

            # Layer 3: 128 → 64, 16×16
            nn.ConvTranspose2d(128, 64, 4, 2, 1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(True),
            # Output: (64, 16, 16)

            # Layer 4: 64 → 1 (grayscale), 32×32
            nn.ConvTranspose2d(64, 1, 4, 2, 1, bias=False),
            nn.Tanh()
            # Output: (1, 32, 32) — pixel values in [-1, 1]
        )

    def forward(self, z):
        return self.network(z)

G = Generator(LATENT_DIM).to(device)
initialize_weights(G)

print("Generator Architecture:")
print(G)
total_g = sum(p.numel() for p in G.parameters())
print(f"\nGenerator parameters: {total_g:,}")
```

```python
# ── Cell 6: Discriminator Model ──────────────────────────────

class Discriminator(nn.Module):
    def __init__(self):
        super(Discriminator, self).__init__()

        # Takes image (1, 32, 32)
        # Progressively downsamples to a single probability
        self.network = nn.Sequential(

            # Layer 1: 1 → 64, 16×16
            # No BatchNorm in first layer (DCGAN paper recommendation)
            nn.Conv2d(1, 64, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            # Output: (64, 16, 16)

            # Layer 2: 64 → 128, 8×8
            nn.Conv2d(64, 128, 4, 2, 1, bias=False),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, inplace=True),
            # Output: (128, 8, 8)

            # Layer 3: 128 → 256, 4×4
            nn.Conv2d(128, 256, 4, 2, 1, bias=False),
            nn.BatchNorm2d(256),
            nn.LeakyReLU(0.2, inplace=True),
            # Output: (256, 4, 4)

            # Layer 4: 256 → 1 (real/fake probability)
            nn.Conv2d(256, 1, 4, 1, 0, bias=False),
            nn.Sigmoid()
            # Output: (1, 1, 1) → single probability
        )

    def forward(self, img):
        return self.network(img).view(-1)  # flatten to (batch_size,)

D = Discriminator().to(device)
initialize_weights(D)

print("Discriminator Architecture:")
print(D)
total_d = sum(p.numel() for p in D.parameters())
print(f"\nDiscriminator parameters: {total_d:,}")
```

```python
# ── Cell 7: Loss and Optimizers ──────────────────────────────

criterion  = nn.BCELoss()    # Binary Cross Entropy

# Separate optimizers for G and D
# DCGAN paper recommends Adam with lr=0.0002, beta1=0.5
optimizer_G = optim.Adam(G.parameters(), lr=0.0002, betas=(0.5, 0.999))
optimizer_D = optim.Adam(D.parameters(), lr=0.0002, betas=(0.5, 0.999))

# Label values
REAL_LABEL = 1.0
FAKE_LABEL = 0.0

print("Loss function : BCELoss")
print("Optimizer     : Adam (lr=0.0002, beta1=0.5)")
```

```python
# ── Cell 8: Training Loop ────────────────────────────────────

EPOCHS = 20    # reduce to 5 for quick test on CPU

G_losses = []
D_losses = []

print("Starting DCGAN Training...")
print("=" * 55)

for epoch in range(EPOCHS):
    G_loss_epoch = 0
    D_loss_epoch = 0

    for i, (real_images, _) in enumerate(train_loader):

        batch_size = real_images.size(0)
        real_images = real_images.to(device)

        # ── Step 1: Train Discriminator ──────────────────────
        # Goal: maximize log(D(x)) + log(1 - D(G(z)))
        D.zero_grad()

        # -- Real images: D should output 1 --
        real_labels = torch.full(
            (batch_size,), REAL_LABEL, dtype=torch.float, device=device
        )
        output_real = D(real_images)
        loss_D_real = criterion(output_real, real_labels)

        # -- Fake images: D should output 0 --
        noise = torch.randn(batch_size, LATENT_DIM, 1, 1, device=device)
        fake_images = G(noise)
        fake_labels = torch.full(
            (batch_size,), FAKE_LABEL, dtype=torch.float, device=device
        )
        output_fake = D(fake_images.detach())  # detach: don't update G here
        loss_D_fake = criterion(output_fake, fake_labels)

        # -- Total Discriminator loss --
        loss_D = loss_D_real + loss_D_fake
        loss_D.backward()
        optimizer_D.step()

        # ── Step 2: Train Generator ───────────────────────────
        # Goal: maximize log(D(G(z)))  i.e. fool D
        G.zero_grad()

        # G wants D to think fake images are real
        output_fake_for_G = D(fake_images)
        loss_G = criterion(output_fake_for_G, real_labels)  # target = real!

        loss_G.backward()
        optimizer_G.step()

        G_loss_epoch += loss_G.item()
        D_loss_epoch += loss_D.item()

    avg_G = G_loss_epoch / len(train_loader)
    avg_D = D_loss_epoch / len(train_loader)
    G_losses.append(avg_G)
    D_losses.append(avg_D)

    print(f"Epoch [{epoch+1:02d}/{EPOCHS}]  "
          f"Loss_D: {avg_D:.4f}  "
          f"Loss_G: {avg_G:.4f}")

print("\nTraining complete ✅")
```

```python
# ── Cell 9: Plot Training Losses ─────────────────────────────

plt.figure(figsize=(10, 4))
plt.plot(G_losses, label='Generator Loss',     color='darkorange', marker='o')
plt.plot(D_losses, label='Discriminator Loss', color='steelblue',  marker='s')
plt.title("DCGAN Training Losses")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()
```

```python
# ── Cell 10: Visualize Generated Images ──────────────────────

G.eval()
with torch.no_grad():
    fake_images = G(FIXED_NOISE).cpu()

grid = torchvision.utils.make_grid(
    fake_images[:32], nrow=8, normalize=True
)

plt.figure(figsize=(10, 4))
plt.imshow(grid.permute(1, 2, 0).numpy(), cmap='gray')
plt.title(f"Generated Images after {EPOCHS} Epochs")
plt.axis('off')
plt.tight_layout()
plt.show()
```

```python
# ── Cell 11: Real vs Fake Side-by-Side ───────────────────────

real_batch, _ = next(iter(train_loader))

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Real
real_grid = torchvision.utils.make_grid(
    real_batch[:32], nrow=8, normalize=True
)
axes[0].imshow(real_grid.permute(1, 2, 0).numpy(), cmap='gray')
axes[0].set_title("Real Images", fontsize=14)
axes[0].axis('off')

# Fake
fake_grid = torchvision.utils.make_grid(
    fake_images[:32], nrow=8, normalize=True
)
axes[1].imshow(fake_grid.permute(1, 2, 0).numpy(), cmap='gray')
axes[1].set_title(f"Generated (Fake) Images", fontsize=14)
axes[1].axis('off')

plt.suptitle("DCGAN — Real vs Generated", fontsize=15)
plt.tight_layout()
plt.show()
```

```python
# ── Cell 12: Generate from Custom Noise ──────────────────────

# Each noise vector = a different image
# Interpolating between two noise vectors morphs one image into another

G.eval()
custom_noise = torch.randn(16, LATENT_DIM, 1, 1, device=device)

with torch.no_grad():
    custom_images = G(custom_noise).cpu()

grid = torchvision.utils.make_grid(
    custom_images, nrow=8, normalize=True
)

plt.figure(figsize=(10, 3))
plt.imshow(grid.permute(1, 2, 0).numpy(), cmap='gray')
plt.title("16 Unique Images Generated from 16 Different Noise Vectors")
plt.axis('off')
plt.tight_layout()
plt.show()
```

---

## PART 3 — Output Walkthrough

**Training output:**

```
Epoch [01/20]  Loss_D: 0.4821  Loss_G: 2.3412
Epoch [02/20]  Loss_D: 0.3921  Loss_G: 2.7821
Epoch [05/20]  Loss_D: 0.5123  Loss_G: 2.1034
Epoch [10/20]  Loss_D: 0.6234  Loss_G: 1.8923
Epoch [20/20]  Loss_D: 0.6891  Loss_G: 1.6234
```

**Reading the losses — this is important:**

| Situation      | Loss_D   | Loss_G    | Meaning                               |
| -------------- | -------- | --------- | ------------------------------------- |
| Early training | Very low | Very high | D easily catches all fakes            |
| Good training  | ~0.5–0.7 | ~1.5–2.0  | D is confused — G is improving        |
| G winning      | Near 0   | Near 0    | D fooled, but may mean mode collapse  |
| D winning      | Near 0   | Very high | G failing to generate anything useful |

Ideal: **both losses fluctuate in a moderate range** — neither network completely dominates.

---

## PART 4 — Key Concepts Summary

### Why LeakyReLU in Discriminator?

```
Regular ReLU : f(x) = max(0, x)    → zero gradient for x < 0
LeakyReLU    : f(x) = max(0.2x, x) → small gradient for x < 0

Discriminator needs gradients to flow even for
negative activations → LeakyReLU prevents dead neurons
```

### Why Tanh at Generator Output?

```
Tanh output range: [-1, 1]
Images normalized to:  [-1, 1]  (via transforms.Normalize with mean=0.5, std=0.5)

They must match — Tanh ensures generated pixels
are in the same range as real training images
```

### Why detach() during Discriminator training?

```python
output_fake = D(fake_images.detach())
```

```
Without detach: gradients flow back through D → into G
                → G gets updated when we only want D updated

With detach:    fake_images treated as a constant
                → only D weights are updated
```

---

## GAN Problems to Know for Viva

| Problem                  | What Happens                            | Sign                                   |
| ------------------------ | --------------------------------------- | -------------------------------------- |
| **Mode Collapse**        | G generates same image repeatedly       | All generated images look identical    |
| **Vanishing Gradient**   | D too strong, G gets no useful gradient | G_loss stays very high, no improvement |
| **Training Instability** | Losses oscillate wildly                 | Loss_D and Loss_G spike unpredictably  |

---

## Viva Quick-Prep 🎯

**Q: What is a GAN?**
A: A GAN is a framework of two competing networks — a Generator that creates fake data and a Discriminator that distinguishes real from fake. They train together in a minimax game until the Generator produces data indistinguishable from real.

**Q: What makes DCGAN different from the original GAN?**
A: DCGAN replaces fully connected layers with convolutional and transposed convolutional layers, adds batch normalization, and uses specific activation functions — making it far more effective at generating images.

**Q: What is a transposed convolution?**
A: It is the reverse of a regular convolution — instead of reducing spatial size, it increases it. Used in the Generator to upsample from a small noise vector to a full-size image.

**Q: What is mode collapse?**
A: A failure mode where the Generator finds one or a few outputs that always fool the Discriminator, and produces only those — losing diversity. Instead of generating all 10 digits, it might only generate '1' repeatedly.

**Q: Why do we use separate optimizers for G and D?**
A: G and D have opposing objectives. Using separate optimizers lets us update each network independently — training D on real+fake images, then training G to fool D, in alternating steps.

**Q: Why is the Generator's target label `real_label=1.0` during Generator training?**
A: The Generator wants the Discriminator to classify its fake images as real. So we compute Generator loss as if the fake images were real — the loss pushes G to produce images D scores as 1.0 (real).

**Q: Who invented GANs and when?**
A: Ian Goodfellow in 2014, while at the University of Montreal. The DCGAN variant was proposed by Alec Radford et al. in 2015.

---

## Running This Practical

```bash
# Same dl_lab environment
# torchvision is already installed from Practical 3
# No new installs needed!
```

**Save as** `practical5.ipynb` → select **DL Lab** kernel.

**Training time on CPU:**

| Epochs    | Time       |
| --------- | ---------- |
| 5 epochs  | ~15–20 min |
| 20 epochs | ~60–80 min |

**For exam/quick demo — use 5 epochs:**

Change in Cell 8:

```python
EPOCHS = 5    # quick run — images will be blurry but visible
```

Even at 5 epochs you'll see the generator starting to produce digit-like shapes — enough to demonstrate the concept clearly to an examiner.

---

Ready for Practical 6 whenever you are! 🚀
