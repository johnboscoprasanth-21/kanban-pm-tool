import { useEffect } from 'react'

interface ShortcutsOverlayProps {
  onClose: () => void
}

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ['/'], description: 'Focus the search box' },
  { keys: ['?'], description: 'Show this shortcuts overlay' },
  { keys: ['Esc'], description: 'Close any open dialog or menu' },
  { keys: ['Enter'], description: 'Save the field you’re editing' },
  { keys: ['Space'], description: 'Open a focused card (or pick up for DnD)' },
  { keys: ['↑ ↓ ← →'], description: 'Move a card with the keyboard while held' },
]

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="shortcuts-card">
        <header className="modal-head">
          <h2 className="shortcuts-title">Keyboard shortcuts</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close shortcuts"
            title="Close"
          >
            ✕
          </button>
        </header>
        <ul className="shortcuts-list">
          {SHORTCUTS.map((s) => (
            <li key={s.description} className="shortcuts-item">
              <span className="shortcuts-keys">
                {s.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
              <span className="shortcuts-desc">{s.description}</span>
            </li>
          ))}
        </ul>
        <footer className="shortcuts-foot">
          Press <kbd>?</kbd> any time to reopen this list.
        </footer>
      </div>
    </div>
  )
}
