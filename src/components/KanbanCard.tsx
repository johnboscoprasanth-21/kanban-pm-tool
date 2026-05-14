import { type CSSProperties, type Dispatch } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  LABELS,
  PRIORITY_META,
  type Card,
  type ColumnId,
} from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { isOverdue } from '../lib/filters'
import { formatIstDate } from '../lib/formatIst'

interface KanbanCardProps {
  card: Card
  columnId: ColumnId
  dispatch: Dispatch<BoardAction>
  onOpen?: (cardId: string) => void
  /** Disable drag handlers (e.g. when rendered inside a DragOverlay). */
  isOverlay?: boolean
}

export function KanbanCard({
  card,
  columnId,
  dispatch,
  onOpen,
  isOverlay = false,
}: KanbanCardProps) {
  const sortable = useSortable({
    id: card.id,
    data: { type: 'card', columnId, cardId: card.id },
    disabled: isOverlay,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.4 : 1,
  }

  const remove = () => {
    dispatch({ type: 'DELETE_CARD', cardId: card.id })
  }

  const overdue = isOverdue(card)
  const open = () => {
    if (onOpen) onOpen(card.id)
  }

  return (
    <article
      ref={isOverlay ? undefined : sortable.setNodeRef}
      style={isOverlay ? undefined : style}
      className={`kanban-card ${isOverlay ? 'is-overlay' : ''} ${
        sortable.isDragging ? 'is-dragging' : ''
      } ${overdue ? 'is-overdue' : ''}`}
      data-testid={`card-${card.id}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open card: ${card.title}`}
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
