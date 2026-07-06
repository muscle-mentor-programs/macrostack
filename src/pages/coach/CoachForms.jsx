import { useEffect, useState } from 'react'
import {
  ClipboardList, ClipboardCheck, Plus, Pencil, Trash2, Camera,
  Users, Send,
} from 'lucide-react'
import useStore from '../../store'
import ScrambleText from '../../components/ScrambleText'
import FormEditor from '../../components/FormEditor'
import { DEFAULT_QUESTIONS } from '../../lib/checkinQuestions'
import { DEFAULT_INTRO_QUESTIONS, DEFAULT_INTRO_TITLE, DEFAULT_INTRO_DESC } from '../../lib/forms'

const accentA = (pct) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`

function Toggle({ on, onChange, label }) {
  return (
    <button onClick={onChange} className="flex items-center gap-2.5" title={label}>
      <span
        className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors"
        style={{ background: on ? 'var(--color-accent)' : 'var(--color-dim)' }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: on ? '20px' : '4px' }}
        />
      </span>
    </button>
  )
}

/* ── FORMS — build + auto-send forms to every client ─────────────────────────
   Active forms appear in each client's app until completed: the intro
   questionnaire once (new clients), custom forms once each, and the weekly
   check-in every 7 days. */
export default function CoachForms() {
  const {
    coachForms, fetchCoachForms, saveCoachForm, deleteCoachForm,
    checkinQuestions, fetchCheckinQuestions, saveCheckinQuestions,
    clients,
  } = useStore()

  const [editing, setEditing] = useState(null) // { mode: 'weekly'|'intro'|'custom', form? }
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { fetchCoachForms(); fetchCheckinQuestions() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const forms     = coachForms || []
  const introForm = forms.find((f) => f.kind === 'intro') || null
  const weeklyCfg = forms.find((f) => f.kind === 'weekly') || null
  const customs   = forms.filter((f) => f.kind === 'custom')

  const weeklyQs = checkinQuestions?.length ? checkinQuestions : DEFAULT_QUESTIONS

  // Responses per form across the roster
  const responseCount = (formId) =>
    clients.reduce((n, c) => n + (c.submissions || []).filter((s) => s.formId === formId).length, 0)
  const introPending = introForm && introForm.active
    ? clients.filter((c) => !(c.submissions || []).some((s) => s.formId === introForm.id)).length
    : 0

  const togglePhotos = () =>
    saveCoachForm({
      id: weeklyCfg?.id, kind: 'weekly', title: 'Weekly Check-in',
      questions: [], active: true, allowPhotos: !(weeklyCfg?.allowPhotos),
    })

  const toggleActive = (form) => saveCoachForm({ ...form, active: !form.active })

  const handleEditorSave = async ({ title, description, questions }) => {
    if (editing.mode === 'weekly') return saveCheckinQuestions(questions)
    if (editing.mode === 'intro') {
      return saveCoachForm({
        id: introForm?.id, kind: 'intro',
        title: title || DEFAULT_INTRO_TITLE, description, questions,
        active: introForm?.active ?? true,
      })
    }
    return saveCoachForm({
      id: editing.form?.id, kind: 'custom',
      title, description, questions,
      active: editing.form?.active ?? true,
    })
  }

  const cardCls = 'glass-card border border-border rounded-2xl p-5 card-dim'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative px-6 md:px-8 pt-mobile-header md:pt-6 pb-5 border-b border-border flex-shrink-0 anim-fade-in-down glass-panel accent-line">
        <h2 className="font-display font-black text-3xl md:text-4xl tracking-wide text-cream">
          <ScrambleText text="FORMS" duration={800} />
        </h2>
        <p className="font-mono text-xs md:text-sm text-muted mt-1">
          Auto-sent in-app — active forms appear for every client until completed
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-6 max-w-6xl w-full mx-auto">

        {/* ── Core forms — intro + weekly side by side on wide screens ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

        {/* ── Intro questionnaire ── */}
        <div className={cardCls}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <ClipboardList size={16} style={{ color: 'var(--color-accent)' }} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-display font-bold text-base text-cream tracking-wide truncate">
                  {introForm?.title || DEFAULT_INTRO_TITLE}
                </p>
                <p className="font-mono text-[10px] text-muted mt-0.5">
                  Sent to every client once, when they join
                </p>
              </div>
            </div>
            {introForm && (
              <Toggle on={introForm.active} onChange={() => toggleActive(introForm)} label="Active" />
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="font-mono text-xs text-muted">
              {(introForm?.questions?.length ?? DEFAULT_INTRO_QUESTIONS.length)} questions
            </span>
            {introForm && (
              <>
                <span className="font-mono text-xs text-muted flex items-center gap-1.5">
                  <Users size={11} /> {responseCount(introForm.id)} responses
                </span>
                {introForm.active && introPending > 0 && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: accentA(14), color: 'var(--color-accent)' }}>
                    {introPending} pending
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {introForm ? (
              <button
                onClick={() => setEditing({ mode: 'intro' })}
                className="flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-3 py-2 transition-colors"
              >
                <Pencil size={11} /> EDIT QUESTIONS
              </button>
            ) : (
              <button
                onClick={() => setEditing({ mode: 'intro' })}
                className="flex items-center gap-1.5 btn-accent text-bg font-display font-bold text-[10px] tracking-widest rounded-lg px-3.5 py-2 transition-colors press"
              >
                <Send size={11} /> SET UP & SEND
              </button>
            )}
          </div>
          {!introForm && (
            <p className="font-mono text-[10px] text-dim mt-3 leading-relaxed">
              Starts from a proven 14-question intake — stats, history, preferences, red flags — and you can tailor every question.
            </p>
          )}
        </div>

        {/* ── Weekly check-in ── */}
        <div className={cardCls}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <ClipboardCheck size={16} style={{ color: 'var(--color-accent)' }} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-display font-bold text-base text-cream tracking-wide">Weekly Check-in</p>
                <p className="font-mono text-[10px] text-muted mt-0.5">
                  Due from every client each week — reviewed on their check-in tab
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="font-mono text-xs text-muted">{weeklyQs.length} questions</span>
          </div>

          {/* Photo uploads toggle */}
          <div className="flex items-center justify-between mt-4 py-3 border-t border-border/50">
            <span className="flex items-center gap-2.5">
              <Camera size={13} className="text-muted" />
              <span>
                <span className="block font-mono text-sm text-cream">Photo uploads</span>
                <span className="block font-mono text-[10px] text-dim mt-0.5">
                  Clients attach progress photos with each check-in — saved to their file
                </span>
              </span>
            </span>
            <Toggle on={!!weeklyCfg?.allowPhotos} onChange={togglePhotos} label="Photo uploads" />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setEditing({ mode: 'weekly' })}
              className="flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-3 py-2 transition-colors"
            >
              <Pencil size={11} /> EDIT QUESTIONS
            </button>
          </div>
        </div>

        </div>

        {/* ── Custom forms ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-px bg-brown/50 flex-shrink-0" />
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">CUSTOM FORMS</p>
            </div>
            <button
              onClick={() => setEditing({ mode: 'custom' })}
              className="flex items-center gap-1.5 btn-accent text-bg font-display font-bold text-[10px] tracking-widest rounded-lg px-3.5 py-2 transition-colors press"
            >
              <Plus size={11} /> NEW FORM
            </button>
          </div>

          {customs.length === 0 ? (
            <div className="glass-card border border-dashed border-border rounded-2xl p-6 text-center card-dim">
              <p className="font-mono text-xs text-dim leading-relaxed">
                Build any form — habit audits, injury screens, program feedback — and it's sent to every client until they fill it out.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              {customs.map((f) => (
                <div key={f.id} className={cardCls}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-base text-cream tracking-wide truncate">{f.title || 'Untitled form'}</p>
                      {f.description && (
                        <p className="font-mono text-[10px] text-muted mt-0.5 truncate">{f.description}</p>
                      )}
                    </div>
                    <Toggle on={f.active} onChange={() => toggleActive(f)} label="Active" />
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="font-mono text-xs text-muted">{f.questions.length} questions</span>
                    <span className="font-mono text-xs text-muted flex items-center gap-1.5">
                      <Users size={11} /> {responseCount(f.id)} responses
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setEditing({ mode: 'custom', form: f })}
                      className="flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest text-muted hover:text-cream border border-border hover:border-muted rounded-lg px-3 py-2 transition-colors"
                    >
                      <Pencil size={11} /> EDIT
                    </button>
                    <button
                      onClick={() => setConfirmDelete(f)}
                      className="flex items-center gap-1.5 font-display font-bold text-[10px] tracking-widest text-dim hover:text-red-400 border border-border hover:border-red-400/40 rounded-lg px-3 py-2 transition-colors"
                    >
                      <Trash2 size={11} /> DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="font-mono text-[10px] text-dim text-center pb-6 leading-relaxed">
          Responses appear in each client's FORMS tab, with a badge on your dashboard when something new arrives.
        </p>
      </div>

      {/* Editors */}
      {editing?.mode === 'weekly' && (
        <FormEditor
          heading="WEEKLY CHECK-IN"
          subtitle="What every client answers each week"
          initialQuestions={weeklyQs}
          saveLabel="SAVE QUESTIONS"
          onSave={handleEditorSave}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.mode === 'intro' && (
        <FormEditor
          heading="INTRO QUESTIONNAIRE"
          subtitle="Collected once from every client when they join"
          withMeta
          initialTitle={introForm?.title || DEFAULT_INTRO_TITLE}
          initialDescription={introForm?.description || DEFAULT_INTRO_DESC}
          initialQuestions={introForm?.questions?.length ? introForm.questions : DEFAULT_INTRO_QUESTIONS}
          saveLabel={introForm ? 'SAVE FORM' : 'SAVE & SEND TO CLIENTS'}
          onSave={handleEditorSave}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.mode === 'custom' && (
        <FormEditor
          heading={editing.form ? 'EDIT FORM' : 'NEW FORM'}
          subtitle="Sent to every client until they complete it"
          withMeta
          initialTitle={editing.form?.title || ''}
          initialDescription={editing.form?.description || ''}
          initialQuestions={editing.form?.questions || []}
          saveLabel={editing.form ? 'SAVE FORM' : 'CREATE & SEND'}
          onSave={handleEditorSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in p-4">
          <div className="bg-card border border-border rounded-2xl w-[400px] max-w-full p-6 text-center anim-fade-in-up">
            <p className="font-display font-black text-lg tracking-widest text-cream">DELETE FORM?</p>
            <p className="font-mono text-xs text-muted mt-2 leading-relaxed">
              "{confirmDelete.title}" and its client responses will be permanently removed.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { deleteCoachForm(confirmDelete.id); setConfirmDelete(null) }}
                className="flex-1 bg-red-400/15 border border-red-400/40 text-red-400 font-display font-bold text-xs tracking-widest py-3 rounded-lg transition-colors hover:bg-red-400/25"
              >
                DELETE
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-surface border border-border text-muted hover:text-cream font-display font-bold text-xs tracking-widest py-3 rounded-lg transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
