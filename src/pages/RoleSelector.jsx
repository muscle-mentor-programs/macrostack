import { Monitor, Smartphone } from 'lucide-react'
import useStore from '../store'
import ScrambleText from '../components/ScrambleText'

export default function RoleSelector() {
  const setActiveRole = useStore((s) => s.setActiveRole)

  return (
    <div className="flex h-screen w-screen bg-bg items-center justify-center anim-fade-in">
      <div className="w-full max-w-2xl px-8">
        {/* Brand */}
        <div className="text-center mb-16 anim-fade-in-down">
          <h1 className="font-display font-black text-6xl tracking-widest text-cream">
            <ScrambleText text="MACRO" duration={1000} delay={100} />
            <ScrambleText text="STACK" className="text-brown" duration={1000} delay={300} />
          </h1>
          <p className="font-mono text-sm text-muted mt-2 tracking-widest cursor" style={{ animationDelay: '800ms' }}>
            NUTRITION OS
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-6 anim-stagger">
          {/* Coach Portal */}
          <button
            onClick={() => setActiveRole('coach')}
            className="group bg-card border border-border hover:border-brown/60 rounded-2xl p-8 text-left transition-all duration-200 hover:bg-brown/5 glow-hover anim-fade-in-up"
          >
            <div className="w-12 h-12 rounded-xl bg-brown/20 border border-brown/30 flex items-center justify-center mb-6 group-hover:bg-brown/30 transition-colors">
              <Monitor size={22} className="text-brown-light" />
            </div>
            <h2 className="font-display font-black text-2xl tracking-wider text-cream mb-2">
              COACH PORTAL
            </h2>
            <p className="font-mono text-xs text-muted leading-relaxed">
              Manage clients, assign nutrition targets, monitor progress and compliance across your entire roster.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="font-display font-bold text-xs tracking-widest text-brown group-hover:text-brown-light transition-colors">
                ENTER PORTAL →
              </span>
            </div>
          </button>

          {/* Client App */}
          <button
            onClick={() => setActiveRole('client')}
            className="group bg-card border border-border hover:border-olive/60 rounded-2xl p-8 text-left transition-all duration-200 hover:bg-olive/5 glow-hover anim-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <div className="w-12 h-12 rounded-xl bg-olive/20 border border-olive/30 flex items-center justify-center mb-6 group-hover:bg-olive/30 transition-colors">
              <Smartphone size={22} className="text-olive-light" />
            </div>
            <h2 className="font-display font-black text-2xl tracking-wider text-cream mb-2">
              CLIENT APP
            </h2>
            <p className="font-mono text-xs text-muted leading-relaxed">
              Log your meals, track daily macros, and monitor your progress toward your nutrition goals.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="font-display font-bold text-xs tracking-widest text-olive group-hover:text-olive-light transition-colors">
                OPEN APP →
              </span>
            </div>
          </button>
        </div>

        <p className="text-center font-mono text-xs text-dim mt-10 anim-fade-in" style={{ animationDelay: '500ms' }}>
          Local session · All data stored on this device
        </p>
      </div>
    </div>
  )
}
