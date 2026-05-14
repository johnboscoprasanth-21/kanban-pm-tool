import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
} from 'react'
import {
  LABELS,
  PRIORITIES,
  PRIORITY_META,
  type Board,
  type Card,
  type ColumnId,
  type LabelId,
  type Priority,
} from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { formatIst } from '../lib/formatIst'

interface CardDetailModalProps {
  card: Card
  columnId: ColumnId
  board: Board
  dispatch: Dispatch<BoardAction>
  onClose: () => void
}

function epochToInputValue(ms: number | undefined): string {
  if (ms === undefined) return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function inputValueToEpoch(v: string): number | undefined {
  if (!v) return undefined
  const ms = new Date(v + 'T00:00:00').getTime()
  return Number.isNaN(ms) ? undefined : ms
}

export function CardDetailModal({
  card,
  columnId,
  board,
  dispatch,
  onClose,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [priority, setPriority] = useState<Priority | undefined>(card.priority)
  const [labels, setLabels] = useState<LabelId[]>(card.labels ?? [])
  const [dueInput, setDueInput] = useState(epochToInputValue(card.dueDate))

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = (e?: FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) return
    dispatch({
      type: 'UPDATE_CARD',
      cardId: card.id,
      patch: {
        title,
        description,
        priority,
        labels,
        dueDate: inputValueToEpoch(dueInput),
      },
    })
    onClose()
  }

  const remove = () => {
    dispatch({ type: 'DELETE_CARD', cardId: card.id })
    onClose()
  }

  const moveTo = (toColumnId: ColumnId) => {
    if (toColumnId === columnId) return
    const len = board.columns[toColumnId]?.cardIds.length ?? 0
    dispatch({
      type: 'MOVE_CARD',
      cardId: card.id,
      toColumnId,
      toIndex: len,
    })
    onClose()
  }

  const toggleLabel = (id: LabelId) => {
    setLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    )
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Card: ${card.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form className="modal-card" onSubmit={save}>
        <header className="modal-head">
          <input
            type="text"
            className="modal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            maxLength={120}
            aria-label="Card title"
            placeholder="Card title"
          />
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close card"
            title="Close"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          <label className="modal-field">
            <span className="modal-field-label">Description</span>
            <textarea
              className="modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add a description…"
              maxLength={1000}
              aria-label="Card description"
            />
          </label>

          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-field-label">Column</span>
              <select
                className="modal-select"
                value={columnId}
                onChange={(e) => moveTo(e.target.value)}
                aria-label="Move to column"
              >
                {board.columnIds.map((cid) => {
                  const c = board.columns[cid]
                  if (!c) return null
                  return (
                    <option key={cid} value={cid}>
                      {c.name}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="modal-field">
              <span className="modal-field-label">Due (IST)</span>
              <input
                type="date"
                className="modal-input"
                value={dueInput}
                onChange={(e) => setDueInput(e.target.value)}
                aria-label="Due date"
              />
            </label>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Priority</span>
            <div className="priority-picker" role="radiogroup" aria-label="Priority">
              <button
                type="button"
                className={`priority-btn ${priority === undefined ? 'is-on' : ''}`}
                onClick={() => setPriority(undefined)}
                aria-pressed={priority === undefined}
              >
                None
              </button>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-btn priority-${p} ${
                    priority === p ? 'is-on' : ''
                  }`}
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Labels</span>
            <div className="label-picker" role="group" aria-label="Labels">
              {(Object.keys(LABELS) as LabelId[]).map((id) => {
                const meta = LABELS[id]
                const on = labels.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`label-chip ${on ? 'is-on' : ''}`}
                    style={
                      on
                        ? {
                            background: meta.color,
                            borderColor: meta.color,
                            color: '#fff',
                          }
                        : { borderColor: meta.color, color: meta.color }
                    }
                    onClick={() => toggleLabel(id)}
                    aria-pressed={on}
                  >
                    {meta.name}
                  </button>
                )
              })}
            </div>
          </div>

          {card.createdAt !== undefined && (
            <p className="modal-meta">
              Created {formatIst(new Date(card.createdAt))}
            </p>
          )}
        </div>

        <footer className="modal-foot">
          <button
            type="button"
            className="btn btn-ghost btn-danger"
            onClick={remove}
            aria-label={`Delete card: ${card.title}`}
          >
            Delete
          </button>
          <div className="modal-foot-right">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
