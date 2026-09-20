import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const code = readFileSync('api/_auth.js','utf8').replaceAll('export async function','async function')
for (const [role, recipients, expected] of [
  ['client','member@example.invalid',true],
  ['client','stranger@example.invalid',false],
  ['coach','client@example.invalid',true],
  ['coach',['client@example.invalid','stranger@example.invalid'],false],
  ['coach','other-coach-client@example.invalid',false],
]) {
  const context = vm.createContext({ process: {env:{VITE_SUPABASE_URL:'https://test.invalid',VITE_SUPABASE_ANON_KEY:'fixture'}}, fetch: async url => ({ok:true,json:async()=>url.includes('/profiles?')?[{role}]:[{email:'client@example.invalid'}]}) })
  vm.runInContext(`${code};this.check=requireEmailRecipients`,context)
  const res={status(code){this.code=code;return this},json(){return this}}
  const result=await context.check({user:{id:'fixture',email:'member@example.invalid'},token:'fixture'},recipients,res)
  assert.equal(result,expected)
  if(!expected)assert.equal(res.code,403)
}
console.log('PASS email authorization: self and own roster allowed; unrelated recipients and members broadcasting denied')
