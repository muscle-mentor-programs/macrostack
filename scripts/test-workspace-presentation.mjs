import assert from 'node:assert/strict'
import { workspaceDate, sortTasks, taskMatches } from '../src/lib/workspacePresentation.js'

const today = '2026-01-22'
const task = (id, details) => ({ id, title: 'Travel lunch', body: 'Pack a meal', created_at: today, details })
const overdue = task('overdue', { due: '2026-01-21' })
const high = task('high', { due: today, priority: 'high', owner: 'Client — coach tracked' })
const normal = task('normal', { due: today })
const done = task('done', { due: '2026-01-20', state: 'done' })
const unscheduled = task('unscheduled', {})
const input = [done, normal, unscheduled, high, overdue]
assert.deepEqual(sortTasks(input).map(t => t.id), ['overdue', 'high', 'normal', 'unscheduled', 'done'])
assert.equal(input[0], done, 'sorting must not mutate records')
assert.equal(taskMatches(overdue, 'overdue', 'Coach', ' lunch ', today), true)
assert.equal(taskMatches(done, 'overdue', 'all', '', today), false)
assert.equal(taskMatches(high, 'today', 'Client — coach tracked', '', today), true)
assert.equal(taskMatches(normal, 'today', 'Client — coach tracked', '', today), false)
assert.equal(taskMatches(done, 'done', 'all', '', today), true)
assert.equal(workspaceDate(today), 'January 22, 2026')
assert.equal(workspaceDate('invalid'), 'Unknown date')
assert.equal(workspaceDate(null), 'Not scheduled')
console.log('Workspace date, task filters, priorities, legacy defaults, and immutable sorting passed.')
