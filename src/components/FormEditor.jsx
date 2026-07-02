import { useState } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { QUESTION_TYPES } from '../lib/checkinQuestions'

/* ── Shared form/question editor modal ────────────────────────────────────────
   Used for the weekly check-in question set, the intro questionnaire, and
   custom forms. Purely presentational — the parent decides how to persist via
   onSave. withMeta adds title/description fields (custom + intro forms). */
export default function FormEditor({
  heading, subtitle, initialQuestions = [], withMeta = false,
  initialTitle = '', initialDescription = '', saveLabel = 'SAVE',
  onSave, onClose,
}) {
  const [list, setList]   = useState(initialQuestions.map((q) => ({ ...q })))
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const update = (i, patch) => setList((l) => l.map((q, x) => (x === i ? { ...q, ...patch } : q)))
  const remove = (i)        => setList((l) => l.filter((_, x) => x !== i))
  const move   = (i, dir)   => setList((l) => {
    const j = i + dir
    if (j < 0 || j >= l.length) return l
    const next = [...l]; [next[i], next[j]] = [next[j], next[i]]
    return next
  })
  const add = (type) => setList((l) => [...l, {
    id: `q-${Date.now()}`, slug: null, type, label: '',
    low: type === 'scale' ? 'Low' : '', high: type === 'scale' ? 'High' : '',
  }])

  const handleSave = async () => {
    if (withMeta && !title.trim()) { setError('Give the form a title.'); return }
    if (list.length === 0) { setError('Keep at least one question.'); return }
    if (list.some((q) => !q.label.trim())) { setError('Every question needs text.'); return }
    setSaving(true); setError('')
    const res = await onSave({ title: title.trim(), description: description.trim(), questions: list })
    setSaving(false)
    if (res && res.ok === false) setError(res.error || 'Could not save.')
    else onClose()
  }

  const typeBadge = (t) => QUESTION_TYPES.find((x) => x.id === t)?.label || t

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 anim-fade-in p-4">
      <div className="bg-card border border-border rounded-2xl w-[620px] max-w-full max-h-[88vh] overflow-y-auto shadow-2xl anim-fade-in-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-display font-black text-xl tracking-widest text-cream">{heading}</h3>
            {subtitle && <p className="font-mono text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {withMeta && (
            <div className="space-y-2.5 pb-2">
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-1.5">FORM TITLE</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Intro Questionnaire"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors"
                />
              </div>
              <div>
                <label className="font-display text-xs text-muted tracking-widest block mb-1.5">DESCRIPTION (SHOWN TO CLIENTS)</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  placeholder="What this form is for…"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {list.map((q, i) => (
            <div key={q.id} className="bg-surface border border-border rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] tracking-[0.18em] px-2 py-1 rounded flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>
                  {typeBadge(q.type)}
                </span>
                <div className="flex-1" />
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="p-1.5 rounded text-dim hover:text-cream disabled:opacity-25 transition-colors" title="Move up">
                  <ChevronUp size={13} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1}
                  className="p-1.5 rounded text-dim hover:text-cream disabled:opacity-25 transition-colors" title="Move down">
                  <ChevronDown size={13} />
                </button>
                <button onClick={() => remove(i)}
                  className="p-1.5 rounded text-dim hover:text-red-400 transition-colors" title="Remove question">
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                value={q.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Question text…"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 font-mono text-sm text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors"
              />
              {q.type === 'scale' && (
                <div className="flex gap-2">
                  <input
                    value={q.low} onChange={(e) => update(i, { low: e.target.value })}
                    placeholder="1 = …"
                    className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors"
                  />
                  <input
                    value={q.high} onChange={(e) => update(i, { high: e.target.value })}
                    placeholder="5 = …"
                    className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-cream placeholder-dim focus:outline-none focus:border-brown transition-colors"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => add(t.id)}
                className="flex items-center justify-center gap-1.5 border border-dashed border-border hover:border-brown/60 text-muted hover:text-brown-light rounded-xl py-2.5 font-display font-bold text-[10px] tracking-widest transition-colors"
              >
                <Plus size={12} /> {t.label}
              </button>
            ))}
          </div>

          {error && <p className="font-mono text-xs text-red-400 anim-shake">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-1 sticky bottom-0 bg-card">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-accent text-bg font-display font-bold text-sm tracking-widest py-3 rounded-lg transition-colors glow-hover disabled:opacity-50"
          >
            {saving ? 'SAVING…' : saveLabel}
          </button>
          <button
            onClick={onClose}
            className="bg-surface border border-border text-muted hover:text-cream font-display font-bold text-sm tracking-widest px-5 py-3 rounded-lg transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}
