import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
} from 'react'
import type { Board } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'

interface SprintControlProps {
  board: Board
  dispatch: Dispatch<BoardAction>
}

export function SprintControl({ board, dispatch }: SprintControlProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const sprints = board.sprints ?? {}
  const order = board.sprintOrder ?? []
  const ordered = order.map((id) => sprints[id]).filter(Boolean)
  const activeSprint = board.activeSprintId
    ? sprints[board.activeSprintId]
    : undefined

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      setCreating(false)
      setNewName('')
      return
    }
    dispatch({ type: 'CREATE_SPRINT', name: newName })
    setNewName('')
    setCreating(false)
  }

  const handleStart = (id: string) => {
    dispatch({ type: 'START_SPRINT', sprintId: id })
  }
  const handleComplete = (id: string, name: string) => {
    if (
      confirm(
        `Complete sprint "${name}"? Cards not in the last column will move back to the backlog.`,
      )
    ) {
      dispatch({ type: 'COMPLETE_SPRINT', sprintId: id })
    }
  }
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete sprint "${name}"? Its cards go back to the backlog.`)) {
      dispatch({ type: 'DELETE_SPRINT', sprintId: id })
    }
  }

  return (
    <div className="sprint-control" ref={popRef}>
      <button
        type="button"
        className="board-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Manage sprints"
      >
        <span className="bs-label">Sprint</span>
        <span className="bs-current">
          {activeSprint ? activeSprint.name : 'None active'}
        </span>
        <span className="bs-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="board-switcher-pop sprint-pop"
          role="menu"
          aria-label="Sprints"
        >
          {ordered.length === 0 && (
            <p className="sprint-empty">No sprints yet. Create one below.</p>
          )}
          <ul className="bs-list">
            {ordered.map((s) => (
              <li
                key={s.id}
                className={`bs-item sprint-item state-${s.state}`}
              >
                <span className="sprint-name-cell">
                  <span className={`sprint-state-pill state-${s.state}`}>
                    {s.state}
                  </span>
                  <span className="bs-name">{s.name}</span>
                </span>
                <span className="bs-item-actions sprint-actions">
                  {s.state === 'planning' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStart(s.id)}
                      disabled={Boolean(board.activeSprintId)}
                      title={
                        board.activeSprintId
                          ? 'Complete the active sprint first'
                          : 'Start sprint'
                      }
                    >
                      Start
                    </button>
                  )}
                  {s.state === 'active' && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleComplete(s.id, s.name)}
                    >
                      Complete
                    </button>
                  )}
                  {s.state !== 'active' && (
                    <button
                      type="button"
                      className="bs-icon-btn bs-icon-danger"
                      onClick={() => handleDelete(s.id, s.name)}
                      aria-label={`Delete sprint: ${s.name}`}
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="bs-divider" />

          {creating ? (
            <form className="bs-create-form" onSubmit={handleCreate}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Sprint name"
                autoFocus
                maxLength={40}
                aria-label="New sprint name"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setCreating(false)
                    setNewName('')
                  }
                }}
              />
              <div className="bs-create-actions">
                <button type="submit" className="btn btn-primary btn-sm">
                  Create
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setCreating(false)
                    setNewName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="bs-create-btn"
              onClick={() => setCreating(true)}
            >
              + New sprint
            </button>
          )}
        </div>
      )}
    </div>
  )
}
