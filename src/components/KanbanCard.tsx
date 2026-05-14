import {
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
} from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  LABELS,
  PRIORITIES,
  PRIORITY_META,
  type Card,
  type ColumnId,
  type LabelId,
  type Priority,
} from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { formatIstDate } from '../lib/formatIst'

interface KanbanCardProps {
  card: Card
  columnId: ColumnId
  dispatch: Dispatch<BoardAction>
  /** Disable drag handlers (e.g. when rendered inside a DragOverlay). */
  isOverlay?: boolean
}

/** Convert epoch ms <-> "YYYY-MM-DD" for <input type="date"> binding. */
function epochToInputValue(ms: number | undefined): string {
  if (ms === undefined) return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  // YYYY-MM-DD in local time (input[type=date] is local-zoned).
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function inputValueToEpoch(v: string): number | undefined {
  if (!v) return undefined
  const ms = new Date(v + 'T00:00:00').getTime()
  return Number.isNaN(ms) ? undefined : ms
}

function isOverdue(card: Card): boolean {
  if (card.dueDate === undefined) return false
  // Today's start in local time.
  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  return card.dueDate < todayStart
}

export function KanbanCard({
  card,
  columnId,
  dispatch,
  isOverlay = false,
}: KanbanCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [priority, setPriority] = useState<Priority | undefined>(card.priority)
  const [labels, setLabels] = useState<LabelId[]>(card.labels ?? [])
  const [dueInput, setDueInput] = useState(epochToInputValue(card.dueDate))

  const sortable = useSortable({
    id: card.id,
    data: { type: 'card', columnId, cardId: card.id },
    disabled: editing || isOverlay,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.4 : 1,
  }

  const startEditing = () => {
    setTitle(card.title)
    setDescription(card.description ?? '')
    setPriority(card.priority)
    setLabels(card.labels ?? [])
    setDueInput(epochToInputValue(card.dueDate))
    setEditing(true)
  }

  const cancel = () => {
    setTitle(card.title)
    setDescription(card.description ?? '')
    setPriority(card.priority)
    setLabels(card.labels ?? [])
    setDueInput(epochToInputValue(card.dueDate))
    setEditing(false)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const dueDate = inputValueToEpoch(dueInput)
    dispatch({
      type: 'UPDATE_CARD',
      cardId: card.id,
      patch: { title, description, priority, labels, dueDate },
    })
    setEditing(false)
  }

  const remove = () => {
    dispatch({ type: 'DELETE_CARD', cardId: card.id })
  }

  const toggleLabel = (id: LabelId) => {
    setLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    )
  }

  if (editing) {
    return (
      <form
        ref={sortable.setNodeRef}
        style={style}
        className="kanban-card kanban-card-edit"
        onSubmit={save}
        data-testid={`card-${card.id}`}
        aria-label={`Edit ${card.title}`}
      >
        <input
          type="text"
          className="card-input-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          maxLength={120}
          aria-label="Card title"
        />
        <textarea
          className="card-input-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Add a description (optional)"
          maxLength={500}
          aria-label="Card description"
        />

        <div className="card-edit-row">
          <label className="card-edit-field">
            <span className="card-edit-label">Priority</span>
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
          </label>

          <label className="card-edit-field">
            <span className="card-edit-label">Due (IST)</span>
            <input
              type="date"
              className="card-input-date"
              value={dueInput}
              onChange={(e) => setDueInput(e.target.value)}
              aria-label="Due date"
            />
          </label>
        </div>

        <div className="card-edit-field">
          <span className="card-edit-label">Labels</span>
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

        <div className="card-edit-actions">
          <button type="submit" className="btn btn-primary btn-sm">
            Save
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={cancel}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  const overdue = isOverdue(card)

  return (
    <article
      ref={isOverlay ? undefined : sortable.setNodeRef}
      style={isOverlay ? undefined : style}
      className={`kanban-card ${isOverlay ? 'is-overlay' : ''} ${
        sortable.isDragging ? 'is-dragging' : ''
      } ${overdue ? 'is-overdue' : ''}`}
      data-testid={`card-${card.id}`}
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          startEditing()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit card: ${card.title}`}
      {...(isOverlay ? {} : sortable.attributes)}
      {...(isOverlay ? {} : sortable.listeners)}
    >
      <button
        type="button"
        className="card-delete"
        onClick={(e) => {
          e.stopPropagation()
          remove()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Delete card: ${card.title}`}
        title="Delete card"
      >
        ✕
      </button>

      {card.labels && card.labels.length > 0 && (
        <div className="card-labels" aria-label="Labels">
          {card.labels.map((id) => {
            const meta = LABELS[id]
            if (!meta) return null
            return (
              <span
                key={id}
                className="card-label"
                style={{ background: meta.color }}
                title={meta.name}
              >
                {meta.name}
              </span>
            )
          })}
        </div>
      )}

      <h3 className="kanban-card-title">
        {card.priority && (
          <span
            className={`priority-dot priority-${card.priority}`}
            title={`${PRIORITY_META[card.priority].label} priority`}
            aria-label={`${PRIORITY_META[card.priority].label} priority`}
          />
        )}
        {card.title}
      </h3>

      {card.description && (
        <p className="kanban-card-desc">{card.description}</p>
      )}

      {card.dueDate !== undefined && (
        <div
          className={`card-due ${overdue ? 'is-overdue-text' : ''}`}
          aria-label="Due date"
        >
          <span aria-hidden="true">📅</span>{' '}
          {formatIstDate(new Date(card.dueDate))}
          {overdue && <span className="overdue-tag">Overdue</span>}
        </div>
      )}
    </article>
  )
}
