import type { Board, Sprint } from './board'

export interface BurndownPoint {
  /** epoch ms */
  at: number
  /** Cumulative remaining story points at that moment. */
  remaining: number
}

export interface BurndownSeries {
  totalPoints: number
  donePoints: number
  remainingPoints: number
  startedAt: number
  /** "now" epoch ms when this was computed. */
  now: number
  /** Estimated sprint end (14-day default). */
  endsAt: number
  /** Day index 1..N. */
  dayOfSprint: number
  /** Estimated sprint length in days. */
  sprintDays: number
  /** Actual burndown stepped line: completion events + endpoints. */
  actual: BurndownPoint[]
}

const DAY = 24 * 60 * 60 * 1000
const DEFAULT_SPRINT_DAYS = 14

/**
 * Derive a per-card "completed at" timestamp from card history entries
 * created by the boardReducer (e.g. `Moved from "X" to "Done"`).
 */
function findCompletedAt(
  card: { history?: { at: number; text: string }[] },
  doneColName: string,
): number | undefined {
  const moves = (card.history ?? []).filter(
    (h) => h.text.endsWith(`to "${doneColName}"`),
  )
  if (moves.length === 0) return undefined
  return moves[moves.length - 1].at
}

export function computeBurndown(
  board: Board,
  sprint: Sprint,
  now: number = Date.now(),
): BurndownSeries | null {
  if (sprint.state !== 'active' || !sprint.startedAt) return null
  const doneColId = board.columnIds[board.columnIds.length - 1]
  const doneCol = board.columns[doneColId]
  if (!doneCol) return null
  const doneColName = doneCol.name
  const doneCardIds = new Set(doneCol.cardIds)

  const inSprint = Object.values(board.cards).filter(
    (c) => c.sprintId === sprint.id,
  )
  const totalPoints = inSprint.reduce((s, c) => s + (c.points ?? 0), 0)
  const donePoints = inSprint
    .filter((c) => doneCardIds.has(c.id))
    .reduce((s, c) => s + (c.points ?? 0), 0)

  // Build actual line from completion events for cards CURRENTLY in done.
  const events: { at: number; points: number }[] = []
  for (const card of inSprint) {
    if (!doneCardIds.has(card.id)) continue
    const points = card.points ?? 0
    if (points === 0) continue
    const completedAt = findCompletedAt(card, doneColName) ?? sprint.startedAt
    events.push({ at: completedAt, points })
  }
  events.sort((a, b) => a.at - b.at)

  const actual: BurndownPoint[] = [
    { at: sprint.startedAt, remaining: totalPoints },
  ]
  let remaining = totalPoints
  for (const e of events) {
    remaining -= e.points
    actual.push({ at: e.at, remaining })
  }
  // Cap with "now" so the line extends to today.
  if (actual[actual.length - 1].at < now) {
    actual.push({ at: now, remaining })
  }

  const sprintDays = DEFAULT_SPRINT_DAYS
  const endsAt = sprint.startedAt + sprintDays * DAY
  const dayOfSprint = Math.max(
    1,
    Math.min(sprintDays, Math.ceil((now - sprint.startedAt) / DAY)),
  )

  return {
    totalPoints,
    donePoints,
    remainingPoints: totalPoints - donePoints,
    startedAt: sprint.startedAt,
    now,
    endsAt,
    dayOfSprint,
    sprintDays,
    actual,
  }
}
