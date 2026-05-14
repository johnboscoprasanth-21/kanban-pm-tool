import type { Board, ColumnId } from '../lib/board'
import { cardsInColumn } from '../lib/board'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  board: Board
  columnId: ColumnId
}

export function KanbanColumn({ board, columnId }: KanbanColumnProps) {
  const column = board.columns[columnId]
  if (!column) return null
  const cards = cardsInColumn(board, columnId)

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
        {cards.length === 0 ? (
          <p className="kanban-column-empty">No cards yet.</p>
        ) : (
          cards.map((card) => <KanbanCard key={card.id} card={card} />)
        )}
      </div>
    </section>
  )
}
