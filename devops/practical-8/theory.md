# 📚 Part 1: What is Selenium?

Selenium is a **browser automation tool.** It lets you write code that controls a real browser — clicking buttons, filling forms, reading text — exactly like a human user would, but automatically.

```
Without Selenium (manual testing):
  Developer opens browser
  Types in the form
  Clicks submit
  Checks if success page shows
  Repeats this 50 times for every change 😫

With Selenium (automated testing):
  Script opens browser
  Types in the form
  Clicks submit
  Checks if success page shows
  Repeats this 50 times in 30 seconds ✅
```

---

## What Selenium is NOT

```
❌ Not a testing framework (like Jest or Mocha)
❌ Not a tool for unit testing functions
✅ It is a browser controller
✅ Used for end-to-end (E2E) testing
✅ Tests the app the way a real user uses it
```

---

## Types of Testing (context)

```
Unit Tests        →  test one function in isolation
Integration Tests →  test multiple modules together
E2E Tests         →  test the whole app through the browser  ← Selenium lives here
```

---

# 🏗️ Part 2: Selenium Architecture

```
Your Test Script (JS)
        │
        │  sends commands
        ▼
  Selenium WebDriver
        │
        │  talks via WebDriver Protocol (HTTP)
        ▼
  ChromeDriver / GeckoDriver
  (browser-specific driver)
        │
        │  controls
        ▼
  Real Browser (Chrome / Firefox)
        │
        │  loads
        ▼
  Your Web Application
```

| Component | Role |
|---|---|
| **Test Script** | Your code — what to click, what to type, what to check |
| **WebDriver** | The library (`selenium-webdriver` npm package) |
| **ChromeDriver** | Bridge between WebDriver and Chrome specifically |
| **Browser** | The actual Chrome window that opens and runs |

---

# 💻 Part 3: Project Structure

```
practical-8/
│
├── index.html          ← Simple Calculator (the app to test)
├── test.js             ← Selenium test script
├── package.json        ← Node.js dependencies
└── package-lock.json   ← Lockfile
```

This practical tests a **static HTML page** (no server framework) — just a calculator with addition, subtraction, multiplication, division, and input validation.

---

# 🧮 Part 4: The Code

## `index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple Calculator</title>
    <style>
        body  { font-family: Arial, sans-serif; max-width: 400px; margin: 60px auto; }
        input { width: 100%; padding: 10px; margin: 6px 0; box-sizing: border-box; font-size: 16px; }
        select { width: 100%; padding: 10px; margin: 6px 0; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #3498db; color: white;
                 border: none; font-size: 16px; cursor: pointer; border-radius: 4px; }
        button:hover { background: #2980b9; }
        #result { margin-top: 20px; padding: 16px; background: #f0f0f0;
                  border-radius: 4px; font-size: 18px; min-height: 30px; }
        #error  { color: red; margin-top: 10px; min-height: 20px; }
    </style>
</head>
<body>
    <h2>🧮 Simple Calculator</h2>

    <input  type="number" id="num1" placeholder="Enter first number"  />
    <select id="operator">
        <option value="add">➕ Addition</option>
        <option value="subtract">➖ Subtraction</option>
        <option value="multiply">✖️ Multiplication</option>
        <option value="divide">➗ Division</option>
    </select>
    <input  type="number" id="num2" placeholder="Enter second number" />
    <button id="calculateBtn" onclick="calculate()">Calculate</button>

    <div id="result"></div>
    <div id="error"></div>

    <script>
        function calculate() {
            const num1     = parseFloat(document.getElementById('num1').value);
            const num2     = parseFloat(document.getElementById('num2').value);
            const operator = document.getElementById('operator').value;
            const resultEl = document.getElementById('result');
            const errorEl  = document.getElementById('error');

            resultEl.textContent = '';
            errorEl.textContent  = '';

            if (isNaN(num1) || isNaN(num2)) {
                errorEl.textContent = 'Please enter valid numbers';
                return;
            }

            let result;
            switch (operator) {
                case 'add':      result = num1 + num2; break;
                case 'subtract': result = num1 - num2; break;
                case 'multiply': result = num1 * num2; break;
                case 'divide':
                    if (num2 === 0) {
                        errorEl.textContent = 'Error: Cannot divide by zero';
                        return;
                    }
                    result = num1 / num2;
                    break;
            }

            resultEl.textContent = `Result: ${result}`;
        }
    </script>
