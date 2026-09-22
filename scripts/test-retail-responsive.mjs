import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const fixture = `
const rid='customer',lid='store',oid='org';
const relation={id:rid,location_id:lid,name:'Alexandra Montgomery',email:'alex@example.invalid',status:'active',goal:'Build consistent habits',assigned_to:'staff',revision:1,share_activity:true};
const staff=[{id:'membership',user_id:'staff',location_id:lid,organization_id:oid,name:'Store Manager',role:'manager',active:true}];
const loc={id:lid,organization_id:oid,operator_id:'operator',name:'Peak Nutrition — Downtown Wellness Center',timezone:'America/Chicago',join_code:'00000000-0000-4000-8000-000000000000',enabled:true};
let records={consultations:[],plans:[],assessments:[],tasks:[],notes:[],messages:[],threads:[],checkins:[],notifications:[],read_receipts:[],intakes:[],files:[]};
export async function deleteCustomer(rid,revision){window.deletedCustomer={rid,revision}}
export async function nutritionState(){return {client_id:"client",version:"v1",targets:{calories:2200,protein:160,carbs:220,fat:70},active_plan_id:null}}
export async function setStoreTargets(){}
export async function customerAvatarURL(){return null} export async function saveCustomerAvatar(){return 'relationship/photo.png'}
export async function retailerFoods(){return []}
export async function publishNutrition(){}
export async function storeMealPlans(){return []}
export async function storeBranding(){return {name:'Retail Network',logo_path:'fixture-logo'}}
export function brandLogoURL(path){return path?'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 132%22%3E%3Crect width=%22192%22 height=%22132%22 rx=%2212%22 fill=%22%2382ade1%22/%3E%3C/svg%3E':null}
export async function saveBranding(){}
export async function uploadBrandLogo(){return 'logo.png'}
export async function removeBrandLogo(){}
export async function context(){return {locations:[loc],organizations:[{id:oid,name:'Retail Network',brand_colors:{primary:'#CCAABB',secondary:'#88AA99'}}],staff,operators:[]}}
export async function relationships(){return {rows:[relation],count:1}}
export async function list(t){return t==='relationships'?[relation]:records[t]||[]}
export async function customer(){return structuredClone(records)}
export async function conversation(){return structuredClone(records)}
export async function directory(){return staff}
export async function inbox(){return []}
export async function queue(){return []}
export async function queueCounts(){return {open:0,due:0,invited:0}}
export async function reports(){return {customers:1,activated:1,consultations:0,scans:0,repeat_scans:0,tasks_due:0,tasks_completed:0,active_staff:1}}
export async function joinInfo(){return {name:'Pilot Store'}}
export async function intakeForm(){return [{id:'goal',label:'Your goals'}]}
export async function appRecords(){return {shared:true,rows:[{id:'record',name:'Customer',goal_calories:2200}],has_more:false}}
export async function shareAppRecords(){}
export async function appPhotoURL(){return ''}
export async function activity(){return {shared:true,foods:[],weights:[]}}
export async function uploadFile(){}
export async function historyPage(){return {items:[],next:null}}
export async function billing(){return {url:'https://checkout.stripe.com/test'}}
export async function verifyPhone(){}
export async function operations(){return {counts:{failed:window.deliveryRetried?0:1},items:window.deliveryRetried?[]:[{id:"retry",name:"Synthetic customer",channel:"email",status:"failed",error_code:"retries_exhausted",retryable:true}],worker:null,scheduler_credential:false,configuration:{},setup:{staff:1,resources:0,customers:1,billing:null}}}
export async function retryDelivery(){window.deliveryRetried=true}
export async function fileURL(){return ''}
export async function command(action,p){
 window.lastRetailCommand={action,p};
 if(window.failRetailSave&&action==='consultation')throw Error('Simulated connection failure. Retry.');
 if(action==='consultation'){const old=records.consultations.find(c=>c.id===p.id);const row={...p,id:p.id||'draft',status:'draft',updated_at:new Date().toISOString(),revision:(old?.revision||0)+1};records.consultations=[row];return structuredClone(row)}
 if(action==='publish'){records.consultations[0].status='published';records.plans=[{id:'plan',published_at:new Date().toISOString(),content:records.consultations[0].draft}];return {published:true}}
 return {};
}`;
await mkdir("outputs/retail", { recursive: true });
try {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*.supabase.co/**", (r) => r.abort());
    await page.route("**/src/retail/api.js*", (r) =>
      r.fulfill({ contentType: "text/javascript", body: fixture }),
    );
    await page.route(/\/$/, (r) =>
      r.fulfill({
        contentType: "text/html",
        body: `<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"></head><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>`,
      }),
    );
    await page.goto(process.env.TEST_URL || "http://127.0.0.1:5198");
    await page.waitForFunction(
      () => window.__vite_plugin_react_preamble_installed__,
    );
    await page.evaluate(async () => {
      const { default: React } =
          await import("/node_modules/.vite/deps/react.js"),
        {
          default: { createRoot },
        } = await import("/node_modules/.vite/deps/react-dom_client.js");
      const hook = await (await fetch("/src/hooks/useSubscription.js")).text();
      const { default: store } = await import(
        hook.match(/from ["']([^"']+)["']/)[1]
      );
      await import("/src/index.css");
      await import("/src/software.css");
      document.documentElement.className = "ocean-light";
      window.retailTestStore = store;
      store.setState({
        currentUser: { id: "staff", name: "Store Manager", role: "client" },
        isAuthenticated: true,
      });
      const { default: App } = await import("/src/retail/RetailApp.jsx");
      createRoot(document.getElementById("root")).render(
        React.createElement(App),
      );
    });
    await page
      .getByRole("heading", { name: "Today", exact: true })
      .waitFor();
    await page.locator(".retail-top .retail-store-identity img").waitFor();
    const logoBox = await page
      .locator(".retail-top .retail-store-identity img")
      .boundingBox();
    assert.equal(Math.round(logoBox.width), width <= 600 ? 138 : 192);
    assert.equal(Math.round(logoBox.height), width <= 600 ? 108 : 132);
    for (const tab of ["Today", "Customers", "Inbox", "Library", "Store"]) {
      await page
        .getByRole("navigation", { name: "Store navigation" })
        .getByRole("button", { name: tab, exact: true })
        .click();
      await page.getByRole("heading", { name: tab, exact: true }).waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width} ${tab}: overflow`,
      );
    }
    await page
      .getByText("Delivery issues and queued reminders (1)", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Queue retry", exact: true })
      .click();
    await page
      .getByText("Delivery issues and queued reminders (0)", { exact: true })
      .waitFor();
    assert.equal(await page.locator('.retail').first().evaluate(el => el.style.getPropertyValue('--retail-brand-primary')), '#CCAABB');
    await page.screenshot({ path: `outputs/retail/store-${width}.png` });
    await page
      .getByRole("navigation", { name: "Store navigation" })
      .getByRole("button", { name: "Library", exact: true })
      .click();
    await page
      .getByText("Start with an editable draft", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Review draft", exact: true })
      .first()
      .click();
    await page.getByRole("dialog").waitFor();
    assert.equal(
      await page.getByLabel("Resource title").inputValue(),
      "New customer intake",
    );
    assert.equal(
      await page.getByLabel("Publish for staff use").isChecked(),
      false,
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(
      await page.evaluate(() => window.lastRetailCommand.p.published),
      false,
    );

    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Customers", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Customers", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("navigation", { name: "Store navigation" })
        .getByRole("button", { name: "Customers", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    await page.screenshot({
      path: `outputs/retail/customer-directory-${width}.png`,
    });
    await page
      .getByLabel("Actions for Alexandra Montgomery")
      .getByRole("button", { name: "Nutrition", exact: true })
      .click();
    await page
      .getByRole("heading", {
        name: "Food database & meal plan builder",
        exact: true,
      })
      .waitFor();
    await page
      .getByRole("button", { name: "← Customers", exact: true })
      .click();
    await page
      .getByLabel("Actions for Alexandra Montgomery")
      .getByRole("button", { name: "Food journal", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Food journal", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "← Customers", exact: true })
      .click();
    await page.getByRole("button", { name: /Alexandra Montgomery/ }).click();
    for (const tab of [
      "Intake",
      "Nutrition",
      "Food journal",

      "Progress",
      "History & exports",
      "Check-ins",
      "Chat",
      "Overview",
    ]) {
      if (
        [
          "Intake",
          "History & exports",
          "Connection settings",
          "Private notes",
        ].includes(tab)
      ) {
        await page.locator(".retail-profile-more>summary").click();
        await page
          .locator(".retail-profile-more")
          .getByRole("button", { name: tab, exact: true })
          .click();
      } else
        await page
          .locator(".retail-tabbar")
          .getByRole("button", { name: tab, exact: true })
          .click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width} ${tab}: overflow`,
      );
    }
    await page.locator('.retail-profile-more>summary').click();
    await page.locator('.retail-profile-more').getByRole('button',{name:'Connection settings',exact:true}).click();
    await page.getByRole('button',{name:'Delete customer',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Confirm deletion',exact:true}).isDisabled(),true);
    const confirmation = page.getByLabel('Type customer name to confirm');
    await confirmation.click();
    await confirmation.pressSequentially('Alexandra Montgomery', {delay:20});
    assert.equal(await confirmation.inputValue(), 'Alexandra Montgomery');
    assert.equal(await confirmation.evaluate(el => document.activeElement === el), true);
    assert.equal(await page.getByRole('button',{name:'Confirm deletion',exact:true}).isDisabled(),false);
    await confirmation.press('Escape');
    await page.getByRole('dialog',{name:'Delete customer',exact:true}).waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'Delete customer',exact:true}).evaluate(el => document.activeElement === el),true);
    await page.getByRole('navigation',{name:'Customer sections'}).getByRole('button',{name:'Overview',exact:true}).click();
    await page.screenshot({
      path: `outputs/retail/customer-overview-${width}.png`,
    });
    await page.getByRole("button", { name: "Start consultation" }).click();
    await page.evaluate(() => {
      window.failRetailSave = true;
    });
    await page.getByLabel("Customer goal").fill("Build consistency");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Simulated connection failure" })
      .waitFor();
    assert.equal(
      await page.getByLabel("Customer goal").inputValue(),
      "Build consistency",
    );
    await page.evaluate(() => {
      window.failRetailSave = false;
    });
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Saved" }).waitFor();
    await page
      .getByRole("button", { name: "2. Build recommendations", exact: true })
      .click();
    await page
      .getByLabel("Nutrition guidance — visible to customer")
      .fill("Prioritize consistent meals.");
    await page
      .getByRole("button", { name: "3. Schedule follow-up", exact: true })
      .click();
    await page.getByLabel("First check-in", { exact: true }).fill("2026-10-01");
    await page.getByLabel("Return scan", { exact: true }).fill("2026-10-20");
    await page
      .getByRole("button", { name: "4. Review & publish", exact: true })
      .click();
    assert.equal(
      await page
        .locator(".retail-tabbar button")
        .evaluateAll((nodes) =>
          nodes.every((el) => el.scrollWidth <= el.clientWidth + 2),
        ),
      true,
      "Tab labels do not squeeze or overlap",
    );
    await page.screenshot({ path: `outputs/retail/consultation-${width}.png` });
    await page.getByRole("button", { name: "Publish customer plan" }).click();
    await page.getByRole("button", { name: "Start consultation" }).waitFor();
    await page
      .locator(".retail-tabbar")
      .getByRole("button", { name: "Nutrition", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Build consistency", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Update guidance", exact: true })
      .click();
    assert.equal(
      await page
        .getByLabel("Nutrition guidance — visible to customer")
        .inputValue(),
      "Prioritize consistent meals.",
    );
    await page
      .getByLabel("Agreed habits — visible to customer", { exact: true })
      .fill("Consistent breakfast");
    await page
      .getByRole("navigation", { name: "Store navigation" })
      .getByRole("button", { name: "Customers", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Save and close" })
      .waitFor();
    await page
      .getByRole("button", { name: "Save & close", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Continue guidance draft", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "← Customers", exact: true })
      .click();
    await page.evaluate(() =>
      window.retailTestStore.setState({
        currentUser: { id: "member", name: "Alexandra", role: "client" },
      }),
    );
    await page.getByRole("button", { name: /Your plan & progress/ }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Start consultation", exact: true })
        .count(),
      0,
      "Customer has no staff editing tools",
    );
    assert.equal(
      await page
        .getByRole("heading", { name: "Private notes", exact: true })
        .count(),
      0,
      "Customer cannot see private notes",
    );
    for (const tab of [
      "Intake",
      "Check-ins",
      "Chat",
      "History & exports",
      "Connection settings",
    ]) {
      if (
        [
          "Intake",
          "History & exports",
          "Connection settings",
          "Private notes",
        ].includes(tab)
      ) {
        await page.locator(".retail-profile-more>summary").click();
        await page
          .locator(".retail-profile-more")
          .getByRole("button", { name: tab, exact: true })
          .click();
      } else
        await page
          .locator(".retail-tabbar")
          .getByRole("button", { name: tab, exact: true })
          .click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width} customer ${tab}`,
      );
    }
    await page.getByRole('checkbox',{name:'Enable service reminders',exact:true}).click();
    await page.getByRole('navigation',{name:'Customer sections'}).getByRole('button',{name:'Overview',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Save or discard'}).waitFor();
    await page.getByRole('button',{name:'Discard unsaved changes',exact:true}).click();
    await page.getByRole('navigation',{name:'Customer sections'}).getByRole('button',{name:'Overview',exact:true}).click();
    await page.getByRole('heading',{name:'Customer focus',exact:true}).waitFor();
    assert.equal(await page.locator(".retail-theme-control").count(), 0);
    if (width > 1050) {
      const controls = await page
        .locator(".retail-header-controls")
        .evaluate((el) =>
          [...el.children].map((child) => {
            const r = child.getBoundingClientRect();
            return r.top + r.height / 2;
          }),
        );
      assert.ok(
        Math.max(...controls) - Math.min(...controls) < 3,
        "Desktop header controls align on one row",
      );
    }
    if (width < 768) {
      await page.evaluate(() => {
        Object.defineProperty(visualViewport, "height", {
          configurable: true,
          value: 420,
        });
        Object.defineProperty(visualViewport, "offsetTop", {
          configurable: true,
          value: 160,
        });
        visualViewport.dispatchEvent(new Event("resize"));
      });
      await page.waitForTimeout(80);
      const b = await page.locator(".retail").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
      assert.ok(
        Math.abs(b.top - 160) < 2 && Math.abs(b.bottom - 580) < 2,
        "Retail viewport follows keyboard shrink and pan",
      );
    }
    assert.deepEqual(errors, [], `${width}: runtime errors`);
    await page.close();
    console.log(
      `PASS retail staff/customer workflows, save recovery and layout ${width}px`,
    );
  }
} finally {
  await browser.close();
}
