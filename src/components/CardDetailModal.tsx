import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
} from 'react'
import {
  ASSIGNEE_IDS,
  ISSUE_TYPES,
  ISSUE_TYPE_IDS,
  LABELS,
  POINT_OPTIONS,
  PRIORITIES,
  PRIORITY_META,
  TEAM,
  type AssigneeId,
  type Board,
  type Card,
  type ChecklistItem,
  type ColumnId,
  type IssueType,
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

function makeChecklistItemId(): string {
  return `cl-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
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
  const [type, setType] = useState<IssueType | undefined>(card.type)
  const [points, setPoints] = useState<number | undefined>(card.points)
  const [assignee, setAssignee] = useState<AssigneeId | undefined>(
    card.assignee,
  )
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    card.checklist ? card.checklist.map((i) => ({ ...i })) : [],
  )
  const [newSubtask, setNewSubtask] = useState('')

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
        type,
        points,
        assignee,
        checklist,
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

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
    )
  }

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((it) => it.id !== id))
  }

  const addChecklistItem = () => {
    const text = newSubtask.trim()
    if (!text) return
    setChecklist((prev) => [
      ...prev,
      { id: makeChecklistItemId(), text, done: false },
    ])
    setNewSubtask('')
  }

  const checklistDone = checklist.filter((i) => i.done).length

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
          <div className="modal-key-block">
            {card.key && <span className="modal-key">{card.key}</span>}
            {type && (
              <span
                className="type-icon type-modal"
                style={{ background: ISSUE_TYPES[type].color }}
                title={ISSUE_TYPES[type].name}
              >
                {ISSUE_TYPES[type].icon}
              </span>
            )}
          </div>
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
              rows={4}
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

          <div className="modal-row">
            <div className="modal-field">
              <span className="modal-field-label">Issue type</span>
              <div className="type-picker" role="radiogroup" aria-label="Type">
                {ISSUE_TYPE_IDS.map((t) => {
                  const meta = ISSUE_TYPES[t]
                  const on = type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`type-btn ${on ? 'is-on' : ''}`}
                      onClick={() => setType(on ? undefined : t)}
                      aria-pressed={on}
                      style={
                        on
                          ? {
                              background: meta.color,
                              borderColor: meta.color,
                              color: '#fff',
                            }
                          : { borderColor: meta.color, color: meta.color }
                      }
                    >
                      <span
                        className="type-chip-icon"
                        style={
                          on
                            ? { background: '#ffffff33', color: '#fff' }
                            : { background: meta.color, color: '#fff' }
                        }
                      >
                        {meta.icon}
                      </span>
                      {meta.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="modal-field">
              <span className="modal-field-label">Assignee</span>
              <select
                className="modal-select"
                value={assignee ?? 'unassigned'}
                onChange={(e) =>
                  setAssignee(
                    e.target.value === 'unassigned'
                      ? 'unassigned'
                      : (e.target.value as AssigneeId),
                  )
                }
                aria-label="Assignee"
              >
                {ASSIGNEE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {TEAM[id].name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Story points</span>
            <div className="points-picker" role="radiogroup" aria-label="Story points">
              <button
                type="button"
                className={`points-btn ${points === undefined ? 'is-on' : ''}`}
                onClick={() => setPoints(undefined)}
                aria-pressed={points === undefined}
              >
                –
              </button>
              {POINT_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`points-btn ${points === p ? 'is-on' : ''}`}
                  onClick={() => setPoints(p)}
                  aria-pressed={points === p}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Priority</span>
            <div
              className="priority-picker"
              role="radiogroup"
              aria-label="Priority"
            >
              <button
                type="button"
                className={`priority-btn ${
                  priority === undefined ? 'is-on' : ''
                }`}
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

          <div className="modal-field">
            <span className="modal-field-label">
              Checklist
              {checklist.length > 0 && (
                <span className="checklist-progress-inline">
                  {' '}
                  · {checklistDone} of {checklist.length} done
                </span>
              )}
            </span>
            {checklist.length > 0 && (
              <ul className="checklist">
                {checklist.map((it) => (
                  <li
                    key={it.id}
                    className={`checklist-item ${it.done ? 'is-done' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={it.done}
                      onChange={() => toggleChecklistItem(it.id)}
                      aria-label={
                        it.done
                          ? `Mark "${it.text}" not done`
                          : `Mark "${it.text}" done`
                      }
                    />
                    <span className="checklist-text">{it.text}</span>
                    <button
                      type="button"
                      className="checklist-remove"
                      onClick={() => removeChecklistItem(it.id)}
                      aria-label={`Remove subtask: ${it.text}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="checklist-add">
              <input
                type="text"
                className="modal-input"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask…"
                maxLength={120}
                aria-label="New subtask"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChecklistItem()
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addChecklistItem}
                disabled={!newSubtask.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {card.createdAt !== undefined && (
            <p className="modal-meta">
              Created {formatIst(new Date(card.createdAt))}
            </p>
          )}

          {card.history && card.history.length > 0 && (
            <div className="modal-field">
              <span className="modal-field-label">Activity</span>
              <ul className="history-list">
                {card.history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <li key={`${h.at}-${i}`} className="history-item">
                      <time className="history-time">
                        {formatIst(new Date(h.at))}
                      </time>
                      <span className="history-text">{h.text}</span>
                    </li>
                  ))}
              </ul>
            </div>
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
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
