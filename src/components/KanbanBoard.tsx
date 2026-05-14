import type { Board } from '../lib/board'
import { totalCards } from '../lib/board'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  board: Board
}

export function KanbanBoard({ board }: KanbanBoardProps) {
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
            {totalCards(board)} cards across {board.columnIds.length} columns ·
            read-only in Phase 1, mutable from Phase 2
          </p>
        </div>
      </header>
      <div className="kanban-board-grid">
        {board.columnIds.map((columnId) => (
          <KanbanColumn key={columnId} board={board} columnId={columnId} />
        ))}
      </div>
    </section>
  )
}
