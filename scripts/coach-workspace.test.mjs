import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = (await readFile(new URL('../src/lib/coachWorkspace.js', import.meta.url), 'utf8'))
  .replace("import { supabase } from './supabase'", 'const supabase = globalThis.workspaceTestDatabase')
const rows = new Map()
let loseResponse = true
globalThis.workspaceTestDatabase = {
  from() {
    let inserted, id
    return {
      insert(value) { inserted = value; return this },
      select() { return this },
      eq(column, value) { assert.equal(column, 'id'); id = value; return this },
      async single() {
        if (inserted) {
          if (rows.has(inserted.id)) return { error: { code: '23505' } }
          rows.set(inserted.id, inserted)
          if (loseResponse) { loseResponse = false; return { error: { message: 'Response lost' } } }
          return { data: inserted }
        }
        return { data: rows.get(id) }
      },
    }
  },
}
const { periodSummary, latestEntries, appendWorkspace } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('unlogged days are unknown, not zero intake', () => {
  const empty = periodSummary({ log: {} }, '2026-09-05')
  assert.equal(empty.days, 0)
  assert.equal(empty.calories, null)
  const partial = periodSummary({ log: { '2026-09-05': [{ calories: 600, protein: 40 }] } }, '2026-09-05')
  assert.equal(partial.calories, 600)
  assert.equal(partial.days, 1)
})
test('period dates cross month and year boundaries', () => {
  assert.deepEqual(periodSummary({}, '2026-01-02', 3).dates, ['2026-01-02','2026-01-01','2025-12-31'])
})
test('latest revision is shown without modifying history', () => {
  const history = [{ record_id: 'a', kind: 'note', body: 'new' }, { record_id: 'a', kind: 'note', body: 'old' }]
  assert.deepEqual(latestEntries(history, 'note'), [history[0]])
  assert.equal(history.length, 2)
})
test('retry after committed insert with lost response does not duplicate the record', async () => {
  const entry = { record_id: 'a', client_id: 'client', author_id: 'coach', kind: 'note', title: 'Test', body: 'Test' }
  await assert.rejects(appendWorkspace(entry), /Not saved/)
  const saved = await appendWorkspace(entry)
  assert.equal(rows.size, 1)
  assert.equal(saved.body, 'Test')
  await appendWorkspace({ ...entry, body: 'New revision' })
  assert.equal(rows.size, 2)
})
