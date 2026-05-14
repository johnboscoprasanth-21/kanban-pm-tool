import type { Dispatch } from 'react'
import type { Board } from '../lib/board'
import { totalCards } from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  board: Board
  dispatch: Dispatch<BoardAction>
}

export function KanbanBoard({ board, dispatch }: KanbanBoardProps) {
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
            click a card to edit · changes persist locally
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
      <div className="kanban-board-grid">
        {board.columnIds.map((columnId) => (
          <KanbanColumn
            key={columnId}
            board={board}
            columnId={columnId}
            dispatch={dispatch}
          />
        ))}
      </div>
    </section>
  )
}
