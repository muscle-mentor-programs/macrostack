import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const width of [390, 1440]) for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width, height: 900 } }), errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.route('**/src/lib/stripeConnect.js*', route => route.fulfill({ contentType: 'application/javascript', body: `export async function stripeConnectRequest(body){return window.stripeMock(body)}; export async function startStripeConnection(){return window.stripeMock({action:'begin'})}` }))
    await page.route(/\/$/, route => route.fulfill({ contentType: 'text/html', body: `<html><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>` }))
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5198')
    await page.waitForFunction(() => window.__vite_plugin_react_preamble_installed__)
    await page.evaluate(async theme => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js')
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js')
      for (const css of ['index', 'software', 'coach-responsive']) await import(`/src/${css}.css`)
      document.documentElement.className = theme === 'light' ? 'ocean-light' : 'ocean-dark'
      window.stripeState = { connected: true, ready: true }
      window.requests = []
      window.stripeMock = async body => {
        window.requests.push(body)
        if (body.action === 'disconnect') {
          if (window.failUnlink) { window.stripeState.disconnect_pending = true; throw Error('Unlinking could not be confirmed. Retry unlinking.') }
          window.stripeState = { connected: false, ready: false }
        }
        if (body.action === 'begin') window.stripeState = { connected: true, ready: true }
        return { ...window.stripeState }
      }
      const { default: Connection } = await import('/src/components/CoachStripeConnection.jsx')
      createRoot(document.getElementById('root')).render(React.createElement('main', { className: 'marketplace-page', style: { padding: 20, maxWidth: 440, margin: 'auto' } }, React.createElement(Connection)))
    }, theme)
    await page.getByRole('button', { name: 'Stripe linked', exact: true }).waitFor()
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.coach-stripe-button')).backgroundColor === 'rgb(20, 62, 50)')
    assert.equal(await page.getByRole('button', { name: 'Stripe linked', exact: true }).evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(20, 62, 50)')
    await page.getByRole('button', { name: 'Unlink Stripe account', exact: true }).click()
    await page.getByRole('button', { name: 'Keep linked', exact: true }).click()
    assert.equal(await page.evaluate(() => requests.some(r => r.action === 'disconnect')), false)
    await page.getByRole('button', { name: 'Unlink Stripe account', exact: true }).click()
    await page.evaluate(() => { window.failUnlink = true })
    await page.getByRole('button', { name: 'Confirm unlink', exact: true }).click()
    await page.getByRole('alert').waitFor()
    await page.getByRole('button', { name: 'Refresh unlink status', exact: true }).waitFor()
    await page.evaluate(() => { window.failUnlink = false })
    await page.getByRole('button', { name: 'Confirm unlink', exact: true }).click()
    await page.getByRole('button', { name: 'Connect Stripe account', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Unlink Stripe account', exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Connect Stripe account', exact: true }).click()
    await page.getByRole('button', { name: 'Stripe linked', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    assert.deepEqual(errors, [])
    await page.waitForFunction(() => {const s=getComputedStyle(document.querySelector('.coach-stripe-button'));return s.opacity==='1' && s.color==='rgb(198, 247, 220)'})
    await page.screenshot({ path: `/tmp/stripe-linked-${width}-${theme}.png` })
    console.log(`PASS ${width}px ${theme}: linked state, cancel, pending retry, unlink and reconnect; no overflow`)
    await page.close()
  }
} finally { await browser.close() }
