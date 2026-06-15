import { Monitor, Smartphone, ArrowLeft } from 'lucide-react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'

export default function RoleSelector() {
  const setActiveRole = useStore((s) => s.setActiveRole)
  const logout        = useStore((s) => s.logout)

  return (
    <div className="flex h-screen w-screen bg-bg items-center justify-center anim-fade-in">
      {/* Back to homepage */}
      <button
        onClick={logout}
        className="absolute top-6 left-6 flex items-center gap-2 font-mono text-xs text-muted hover:text-cream transition-colors"
      >
        <ArrowLeft size={14} />
        HOMEPAGE
      </button>

      <div className="w-full max-w-md px-6">
        {/* Brand */}
        <div className="text-center mb-12 anim-fade-in-down">
          <h1 className="font-display font-black text-5xl tracking-[0.12em] leading-[0.95] text-cream">
            <ScrambleText text="MACRO" duration={1000} delay={100} />
            <br />
            <ScrambleText text="STACK" className="text-brown" duration={1000} delay={300} />
          </h1>
          <p className="font-mono text-xs text-muted mt-3 tracking-[0.3em]" style={{ animationDelay: '800ms' }}>
            NUTRITION OS
          </p>
        </div>

        {/* Role cards — stacked vertically, full-width rows */}
        <div className="flex flex-col gap-4">
          {/* Coach Portal */}
          <button
            onClick={() => setActiveRole('coach')}
            className="group w-full glass-card bg-card border border-border hover:border-green/60 rounded-2xl p-5 transition-all duration-200 hover:bg-green/5 glow-hover card-hover flex items-center gap-5 text-left anim-fade-in-up"
          >
            <div className="w-14 h-14 rounded-2xl bg-green/20 border border-green/30 flex items-center justify-center group-hover:bg-green/30 transition-colors flex-shrink-0">
              <Monitor size={24} className="text-green-light" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-lg tracking-wider text-cream">
                COACH PORTAL
              </h2>
              <p className="font-mono text-xs text-muted leading-relaxed mt-0.5">
                Manage users & monitor progress
              </p>
            </div>
            <span className="font-display font-bold text-xs tracking-widest text-green group-hover:text-green-light transition-colors flex-shrink-0">
              ENTER →
            </span>
          </button>

          {/* Client App */}
          <button
            onClick={() => setActiveRole('client')}
            className="group w-full glass-card bg-card border border-border hover:border-blue/60 rounded-2xl p-5 transition-all duration-200 hover:bg-blue/5 glow-hover card-hover flex items-center gap-5 text-left anim-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue/20 border border-blue/30 flex items-center justify-center group-hover:bg-blue/30 transition-colors flex-shrink-0">
              <Smartphone size={24} className="text-blue-light" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-lg tracking-wider text-cream">
                USER APP
              </h2>
              <p className="font-mono text-xs text-muted leading-relaxed mt-0.5">
                Log meals & track daily macros
              </p>
            </div>
            <span className="font-display font-bold text-xs tracking-widest text-blue group-hover:text-blue-light transition-colors flex-shrink-0">
              OPEN →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
