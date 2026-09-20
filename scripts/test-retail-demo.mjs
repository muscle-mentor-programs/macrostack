import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir("outputs/retail", { recursive: true });
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } }),
      errors = [],
      dataRequests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.url().includes(".supabase.co") || r.url().includes("/api/"))
        dataRequests.push(r.url());
    });
    await page.goto(
      (process.env.TEST_URL || "http://127.0.0.1:5198") + "/retail/demo",
    );
    await page.getByRole("heading", { name: "A clear next step." }).waitFor();
    const nav = page.getByRole("navigation", { name: "Demo navigation" });
    await nav.getByRole("button", { name: "Customers", exact: true }).click();
    await page.getByRole("button", { name: /Jordan Lee/ }).click();
    await page
      .getByLabel("Sample customer goal")
      .fill("A realistic routine for busy days");
    await page.getByRole("button", { name: "Continue →" }).click();
    await page
      .getByLabel("Sample customer-facing plan")
      .fill("Sample plan for the demo only.");
    await page.getByRole("button", { name: "Continue →" }).click();
    await page.getByRole("button", { name: "Publish sample plan" }).click();
    await page
      .getByRole("heading", { name: "A realistic routine for busy days" })
      .waitFor();
    await page.getByLabel("Practice a customer reply").fill("Demo check-in");
    await page.getByRole("button", { name: "Add demo reply" }).click();
    await page
      .getByText("Demo reply added locally. Nothing was sent.")
      .waitFor();
    for (const tab of [
      "Today",
      "Customers",
      "Consultation",
      "Member view",
      "Results",
    ]) {
      await nav.getByRole("button", { name: tab, exact: true }).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width} ${tab} overflow`,
      );
    }
    await page.getByLabel("Example store").selectOption("2");
    await page.getByRole("heading", { name: "Demo · Westside" }).waitFor();
    await page.screenshot({ path: `outputs/retail/demo-${width}.png` });
    await page.getByRole("button", { name: "Reset demo" }).click();
    await page.getByRole("heading", { name: "A clear next step." }).waitFor();
    assert.equal(await page.getByLabel("Example store").inputValue(), "0");
    assert.deepEqual(
      dataRequests,
      [],
      "demo never loads account data or calls application APIs",
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS isolated interactive retail demo ${width}px`);
  }
} finally {
  await browser.close();
}
