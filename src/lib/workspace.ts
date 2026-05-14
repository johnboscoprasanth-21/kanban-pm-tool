/**
 * Workspace: a collection of boards with one active at a time.
 *
 * Introduced in Phase 4. The card-level shape (Board / Column / Card)
 * from `board.ts` is unchanged — Workspace just wraps it.
 */

import { SAMPLE_BOARD, type Board, type BoardId } from './board'

export interface Workspace {
  activeBoardId: BoardId
  boardOrder: BoardId[] // stable display order in the switcher
  boards: Record<BoardId, Board>
}

/**
 * Two seed boards so the dropdown is meaningful out-of-the-box.
 * "KRA Sprint 14" is the original Phase 1-3 board; "Personal" is the
 * one we use to demo board switching.
 */
const PERSONAL_BOARD: Board = {
  id: 'board-personal',
  name: 'Personal',
  columnIds: ['col-todo', 'col-progress', 'col-done'],
  columns: {
    'col-todo': { id: 'col-todo', name: 'To Do', cardIds: ['p1', 'p2'] },
    'col-progress': { id: 'col-progress', name: 'In Progress', cardIds: ['p3'] },
    'col-done': { id: 'col-done', name: 'Done', cardIds: ['p4'] },
  },
  cards: {
    p1: { id: 'p1', title: 'Renew passport' },
    p2: {
      id: 'p2',
      title: 'Book dentist',
      description: 'Six-month check-up.',
    },
    p3: { id: 'p3', title: 'Plan weekend trip' },
    p4: { id: 'p4', title: 'Pay credit card' },
  },
}

export const SAMPLE_WORKSPACE: Workspace = {
  activeBoardId: SAMPLE_BOARD.id,
  boardOrder: [SAMPLE_BOARD.id, PERSONAL_BOARD.id],
  boards: {
    [SAMPLE_BOARD.id]: SAMPLE_BOARD,
    [PERSONAL_BOARD.id]: PERSONAL_BOARD,
  },
}

export function activeBoard(ws: Workspace): Board {
  return ws.boards[ws.activeBoardId] ?? SAMPLE_BOARD
}

export function makeBoardId(): BoardId {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Brand-new board with the standard 4 columns and no cards. */
export function makeEmptyBoard(name: string): Board {
  const id = makeBoardId()
  return {
    id,
    name: name.trim() || 'New board',
    columnIds: ['col-todo', 'col-progress', 'col-review', 'col-done'],
    columns: {
      'col-todo': { id: 'col-todo', name: 'To Do', cardIds: [] },
      'col-progress': {
        id: 'col-progress',
        name: 'In Progress',
        cardIds: [],
      },
      'col-review': { id: 'col-review', name: 'Review', cardIds: [] },
      'col-done': { id: 'col-done', name: 'Done', cardIds: [] },
    },
    cards: {},
  }
}
