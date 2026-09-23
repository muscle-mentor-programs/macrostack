import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[MacroStack] Page render failed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return <main className="min-h-screen bg-bg text-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
        <h1 className="font-display text-2xl font-bold">This page couldn’t load</h1>
        <p className="mt-3 text-sm text-muted">Reload the app to try again.</p>
        <button type="button" className="btn-accent mt-6 rounded-lg px-5 py-3" onClick={() => window.location.reload()}>Reload app</button>
      </div>
    </main>
  }
}
