import { describe, it, expect } from 'vitest'
import type { Board, Sprint } from './board'
import { computeBurndown } from './burndown'

const START = new Date('2026-05-14T00:00:00+05:30').getTime()
const DAY = 24 * 60 * 60 * 1000

function makeBoard(): Board {
  return {
    id: 'b',
    name: 'Test',
    columnIds: ['todo', 'done'],
    columns: {
      todo: { id: 'todo', name: 'To Do', cardIds: ['c1', 'c2'] },
      done: { id: 'done', name: 'Done', cardIds: ['c3'] },
    },
    cards: {
      c1: { id: 'c1', title: 'A', sprintId: 's1', points: 5 },
      c2: { id: 'c2', title: 'B', sprintId: 's1', points: 3 },
      c3: {
        id: 'c3',
        title: 'C',
        sprintId: 's1',
        points: 2,
        history: [{ at: START + 2 * DAY, text: 'Moved from "To Do" to "Done"' }],
      },
    },
  }
}

const activeSprint: Sprint = {
  id: 's1',
  name: 'S1',
  state: 'active',
  startedAt: START,
}

describe('computeBurndown', () => {
  it('returns null for non-active sprints', () => {
    const b = makeBoard()
    expect(
      computeBurndown(b, { ...activeSprint, state: 'planning' }, START + DAY),
    ).toBeNull()
  })

  it('sums totals and done points correctly', () => {
    const b = makeBoard()
    const out = computeBurndown(b, activeSprint, START + 3 * DAY)!
    expect(out.totalPoints).toBe(10)
    expect(out.donePoints).toBe(2)
    expect(out.remainingPoints).toBe(8)
  })

  it('builds a stepped actual line including the start and now', () => {
    const b = makeBoard()
    const out = computeBurndown(b, activeSprint, START + 3 * DAY)!
    // Start (10), event @ +2d (8), now @ +3d (8)
    expect(out.actual.length).toBe(3)
    expect(out.actual[0].remaining).toBe(10)
    expect(out.actual[1].remaining).toBe(8)
    expect(out.actual[2].remaining).toBe(8)
  })

  it('computes dayOfSprint clamped to 1..sprintDays', () => {
    const b = makeBoard()
    const out = computeBurndown(b, activeSprint, START + 3 * DAY)!
    expect(out.dayOfSprint).toBe(3)
    expect(out.sprintDays).toBe(14)
    const future = computeBurndown(b, activeSprint, START + 50 * DAY)!
    expect(future.dayOfSprint).toBe(14)
  })
})
