import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { randomUUID } from 'node:crypto'
const source = readFileSync('src/store/index.js', 'utf8')
const extract = name => {
  const start = source.indexOf(`      ${name}: async`)
  const end = source.indexOf('\n      },', start)
  return `{${source.slice(start, end + 8)}}`
}
for (const name of ['updateClientProfile', 'updateCoachProfile', 'copyDayEntries', 'removeClientEntry', 'updateClientEntry', 'addClientWeight', 'removeClientWeight']) {
  for (const failure of ['error', 'missing', 'success']) {
    if (['copyDayEntries', 'addClientWeight'].includes(name) && failure === 'missing') continue
    let state = { currentUser: { id: 'me', name: 'Original', role: 'client', hasAccess: true }, clients: [{ id: 'client', profileId: 'other', name: 'Original', weightLog: [{ id: 'weight', value: 150, date: '2026-09-19' }], log: { from: [{ id: 'food', name: 'Oats', calories: 100, quantity: 1 }], to: [] } }] }
    const query = { update() { return this }, delete() { return this }, insert() { return this }, eq() { return this }, select() { return this }, single() { return this }, then(resolve) { resolve({ data: failure === 'success' ? { id: 'saved' } : null, error: failure === 'error' ? { message: 'Rejected' } : null }) } }
    const context = vm.createContext({ supabase: { from: () => query }, get: () => state, set: next => { state = { ...state, ...(typeof next === 'function' ? next(state) : next) } }, crypto: { randomUUID }, today: () => 'to', dbToEntry: r => ({ ...r, id: r.id }), console: { error() {} } })
    const action = vm.runInContext(`(${extract(name)})`, context)[name]
    const before = JSON.stringify(state.clients)
    let result
    if (name === 'updateCoachProfile') result = await action({ name: 'New' })
    if (name === 'updateClientProfile') result = await action('client', { name: 'New' })
    if (name === 'copyDayEntries') result = await action('client', 'from', 'to')
    if (name === 'removeClientEntry') result = await action('client', 'from', 'food')
    if (name === 'updateClientEntry') result = await action('client', 'from', 'food', { quantity: 2, calories: 200 })
    if (name === 'addClientWeight') result = await action('client', { value: 155, date: '2026-09-20' })
    if (name === 'removeClientWeight') result = await action('client', 'weight')
    if (failure !== 'success') {
      assert.equal(JSON.stringify(state.clients), before, `${name}: failed writes must preserve data`)
      assert.equal(state.currentUser.name, 'Original')
      assert.ok(result === 0 || result.ok === false)
    } else {
      assert.ok(result === 1 || result.ok === true)
      if (name === 'updateCoachProfile') assert.equal(state.currentUser.name, 'New')
      else assert.notEqual(JSON.stringify(state.clients), before)
    }
  }
  console.log(`PASS ${name}: confirmed writes only; rejected/missing rows cannot report success`)
}
