import './App.css'
import { IstClock } from './components/IstClock'
import { KanbanBoard } from './components/KanbanBoard'
import { SAMPLE_BOARD } from './lib/board'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true">
            <span>K</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">Kanban PM</span>
            <span className="brand-tag">
              A project management tool · React + CI/CD
            </span>
          </div>
        </div>
        <div className="header-right">
          <span className="phase-pill" title="Current development phase">
            {__APP_PHASE__}
          </span>
          <IstClock />
        </div>
      </header>

      <main className="app-main">
        <KanbanBoard board={SAMPLE_BOARD} />

        <section className="build-card" aria-label="Build info">
          <h2>Build info</h2>
          <dl className="meta">
            <dt>Phase</dt>
            <dd>
              <code>{__APP_PHASE__}</code>
            </dd>
            <dt>Commit</dt>
            <dd>
              <code>{__COMMIT_SHA__}</code>
            </dd>
            <dt>Built at</dt>
            <dd>
              <code>{__BUILD_TIME__}</code>
            </dd>
          </dl>
        </section>
      </main>

      <footer className="app-footer">
        <span>
          John Bosco Prasanth · Built in phases · Each phase auto-deployed via
          GitHub Actions
        </span>
      </footer>
    </div>
  )
}

export default App
