import type { Board } from '../lib/board'
import { isDueToday, isOverdue } from '../lib/filters'

interface BoardStatsProps {
  board: Board
}

export function BoardStats({ board }: BoardStatsProps) {
  const cards = Object.values(board.cards)
  const overdue = cards.filter((c) => isOverdue(c)).length
  const dueToday = cards.filter((c) => isDueToday(c)).length

  return (
    <div className="board-stats" aria-label="Board statistics">
      <span className="bs-stat">
        <span className="bs-stat-num">{cards.length}</span>
        <span className="bs-stat-label">cards</span>
      </span>
      <span className="bs-sep" aria-hidden="true">
        ·
      </span>
      <span className={`bs-stat ${overdue > 0 ? 'is-warn' : ''}`}>
        <span className="bs-stat-num">{overdue}</span>
        <span className="bs-stat-label">overdue</span>
      </span>
      <span className="bs-sep" aria-hidden="true">
        ·
      </span>
      <span className={`bs-stat ${dueToday > 0 ? 'is-due' : ''}`}>
        <span className="bs-stat-num">{dueToday}</span>
        <span className="bs-stat-label">due today</span>
      </span>
    </div>
  )
}
