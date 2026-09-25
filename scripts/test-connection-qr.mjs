import assert from 'node:assert/strict'
import { coachJoinURL, parseConnectionQR } from '../src/lib/connectionQr.js'

const origin = 'https://www.getmacrostack.com'
const storeCode = '019e84b2-8ddc-4eb4-b622-f76a94bf42bc'

assert.equal(coachJoinURL(origin, 'bran4x7k'), `${origin}/profile?coach=BRAN4X7K`)
assert.deepEqual(parseConnectionQR(coachJoinURL(origin, 'bran4x7k'), origin), { kind: 'coach', code: 'BRAN4X7K' })
assert.deepEqual(parseConnectionQR(`${origin}/retail/member?store=${storeCode}`, origin), { kind: 'store', code: storeCode })
assert.deepEqual(parseConnectionQR(`https://getmacrostack.com/retail/member?store=${storeCode}`, origin), { kind: 'store', code: storeCode })
assert.deepEqual(parseConnectionQR('bran4x7k', origin), { kind: 'coach', code: 'BRAN4X7K' })
assert.deepEqual(parseConnectionQR(storeCode, origin), { kind: 'store', code: storeCode })
assert.equal(parseConnectionQR(`https://other.example/retail/member?store=${storeCode}`, origin), null)
assert.equal(parseConnectionQR('javascript:alert(1)', origin), null)
assert.equal(parseConnectionQR(`${origin}/retail?invite=${storeCode}`, origin), null)
assert.equal(parseConnectionQR(`${origin}/profile?coach=BRAN4X7K#other`, origin), null)
assert.equal(parseConnectionQR(`${origin}/profile?coach=`, origin), null)
console.log('PASS coach/store QR routing and untrusted-link rejection')
