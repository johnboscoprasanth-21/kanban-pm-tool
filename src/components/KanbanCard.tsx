import { type CSSProperties, type Dispatch } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ISSUE_TYPES,
  LABELS,
  PRIORITY_META,
  TEAM,
  assigneeInitials,
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

  const typeMeta = card.type ? ISSUE_TYPES[card.type] : null
  const assigneeMeta = card.assignee
    ? TEAM[card.assignee]
    : null
  const checklistTotal = card.checklist?.length ?? 0
  const checklistDone = card.checklist?.filter((c) => c.done).length ?? 0

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
      aria-label={`Open card: ${card.key ? card.key + ' — ' : ''}${card.title}`}
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

      <div className="card-title-row">
        {typeMeta && (
          <span
            className={`type-icon type-${card.type}`}
            style={{ background: typeMeta.color }}
            title={typeMeta.name}
            aria-label={`Type: ${typeMeta.name}`}
          >
            {typeMeta.icon}
          </span>
        )}
        {card.priority && (
          <span
            className={`priority-dot priority-${card.priority}`}
            title={`${PRIORITY_META[card.priority].label} priority`}
            aria-label={`${PRIORITY_META[card.priority].label} priority`}
          />
        )}
        <h3 className="kanban-card-title">{card.title}</h3>
      </div>

      {card.description && (
        <p className="kanban-card-desc">{card.description}</p>
      )}

      <div className="card-foot">
        <span className="card-foot-left">
          {card.key && <span className="card-key" title="Issue key">{card.key}</span>}
          {checklistTotal > 0 && (
            <span
              className={`checklist-progress ${
                checklistDone === checklistTotal ? 'is-done' : ''
              }`}
              title="Checklist progress"
              aria-label={`Checklist: ${checklistDone} of ${checklistTotal} done`}
            >
              ☑ {checklistDone}/{checklistTotal}
            </span>
          )}
          {card.dueDate !== undefined && (
            <span
              className={`card-due-pill ${overdue ? 'is-overdue-text' : ''}`}
              title={overdue ? 'Overdue' : 'Due date'}
              aria-label="Due date"
            >
              📅 {formatIstDate(new Date(card.dueDate))}
            </span>
          )}
        </span>
        <span className="card-foot-right">
          {card.points !== undefined && (
            <span className="card-points" title="Story points">
              {card.points}
            </span>
          )}
          {assigneeMeta && (
            <span
              className="avatar"
              style={{ background: assigneeMeta.color }}
              title={`Assignee: ${assigneeMeta.name}`}
              aria-label={`Assignee: ${assigneeMeta.name}`}
            >
              {assigneeInitials(card.assignee)}
            </span>
          )}
        </span>
      </div>
    </article>
  )
}
