import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const corsSource = readFileSync('api/_cors.js', 'utf8').replace('export function handleNativeCors', 'function handleNativeCors')
const requestSource = readFileSync('api/account/deletion-request.js', 'utf8')
  .replace(/^import .*$/gm, '')
  .replace('export default async function handler', 'async function handler')

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; return this },
    status(value) { this.code = value; return this },
    json(value) { this.body = value; return this },
    end() { this.ended = true; return this },
  }
}

function makeHandler({ staffError = false, user = { id: 'real-user', email: 'user@example.invalid', email_confirmed_at: '2026-01-01' }, apiKey = 'fixture' } = {}) {
  const sent = []
  class Resend {
    emails = { send: async (message) => {
      sent.push(message)
      return sent.length === 1 && staffError ? { error: { message: 'Provider rejection' } } : { data: { id: 'sent' }, error: null }
    } }
  }
  const context = vm.createContext({
    Resend,
    crypto: { randomUUID: () => 'request-123' },
    console: { error() {} },
    process: { env: { RESEND_API_KEY: apiKey, RESEND_FROM_EMAIL: 'MacroStack <test@example.invalid>', ACCOUNT_DELETION_EMAIL: 'staff@example.invalid' } },
    requireUser: async () => user ? { user } : null,
  })
  vm.runInContext(`${corsSource}\n${requestSource};this.handler=handler`, context)
  return { handler: context.handler, sent }
}

const { handler: success, sent } = makeHandler()
const preflight = response()
await success({ method: 'OPTIONS', headers: { origin: 'capacitor://localhost' } }, preflight)
assert.equal(preflight.code, 204)
assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'capacitor://localhost')
assert.match(preflight.headers['Access-Control-Allow-Headers'], /Authorization/)
assert.equal(sent.length, 0)

const result = response()
await success({ method: 'POST', headers: { origin: 'capacitor://localhost' }, body: { userId: 'forged-user' } }, result)
assert.equal(result.code, 200)
assert.equal(result.body.requestId, 'request-123')
assert.equal(sent.length, 2)
assert.match(sent[0].text, /User ID: real-user/)
assert.doesNotMatch(sent[0].text, /forged-user/)
assert.equal(sent[1].to, 'user@example.invalid')

const failed = makeHandler({ staffError: true })
const failedResponse = response()
await failed.handler({ method: 'POST', headers: {} }, failedResponse)
assert.equal(failedResponse.code, 502)
assert.equal(failed.sent.length, 1)

const unconfirmed = makeHandler({ user: { id: 'user', email: 'user@example.invalid' } })
const unconfirmedResponse = response()
await unconfirmed.handler({ method: 'POST', headers: {} }, unconfirmedResponse)
assert.equal(unconfirmedResponse.code, 403)
assert.equal(unconfirmed.sent.length, 0)

console.log('PASS iOS API: native preflight, authenticated deletion request, provider failure, and unconfirmed account')
