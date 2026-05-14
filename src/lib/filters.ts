import type {
  AssigneeId,
  Card,
  IssueType,
  LabelId,
  Priority,
} from './board'

export interface Filter {
  overdue: boolean
  dueToday: boolean
  priority?: Priority
  labels: LabelId[]
  /** Filter by issue types. Empty array = all types. */
  types: IssueType[]
  /** Filter by assignees. Empty array = anyone. */
  assignees: AssigneeId[]
}

export const EMPTY_FILTER: Filter = {
  overdue: false,
  dueToday: false,
  labels: [],
  types: [],
  assignees: [],
}

export function isEmptyFilter(f: Filter): boolean {
  return (
    !f.overdue &&
    !f.dueToday &&
    !f.priority &&
    f.labels.length === 0 &&
    f.types.length === 0 &&
    f.assignees.length === 0
  )
}

/** Start of today in local time, as epoch ms. */
function startOfToday(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

function startOfTomorrow(now: Date = new Date()): number {
  return startOfToday(now) + 24 * 60 * 60 * 1000
}

export function isOverdue(card: Card, now: Date = new Date()): boolean {
  if (card.dueDate === undefined) return false
  return card.dueDate < startOfToday(now)
}

export function isDueToday(card: Card, now: Date = new Date()): boolean {
  if (card.dueDate === undefined) return false
  const t = startOfToday(now)
  return card.dueDate >= t && card.dueDate < startOfTomorrow(now)
}

export function matchesFilter(card: Card, filter: Filter): boolean {
  if (filter.overdue && !isOverdue(card)) return false
  if (filter.dueToday && !isDueToday(card)) return false
  if (filter.priority && card.priority !== filter.priority) return false
  if (filter.labels.length > 0) {
    const cardLabels = card.labels ?? []
    if (!filter.labels.some((l) => cardLabels.includes(l))) return false
  }
  if (filter.types.length > 0) {
    if (!card.type || !filter.types.includes(card.type)) return false
  }
  if (filter.assignees.length > 0) {
    const a = card.assignee ?? 'unassigned'
    if (!filter.assignees.includes(a)) return false
  }
  return true
}
