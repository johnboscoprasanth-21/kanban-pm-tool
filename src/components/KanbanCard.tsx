import { useState, type Dispatch, type FormEvent } from 'react'
import type { Card } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'

interface KanbanCardProps {
  card: Card
  dispatch: Dispatch<BoardAction>
}

export function KanbanCard({ card, dispatch }: KanbanCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')

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
      className="kanban-card"
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
    >
      <button
        type="button"
        className="card-delete"
        onClick={(e) => {
          e.stopPropagation()
          remove()
        }}
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
