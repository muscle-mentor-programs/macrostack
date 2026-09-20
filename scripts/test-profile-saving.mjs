import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const kind of ['coach', 'client']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*.supabase.co/**', route => route.abort())
    await page.route(/\/$/, route => route.fulfill({ contentType: 'text/html', body: `<html><body><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>` }))
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5198')
    await page.waitForFunction(() => window.__vite_plugin_react_preamble_installed__)
    await page.evaluate(async kind => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js')
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js')
      const hook = await (await fetch('/src/hooks/useSubscription.js')).text()
      const { default: store } = await import(hook.match(/from ["']([^"']+)["']/)[1])
      await import('/src/index.css')
      const { default: Component } = await import(`/src/pages/${kind}/${kind === 'coach' ? 'CoachProfile' : 'ClientProfile'}.jsx`)
      window.testStore = store
      window.saveMode = 'reject'
      window.saveCalls = 0
      const save = async () => {
        window.saveCalls++
        if (window.saveMode === 'throw') throw new Error('Network unavailable')
        if (window.saveMode === 'reject') return { ok: false, error: 'Save rejected' }
        return { ok: true }
      }
      store.setState({ currentUser: { id: 'one', name: 'Original', role: kind === 'coach' ? 'coach' : 'client' }, activeRole: kind === 'coach' ? 'coach' : 'client', activeClientId: 'own', clients: [{ id: 'own', profileId: 'one', name: 'Original', goals: {}, log: {}, weightLog: [] }], myCoachRequests: [], updateCoachProfile: save, updateClientProfile: save, fetchMyCoachRequests: async () => {} })
      createRoot(document.getElementById('root')).render(React.createElement(Component))
    }, kind)
    if (kind === 'coach') await page.getByRole('button', { name: 'EDIT', exact: true }).click()
    const name = kind === 'client' ? page.getByPlaceholder('Your name') : page.locator('input').first()
    await name.fill('Draft survives')
    const save = page.getByRole('button', { name: kind === 'coach' ? 'SAVE' : 'SAVE CHANGES', exact: true })
    await save.click()
    await page.getByRole('alert').filter({ hasText: 'Save rejected' }).waitFor()
    assert.equal(await name.inputValue(), 'Draft survives')
    await page.evaluate(() => { window.saveMode = 'throw' })
    await save.click()
    await page.getByRole('alert').filter({ hasText: 'Network unavailable' }).waitFor()
    assert.equal(await name.inputValue(), 'Draft survives')
    await page.evaluate(() => { window.saveMode = 'success' })
    await save.click()
    await page.getByRole('button', { name: kind === 'coach' ? 'EDIT' : 'SAVED', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => window.saveCalls), 3)
    assert.deepEqual(errors, [])
    console.log(`PASS ${kind}: rejected and thrown saves retain drafts; successful retry exits saving state`)
    await page.close()
  }
} finally { await browser.close() }
