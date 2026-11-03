import { Component } from 'react';

/** Catches unexpected rendering errors so the whole app never turns into a blank screen. */
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base px-6 text-center">
        <h1 className="text-white">Something went wrong</h1>
        <p className="max-w-md text-muted">An unexpected error happened in the page. Reloading usually fixes it.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.assign('/')}>Reload EquiTrack</button>
      </div>
    );
  }
}
