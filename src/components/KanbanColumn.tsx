import { useState, type Dispatch, type FormEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Board, ColumnId } from '../lib/board'
import { cardsInColumn } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { matchesQuery } from '../lib/matchesQuery'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  board: Board
  columnId: ColumnId
  dispatch: Dispatch<BoardAction>
  query?: string
}

export function KanbanColumn({
  board,
  columnId,
  dispatch,
  query = '',
}: KanbanColumnProps) {
  const column = board.columns[columnId]
  const allCards = cardsInColumn(board, columnId)
  const filtered = allCards.filter((c) => matchesQuery(c, query))
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: 'column', columnId },
  })

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

  const isFiltered = query.trim().length > 0
  const countLabel = isFiltered
    ? `${filtered.length} of ${allCards.length}`
    : String(allCards.length)

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'is-drop-target' : ''}`}
      data-testid={`column-${columnId}`}
      aria-label={`Column ${column.name}`}
    >
      <header className="kanban-column-head">
        <h2 className="kanban-column-name">{column.name}</h2>
        <span className="kanban-column-count" aria-label="Card count">
          {countLabel}
        </span>
      </header>

      <div className="kanban-column-body">
        <SortableContext
          items={filtered.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {filtered.length === 0 && !adding && (
            <p className="kanban-column-empty">
              {isFiltered
                ? 'No matches in this column.'
                : 'Drop here or add a card.'}
            </p>
          )}
          {filtered.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={columnId}
              dispatch={dispatch}
            />
          ))}
        </SortableContext>
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
