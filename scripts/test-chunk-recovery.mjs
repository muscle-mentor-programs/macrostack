import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:5201'

try {
  for (const persistent of [false, true]) {
    const page = await browser.newPage()
    let failedChunks = 0
    let documentLoads = 0
    page.on('request', request => {
      if (request.isNavigationRequest() && request.resourceType() === 'document') documentLoads++
    })
    await page.route(/\/assets\/Landing-[^/]+\.js$/, route => {
      if (persistent || failedChunks++ === 0) return route.abort('failed')
      return route.continue()
    })

    await page.goto(baseURL)
    if (persistent) {
      await page.getByRole('heading', { name: 'This page couldn’t load' }).waitFor()
      assert.equal(await page.getByRole('button', { name: 'Reload app' }).count(), 1)
      assert.equal(documentLoads, 2, 'a persistent failure must cause only one automatic reload')
    } else {
      await page.getByRole('heading', { name: 'TRACK. OPTIMIZE. PERFORM.' }).waitFor()
      assert.ok(documentLoads >= 2, 'a failed chunk should reload the current build')
      assert.equal(await page.getByRole('heading', { name: 'This page couldn’t load' }).count(), 0)
    }
    console.log(`PASS ${persistent ? 'persistent failure shows recovery' : 'failed chunk reloads and renders content'}`)
    await page.close()
  }
} finally {
  await browser.close()
}
