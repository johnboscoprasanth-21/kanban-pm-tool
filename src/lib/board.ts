/**
 * Core data model for the Kanban board.
 *
 * Designed for the full phase lifecycle:
 *   - Phase 1: hardcoded seed, read-only.
 *   - Phase 2: mutation helpers + localStorage persistence.
 *   - Phase 3: drag-and-drop reorders use the same `moveCard` shape.
 *   - Phase 4: multiple boards keyed by id.
 */

export type CardId = string
export type ColumnId = string
export type BoardId = string
export type LabelId =
  | 'bug'
  | 'feature'
  | 'design'
  | 'docs'
  | 'blocked'
  | 'urgent'
export type Priority = 'low' | 'medium' | 'high'

export interface Card {
  id: CardId
  title: string
  description?: string
  priority?: Priority
  labels?: LabelId[]
  /** epoch ms */
  dueDate?: number
  /** epoch ms */
  createdAt?: number
}

/** Predefined label palette. Kept tiny and Phase-5-only. */
export const LABELS: Record<LabelId, { name: string; color: string }> = {
  bug: { name: 'Bug', color: '#ef4444' },
  feature: { name: 'Feature', color: '#10b981' },
  design: { name: 'Design', color: '#8b5cf6' },
  docs: { name: 'Docs', color: '#06b6d4' },
  blocked: { name: 'Blocked', color: '#f59e0b' },
  urgent: { name: 'Urgent', color: '#ec4899' },
}

export const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; rank: number }
> = {
  low: { label: 'Low', color: '#6b7280', rank: 1 },
  medium: { label: 'Medium', color: '#f59e0b', rank: 2 },
  high: { label: 'High', color: '#ef4444', rank: 3 },
}

export interface Column {
  id: ColumnId
  name: string
  cardIds: CardId[]
}

export interface Board {
  id: BoardId
  name: string
  columnIds: ColumnId[]
  columns: Record<ColumnId, Column>
  cards: Record<CardId, Card>
}

/** Seed board used in Phase 1. Replaced by user data once CRUD ships in Phase 2. */
export const SAMPLE_BOARD: Board = {
  id: 'board-default',
  name: 'KRA Sprint 14',
  columnIds: ['col-todo', 'col-progress', 'col-review', 'col-done'],
  columns: {
    'col-todo': {
      id: 'col-todo',
      name: 'To Do',
      cardIds: ['c1', 'c2', 'c3'],
    },
    'col-progress': {
      id: 'col-progress',
      name: 'In Progress',
      cardIds: ['c4', 'c5'],
    },
    'col-review': {
      id: 'col-review',
      name: 'Review',
      cardIds: ['c6'],
    },
    'col-done': {
      id: 'col-done',
      name: 'Done',
      cardIds: ['c7', 'c8'],
    },
  },
  cards: {
    c1: {
      id: 'c1',
      title: 'Design board switcher UI',
      description: 'Sketch the header dropdown for Phase 4.',
    },
    c2: {
      id: 'c2',
      title: 'Plan dnd-kit integration',
      description: 'Pick sensor strategy and write a spike test.',
    },
    c3: {
      id: 'c3',
      title: 'Add card priority field',
      description: 'High / Medium / Low with colour-coded pills.',
      priority: 'high',
      labels: ['feature'],
    },
    c4: {
      id: 'c4',
      title: 'Card create/edit modal',
      description: 'Inline edit on title; modal for details.',
      priority: 'medium',
      labels: ['design'],
    },
    c5: {
      id: 'c5',
      title: 'localStorage persistence',
      description: 'Single-board key for Phase 2; multi-key in Phase 4.',
      priority: 'low',
      labels: ['feature', 'docs'],
    },
    c6: {
      id: 'c6',
      title: 'CI/CD pipeline wiring',
      description: 'Lint → Test → Build → Deploy to GitHub Pages.',
      priority: 'high',
      labels: ['urgent'],
    },
    c7: {
      id: 'c7',
      title: 'Scaffold Vite + React + TS',
      description: 'Phase 1 foundation done.',
    },
    c8: {
      id: 'c8',
      title: 'Define data model',
      description: 'Board / Column / Card shape locked in.',
    },
  },
}

/** Pure helper: cards in a column, in display order. */
export function cardsInColumn(board: Board, columnId: ColumnId): Card[] {
  const col = board.columns[columnId]
  if (!col) return []
  return col.cardIds
    .map((id) => board.cards[id])
    .filter((c): c is Card => Boolean(c))
}

/** Total cards on the board — handy for counters. */
export function totalCards(board: Board): number {
  return Object.keys(board.cards).length
}
