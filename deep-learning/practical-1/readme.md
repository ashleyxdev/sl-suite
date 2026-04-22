## Practical 1: Vector Addition in TensorFlow

Let me decide the flow for this one:

> **Concepts → Implementation → Output Walkthrough**

Since this is the very first practical, the concepts here lay the foundation for everything ahead. Let's not skip them.

---

## PART 1 — Concepts

### 1.1 What is TensorFlow?

TensorFlow is an **open-source numerical computing library** by Google, designed specifically for Machine Learning and Deep Learning.

At its core, it does one thing really well:
> **Perform mathematical operations on data, efficiently, at scale** (on CPU/GPU)

---

### 1.2 What is a Tensor?

Everything in TensorFlow revolves around a **Tensor**.

A Tensor is simply a **multi-dimensional array of numbers**.

Think of it like this:

```
A single number        → Scalar   → 0D Tensor     e.g.  42
A list of numbers      → Vector   → 1D Tensor     e.g.  [1, 2, 3]
A grid of numbers      → Matrix   → 2D Tensor     e.g.  [[1,2],[3,4]]
A cube of numbers      →            3D Tensor     e.g.  image (height × width × channels)
```

So a **Vector is just a 1D Tensor** — a simple list of numbers.

---

### 1.3 What is Vector Addition?

It's element-wise addition of two vectors of the **same size**.

```
A = [1, 2, 3]
B = [4, 5, 6]

A + B = [1+4, 2+5, 3+6] = [5, 7, 9]
```

Each element at position `i` in A is added to the element at position `i` in B.

**Rule:** Both vectors must have the **same length**.

---

### 1.4 Why do this in TensorFlow and not plain Python?

| Plain Python (lists) | TensorFlow |
|---|---|
| Slow loops | Optimized C++ backend |
| CPU only | Runs on GPU automatically |
| No ML integration | Native to the ML ecosystem |
| Manual math | Built-in ops for everything |

In Deep Learning, you'll be adding, multiplying, and transforming **millions** of numbers. TensorFlow is built exactly for this.

---

### 1.5 Key TensorFlow concepts used in this practical

| Concept | What it does |
|---|---|
| `tf.constant()` | Creates a fixed tensor (like declaring a variable) |
| `tf.add()` | Adds two tensors element-wise |
| `.numpy()` | Converts a tensor back to a regular NumPy array for display |

---

## PART 2 — Implementation

```python
# ============================================================
# Practical 1: Simple Vector Addition using TensorFlow
# ============================================================

# Step 1: Import TensorFlow
import tensorflow as tf

# Step 2: Define two vectors as TensorFlow constants
# tf.constant() creates a tensor whose values cannot be changed
a = tf.constant([1, 2, 3, 4, 5], dtype=tf.float32)
b = tf.constant([10, 20, 30, 40, 50], dtype=tf.float32)

# Step 3: Perform vector addition
# tf.add() adds two tensors element-wise
result = tf.add(a, b)

# Step 4: Display the results
print("Vector A       :", a.numpy())
print("Vector B       :", b.numpy())
print("A + B (result) :", result.numpy())

# Step 5: Show tensor metadata
print("\n--- Tensor Info ---")
print("Shape of result :", result.shape)
print("Dtype of result :", result.dtype)
```

---

## PART 3 — Output Walkthrough

**Expected Output:**
```
Vector A       : [ 1.  2.  3.  4.  5.]
Vector B       : [10. 20. 30. 40. 50.]
A + B (result) : [11. 22. 33. 44. 55.]

--- Tensor Info ---
Shape of result : (5,)
Dtype of result : <dtype: 'float32'>
```

**Understanding each line:**

- `[ 1.  2.  3.  4.  5.]` — The `.` after each number shows it's `float32`, not integer
- `[11. 22. 33. 44. 55.]` — Element-wise addition confirmed ✅
- `Shape: (5,)` — A 1D tensor with 5 elements → this is your vector
- `dtype: float32` — 32-bit floating point, standard in deep learning (balances precision and memory)

---

## Viva Quick-Prep 🎯

**Q: What is a tensor?**
A: A multi-dimensional array of numbers. The fundamental data structure in TensorFlow.

**Q: Why use `tf.constant()` and not a Python list?**
A: `tf.constant()` creates a TensorFlow tensor which can be processed on GPU and integrated into ML pipelines. A plain Python list cannot.

**Q: What does `dtype=tf.float32` mean?**
A: It specifies the data type of each element — 32-bit floating point numbers. This is the standard in deep learning.

**Q: What does `.numpy()` do?**
A: Converts a TensorFlow tensor into a NumPy array so it can be printed or used with regular Python/NumPy code.

---

Ready for **Practical 2** whenever you are! 🚀
