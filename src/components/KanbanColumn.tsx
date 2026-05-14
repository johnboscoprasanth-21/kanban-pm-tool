import { useState, type Dispatch, type FormEvent } from 'react'
import type { Board, ColumnId } from '../lib/board'
import { cardsInColumn } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  board: Board
  columnId: ColumnId
  dispatch: Dispatch<BoardAction>
}

export function KanbanColumn({ board, columnId, dispatch }: KanbanColumnProps) {
  const column = board.columns[columnId]
  const cards = cardsInColumn(board, columnId)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  if (!column) return null

  const submitAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setAdding(false)
      setTitle('')
      return
    }
    dispatch({ type: 'ADD_CARD', columnId, title })
    setTitle('')
    setAdding(false)
  }

  return (
    <section
      className="kanban-column"
      data-testid={`column-${columnId}`}
      aria-label={`Column ${column.name}`}
    >
      <header className="kanban-column-head">
        <h2 className="kanban-column-name">{column.name}</h2>
        <span className="kanban-column-count" aria-label="Card count">
          {cards.length}
        </span>
      </header>

      <div className="kanban-column-body">
        {cards.length === 0 && !adding && (
          <p className="kanban-column-empty">No cards yet.</p>
        )}
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} dispatch={dispatch} />
        ))}
        {adding ? (
          <form className="add-card-form" onSubmit={submitAdd}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New card title"
              autoFocus
              maxLength={120}
              aria-label="New card title"
              onBlur={() => {
                if (!title.trim()) setAdding(false)
              }}
            />
            <div className="add-card-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Add
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setAdding(false)
                  setTitle('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="add-card-btn"
            onClick={() => setAdding(true)}
            aria-label={`Add a card to ${column.name}`}
          >
            + Add a card
          </button>
        )}
      </div>
    </section>
  )
}
