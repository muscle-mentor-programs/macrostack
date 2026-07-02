/* ── Weekly check-in questions ────────────────────────────────────────────────
   Coaches can customize their check-in form (add / remove / edit questions).
   Until a coach saves their own set, clients see DEFAULT_QUESTIONS. Answers
   are stored as a snapshot on each check-in row, so history stays intact even
   if the coach changes the questions later.

   The `slug` ties a question to a legacy structured column (adherence /
   hunger / energy) so trend views and Kay's review keep working across
   default and customized sets. Custom questions have slug = null. */

export const QUESTION_TYPES = [
  { id: 'scale',  label: '1–5 SCALE' },
  { id: 'yesno',  label: 'YES / NO' },
  { id: 'number', label: 'NUMBER' },
  { id: 'text',   label: 'FREE TEXT' },
]

export const DEFAULT_QUESTIONS = [
  {
    id: 'default-adherence', slug: 'adherence', type: 'scale',
    label: 'How closely did you follow your plan?',
    low: 'Off plan', high: 'Nailed it',
  },
  {
    id: 'default-hunger', slug: 'hunger', type: 'scale',
    label: 'How manageable was hunger this week?',
    low: 'Starving', high: 'Satisfied',
  },
  {
    id: 'default-energy', slug: 'energy', type: 'scale',
    label: 'How were energy and training quality?',
    low: 'Drained', high: 'Firing',
  },
  {
    id: 'default-sleep', slug: null, type: 'scale',
    label: 'How was your sleep?',
    low: 'Rough', high: 'Excellent',
  },
  {
    id: 'default-stress', slug: null, type: 'scale',
    label: 'How were stress levels?',
    low: 'Maxed out', high: 'Calm',
  },
  {
    id: 'default-offplan', slug: null, type: 'yesno',
    label: 'Any meals out, travel, or events that made tracking harder?',
  },
  {
    id: 'default-win', slug: null, type: 'text',
    label: "What's one win from this week?",
  },
  {
    id: 'default-struggle', slug: null, type: 'text',
    label: 'What was hardest? Anything your coach should know?',
  },
]

/* Format a stored answer for display. */
export function formatAnswer(a) {
  if (a.value === null || a.value === undefined || a.value === '') return '—'
  if (a.type === 'scale') return `${a.value}/5`
  if (a.type === 'yesno') return a.value ? 'Yes' : 'No'
  return String(a.value)
}
