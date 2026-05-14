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
export type IssueType = 'story' | 'task' | 'bug' | 'epic'
export type AssigneeId = 'jbp' | 'pri' | 'raj' | 'arn' | 'meh' | 'unassigned'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export type SprintId = string
export type SprintState = 'planning' | 'active' | 'completed'

export interface Sprint {
  id: SprintId
  name: string
  state: SprintState
  /** epoch ms */
  startedAt?: number
  /** epoch ms */
  completedAt?: number
}

export interface Comment {
  id: string
  authorId: AssigneeId
  text: string
  /** epoch ms */
  at: number
}

export interface HistoryEntry {
  /** epoch ms */
  at: number
  text: string
}

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
  /** Recent activity entries (most recent last). Capped at 10. */
  history?: HistoryEntry[]
  // ── Phase 8: Jira essentials ─────────────────────────
  /** e.g. "KAN-42" — assigned at creation time, never changes. */
  key?: string
  type?: IssueType
  /** Fibonacci scale: 1, 2, 3, 5, 8, 13. */
  points?: number
  assignee?: AssigneeId
  checklist?: ChecklistItem[]
  // ── Phase 9: agile + collaboration ───────────────────
  /** Sprint membership. undefined = in the backlog. */
  sprintId?: SprintId
  comments?: Comment[]
}

/** Preset team for the assignee dropdown. */
export const TEAM: Record<AssigneeId, { name: string; color: string }> = {
  jbp: { name: 'John Bosco Prasanth', color: '#4f46e5' },
  pri: { name: 'Priya M.', color: '#ec4899' },
  raj: { name: 'Raj K.', color: '#10b981' },
  arn: { name: 'Arnav S.', color: '#f59e0b' },
  meh: { name: 'Mehul P.', color: '#06b6d4' },
  unassigned: { name: 'Unassigned', color: '#6b7280' },
}

export const ASSIGNEE_IDS: AssigneeId[] = [
  'jbp',
  'pri',
  'raj',
  'arn',
  'meh',
  'unassigned',
]

