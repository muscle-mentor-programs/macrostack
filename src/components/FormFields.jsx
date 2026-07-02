/* Shared question renderers — used by the weekly check-in, the intro
   questionnaire, and custom coach forms. */

export function ScaleField({ low, high, value, onChange }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" onClick={() => onChange(n)}
            className="flex-1 h-10 rounded-lg font-mono text-sm transition-all border press"
            style={value === n
              ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'transparent', transform: 'scale(1.04)' }
              : { borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[9px] text-dim">{low}</span>
        <span className="font-mono text-[9px] text-dim">{high}</span>
      </div>
    </div>
  )
}

export function YesNoField({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[{ v: true, l: 'YES' }, { v: false, l: 'NO' }].map(({ v, l }) => (
        <button
          key={l} type="button" onClick={() => onChange(v)}
          className="flex-1 h-10 rounded-lg font-display font-bold text-xs tracking-widest transition-all border press"
          style={value === v
            ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'transparent' }
            : { borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/* One labeled question of any type. */
export function QuestionField({ question: q, value, onChange }) {
  return (
    <div>
      <label className="font-display text-xs text-muted tracking-widest block mb-1.5 leading-relaxed">
        {q.label.toUpperCase()}
      </label>
      {q.type === 'scale' && (
        <ScaleField low={q.low} high={q.high} value={value} onChange={onChange} />
      )}
      {q.type === 'yesno' && (
        <YesNoField value={value} onChange={onChange} />
      )}
      {q.type === 'number' && (
        <input
          type="number" inputMode="decimal" value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder="0"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30"
        />
      )}
      {q.type === 'text' && (
        <textarea
          value={value || ''} onChange={(e) => onChange(e.target.value)} rows={2}
          placeholder="Type your answer…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 font-mono text-sm text-cream placeholder-muted focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/30 resize-none"
        />
      )}
    </div>
  )
}

/* Counts non-empty answers for a question list + answers map. */
export function countAnswered(questions = [], answers = {}) {
  return questions.filter((q) => {
    const v = answers[q.id]
    return v !== undefined && v !== null && String(v).trim() !== ''
  }).length
}