</body>
</html>
```

---

## `test.js` — Selenium Test Script

The test script opens a **headless Chrome browser**, navigates to the calculator, fills in numbers, clicks calculate, and checks the result — all automatically.

**Test cases covered:**

| # | Test | What it checks |
|---|---|---|
| TC01 | Page Load | Title says "Simple Calculator" |
| TC02 | Addition | 10 + 5 = 15 |
| TC03 | Subtraction | 20 - 8 = 12 |
| TC04 | Multiplication | 6 × 7 = 42 |
| TC05 | Division | 15 ÷ 3 = 5 |
| TC06 | Divide by Zero | Shows error message |
| TC07 | Empty Input | Shows validation message |

```javascript
const { Builder, By, Select, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

async function runTests() {

    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    const BASE_URL = 'http://localhost:3000';

    try {
        console.log('\n🧪 Running Calculator Tests...\n');

        // TC01: Page loads correctly
        console.log('TC01: Page Load');
        await driver.get(BASE_URL);
        const title = await driver.getTitle();
        assert(title === 'Simple Calculator', 'Page title is correct');

        // TC02: Addition
        console.log('\nTC02: Addition (10 + 5 = 15)');
        await driver.get(BASE_URL);
        await driver.findElement(By.id('num1')).sendKeys('10');
        await driver.findElement(By.id('num2')).sendKeys('5');
        const select = new Select(await driver.findElement(By.id('operator')));
        await select.selectByValue('add');
        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);
        const addResult = await driver.findElement(By.id('result')).getText();
        assert(addResult === 'Result: 15', `Addition result: "${addResult}"`);

        // TC03–TC07: Subtraction, Multiplication, Division,
        //            Divide by Zero, Empty Input
        // (same pattern — fill inputs, select operator, click, check result)

        // ... (full test code in test.js file)

    } finally {
        await driver.quit();
        console.log('\n─────────────────────────────');
        console.log(`📊 Results: ${passed} passed, ${failed} failed`);
        console.log('─────────────────────────────\n');
    }
}

runTests().catch(console.error);
```

> The full `test.js` has all 7 test cases. Above is a shortened version showing the pattern.

---

# ▶️ Part 5: Prerequisites

### 1. Google Chrome

Your machine needs Chrome installed. Selenium uses it (in headless mode — no visible window).

```bash
# Check if Chrome is installed
google-chrome --version
```

If not installed:

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y google-chrome-stable

# Windows / Mac
# Download from https://www.google.com/chrome/
```

### 2. Node.js

```bash
# Check if Node.js is installed
node --version
```

If not installed, download from [https://nodejs.org](https://nodejs.org) (LTS version recommended).

---

# 🚀 Part 6: Running the Practical

### Step 1: Install Dependencies

```bash
# Navigate to the practical folder
cd practical-8

# Install selenium-webdriver and chromedriver
npm install
```

---

### Step 2: Serve the HTML page

`index.html` is a static file — it needs a local HTTP server. Use `npx serve`:

```bash
# Start a local server on port 3000
npx -y serve -l 3000
```

This serves `index.html` at **http://localhost:3000**. Keep this terminal open.

---

### Step 3: Run the Selenium Tests

Open a **second terminal** (keep the server running in the first one):

```bash
# Run the test script
node test.js
```

---

### Expected Output

```
🧪 Running Calculator Tests...

TC01: Page Load
  ✅ PASS: Page title is correct

TC02: Addition (10 + 5 = 15)
  ✅ PASS: Addition result: "Result: 15"

TC03: Subtraction (20 - 8 = 12)
  ✅ PASS: Subtraction result: "Result: 12"

TC04: Multiplication (6 × 7 = 42)
  ✅ PASS: Multiplication result: "Result: 42"

TC05: Division (15 ÷ 3 = 5)
  ✅ PASS: Division result: "Result: 5"

TC06: Divide by Zero (10 ÷ 0)
  ✅ PASS: Divide by zero error shown: "Error: Cannot divide by zero"

TC07: Empty Input Validation
  ✅ PASS: Validation message shown: "Please enter valid numbers"

─────────────────────────────
📊 Results: 7 passed, 0 failed
─────────────────────────────
```

---

### Common Issues & Fixes

| Problem | Fix |
|---|---|
| `ChromeDriver not found` | Make sure `npm install` completed — the `chromedriver` package auto-downloads it |
| `ChromeDriver version mismatch` | Run `npm update chromedriver` to match your Chrome version |
| `Connection refused localhost:3000` | The HTTP server isn't running — start it with `npx -y serve -l 3000` in another terminal |
| `Chrome not found` | Install Google Chrome on your machine |
| Tests hang forever | Press `Ctrl+C` and re-run — ChromeDriver may have crashed |

---

# ✅ Summary

```
What you have:
  index.html    → Static calculator with 4 operations + validation
  test.js       → 7 Selenium test cases that automate browser interaction

What you did:
  npx serve     → Served the HTML page on localhost:3000
  node test.js  → Selenium opened headless Chrome, tested everything automatically

Key takeaway:
  Selenium automates what a human tester does manually.
  No framework needed — just selenium-webdriver + chromedriver + Chrome.
```

---
