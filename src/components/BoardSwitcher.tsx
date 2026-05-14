import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Workspace } from '../lib/workspace'
import type { WorkspaceAction } from '../lib/workspaceReducer'

interface BoardSwitcherProps {
  workspace: Workspace
  dispatch: Dispatch<WorkspaceAction>
}

export function BoardSwitcher({ workspace, dispatch }: BoardSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const popRef = useRef<HTMLDivElement>(null)

  const activeBoard = workspace.boards[workspace.activeBoardId]
  const orderedBoards = workspace.boardOrder
    .map((id) => workspace.boards[id])
    .filter(Boolean)
  const canDelete = orderedBoards.length > 1

  // Close on click outside.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setRenamingId(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const handleSwitch = (id: string) => {
    dispatch({ type: 'SWITCH_BOARD', boardId: id })
    setOpen(false)
  }

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) {
      setCreating(false)
      setNewName('')
      return
    }
    dispatch({ type: 'CREATE_BOARD', name: newName })
    setNewName('')
    setCreating(false)
    setOpen(false)
  }

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      dispatch({ type: 'RENAME_BOARD', boardId: renamingId, name: renameValue })
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const handleRenameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!canDelete) return
    if (confirm(`Delete board "${name}"? Its cards will be lost.`)) {
      dispatch({ type: 'DELETE_BOARD', boardId: id })
    }
  }

  return (
    <div className="board-switcher" ref={popRef}>
      <button
        type="button"
        className="board-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch board"
      >
        <span className="bs-label">Board</span>
        <span className="bs-current">{activeBoard?.name ?? '—'}</span>
        <span className="bs-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="board-switcher-pop"
          role="menu"
          aria-label="Boards"
        >
          <ul className="bs-list">
            {orderedBoards.map((b) => {
              const isActive = b.id === workspace.activeBoardId
              const isRenaming = renamingId === b.id
              return (
                <li
                  key={b.id}
                  className={`bs-item ${isActive ? 'is-active' : ''}`}
                >
                  {isRenaming ? (
                    <input
                      type="text"
                      className="bs-rename-input"
                      value={renameValue}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKey}
                      onBlur={commitRename}
                      maxLength={60}
                      aria-label={`Rename ${b.name}`}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="bs-item-switch"
                        onClick={() => handleSwitch(b.id)}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span className="bs-check" aria-hidden="true">
                          {isActive ? '✓' : ''}
                        </span>
                        <span className="bs-name">{b.name}</span>
                      </button>
                      <span className="bs-item-actions">
                        <button
                          type="button"
                          className="bs-icon-btn"
                          onClick={() => startRename(b.id, b.name)}
                          aria-label={`Rename board: ${b.name}`}
                          title="Rename"
                        >
                          ✏
                        </button>
                        <button
                          type="button"
                          className="bs-icon-btn bs-icon-danger"
                          onClick={() => handleDelete(b.id, b.name)}
                          disabled={!canDelete}
                          aria-label={`Delete board: ${b.name}`}
                          title={canDelete ? 'Delete' : 'Cannot delete last board'}
                        >
                          ✕
                        </button>
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="bs-divider" />

          {creating ? (
            <form className="bs-create-form" onSubmit={handleCreate}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Board name"
                autoFocus
                maxLength={60}
                aria-label="New board name"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setCreating(false)
                    setNewName('')
                  }
                }}
              />
              <div className="bs-create-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
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
              + New board
            </button>
          )}
        </div>
      )}
    </div>
  )
}
