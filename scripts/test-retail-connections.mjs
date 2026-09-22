import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const origin = process.env.TEST_URL || "http://127.0.0.1:5198";
const api = `let messages=[{id:'first',author_id:'staff',body:'Welcome to your store chat',created_at:'2026-09-22T10:00:00Z'}];export async function list(){return [{id:'relationship',location_id:'store'}]} export async function conversation(){return {messages}} export function brandLogoURL(){return null} export async function storeBranding(){return {name:'Peak Nutrition'}} export async function command(action,payload){window.commandPayload={action,payload};if(action==='message')messages.push({id:payload.id,author_id:'member',body:payload.body,created_at:new Date().toISOString()});return {relationship_id:'relationship'}} export async function shareAppRecords(){window.shared=true} export async function saveBranding(oid,name,path){window.brandSaved={oid,name,path}} export async function uploadBrandLogo(){return 'org/logo.png'} export async function removeBrandLogo(){} export async function storeMealPlans(){return []} export async function setStoreTargets(){}
export async function customerAvatarURL(){return null} export async function saveCustomerAvatar(rid,file){window.avatarSaved={rid,name:file?.name};return 'relationship/photo.png'}
export async function retailerFoods(){return []}
export async function publishNutrition(...args){window.nutrition=args}`;
const auth = `let user=null;let listener;export const supabase={rpc:async()=>({data:{email:'member@example.invalid',has_account:!window.newAccount,store:'Downtown',brand:'Peak Nutrition',logo_path:null}}),auth:{getUser:async()=>({data:{user}}),onAuthStateChange:fn=>{listener=fn;window.authenticate=()=>{user={id:'member',email:'member@example.invalid'};listener('SIGNED_IN',{user})};return {data:{subscription:{unsubscribe(){}}}}},signOut:async()=>{user=null;listener('SIGNED_OUT',null)}}};`;
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.error(e.message);
    });
    await page.route("**/src/retail/api.js*", (r) =>
      r.fulfill({ contentType: "text/javascript", body: api }),
    );
    await page.route("**/src/data/foods*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const FOODS=[{id:'rice',name:'White Rice',brand:'Test Brand',servingSize:100,servingUnit:'g',calories:250,protein:5,carbs:50,fat:1}];`,
      }),
    );
    await page.route("**/src/lib/supabase.js*", (r) =>
      r.fulfill({ contentType: "text/javascript", body: auth }),
    );
    await page.route("**/src/store/index.js*", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `function useStore(selector){const state={currentUser:{id:"member"},customFoods:[],clients:[],hiddenFoodIds:[],setNavHidden:()=>{}};return selector?selector(state):state};useStore.getState=()=>({signup:async()=>{window.signedUp=true;window.authenticate();return {ok:true}},login:async()=>{window.signedIn=true;window.authenticate();return {ok:true}},loadAllData:async()=>{}});export default useStore;`,
      }),
    );
    await page.route("**/qa-retail**", (r) => {
      const type = new URL(r.request().url()).searchParams.get("type");
      r.fulfill({
        contentType: "text/html",
        body: `<html class="ocean-dark"><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import '/src/index.css';import '/src/retail/retail.css';import Component from '/src/retail/${type}.jsx';ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Component,{customer:{id:'relationship',name:'Alex'},editable:true,organization:{id:'org',name:'Peak Nutrition'},relationship:{id:'relationship',name:'Alex'},onSaved:async()=>{},onClose:()=>{}}));</script></body></html>`,
      });
    });
    await page.route("**/messages?store=1", (r) =>
      r.fulfill({ contentType: "text/html", body: "<h1>Linked messages</h1>" }),
    );
    for (const isNew of [false, true]) {
      await page.addInitScript((v) => {
        window.newAccount = v;
      }, isNew);
      await page.goto(
        origin +
          "/qa-retail?type=CustomerInvite&invite=00000000-0000-4000-8000-000000000000",
      );
      await page.getByLabel("Password", { exact: true }).waitFor();
      assert.equal(
        await page.getByLabel("Invited email").inputValue(),
        "member@example.invalid",
      );
      if (isNew) await page.getByLabel("Your name").fill("Alex");
      await page
        .getByLabel("Password", { exact: true })
        .fill("SyntheticPassword123");
      await page
        .getByRole("button", {
          name: isNew ? "Create user account" : "Sign in",
          exact: true,
        })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      assert.equal(
        await dialog
          .getByRole("button", { name: "Link my account" })
          .isDisabled(),
        true,
      );
      await dialog.getByRole("checkbox").first().check();
      await dialog.getByRole("checkbox").nth(1).check();
      await dialog.getByRole("button", { name: "Link my account" }).click();
      await page.getByRole("heading", { name: "Linked messages" }).waitFor();
    }
    await page.goto(origin + "/qa-retail?type=Branding");
    await page.getByLabel("Portal display name").fill("Peak Wellness");
    await page.getByRole("button", { name: "Save display name" }).click();
    assert.equal(
      await page.evaluate(() => window.brandSaved.name),
      "Peak Wellness",
    );
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 100;
      c.height = 100;
      const x = c.getContext("2d");
      x.fillStyle = "blue";
      x.fillRect(20, 20, 60, 60);
      return c.toDataURL().split(",")[1];
    });
    await page.getByLabel("Upload your store logo", { exact: false }).setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
    await page.getByText("Logo saved.", { exact: false }).waitFor();
    assert.equal(
      await page.evaluate(() => window.brandSaved.path),
      "org/logo.png",
    );
    await page.getByRole("button", { name: "Remove logo" }).click();
    await page.waitForFunction(() => window.brandSaved.path === null);
    await page.goto(origin + "/qa-retail?type=CustomerAvatar");
    await page.getByLabel("Customer profile photo").setInputFiles({name:"customer.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
    await page.waitForFunction(()=>window.avatarSaved?.rid==='relationship');
    assert.equal(await page.evaluate(()=>window.avatarSaved.name),'customer.png');
    await page.goto(origin + "/qa-retail?type=NutritionEditor");
    await page.locator('#meal-plan-name').fill('Retail weekly plan');
    await page.locator('.retail-builder-targets summary').click();
    for (const [label,value] of [['Calories · kcal','2200'],['protein · g','150'],['carbs · g','250'],['fat · g','65']]) await page.getByLabel(label,{exact:true}).fill(value);
    await page.locator('.retail-builder-targets summary').click();
    if(width<768) await page.getByRole('button',{name:'Add food to Breakfast',exact:true}).click();
    await page.locator('.mp-foods input').first().fill('Rice');
    await page.locator('.mp-results button').filter({hasText:'White Rice'}).click();
    await page.getByLabel('SERVINGS',{exact:true}).fill('0.5');
    await page.getByRole('button',{name:'ADD TO BREAKFAST',exact:true}).click();
    await page.getByRole('button',{name:'PUBLISH PLAN',exact:true}).click();
    await page.waitForFunction(()=>!!window.nutrition);
    assert.equal(await page.evaluate(()=>window.nutrition[4].calories),2200);
    assert.equal(await page.evaluate(()=>window.nutrition[3][0].meals.Breakfast[0].calories),125);
    assert.equal(await page.evaluate(()=>window.nutrition[3][0].meals.Breakfast[0].servingSize),100);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`outputs/retail/shared-builder-${width}.png`});
    await page.goto(origin + "/qa-retail?type=CustomerMessages");
    await page.getByRole("button", { name: /Open store chat/ }).click();
    await page.getByText("Welcome to your store chat").waitFor();
    await page
      .getByLabel("Message your store")
      .fill("Thanks, I can see my plan.");
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await page.getByText("Thanks, I can see my plan.").waitFor();
    await page.screenshot({
      path: `outputs/retail/customer-chat-${width}.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      "PASS invitation login/signup, consent, logo upload/removal and nutrition publishing " +
        width +
        "px",
    );
  }
} finally {
  await browser.close();
}
