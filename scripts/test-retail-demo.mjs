import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RETAIL_DEMO_EMAIL, demoCredentialResult, endRetailDemoSession,
  hasRetailDemoSession, isRetailDemoEmail, startRetailDemoSession,
} from '../src/retail/demoAccess.mjs'

assert.equal(RETAIL_DEMO_EMAIL, 'demo@getmacrostack.com')
assert.equal(isRetailDemoEmail(' DEMO@GetMacroStack.COM '), true)
assert.equal(demoCredentialResult('demo@getmacrostack.com', 'msdemo'), 'valid')
assert.equal(demoCredentialResult('demo@getmacrostack.com', 'wrong'), 'invalid')
assert.equal(demoCredentialResult('owner@example.com', 'msdemo'), 'not-demo')

const values = new Map()
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}
assert.equal(hasRetailDemoSession(storage), false)
startRetailDemoSession(storage)
assert.equal(hasRetailDemoSession(storage), true)
endRetailDemoSession(storage)
assert.equal(hasRetailDemoSession(storage), false)
assert.equal(hasRetailDemoSession({ getItem: () => { throw new Error('blocked') } }), false)

const signup = readFileSync(new URL('../src/retail/RetailSignup.jsx', import.meta.url), 'utf8')
const demo = readFileSync(new URL('../src/retail/RetailDemo.jsx', import.meta.url), 'utf8')
assert.ok(signup.indexOf('demoCredentialResult(email, password)') < signup.indexOf('supabase.auth.signInWithPassword'), 'Demo sign-in must be intercepted before real authentication')
assert.doesNotMatch(demo, /from ["']\.\.\/lib\/supabase|from ["']\.\/api/)
assert.match(demo, /Every name and record is sample data/)
console.log('Retail demo access and isolation passed.')
