import {
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Board, ColumnId } from '../lib/board'
import { cardsInColumn } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { matchesQuery } from '../lib/matchesQuery'
import { matchesFilter, type Filter } from '../lib/filters'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  board: Board
  columnId: ColumnId
  dispatch: Dispatch<BoardAction>
  query?: string
  filter?: Filter
  onOpenCard?: (cardId: string) => void
  canDeleteColumn?: boolean
}

export function KanbanColumn({
  board,
  columnId,
  dispatch,
  query = '',
  filter,
  onOpenCard,
  canDeleteColumn = true,
}: KanbanColumnProps) {
  const column = board.columns[columnId]
  const allCards = cardsInColumn(board, columnId)
  const filtered = allCards.filter(
    (c) => matchesQuery(c, query) && (filter ? matchesFilter(c, filter) : true),
  )
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(column?.name ?? '')

  // useSortable makes the column draggable AND droppable. Cards dropping
  // on the column will hit this droppable (data type: 'column').
  const sortable = useSortable({
    id: columnId,
    data: { type: 'column', columnId },
    disabled: renaming, // don't drag while editing the name
  })

  if (!column) return null

  const style: CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  }

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

  const startRename = () => {
    setRenameValue(column.name)
    setRenaming(true)
  }
  const commitRename = () => {
    if (renameValue.trim() && renameValue !== column.name) {
      dispatch({ type: 'RENAME_COLUMN', columnId, name: renameValue })
    }
    setRenaming(false)
  }
  const cancelRename = () => {
    setRenameValue(column.name)
    setRenaming(false)
  }
  const onRenameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  const handleDeleteColumn = () => {
    if (!canDeleteColumn) return
    const note =
      allCards.length === 0
        ? ''
        : `\n\nThis column has ${allCards.length} card(s). They will be deleted.`
    if (confirm(`Delete column "${column.name}"?${note}`)) {
      dispatch({ type: 'DELETE_COLUMN', columnId })
    }
  }

  const isFiltered =
    query.trim().length > 0 || (filter && filtered.length !== allCards.length)
  const countLabel = isFiltered
    ? `${filtered.length} of ${allCards.length}`
    : String(allCards.length)

  return (
    <section
      ref={sortable.setNodeRef}
      style={style}
      className={`kanban-column ${sortable.isOver ? 'is-drop-target' : ''} ${
        sortable.isDragging ? 'is-dragging' : ''
      }`}
      data-testid={`column-${columnId}`}
      aria-label={`Column ${column.name}`}
    >
      <header
        className="kanban-column-head"
        {...(renaming ? {} : sortable.attributes)}
        {...(renaming ? {} : sortable.listeners)}
      >
        {renaming ? (
          <input
            type="text"
            className="column-rename-input"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={onRenameKey}
            onBlur={commitRename}
            maxLength={40}
            aria-label={`Rename column ${column.name}`}
          />
        ) : (
          <button
            type="button"
            className="kanban-column-name-btn"
            onClick={startRename}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Rename column: ${column.name}`}
            title="Click to rename · drag header to reorder"
          >
            <h2 className="kanban-column-name">{column.name}</h2>
          </button>
        )}
        <span className="kanban-column-meta">
          <span className="kanban-column-count" aria-label="Card count">
            {countLabel}
          </span>
          <button
            type="button"
            className="column-delete-btn"
            onClick={handleDeleteColumn}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={!canDeleteColumn}
            aria-label={`Delete column: ${column.name}`}
            title={canDeleteColumn ? 'Delete column' : 'Cannot delete last column'}
          >
            ✕
          </button>
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
              onOpen={onOpenCard}
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