/** Initials shown in the small avatar chip. */
export function assigneeInitials(id: AssigneeId | undefined): string {
  if (!id || id === 'unassigned') return '?'
  const name = TEAM[id].name
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export const ISSUE_TYPES: Record<
  IssueType,
  { name: string; color: string; icon: string }
> = {
  story: { name: 'Story', color: '#16a34a', icon: 'S' },
  task: { name: 'Task', color: '#2563eb', icon: 'T' },
  bug: { name: 'Bug', color: '#dc2626', icon: 'B' },
  epic: { name: 'Epic', color: '#9333ea', icon: 'E' },
}

export const ISSUE_TYPE_IDS: IssueType[] = ['story', 'task', 'bug', 'epic']

/** Fibonacci-ish scale used by Jira style point pickers. */
export const POINT_OPTIONS: number[] = [1, 2, 3, 5, 8, 13]

/** Infer a key prefix from a free-text board name. */
export function inferKeyPrefix(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'KAN'
  const words = trimmed.split(/\s+/).filter(Boolean)
  let result: string
  if (words.length >= 2) {
    result = words
      .slice(0, 4)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase()
  } else {
    result = words[0].slice(0, 3).toUpperCase()
  }
  result = result.replace(/[^A-Z0-9]/g, '')
  return result || 'KAN'
}

/** Append a history entry, keeping at most 10 entries. */
export function appendHistory(
  history: HistoryEntry[] | undefined,
  text: string,
): HistoryEntry[] {
  const entry: HistoryEntry = { at: Date.now(), text }
  const trimmed = (history ?? []).slice(-9)
  return [...trimmed, entry]
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
  /** Issue-key prefix, e.g. "KAN". Migrated from name on first ADD_CARD if absent. */
  keyPrefix?: string
  /** Next sequence number to assign. Starts at 1. */
  nextIssueNumber?: number
  // ── Phase 9: sprints ─────────────────────────────────
  sprints?: Record<SprintId, Sprint>
  sprintOrder?: SprintId[]
  activeSprintId?: SprintId
}

/** Seed board used in Phase 1. Replaced by user data once CRUD ships in Phase 2. */
export const SAMPLE_BOARD: Board = {
  id: 'board-default',
  name: 'KRA Sprint 14',
  keyPrefix: 'KAN',
  nextIssueNumber: 9,
  sprints: {
    'sprint-14': {
      id: 'sprint-14',
      name: 'Sprint 14',
      state: 'active',
      startedAt: 1715000000000,
    },
    'sprint-15': {
      id: 'sprint-15',
      name: 'Sprint 15',
      state: 'planning',
    },
  },
  sprintOrder: ['sprint-14', 'sprint-15'],
  activeSprintId: 'sprint-14',
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
      key: 'KAN-1',
      title: 'Design board switcher UI',
      description: 'Sketch the header dropdown for Phase 4.',
      type: 'task',
      points: 3,
      assignee: 'pri',
      sprintId: 'sprint-14',
    },
    c2: {
      id: 'c2',
      key: 'KAN-2',
      title: 'Plan dnd-kit integration',
      description: 'Pick sensor strategy and write a spike test.',
      type: 'story',
      points: 5,
      assignee: 'jbp',
      sprintId: 'sprint-14',
      checklist: [
        { id: 'cl-1', text: 'Choose sensor strategy', done: true },
        { id: 'cl-2', text: 'Write spike test', done: false },
        { id: 'cl-3', text: 'Document trade-offs', done: false },
      ],
      comments: [
        {
          id: 'cm-1',
          authorId: 'pri',
          text: 'Reviewed the dnd-kit docs — closestCorners looks right for Kanban.',
          at: 1715100000000,
        },
        {
          id: 'cm-2',
          authorId: 'jbp',
          text: 'Agreed. Let me write the spike branch next.',
          at: 1715103600000,
        },
      ],
    },
    c3: {
      id: 'c3',
      key: 'KAN-3',
      title: 'Add card priority field',
      description: 'High / Medium / Low with colour-coded pills.',
      type: 'story',
      points: 2,
      priority: 'high',
      labels: ['feature'],
      assignee: 'raj',
      sprintId: 'sprint-14',
    },
    c4: {
      id: 'c4',
      key: 'KAN-4',
      title: 'Card create/edit modal',
      description: 'Inline edit on title; modal for details.',
      type: 'task',
      points: 5,
      priority: 'medium',
      labels: ['design'],
      assignee: 'jbp',
      sprintId: 'sprint-14',
    },
    c5: {
      id: 'c5',
      key: 'KAN-5',
      title: 'localStorage persistence',
      description: 'Single-board key for Phase 2; multi-key in Phase 4.',
      type: 'epic',
      points: 8,
      priority: 'low',
      labels: ['feature', 'docs'],
      assignee: 'arn',
      sprintId: 'sprint-14',
    },
    c6: {
      id: 'c6',
      key: 'KAN-6',
      title: 'CI/CD pipeline wiring',
      description: 'Lint → Test → Build → Deploy to GitHub Pages.',
      type: 'task',
      points: 3,
      priority: 'high',
      labels: ['urgent'],
      assignee: 'jbp',
      sprintId: 'sprint-14',
    },
    c7: {
      id: 'c7',
      key: 'KAN-7',
      title: 'Scaffold Vite + React + TS',
      description: 'Phase 1 foundation done.',
      type: 'task',
      points: 1,
      assignee: 'jbp',
      sprintId: 'sprint-14',
    },
    c8: {
      id: 'c8',
      key: 'KAN-8',
      title: 'Bug: Vite base path on Pages',
      description: 'Assets 404 when base path mismatched.',
      type: 'bug',
      points: 2,
      assignee: 'meh',
      sprintId: 'sprint-14',
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
