import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try { for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } }), errors = []
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*.supabase.co/**', route => route.abort())
  await page.route('**/src/retail/api.js*', route => route.fulfill({ contentType: 'application/javascript', body: `
    export async function list(table,filters){window.lastFilters=filters;return window.connections}
    export async function storeBranding(){return {name:'Peak Nutrition',logo_path:null}}
    export function brandLogoURL(){return null}
    export async function customerAvatarURL(){return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"/%3E'}
    export async function saveCustomerAvatar(id,file){window.photoWrites.push({id,remove:!file});return file?'new-photo':null}
    export async function conversation(){return {messages:[]}}
    export async function command(){return {}}
  ` }))
  await page.route(/\/$/, route => route.fulfill({ contentType: 'text/html', body: `<html><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>` }))
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5198'); await page.waitForFunction(() => window.__vite_plugin_react_preamble_installed__)
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js'), { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js')
    for (const css of ['index', 'software', 'coach-responsive']) await import(`/src/${css}.css`)
    await import('/src/retail/retail.css')
    document.documentElement.className = 'ocean-light'
    const hook = await (await fetch('/src/hooks/useSubscription.js')).text()
    const { default: store } = await import(hook.match(/from ["']([^"']+)["']/)[1])

    window.connections = [{ id: 'relationship1', location_id: 'store1', status: 'active' }]; window.photoWrites = []
    const { default: Links } = await import('/src/retail/CustomerStoreLinks.jsx')
    const { default: Avatar } = await import('/src/retail/CustomerAvatar.jsx')
    const { default: Messages } = await import('/src/retail/CustomerMessages.jsx')
    window.root = createRoot(document.getElementById('root'))
    window.showLinks = () => root.render(React.createElement(Links))
    window.showMessages = () => root.render(React.createElement(Messages, { CoachConversation: () => React.createElement('p', {}, 'Coach thread') }))
    window.avatarPath = 'old-photo'
    window.showAvatar = () => root.render(React.createElement('section', { className: 'retail', style: { padding: 24 } }, React.createElement(Avatar, { customer: { id: 'relationship1', name: 'Member', avatar_path: window.avatarPath }, editable: true, onSaved: path => { window.avatarPath = path; showAvatar() } })))
    store.setState({ currentUser: { id: 'member1' }, activeClientId: 'client1', clients: [{ id: 'client1', coachId: 'coach1' }], coachProfile: { name: 'Coach Taylor' } })
    showLinks()
  })
  await page.getByText('Peak Nutrition', { exact: true }).waitFor({timeout:10000}).catch(async e=>{console.log(await page.locator('body').innerText(),errors);throw e})
  await page.getByText('Account linked', { exact: true }).waitFor()
  assert.deepEqual(await page.evaluate(() => lastFilters), { profile_id: 'member1', status: 'active' })
  await page.getByRole('button', { name: 'Message store', exact: true }).click()
  assert.equal(new URL(page.url()).searchParams.get('store'), 'relationship1')
  await page.evaluate(() => showMessages())
  await page.getByRole('heading', { name: 'Peak Nutrition', exact: true }).waitFor()
  await page.getByRole('button', { name: 'All conversations', exact: true }).click()
  await page.getByRole('button', { name: /Coach Taylor/ }).waitFor()
  await page.getByRole('button', { name: /Peak Nutrition/ }).waitFor()
  await page.evaluate(() => showAvatar())
  await page.getByRole('button', { name: 'Edit customer photo', exact: true }).waitFor().catch(async e=>{console.log('AVATAR',await page.locator('body').innerText(),errors);throw e})
  assert.equal(await page.getByRole('button', { name: 'Remove photo', exact: true }).count(), 0)
  assert.equal(await page.getByText(/private to this store connection/).count(), 0)
  await page.getByRole('button', { name: 'Edit customer photo', exact: true }).click()
  await page.getByRole('button', { name: 'Change photo', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('button', { name: 'Remove photo', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Edit customer photo', exact: true }).click()
  await page.getByRole('button', { name: 'Remove photo', exact: true }).click()
  await page.getByRole('button', { name: 'Edit customer photo', exact: true }).waitFor()
  assert.deepEqual(await page.evaluate(() => photoWrites), [{ id: 'relationship1', remove: true }])
  await page.getByRole('button', { name: 'Edit customer photo', exact: true }).click()
  await page.getByRole('button', { name: 'Add photo', exact: true }).waitFor()
  await page.getByLabel('Customer profile photo', { exact: true }).setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: Buffer.from('fixture') })
  await page.waitForFunction(() => window.photoWrites.length === 2)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  assert.deepEqual(errors, [])
  console.log(`PASS ${width}px: linked store identity, scoped lookup, store deep link, coach and store conversations, avatar menu/remove/upload/Escape`)
  await page.close()
} } finally { await browser.close() }
