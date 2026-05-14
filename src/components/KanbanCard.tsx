import {
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
} from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card, ColumnId } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'

interface KanbanCardProps {
  card: Card
  columnId: ColumnId
  dispatch: Dispatch<BoardAction>
  /** Disable drag handlers (e.g. when rendered inside a DragOverlay). */
  isOverlay?: boolean
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
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setTitle(card.title)
    setDescription(card.description ?? '')
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    dispatch({
      type: 'UPDATE_CARD',
      cardId: card.id,
      patch: { title, description },
    })
    setEditing(false)
  }

  const remove = () => {
    dispatch({ type: 'DELETE_CARD', cardId: card.id })
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
          rows={3}
          placeholder="Add a description (optional)"
          maxLength={500}
          aria-label="Card description"
        />
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

  return (
    <article
      ref={isOverlay ? undefined : sortable.setNodeRef}
      style={isOverlay ? undefined : style}
      className={`kanban-card ${isOverlay ? 'is-overlay' : ''} ${
        sortable.isDragging ? 'is-dragging' : ''
      }`}
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
      <h3 className="kanban-card-title">{card.title}</h3>
      {card.description && (
        <p className="kanban-card-desc">{card.description}</p>
      )}
    </article>
  )
}
