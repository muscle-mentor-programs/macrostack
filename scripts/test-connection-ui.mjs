import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { Resvg } from '@resvg/resvg-js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const origin = process.env.TEST_URL || 'http://127.0.0.1:5199'
const storeCode = '019e84b2-8ddc-4eb4-b622-f76a94bf42bc'

try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { enumerateDevices: async () => [], getUserMedia: async () => { throw new DOMException('Blocked', 'NotAllowedError') } },
      })
    })
    await page.route('**/src/lib/supabase.js*', route => route.fulfill({ contentType: 'application/javascript', body: `
      export const supabase = { rpc: async (name, args) => {
        window.lastLookup = { name, args };
        return { data: name === 'get_coach_by_code' ? [{ name: 'Taylor Example' }] : null, error: null };
      } };
    ` }))
    await page.route('**/src/retail/api.js*', route => route.fulfill({ contentType: 'application/javascript', body: `
      export async function joinInfo(code) { window.lastStoreLookup = code; return { name: 'Peak Nutrition', organization: 'Peak Health' } }
    ` }))
    await page.route(/\/$/, route => route.fulfill({ contentType: 'text/html', body: `<html><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>` }))
    await page.goto(origin)
    await page.waitForFunction(() => window.__vite_plugin_react_preamble_installed__)
    await page.evaluate(async () => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js')
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js')
      await import('/src/index.css')
      const { default: Scanner } = await import('/src/components/ConnectionScanner.jsx')
      const { default: QR } = await import('/src/components/ConnectionQR.jsx')
      window.root = createRoot(document.getElementById('root'))
      window.linkCalls = []
      window.showScanner = (value = '') => root.render(React.createElement(Scanner, {
        initialValue: value,
        hasCoach: false,
        onLinkCoach: async code => { linkCalls.push(code); return { ok: true, coachName: 'Taylor Example' } },
        onLinked: name => { window.linkedName = name },
        onClose: () => { window.closed = true; root.render(null) },
      }))
      window.showQR = value => root.render(React.createElement(QR, { url: value, label: 'Test QR', size: 300 }))
      showScanner('BRAN4X7K')
    })
    await page.getByRole('heading', { name: 'Taylor Example' }).waitFor()
    assert.deepEqual(await page.evaluate(() => lastLookup), { name: 'get_coach_by_code', args: { p_code: 'BRAN4X7K' } })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    await page.screenshot({ path: `/tmp/connection-review-${width}.png` })
    await page.getByRole('button', { name: 'Link to this coach' }).click()
    assert.deepEqual(await page.evaluate(() => linkCalls), ['BRAN4X7K'])
    assert.equal(await page.evaluate(() => linkedName), 'Taylor Example')

    await page.evaluate(() => showScanner())
    await page.getByRole('button', { name: 'Enter code' }).click()
    await page.getByLabel('Code or link').fill(`${origin}/retail/member?store=${storeCode}`)
    await page.getByRole('button', { name: 'Review connection' }).click()
    await page.getByRole('heading', { name: 'Peak Nutrition' }).waitFor()
    assert.equal(await page.evaluate(() => lastStoreLookup), storeCode)
    await page.getByText('You’ll review what the store can access before confirming.').waitFor()

    await page.evaluate(() => showQR(`${location.origin}/profile?coach=BRAN4X7K`))
    const svg = await page.getByRole('img', { name: 'Test QR' }).evaluate(element => new XMLSerializer().serializeToString(element))
    const image = new Resvg(svg, { fitTo: { mode: 'width', value: 600 } }).render().asPng()
    await page.evaluate(() => showScanner())
    await page.getByLabel('Choose QR image').setInputFiles({ name: 'coach.png', mimeType: 'image/png', buffer: image })
    await page.getByRole('heading', { name: 'Taylor Example' }).waitFor()
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px: coach review/link, store review, generated QR image scan, no overflow`)
    await page.close()
  }
} finally {
  await browser.close()
}
