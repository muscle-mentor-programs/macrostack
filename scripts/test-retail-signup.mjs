import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const url = process.env.TEST_URL || "http://127.0.0.1:5198";
const fixture = `
let handler;let user=null;
export const supabase={
 auth:{getUser:async()=>({data:{user}}),onAuthStateChange:fn=>{handler=fn;return {data:{subscription:{unsubscribe(){}}}}},signInWithPassword:async({email})=>{user={id:'owner',email,app_metadata:{account_type:window.personalAccount?'personal':'retailer'}};handler('SIGNED_IN',{user});return {data:{user}}},signOut:async()=>{user=null;handler('SIGNED_OUT',null);return {}}},
 functions:{invoke:async(name,body)=>{window.signupBody=body;return {data:{ok:true}}}},
 from:()=>({select(){return this},eq(){return this},limit:async()=>({data:window.existingStaff?[{id:"membership"}]:[]})}),
 rpc:async(action,body)=>{window.workspaceBody=body;if(window.failSave)return {error:{message:'Connection failed. Please retry.'}};return {data:{location_id:'store',organization_id:'business'}}}
};`;
try {
  await mkdir("outputs/retail", { recursive: true });
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/src/lib/supabase.js*", (r) =>
      r.fulfill({ contentType: "text/javascript", body: fixture }),
    );
    await page.route("**/retail?setup=1", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: "<h1>Workspace opened</h1>",
      }),
    );
    await page.goto(url + "/retailers");
    await page
      .getByRole("heading", { name: "Create your retailer account" })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `outputs/retail/signup-${width}.png`,
      fullPage: true,
    });
    await page.getByLabel("Your name", { exact: true }).fill("Retail Owner");
    await page.getByLabel("Work email").fill("owner@example.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill("SyntheticPassword123");
    await page
      .getByRole("button", { name: "Create account →", exact: true })
      .click();
    await page.getByRole("heading", { name: "Set up your business" }).waitFor();
    assert.equal(
      await page.evaluate(() => window.signupBody.body.account_type),
      "retailer",
    );
    await page
      .getByLabel("Business name", { exact: true })
      .fill("Nutrition Network");
    await page.getByLabel("First store name").fill("Boise");
    await page.getByLabel("Store timezone").selectOption("America/Boise");
    await page.evaluate(() => {
      window.failSave = true;
    });
    await page.getByRole("button", { name: "Create my workspace →" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Connection failed" })
      .waitFor();
    assert.equal(
      await page.getByLabel("Business name", { exact: true }).inputValue(),
      "Nutrition Network",
    );
    const body = await page.evaluate(() => window.workspaceBody);
    assert.equal(body.action, "start_workspace");
    assert.equal(body.payload.billing_email, "owner@example.invalid");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.evaluate(() => {
      window.failSave = false;
    });
    await page.getByRole("button", { name: "Create my workspace →" }).click();
    await page.getByRole("heading", { name: "Workspace opened" }).waitFor();
    assert.deepEqual(errors, []);
    await page.route("**/retail", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: "<h1>Retail workspace</h1>",
      }),
    );
    await page.addInitScript(() => {
      window.existingStaff = true;
    });
    await page.goto(url + "/retailers?signin=1");
    await page.getByRole("heading", { name: "Welcome back" }).waitFor();
    await page.evaluate(() => {
      window.personalAccount = true;
    });
    await page.getByLabel("Work email").fill("personal@example.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill("SyntheticPassword123");
    await page.getByRole("button", { name: "Sign in →", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "This is a personal or coach account" })
      .waitFor();
    await page.evaluate(() => {
      window.personalAccount = false;
    });
    await page.getByLabel("Work email").fill("staff@example.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill("SyntheticPassword123");
    await page.getByRole("button", { name: "Sign in →", exact: true }).click();
    await page
      .getByRole("heading", { name: "Retail workspace", exact: true })
      .waitFor();
    await page.close();
    console.log(
      "PASS retailer signup, workspace setup and retry at " + width + "px",
    );
  }
} finally {
  await browser.close();
}
