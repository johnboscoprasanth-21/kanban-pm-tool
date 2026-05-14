import { useEffect, useState } from 'react'

interface UndoToastProps {
  /** Description of what just happened (e.g. card title). */
  message: string
  /** Seconds before the toast self-dismisses. Default 5. */
  durationMs?: number
  onUndo: () => void
  onDismiss: () => void
}

export function UndoToast({
  message,
  durationMs = 5000,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    const timeout = setTimeout(onDismiss, durationMs)
    return () => {
      clearInterval(id)
      clearTimeout(timeout)
    }
  }, [durationMs, onDismiss])

  return (
    <div
      className="undo-toast"
      role="status"
      aria-live="polite"
      aria-label="Undo action"
    >
      <span className="undo-toast-msg">{message}</span>
      <button
        type="button"
        className="undo-toast-btn"
        onClick={onUndo}
        aria-label="Undo delete"
      >
        Undo
      </button>
      <span className="undo-toast-timer" aria-hidden="true">
        {remaining}s
      </span>
    </div>
  )
}
