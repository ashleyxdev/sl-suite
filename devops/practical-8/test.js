const { Builder, By, Select, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// ─── Helper: small delay for readability ───────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Test runner (no framework needed for lab) ────────────────────────────
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

// ─── Main test suite ──────────────────────────────────────────────────────
async function runTests() {

    // Setup: launch Chrome
    const options = new chrome.Options();
    options.addArguments('--headless');       // run without opening visible window
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    const BASE_URL = 'http://localhost:3000';

    try {
        console.log('\n🧪 Running Calculator Tests...\n');

        // ── TC01: Page loads correctly ────────────────────────────────────
        console.log('TC01: Page Load');
        await driver.get(BASE_URL);
        const title = await driver.getTitle();
        assert(title === 'Simple Calculator', 'Page title is correct');

        // ── TC02: Addition ────────────────────────────────────────────────
        console.log('\nTC02: Addition (10 + 5 = 15)');
        await driver.get(BASE_URL);
        await driver.findElement(By.id('num1')).sendKeys('10');
        await driver.findElement(By.id('num2')).sendKeys('5');

        const opSelect = await driver.findElement(By.id('operator'));
        const select   = new Select(opSelect);
        await select.selectByValue('add');

        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);

        const addResult = await driver.findElement(By.id('result')).getText();
        assert(addResult === 'Result: 15', `Addition result: "${addResult}"`);

        // ── TC03: Subtraction ─────────────────────────────────────────────
        console.log('\nTC03: Subtraction (20 - 8 = 12)');
        await driver.get(BASE_URL);
        await driver.findElement(By.id('num1')).sendKeys('20');
        await driver.findElement(By.id('num2')).sendKeys('8');

        const opSelect2 = await driver.findElement(By.id('operator'));
        const select2   = new Select(opSelect2);
        await select2.selectByValue('subtract');

        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);

        const subResult = await driver.findElement(By.id('result')).getText();
        assert(subResult === 'Result: 12', `Subtraction result: "${subResult}"`);

        // ── TC04: Multiplication ──────────────────────────────────────────
        console.log('\nTC04: Multiplication (6 × 7 = 42)');
        await driver.get(BASE_URL);
        await driver.findElement(By.id('num1')).sendKeys('6');
        await driver.findElement(By.id('num2')).sendKeys('7');

        const opSelect3 = await driver.findElement(By.id('operator'));
        const select3   = new Select(opSelect3);
        await select3.selectByValue('multiply');

        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);

        const mulResult = await driver.findElement(By.id('result')).getText();
        assert(mulResult === 'Result: 42', `Multiplication result: "${mulResult}"`);

        // ── TC05: Division ────────────────────────────────────────────────
        console.log('\nTC05: Division (15 ÷ 3 = 5)');
        await driver.get(BASE_URL);
        await driver.findElement(By.id('num1')).sendKeys('15');
        await driver.findElement(By.id('num2')).sendKeys('3');

        const opSelect4 = await driver.findElement(By.id('operator'));
        const select4   = new Select(opSelect4);
        await select4.selectByValue('divide');

        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);

        const divResult = await driver.findElement(By.id('result')).getText();
        assert(divResult === 'Result: 5', `Division result: "${divResult}"`);

        // ── TC06: Divide by zero ──────────────────────────────────────────
        console.log('\nTC06: Divide by Zero (10 ÷ 0)');
        await driver.get(BASE_URL);
        await driver.findElement(By.id('num1')).sendKeys('10');
        await driver.findElement(By.id('num2')).sendKeys('0');

        const opSelect5 = await driver.findElement(By.id('operator'));
        const select5   = new Select(opSelect5);
        await select5.selectByValue('divide');

        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);

        const errorMsg = await driver.findElement(By.id('error')).getText();
        assert(
            errorMsg === 'Error: Cannot divide by zero',
            `Divide by zero error shown: "${errorMsg}"`
        );

        // ── TC07: Empty input validation ──────────────────────────────────
        console.log('\nTC07: Empty Input Validation');
        await driver.get(BASE_URL);
        // Don't fill in any numbers
        await driver.findElement(By.id('calculateBtn')).click();
        await sleep(500);

        const validationMsg = await driver.findElement(By.id('error')).getText();
        assert(
            validationMsg === 'Please enter valid numbers',
            `Validation message shown: "${validationMsg}"`
        );

    } finally {
        // Always close browser
        await driver.quit();

        // Results summary
        console.log('\n─────────────────────────────');
        console.log(`📊 Results: ${passed} passed, ${failed} failed`);
        console.log('─────────────────────────────\n');
    }
}

runTests().catch(console.error);
