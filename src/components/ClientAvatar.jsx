/**
 * ClientAvatar
 * Shows the client's profile photo if one exists, falls back to their name initial.
 *
 * Props
 *   name         string   — client name (used for initial fallback + alt text)
 *   avatarUrl    string?  — public URL from Supabase storage
 *   className    string   — Tailwind size classes e.g. "w-10 h-10"
 *   textClassName string  — Tailwind text size for the initial e.g. "text-base"
 *   color        'brown'|'olive'  — colour scheme for the initial fallback
 */

const COLORS = {
  brown: { ring: 'bg-brown/20 border-brown/30', text: 'text-brown-light' },
  olive: { ring: 'bg-olive/20 border-olive/30', text: 'text-olive-light' },
}

export default function ClientAvatar({
  name          = '',
  avatarUrl     = null,
  className     = 'w-10 h-10',
  textClassName = 'text-base',
  color         = 'brown',
}) {
  const { ring, text } = COLORS[color] || COLORS.brown
  const initial = (name || '?').charAt(0).toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover border border-brown/30 flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div className={`rounded-full border flex items-center justify-center flex-shrink-0 ${ring} ${className}`}>
      <span className={`font-display font-black ${text} ${textClassName}`}>
        {initial}
      </span>
    </div>
  )
}
