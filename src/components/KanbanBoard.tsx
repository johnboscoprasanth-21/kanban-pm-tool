import { useState, type Dispatch } from 'react'
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
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

interface KanbanBoardProps {
  board: Board
  dispatch: Dispatch<BoardAction>
  query?: string
}

type DragData =
  | { type: 'card'; columnId: ColumnId; cardId: CardId }
  | { type: 'column'; columnId: ColumnId }

export function KanbanBoard({ board, dispatch, query = '' }: KanbanBoardProps) {
  const [activeCardId, setActiveCardId] = useState<CardId | null>(null)

  // PointerSensor with a small activation distance keeps single-clicks
  // working for edit mode; only a real drag movement starts DnD.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id))
  }

  const handleDragCancel = () => {
    setActiveCardId(null)
  }

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
      // Drop at end of column.
      toIndex = board.columns[toColumnId].cardIds.length
    } else {
      // Hovered over another card.
      toColumnId = overData.columnId
      toIndex = board.columns[toColumnId].cardIds.indexOf(overData.cardId)
      if (toIndex < 0) return
    }

    // No-op if dropping at the same slot.
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
            {totalCards(board)} cards · drag cards between columns · click to
            edit · changes persist locally
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (
              confirm(
                'Reset to demo data? This will discard your current board.',
              )
            ) {
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
            />
          ))}
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
