/* ── Coach forms: intro questionnaire + custom forms ──────────────────────────
   Forms are auto-sent in-app: an active form shows up for a client until they
   submit it (once per form). The weekly check-in is its own system
   (checkin_questions / checkins) — the FORMS tab manages it alongside these.

   DEFAULT_INTRO_QUESTIONS seeds a coach's intake questionnaire — the info and
   stats a coach needs before writing a plan. */

export const DEFAULT_INTRO_QUESTIONS = [
  { id: 'intro-age',      type: 'number', label: 'How old are you?' },
  { id: 'intro-sex',      type: 'text',   label: 'Biological sex (used for calorie math)' },
  { id: 'intro-height',   type: 'text',   label: 'How tall are you?' },
  { id: 'intro-weight',   type: 'number', label: 'Current weight (lbs)' },
  { id: 'intro-goal',     type: 'text',   label: "What's your #1 goal — and why now?" },
  { id: 'intro-goalw',    type: 'text',   label: 'Goal weight or body-composition target, if you have one' },
  {
    id: 'intro-activity', type: 'scale',
    label: 'How active is your typical day?',
    low: 'Desk-bound', high: 'On my feet',
  },
  { id: 'intro-training', type: 'text',   label: 'What does a training week look like right now? (days, type of exercise)' },
  { id: 'intro-history',  type: 'text',   label: 'What diets or programs have you tried before — and what happened?' },
  { id: 'intro-foods',    type: 'text',   label: 'Foods you love, and foods you refuse to eat' },
  { id: 'intro-restrict', type: 'text',   label: 'Any allergies or dietary restrictions?' },
  {
    id: 'intro-cooking',  type: 'scale',
    label: 'How much time / skill do you have for cooking?',
    low: 'None', high: 'Chef mode',
  },
  { id: 'intro-medical',  type: 'text',   label: 'Any medical conditions, injuries, or medications your coach should know about?' },
  { id: 'intro-supps',    type: 'yesno',  label: 'Are you currently taking supplements?' },
  { id: 'intro-anything', type: 'text',   label: 'Anything else your coach should know about you?' },
]

export const DEFAULT_INTRO_TITLE = 'Intro Questionnaire'
export const DEFAULT_INTRO_DESC =
  'Tell your coach about you — your stats, history, and goals — so your plan fits your life from day one.'
