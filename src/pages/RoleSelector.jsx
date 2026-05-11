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

        {/* Role cards — stacked on mobile (natural height), squares on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 anim-stagger">
          {/* Coach Portal */}
          <div className="sm:aspect-square overflow-hidden anim-fade-in-up">
            <button
              onClick={() => setActiveRole('coach')}
              className="group w-full sm:h-full bg-card border border-border hover:border-green/60 rounded-2xl p-6 transition-all duration-200 hover:bg-green/5 glow-hover card-hover flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-green/20 border border-green/30 flex items-center justify-center mb-4 group-hover:bg-green/30 transition-colors flex-shrink-0">
                <Monitor size={28} className="text-green-light" />
              </div>
              <h2 className="font-display font-black text-xl tracking-wider text-cream mb-2">
                COACH PORTAL
              </h2>
              <p className="font-mono text-xs text-muted leading-relaxed">
                Manage users & monitor progress
              </p>
              <div className="mt-4">
                <span className="font-display font-bold text-xs tracking-widest text-green group-hover:text-green-light transition-colors">
                  ENTER →
                </span>
              </div>
            </button>
          </div>

          {/* Client App */}
          <div className="sm:aspect-square overflow-hidden anim-fade-in-up" style={{ animationDelay: '80ms' }}>
            <button
              onClick={() => setActiveRole('client')}
              className="group w-full sm:h-full bg-card border border-border hover:border-blue/60 rounded-2xl p-6 transition-all duration-200 hover:bg-blue/5 glow-hover card-hover flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue/20 border border-blue/30 flex items-center justify-center mb-4 group-hover:bg-blue/30 transition-colors flex-shrink-0">
                <Smartphone size={28} className="text-blue-light" />
              </div>
              <h2 className="font-display font-black text-xl tracking-wider text-cream mb-2">
                USER APP
              </h2>
              <p className="font-mono text-xs text-muted leading-relaxed">
                Log meals & track daily macros
              </p>
              <div className="mt-4">
                <span className="font-display font-bold text-xs tracking-widest text-blue group-hover:text-blue-light transition-colors">
                  OPEN →
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
