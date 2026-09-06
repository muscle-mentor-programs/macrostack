import { format, isValid, parseISO } from 'date-fns'

export function workspaceDate(value) {
  if (!value) return 'Not scheduled'
  const date = parseISO(value)
  return isValid(date) ? format(date, 'MMMM d, yyyy') : 'Unknown date'
}

export function taskMatches(task, status, owner, query, today) {
  const done = task.details.state === 'done'
  const due = task.details.due
  return (status === 'all' || (status === 'open' && !done) || (status === 'done' && done)
    || (status === 'overdue' && !done && due && due < today)
    || (status === 'today' && !done && due === today))
    && (owner === 'all' || (task.details.owner || 'Coach') === owner)
    && `${task.title} ${task.body} ${task.details.tags || ''}`.toLowerCase().includes(query.toLowerCase().trim())
}

export function sortTasks(tasks) {
  const priority = { high: 0, normal: 1, low: 2 }
  return [...tasks].sort((a, b) => Number(a.details.state === 'done') - Number(b.details.state === 'done')
    || (a.details.due || '9999').localeCompare(b.details.due || '9999')
    || (priority[a.details.priority] ?? 1) - (priority[b.details.priority] ?? 1)
    || String(b.created_at).localeCompare(String(a.created_at)))
}
