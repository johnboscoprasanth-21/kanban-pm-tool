import { useMemo, useState, type Dispatch, type ChangeEvent } from 'react'
import {
  ISSUE_TYPES,
  PRIORITY_META,
  TEAM,
  assigneeInitials,
  type Board,
  type Card,
  type CardId,
} from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { matchesQuery } from '../lib/matchesQuery'
import { matchesFilter, type Filter } from '../lib/filters'
import { BulkActionBar } from './BulkActionBar'

type SortKey = 'created' | 'priority' | 'points' | 'type' | 'key'

interface BacklogViewProps {
  board: Board
  dispatch: Dispatch<BoardAction>
  query?: string
  filter?: Filter
  onOpenCard?: (cardId: CardId) => void
}

function priorityRank(card: Card): number {
  if (!card.priority) return 0
  return PRIORITY_META[card.priority].rank
}

export function BacklogView({
  board,
  dispatch,
  query = '',
  filter,
  onOpenCard,
}: BacklogViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDesc, setSortDesc] = useState(true)
  const [selected, setSelected] = useState<Set<CardId>>(() => new Set())

  const items = useMemo(() => {
    const all = Object.values(board.cards).filter((c) => !c.sprintId)
    const filtered = all.filter(
      (c) =>
        matchesQuery(c, query) && (filter ? matchesFilter(c, filter) : true),
    )
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'priority':
          cmp = priorityRank(a) - priorityRank(b)
          break
        case 'points':
          cmp = (a.points ?? 0) - (b.points ?? 0)
          break
        case 'type':
          cmp = (a.type ?? '').localeCompare(b.type ?? '')
          break
        case 'key':
          cmp = (a.key ?? '').localeCompare(b.key ?? '')
          break
        case 'created':
        default:
          cmp = (a.createdAt ?? 0) - (b.createdAt ?? 0)
      }
      return sortDesc ? -cmp : cmp
    })
    return sorted
  }, [board.cards, query, filter, sortKey, sortDesc])

  const totalPoints = items.reduce((s, c) => s + (c.points ?? 0), 0)

  const onHeaderClick = (key: SortKey) => {
    if (sortKey === key) setSortDesc((d) => !d)
    else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDesc ? ' ↓' : ' ↑') : ''

  const allSelected =
    items.length > 0 && items.every((c) => selected.has(c.id))

  const toggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(new Set(items.map((c) => c.id)))
    } else {
      setSelected(new Set())
    }
  }

  const toggleOne = (id: CardId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="backlog" aria-label="Backlog">
      <header className="backlog-head">
        <div>
          <h2 className="backlog-title">Backlog</h2>
          <p className="backlog-sub">
            {items.length} cards · {totalPoints} pts · cards not in any sprint
            yet
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="backlog-empty">
          <p>
            No cards in the backlog{query || filter ? ' for this search' : ''}.
          </p>
        </div>
      ) : (
        <table className="backlog-table">
          <thead>
            <tr>
              <th className="backlog-check-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all visible cards"
                />
              </th>
              <th onClick={() => onHeaderClick('key')}>Key{arrow('key')}</th>
              <th onClick={() => onHeaderClick('type')}>
                Type{arrow('type')}
              </th>
              <th className="backlog-title-col">Title</th>
              <th onClick={() => onHeaderClick('priority')}>
                Priority{arrow('priority')}
              </th>
              <th onClick={() => onHeaderClick('points')}>
                Points{arrow('points')}
              </th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const typeMeta = c.type ? ISSUE_TYPES[c.type] : null
              const aMeta = c.assignee ? TEAM[c.assignee] : null
              const isSelected = selected.has(c.id)
              return (
                <tr
                  key={c.id}
                  className={`backlog-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onOpenCard?.(c.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open card: ${c.key ? c.key + ' — ' : ''}${c.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onOpenCard?.(c.id)
                    }
                  }}
                >
                  <td
                    className="backlog-check-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(c.id)}
                      aria-label={`Select ${c.key ?? c.title}`}
                    />
                  </td>
                  <td>
                    {c.key && <span className="card-key">{c.key}</span>}
                  </td>
                  <td>
                    {typeMeta && (
                      <span
                        className="type-icon"
                        style={{ background: typeMeta.color }}
                        title={typeMeta.name}
                        aria-label={typeMeta.name}
                      >
                        {typeMeta.icon}
                      </span>
                    )}
                  </td>
                  <td className="backlog-title-col">{c.title}</td>
                  <td>
                    {c.priority && (
                      <span
                        className={`priority-dot priority-${c.priority}`}
                        title={`${PRIORITY_META[c.priority].label} priority`}
                      />
                    )}
                    {c.priority ? PRIORITY_META[c.priority].label : '—'}
                  </td>
                  <td>{c.points ?? '—'}</td>
                  <td>
                    {aMeta && (
                      <span className="backlog-assignee">
                        <span
                          className="avatar avatar-sm"
                          style={{ background: aMeta.color }}
                        >
                          {assigneeInitials(c.assignee)}
                        </span>
                        <span>{aMeta.name.split(' ')[0]}</span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <BulkActionBar
        board={board}
        selectedIds={Array.from(selected)}
        dispatch={dispatch}
        onClear={() => setSelected(new Set())}
      />
    </section>
  )
}
