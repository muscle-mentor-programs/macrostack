import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Exercise the real hook with a selector fixture, without auth or database writes.
const hook = readFileSync(new URL('../src/hooks/useSubscription.js', import.meta.url), 'utf8')
  .replace("import useStore from '../store'", '')
  .replace('export default function', 'function')
const store = readFileSync(new URL('../src/store/index.js', import.meta.url), 'utf8')
const compute = store.match(/export function computeSubscriptionAccess\(profile\) \{[\s\S]*?\n\}/)[0].replace('export ', '')
let cases = 0
for (const linked of [false, true]) {
  for (const [status, override, expected] of [
    ['inactive', null, false], ['active', null, true], ['trialing', null, true],
    ['canceled', null, false], ['past_due', null, false],
    ['active', 'locked', false], ['inactive', 'unlocked', true],
  ]) {
    const context = vm.createContext({ state: {
      currentUser: {role:'client',subscriptionStatus:status,adminOverride:override},
      clients:[{id:'client',coachId:linked?'coach':null}],activeClientId:'client',
    } })
    vm.runInContext(`${compute}; state.currentUser.hasAccess = computeSubscriptionAccess({role:'client',subscription_status:state.currentUser.subscriptionStatus,admin_override:state.currentUser.adminOverride}); const useStore = selector => selector(state); ${hook}; result = useSubscription();`, context)
    assert.equal(context.result.hasAccess, expected, `${status}/${override}, linked=${linked}`)
    assert.equal(context.result.audience, 'user')
    cases++
  }
}
const upgrade = readFileSync(new URL('../src/pages/UpgradePage.jsx', import.meta.url), 'utf8')
const landing = readFileSync(new URL('../src/pages/Landing.jsx', import.meta.url), 'utf8')
assert.doesNotMatch(hook + upgrade + landing, /viaCoach|Pro included|PRO INCLUDED|Pro is included/)
console.log(`PASS: ${cases} linked/unlinked subscription cases; automatic-Pro copy removed.`)
