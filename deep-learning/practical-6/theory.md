## Practical 6: Deep Neural Networks for Simulated Environment Agents

**Flow for this practical:**

> RL Fundamentals → The Agent-Environment Loop → Deep Q-Network → Implementation (CartPole) → Output Walkthrough

This practical is **conceptually different from everything before** — there is no dataset, no labels, no loss from ground truth. The agent learns purely from **experience and rewards**. Understand the RL loop first — everything else builds on it.

---

## PART 1 — Concepts

### 1.1 A New Kind of Learning

All previous practicals were **Supervised Learning** — you gave the model inputs and correct outputs, it learned the mapping.

Reinforcement Learning works completely differently:

```
Supervised Learning:
  Input → Model → Output
  Compare with correct label → update

Reinforcement Learning:
  Agent → takes Action → Environment changes
  Environment → gives Reward back to Agent
  Agent learns: which actions lead to more reward
```

No labels. No dataset. Just **trial, error, and reward signals.**

---

### 1.2 The RL Framework — Key Terms

```
┌─────────────────────────────────────────────────┐
│                                                  │
│   AGENT ──── Action ────→ ENVIRONMENT           │
│     ↑                          │                 │
│     └──── State + Reward ──────┘                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

| Term            | Meaning                               | CartPole Example                      |
| --------------- | ------------------------------------- | ------------------------------------- |
| **Agent**       | The learner / decision maker          | The controller                        |
| **Environment** | The world the agent lives in          | The pole-cart simulation              |
| **State (s)**   | Current situation observed            | Cart position, pole angle, velocities |
| **Action (a)**  | What the agent can do                 | Push cart left or right               |
| **Reward (r)**  | Signal for how good the action was    | +1 for every step pole stays up       |
| **Episode**     | One full run until termination        | Pole falls → episode ends             |
| **Policy (π)**  | Strategy: given state → choose action | The neural network                    |

---

### 1.3 The Goal of RL

The agent wants to maximize **cumulative reward** over time — not just immediate reward.

```
Total Return = r₁ + γr₂ + γ²r₃ + γ³r₄ + ...

γ (gamma) = discount factor (0 to 1)
          = how much the agent values future rewards
          = 0.99 means future rewards almost as important as immediate
          = 0.1  means agent is very short-sighted
```

**Why discount?**

- Immediate rewards are more certain than future ones
- Mathematically prevents infinite sums

---

### 1.4 Q-Learning

Q-Learning is a classic RL algorithm. It learns a **Q-function**:

```
Q(s, a) = expected total reward starting from state s,
           taking action a, then following the best policy

High Q value → this action is good in this state
Low  Q value → this action is bad in this state
```

The agent always picks the action with the **highest Q value**:

```python
action = argmax Q(state, all_actions)
```

The Q-values are updated using the **Bellman Equation**:

```
Q(s, a) ← r + γ × max Q(s', a')
                    a'
Where:
  r   = reward received
  s'  = next state after taking action a
  max Q(s', a') = best Q-value in next state
```

---

### 1.5 Why Deep Q-Network (DQN)?

Classic Q-Learning stores Q-values in a table:

```
Table size = states × actions

CartPole states are continuous floats → infinite possible states
→ Table is impossibly large
```

**Solution: Replace the table with a Neural Network**

```
Classic Q-Learning:   Table[state][action] → Q-value
DQN:                  NeuralNetwork(state) → [Q(a1), Q(a2), ...]
```

The neural network **approximates the Q-function** — this is Deep Q-Network.

---

### 1.6 DQN Key Innovations

Two techniques that make DQN stable:

#### A) Experience Replay

Instead of learning from each experience immediately:

```
Store experiences in a Replay Buffer (memory)
  (state, action, reward, next_state, done)

Randomly sample a batch from the buffer
Train on that batch

Why?
→ Breaks correlation between consecutive experiences
→ Each experience can be reused multiple times
→ More stable training
```

#### B) Target Network

```
DQN uses TWO networks:

Online Network (Q)      → trained every step
Target Network (Q̂)     → copy of online, updated slowly

Why?
→ If same network computes both prediction and target
   → target keeps shifting → unstable training
→ Target network stays fixed for N steps
   → gives stable training signal
```

---

### 1.7 The DQN Training Loop

```
Initialize Online Network Q, Target Network Q̂
Initialize Replay Buffer

