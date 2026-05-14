import { useState, type Dispatch, type FormEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Board, CardId, ColumnId } from '../lib/board'
import { totalCards } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import type { Filter } from '../lib/filters'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface KanbanBoardProps {
  board: Board
  dispatch: Dispatch<BoardAction>
  query?: string
  filter?: Filter
  onOpenCard?: (cardId: CardId) => void
}

type DragData =
  | { type: 'card'; columnId: ColumnId; cardId: CardId }
  | { type: 'column'; columnId: ColumnId }

export function KanbanBoard({
  board,
  dispatch,
  query = '',
  filter,
  onOpenCard,
}: KanbanBoardProps) {
  const [activeCardId, setActiveCardId] = useState<CardId | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id))
  }
  const handleDragCancel = () => setActiveCardId(null)

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null)
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DragData | undefined
    if (!activeData || activeData.type !== 'card' || !overData) return
    const cardId = activeData.cardId
    let toColumnId: ColumnId
    let toIndex: number
    if (overData.type === 'column') {
      toColumnId = overData.columnId
      toIndex = board.columns[toColumnId]?.cardIds.length ?? 0
    } else {
      toColumnId = overData.columnId
      const idx = board.columns[toColumnId]?.cardIds.indexOf(overData.cardId)
      if (idx === undefined || idx < 0) return
      toIndex = idx
    }
    const fromColId = activeData.columnId
    if (fromColId === toColumnId) {
      const fromIdx = board.columns[fromColId].cardIds.indexOf(cardId)
      if (fromIdx === toIndex) return
    }
    dispatch({ type: 'MOVE_CARD', cardId, toColumnId, toIndex })
  }

  const activeCard = activeCardId ? board.cards[activeCardId] : null
  const activeCardColumnId = activeCardId
    ? (Object.values(board.columns).find((c) =>
        c.cardIds.includes(activeCardId),
      )?.id ?? board.columnIds[0])
    : board.columnIds[0]

  const submitNewColumn = (e: FormEvent) => {
    e.preventDefault()
    if (!newColumnName.trim()) {
      setAddingColumn(false)
      setNewColumnName('')
      return
    }
    dispatch({ type: 'ADD_COLUMN', name: newColumnName })
    setNewColumnName('')
    setAddingColumn(false)
  }

  const canDeleteColumn = board.columnIds.length > 1

  return (
    <section
      className="kanban-board"
      aria-label={`Board ${board.name}`}
      data-testid="kanban-board"
    >
      <header className="kanban-board-head">
        <div>
          <h1 className="kanban-board-name">{board.name}</h1>
          <p className="kanban-board-sub">
            {totalCards(board)} cards · drag cards between columns · click a
            card for details · changes persist locally
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (confirm('Reset to demo data? This will discard your changes.')) {
              dispatch({ type: 'RESET' })
            }
          }}
          aria-label="Reset board to demo data"
        >
          Reset to demo
        </button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="kanban-board-grid">
          {board.columnIds.map((columnId) => (
            <KanbanColumn
              key={columnId}
              board={board}
              columnId={columnId}
              dispatch={dispatch}
              query={query}
              filter={filter}
              onOpenCard={onOpenCard}
              canDeleteColumn={canDeleteColumn}
            />
          ))}
          {addingColumn ? (
            <form className="add-column-form" onSubmit={submitNewColumn}>
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
                autoFocus
                maxLength={40}
                aria-label="New column name"
                onBlur={() => {
                  if (!newColumnName.trim()) setAddingColumn(false)
                }}
              />
              <div className="add-column-actions">
                <button type="submit" className="btn btn-primary btn-sm">
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAddingColumn(false)
                    setNewColumnName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="add-column-btn"
              onClick={() => setAddingColumn(true)}
              aria-label="Add a column"
            >
              + Add column
            </button>
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <KanbanCard
              card={activeCard}
              columnId={activeCardColumnId}
              dispatch={dispatch}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  )
}
