import type { Card } from '../lib/board'

interface KanbanCardProps {
  card: Card
}

export function KanbanCard({ card }: KanbanCardProps) {
  return (
    <article className="kanban-card" data-testid={`card-${card.id}`}>
      <h3 className="kanban-card-title">{card.title}</h3>
      {card.description && (
        <p className="kanban-card-desc">{card.description}</p>
      )}
    </article>
  )
}