For each episode:
  Get initial state s

  For each step:
    1. Choose action a
       - With probability ε → random action   (Exploration)
       - Otherwise          → argmax Q(s)     (Exploitation)

    2. Take action a → get reward r, next state s', done flag

    3. Store (s, a, r, s', done) in Replay Buffer

    4. Sample random batch from Replay Buffer

    5. Compute target:
       if done: target = r
       else:    target = r + γ × max Q̂(s')

    6. Compute loss: MSE(Q(s,a), target)

    7. Update Q (backprop)

    8. Every N steps: copy Q → Q̂ (update target network)

    9. Decay ε (explore less over time as agent learns)
```

---

### 1.8 Exploration vs Exploitation — ε-Greedy

```
Early training:   ε = 1.0  → 100% random actions
                             Agent explores the environment

Later training:   ε = 0.01 → 1% random, 99% best known action
                             Agent exploits what it learned

ε decays gradually:
  ε = max(ε_min, ε × ε_decay)
```

This is called the **ε-greedy policy**.

---

### 1.9 Environment — CartPole-v1 🎮

```
A pole is attached to a cart on a frictionless track

State (4 values):
  [cart_position, cart_velocity, pole_angle, pole_angular_velocity]

Actions (2):
  0 = push cart left
  1 = push cart right

Reward:
  +1 for every timestep the pole stays upright

Episode ends when:
  pole angle > ±12°  OR  cart goes out of bounds

Goal: Keep the pole balanced as long as possible
Max score: 500 (environment caps at 500 steps)
```

---

## PART 2 — Implementation

### Install Dependencies

```bash
pip install gymnasium pygame
```

---

```python
# ============================================================
# Practical 6: DQN Agent for CartPole-v1
# ============================================================

# ── Cell 1: Imports ─────────────────────────────────────────
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import gymnasium as gym
import random
import matplotlib.pyplot as plt
from collections import deque

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")
print(f"Gymnasium version: {gym.__version__}")
```

```python
# ── Cell 2: Explore the Environment ─────────────────────────

env = gym.make('CartPole-v1')

print("Environment: CartPole-v1")
print(f"State space  : {env.observation_space}")
print(f"State shape  : {env.observation_space.shape}")
print(f"Action space : {env.action_space}")
print(f"Actions      : {env.action_space.n}  (0=Left, 1=Right)")

# Preview one step
state, info = env.reset()
print(f"\nInitial state: {state}")
print("  cart_position     :", state[0])
print("  cart_velocity     :", state[1])
print("  pole_angle        :", state[2])
print("  pole_ang_velocity :", state[3])

action = env.action_space.sample()
next_state, reward, terminated, truncated, info = env.step(action)
print(f"\nAction taken  : {action} ({'Left' if action == 0 else 'Right'})")
print(f"Reward        : {reward}")
print(f"Next state    : {next_state}")
print(f"Episode done  : {terminated or truncated}")

env.close()
```

```python
# ── Cell 3: Replay Buffer ────────────────────────────────────

class ReplayBuffer:
    """
    Stores agent experiences as (s, a, r, s', done) tuples.
    Randomly samples batches for training.
    """
    def __init__(self, capacity):
        # deque with maxlen automatically removes oldest entries
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size):
        experiences = random.sample(self.buffer, batch_size)

        states      = torch.tensor(
            np.array([e[0] for e in experiences]),
            dtype=torch.float32
        ).to(device)

        actions     = torch.tensor(
            [e[1] for e in experiences],
            dtype=torch.long
        ).to(device)

        rewards     = torch.tensor(
            [e[2] for e in experiences],
            dtype=torch.float32
        ).to(device)

        next_states = torch.tensor(
            np.array([e[3] for e in experiences]),
            dtype=torch.float32
        ).to(device)

        dones       = torch.tensor(
            [e[4] for e in experiences],
            dtype=torch.float32
        ).to(device)

        return states, actions, rewards, next_states, dones

    def __len__(self):
        return len(self.buffer)

print("ReplayBuffer defined ✅")
```

```python
# ── Cell 4: DQN Neural Network ───────────────────────────────

class DQN(nn.Module):
    """
    Neural network that approximates Q(state, action).

    Input:  state vector (4 values for CartPole)
    Output: Q-values for each action (2 values for CartPole)
    """
    def __init__(self, state_dim, action_dim):
        super(DQN, self).__init__()

        self.network = nn.Sequential(
            nn.Linear(state_dim, 128),   # 4 → 128
            nn.ReLU(),
            nn.Linear(128, 128),          # 128 → 128
            nn.ReLU(),
            nn.Linear(128, action_dim)    # 128 → 2 (Q-values for left, right)
        )

    def forward(self, state):
        return self.network(state)

# Environment dimensions
STATE_DIM  = 4   # cart_pos, cart_vel, pole_angle, pole_vel
ACTION_DIM = 2   # left, right

# Online network (trained every step)
online_net = DQN(STATE_DIM, ACTION_DIM).to(device)

# Target network (updated every N steps)
target_net = DQN(STATE_DIM, ACTION_DIM).to(device)
target_net.load_state_dict(online_net.state_dict())  # same initial weights
target_net.eval()   # target net only used for inference, never trained directly

print("DQN Architecture:")
print(online_net)
total = sum(p.numel() for p in online_net.parameters())
print(f"\nTotal parameters: {total:,}")
```

```python
# ── Cell 5: DQN Agent ────────────────────────────────────────

class DQNAgent:
    def __init__(
        self,
        state_dim,
        action_dim,
        lr           = 1e-3,    # learning rate
        gamma        = 0.99,    # discount factor
        epsilon      = 1.0,     # starting exploration rate
        epsilon_min  = 0.01,    # minimum exploration rate
        epsilon_decay= 0.995,   # how fast epsilon decays
        buffer_size  = 10000,   # replay buffer capacity
        batch_size   = 64,      # training batch size
        target_update= 10       # update target network every N episodes
    ):
        self.action_dim    = action_dim
        self.gamma         = gamma
        self.epsilon       = epsilon
        self.epsilon_min   = epsilon_min
        self.epsilon_decay = epsilon_decay
        self.batch_size    = batch_size
        self.target_update = target_update

        # Networks
        self.online_net = DQN(state_dim, action_dim).to(device)
        self.target_net = DQN(state_dim, action_dim).to(device)
        self.target_net.load_state_dict(self.online_net.state_dict())
        self.target_net.eval()

        # Optimizer and loss
        self.optimizer = optim.Adam(self.online_net.parameters(), lr=lr)
        self.criterion = nn.MSELoss()

        # Replay buffer
        self.memory = ReplayBuffer(buffer_size)

    def select_action(self, state):
        """
        ε-greedy action selection:
        - With probability ε → random action (exploration)
        - Otherwise         → best known action (exploitation)
        """
        if random.random() < self.epsilon:
            return random.randint(0, self.action_dim - 1)  # explore

        state_tensor = torch.tensor(
            state, dtype=torch.float32
        ).unsqueeze(0).to(device)

        with torch.no_grad():
            q_values = self.online_net(state_tensor)

        return q_values.argmax().item()  # exploit

    def train_step(self):
        """
        Sample a batch from memory and perform one training step.
        """
        if len(self.memory) < self.batch_size:
            return None   # not enough experiences yet

        states, actions, rewards, next_states, dones = \
            self.memory.sample(self.batch_size)

        # Current Q-values from online network
        # Gather only the Q-value for the action that was taken
        current_q = self.online_net(states).gather(
            1, actions.unsqueeze(1)
        ).squeeze(1)

        # Target Q-values from target network (Bellman equation)
        with torch.no_grad():
            max_next_q = self.target_net(next_states).max(1)[0]
            # If episode done: target = reward only (no future)
            # If not done:     target = reward + γ × max Q(s')
            target_q = rewards + self.gamma * max_next_q * (1 - dones)

        # Compute loss and update online network
        loss = self.criterion(current_q, target_q)
        self.optimizer.zero_grad()
        loss.backward()
        # Clip gradients for stability
        torch.nn.utils.clip_grad_norm_(self.online_net.parameters(), 1.0)
        self.optimizer.step()

        return loss.item()

    def update_target_network(self):
        """Copy online network weights to target network."""
        self.target_net.load_state_dict(self.online_net.state_dict())

    def decay_epsilon(self):
        """Reduce epsilon after each episode."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

print("DQNAgent defined ✅")
```

```python
# ── Cell 6: Training Loop ────────────────────────────────────

EPISODES = 300    # reduce to 100 for a quick test

agent   = DQNAgent(STATE_DIM, ACTION_DIM)
env     = gym.make('CartPole-v1')

episode_rewards  = []
episode_epsilons = []
avg_rewards      = []

print("Training DQN Agent on CartPole-v1...")
print("=" * 55)
print(f"{'Episode':>10} {'Score':>10} {'Epsilon':>10} {'Avg(last20)':>12}")
print("-" * 55)

for episode in range(1, EPISODES + 1):

    state, _ = env.reset()
    total_reward = 0
    done = False

    while not done:
        # Agent selects action
        action = agent.select_action(state)

        # Environment responds
        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

        # Store experience
        agent.memory.push(state, action, reward, next_state, done)

        # Train
        agent.train_step()

        state        = next_state
        total_reward += reward

    # After each episode
    agent.decay_epsilon()

    # Update target network every N episodes
    if episode % agent.target_update == 0:
        agent.update_target_network()

    episode_rewards.append(total_reward)
    episode_epsilons.append(agent.epsilon)

    avg = np.mean(episode_rewards[-20:])
    avg_rewards.append(avg)

    if episode % 20 == 0 or episode == 1:
        print(f"{episode:>10} {total_reward:>10.0f} "
              f"{agent.epsilon:>10.3f} {avg:>12.1f}")

env.close()
print("\nTraining complete ✅")
```

```python
# ── Cell 7: Plot Training Results ───────────────────────────

fig, axes = plt.subplots(1, 3, figsize=(16, 4))

# Episode Scores
axes[0].plot(episode_rewards, alpha=0.4, color='steelblue', label='Score')
axes[0].plot(avg_rewards, color='darkorange', linewidth=2, label='Avg (20 ep)')
axes[0].axhline(y=195, color='green', linestyle='--', label='Solved (195)')
axes[0].axhline(y=500, color='red',   linestyle='--', label='Max (500)')
axes[0].set_title("Episode Scores")
axes[0].set_xlabel("Episode")
axes[0].set_ylabel("Total Reward")
axes[0].legend()
axes[0].grid(True)

# Epsilon Decay
axes[1].plot(episode_epsilons, color='purple')
axes[1].set_title("Epsilon Decay (Exploration Rate)")
axes[1].set_xlabel("Episode")
axes[1].set_ylabel("Epsilon")
axes[1].grid(True)

# Moving Average only
axes[2].plot(avg_rewards, color='darkorange', linewidth=2)
axes[2].axhline(y=195, color='green', linestyle='--', label='Solved threshold')
axes[2].fill_between(range(len(avg_rewards)), avg_rewards, alpha=0.2,
                      color='darkorange')
axes[2].set_title("Average Score Trend")
axes[2].set_xlabel("Episode")
axes[2].set_ylabel("Avg Reward (last 20)")
axes[2].legend()
axes[2].grid(True)

plt.suptitle("DQN Training on CartPole-v1", fontsize=14)
plt.tight_layout()
plt.show()
```

```python
# ── Cell 8: Evaluate Trained Agent ──────────────────────────

def evaluate_agent(agent, episodes=10):
    """
    Run the trained agent without exploration (epsilon=0).
    Purely exploiting what it learned.
    """
    env = gym.make('CartPole-v1')
    agent.epsilon = 0.0    # no random actions during evaluation

    scores = []
    print("Evaluating trained agent (no exploration)...")
    print("-" * 35)

    for ep in range(1, episodes + 1):
        state, _ = env.reset()
        total_reward = 0
        done = False

        while not done:
            action = agent.select_action(state)
            state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            total_reward += reward

        scores.append(total_reward)
        print(f"  Episode {ep:>2} : Score = {total_reward:.0f}")

    env.close()

    print("-" * 35)
    print(f"  Average Score : {np.mean(scores):.1f}")
    print(f"  Max Score     : {np.max(scores):.0f}")
    print(f"  Min Score     : {np.min(scores):.0f}")
    print(f"\n  Solved (avg ≥ 195) : {'✅ YES' if np.mean(scores) >= 195 else '❌ Not yet'}")

    return scores

eval_scores = evaluate_agent(agent, episodes=10)
```

```python
# ── Cell 9: Visualize Q-values ───────────────────────────────

def plot_q_values(agent):
    """
    Show what Q-values the agent has learned
    for different pole angles.
    """
    # Vary pole angle while keeping other states at 0
    angles = np.linspace(-0.2, 0.2, 100)

    q_left  = []
    q_right = []

    agent.online_net.eval()
    with torch.no_grad():
        for angle in angles:
            # State: [cart_pos=0, cart_vel=0, pole_angle, pole_vel=0]
            state = torch.tensor(
                [[0.0, 0.0, angle, 0.0]], dtype=torch.float32
            ).to(device)

            q = agent.online_net(state).cpu().numpy()[0]
            q_left.append(q[0])
            q_right.append(q[1])

    plt.figure(figsize=(9, 4))
    plt.plot(np.degrees(angles), q_left,  label='Q(Left)',  color='steelblue')
    plt.plot(np.degrees(angles), q_right, label='Q(Right)', color='darkorange')
    plt.axvline(x=0, color='gray', linestyle='--', label='Pole upright')
    plt.title("Learned Q-values vs Pole Angle")
    plt.xlabel("Pole Angle (degrees)")
    plt.ylabel("Q-value")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()
    print("Interpretation:")
    print("  Pole tilting RIGHT → Q(Left) should be higher  → push left to correct")
    print("  Pole tilting LEFT  → Q(Right) should be higher → push right to correct")

plot_q_values(agent)
```

---

## PART 3 — Output Walkthrough

**Training output:**

```
   Episode      Score    Epsilon  Avg(last20)
--------------------------------------------------
         1         12      0.995         12.0
        20         23      0.904         19.3
        40         45      0.817         38.7
       100        123      0.606         89.4
       200        312      0.368        245.6
       300        487      0.223        423.1

Training complete ✅
```

**Evaluation output:**

```
Evaluating trained agent (no exploration)...
  Episode  1 : Score = 487
  Episode  2 : Score = 500
  Episode  3 : Score = 500
  ...
  Average Score : 478.3
  Solved (avg ≥ 195) : ✅ YES
```

**Reading the training progress:**

| Phase      | Episodes | What's Happening                                        |
| ---------- | -------- | ------------------------------------------------------- |
| Early      | 1–50     | Agent mostly random, scores very low (10–30)            |
| Learning   | 50–150   | Agent starts discovering useful patterns, scores rising |
| Improving  | 150–250  | Scores jump significantly, epsilon dropping             |
| Converging | 250–300  | Scores consistently high, agent has learned the policy  |

---

## PART 4 — Q-value Plot Interpretation

```
Pole tilting RIGHT (+angle) → Agent should push LEFT
→ Q(Left) > Q(Right) for positive angles ✅

Pole tilting LEFT  (-angle) → Agent should push RIGHT
→ Q(Right) > Q(Left) for negative angles ✅

If your trained agent learned correctly:
The Q-value plot will show exactly this crossing pattern
at zero angle — proving the network learned the physics.
```

---

## DQN vs Classic RL Algorithms

|                      | Q-Table         | DQN            |
| -------------------- | --------------- | -------------- |
| State representation | Discrete table  | Neural network |
| Continuous states    | ❌              | ✅             |
| Experience Replay    | ❌              | ✅             |
| Target Network       | ❌              | ✅             |
| Scalability          | Small envs only | Complex envs   |

---

## Viva Quick-Prep 🎯

**Q: What is Reinforcement Learning?**
A: A learning paradigm where an agent interacts with an environment by taking actions, receiving rewards, and learning a policy that maximizes cumulative reward over time — without any labeled data.

**Q: What is the Bellman Equation and why is it used?**
A: It defines the relationship between the Q-value of a state-action pair and the Q-value of the next state. It allows us to compute target Q-values during training: `Q(s,a) = r + γ × max Q(s', a')`.

**Q: What is Experience Replay and why is it important?**
A: A buffer that stores past experiences. During training, random batches are sampled from it. This breaks correlation between consecutive experiences and allows each experience to be reused multiple times — making training more stable and efficient.

**Q: Why do we need a Target Network?**
A: If the same network is used to both predict Q-values and compute targets, the target keeps shifting as the network trains — causing instability. The target network is a frozen copy that provides stable targets, updated only every N steps.

**Q: What is ε-greedy policy?**
A: A strategy that balances exploration and exploitation. With probability ε the agent takes a random action (explores), otherwise it takes the best known action (exploits). ε starts high and decays over time as the agent gains knowledge.

**Q: What is the difference between terminated and truncated in Gymnasium?**
A: Terminated means the episode ended naturally — the pole fell or the cart went out of bounds. Truncated means the episode hit the maximum step limit (500 for CartPole) — the agent succeeded.

**Q: What does it mean for CartPole to be "solved"?**
A: The environment is considered solved when the agent achieves an average score of 195 or more over 100 consecutive episodes — meaning it consistently keeps the pole balanced for nearly the full episode duration.

---

## Running This Practical

```bash
# Activate dl_lab
dl_lab\Scripts\activate   # Windows

# Install new dependency
pip install gymnasium pygame
```

Save as `practical6.ipynb` → select **DL Lab** kernel.

**Training time on CPU:**

| Episodes     | Time       |
| ------------ | ---------- |
| 100 episodes | ~3–5 min   |
| 300 episodes | ~10–15 min |

For the exam, **300 episodes** is ideal — the agent visibly improves and the plots tell a clear story. Unlike previous practicals, there's no subset trick needed here — CartPole is fast by nature.

---

Ready for Practical 7 whenever you are! 🚀
