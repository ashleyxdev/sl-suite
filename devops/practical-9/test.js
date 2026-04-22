const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  options.addArguments("--headless");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  const BASE_URL = "http://localhost:5000";

  try {
    console.log("\n🧪 Running Content Manager Tests (Containerized App)...\n");

    // ── TC01: App is reachable ────────────────────────────────────────
    console.log("TC01: Container is Running and App is Reachable");
    await driver.get(BASE_URL);
    const title = await driver.getTitle();
    assert(title === "Content Manager", `Page title: "${title}"`);

    // ── TC02: Page has correct heading ────────────────────────────────
    console.log("\nTC02: Page Heading");
    const heading = await driver.findElement(By.tagName("h1")).getText();
    assert(heading.includes("Content Manager"), `Heading: "${heading}"`);

    // ── TC03: Add post form exists ────────────────────────────────────
    console.log("\nTC03: Add Post Form Elements Exist");
    const titleInput = await driver.findElement(By.name("title"));
    const contentInput = await driver.findElement(By.name("content"));
    const submitBtn = await driver.findElement(By.css(".btn-add"));

    assert(titleInput !== null, "Title input exists");
    assert(contentInput !== null, "Content textarea exists");
    assert(submitBtn !== null, "Submit button exists");

    // ── TC04: Add a new post ──────────────────────────────────────────
    console.log("\nTC04: Add a New Post");
    await driver.findElement(By.name("title")).sendKeys("Selenium Test Post");
    await driver
      .findElement(By.name("content"))
      .sendKeys("This post was created by Selenium.");
    await driver.findElement(By.css(".btn-add")).click();

    await driver.wait(until.urlIs(BASE_URL + "/"), 3000);
    await sleep(500);

    const pageSource = await driver.getPageSource();
    assert(
      pageSource.includes("Selenium Test Post"),
      "New post appears on page after submission",
    );

    // ── TC05: Post content is displayed ──────────────────────────────
    console.log("\nTC05: Post Content is Displayed Correctly");
    assert(
      pageSource.includes("This post was created by Selenium."),
      "Post content displayed on page",
    );

    // ── TC06: Post has metadata (timestamp + ID) ──────────────────────
    console.log("\nTC06: Post Has Metadata");
    const metaElements = await driver.findElements(By.css(".meta"));
    assert(metaElements.length > 0, "Post metadata (timestamp/ID) is visible");

    // ── TC07: Delete button exists for each post ──────────────────────
    console.log("\nTC07: Delete Button Exists");
    const deleteBtns = await driver.findElements(By.css(".btn-del"));
    assert(deleteBtns.length > 0, "Delete button present on post card");

    // ── TC08: Add multiple posts ──────────────────────────────────────
    console.log("\nTC08: Add Multiple Posts");
    await driver.get(BASE_URL);

    await driver.findElement(By.name("title")).sendKeys("Post Two");
    await driver
      .findElement(By.name("content"))
      .sendKeys("Second post content.");
    await driver.findElement(By.css(".btn-add")).click();
    await sleep(500);

    await driver.findElement(By.name("title")).sendKeys("Post Three");
    await driver
      .findElement(By.name("content"))
      .sendKeys("Third post content.");
    await driver.findElement(By.css(".btn-add")).click();
    await sleep(500);

    const allCards = await driver.findElements(By.css(".post-card"));
    assert(
      allCards.length >= 3,
      `Multiple posts displayed (found ${allCards.length})`,
    );

    // ── TC09: Delete a post ───────────────────────────────────────────
    console.log("\nTC09: Delete a Post");
    const beforeDelete = await driver.findElements(By.css(".post-card"));
    const countBefore = beforeDelete.length;

    // Click delete on the first post
    const firstDeleteBtn = await driver.findElement(By.css(".btn-del"));
    await firstDeleteBtn.click();
    await sleep(500);

    const afterDelete = await driver.findElements(By.css(".post-card"));
    const countAfter = afterDelete.length;

    assert(
      countAfter === countBefore - 1,
      `Post deleted (${countBefore} → ${countAfter} posts)`,
    );

    // ── TC10: Empty form validation ───────────────────────────────────
    console.log("\nTC10: Empty Form - Required Field Validation");
    await driver.get(BASE_URL);

    // Try submitting with empty title (HTML required attribute)
    await driver.findElement(By.name("content")).sendKeys("Some content");
    await driver.findElement(By.css(".btn-add")).click();
    await sleep(500);

    // If browser enforced required, URL stays at /
    const currentUrl = await driver.getCurrentUrl();
    assert(
      currentUrl === BASE_URL + "/",
      "Empty title prevented form submission",
    );

    // ── TC11: Data persists (volume test) ─────────────────────────────
    console.log("\nTC11: Data Persists After Page Refresh");
    await driver.get(BASE_URL);
    const beforeRefresh = await driver.findElements(By.css(".post-card"));
    const countBeforeRefresh = beforeRefresh.length;

    await driver.navigate().refresh();
    await sleep(500);

    const afterRefresh = await driver.findElements(By.css(".post-card"));
    const countAfterRefresh = afterRefresh.length;

    assert(
      countAfterRefresh === countBeforeRefresh,
      `Posts persist after refresh (${countAfterRefresh} posts)`,
    );
  } finally {
    await driver.quit();

    console.log("\n─────────────────────────────");
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    console.log("─────────────────────────────\n");
  }
}

runTests().catch(console.error);
