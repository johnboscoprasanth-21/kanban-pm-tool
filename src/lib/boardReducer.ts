/**
 * Single source of truth for board mutations.
 *
 * Pure reducer so it's trivial to test and easy to extend in Phase 3
 * (drag-and-drop adds MOVE_CARD and REORDER_CARD without restructuring).
 */

import {
  LINK_TYPE_META,
  SAMPLE_BOARD,
  appendHistory,
  inferKeyPrefix,
  type AssigneeId,
  type Board,
  type Card,
  type CardId,
  type ColumnId,
  type Comment,
  type IssueLink,
  type LinkType,
  type Sprint,
  type SprintId,
} from './board'

export const STORAGE_KEY = 'kanban-pm-tool.board.v1'

export type BoardAction =
  | { type: 'ADD_CARD'; columnId: ColumnId; title: string }
  | {
      type: 'UPDATE_CARD'
      cardId: CardId
      patch: Partial<Omit<Card, 'id'>>
    }
  | { type: 'DELETE_CARD'; cardId: CardId }
  | {
      type: 'MOVE_CARD'
      cardId: CardId
      toColumnId: ColumnId
      toIndex: number
    }
  | { type: 'RESTORE_CARD'; card: Card; columnId: ColumnId; atIndex: number }
  | { type: 'ADD_COLUMN'; name: string }
  | { type: 'RENAME_COLUMN'; columnId: ColumnId; name: string }
  | { type: 'DELETE_COLUMN'; columnId: ColumnId }
  | { type: 'REORDER_COLUMNS'; columnIds: ColumnId[] }
  | { type: 'CREATE_SPRINT'; name: string }
  | { type: 'START_SPRINT'; sprintId: SprintId }
  | { type: 'COMPLETE_SPRINT'; sprintId: SprintId }
  | { type: 'DELETE_SPRINT'; sprintId: SprintId }
  | {
      type: 'SET_CARD_SPRINT'
      cardId: CardId
      sprintId: SprintId | null
    }
  | {
      type: 'ADD_COMMENT'
      cardId: CardId
      authorId: AssigneeId
      text: string
    }
  | {
      type: 'ADD_LINK'
      cardId: CardId
      linkType: LinkType
      targetCardId: CardId
    }
  | {
      type: 'REMOVE_LINK'
      cardId: CardId
      linkType: LinkType
      targetCardId: CardId
    }
  | { type: 'RESET' }

function makeCardId(): CardId {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function makeColumnId(): ColumnId {
  return `col-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
}

function makeSprintId(): SprintId {
  return `sp-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

function makeCommentId(): string {
  return `cm-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

function findColumnForCard(board: Board, cardId: CardId): ColumnId | undefined {
  for (const col of Object.values(board.columns)) {
    if (col.cardIds.includes(cardId)) return col.id
  }
  return undefined
}

export function boardReducer(state: Board, action: BoardAction): Board {
  switch (action.type) {
    case 'ADD_CARD': {
      const col = state.columns[action.columnId]
      if (!col) return state
      const id = makeCardId()
      const now = Date.now()
      // Mint an issue key from the board prefix and counter. Migrates
      // legacy boards (loaded from older storage) by inferring on demand.
      const prefix = state.keyPrefix ?? inferKeyPrefix(state.name)
      const num = state.nextIssueNumber ?? 1
      const key = `${prefix}-${num}`
      // When a sprint is active, new cards join it automatically so they
      // appear on the board view the user is currently looking at.
      const newCard: Card = {
        id,
        key,
        title: action.title.trim() || 'Untitled',
        type: 'task',
        assignee: 'unassigned',
        createdAt: now,
        history: [{ at: now, text: `Created in "${col.name}"` }],
      }
      if (state.activeSprintId) newCard.sprintId = state.activeSprintId
      return {
        ...state,
        keyPrefix: prefix,
        nextIssueNumber: num + 1,
        cards: { ...state.cards, [id]: newCard },
        columns: {
          ...state.columns,
          [col.id]: { ...col, cardIds: [...col.cardIds, id] },
        },
      }
    }

    case 'UPDATE_CARD': {
      const existing = state.cards[action.cardId]
      if (!existing) return state
      const next: Card = { ...existing, ...action.patch }
      if (typeof next.title === 'string') next.title = next.title.trim()
      // Drop empty/blank optional fields so we don't render empty UI.
      if (next.description !== undefined && next.description.trim() === '') {
        delete next.description
      }
      if (next.labels !== undefined && next.labels.length === 0) {
        delete next.labels
      }
      if (
        next.dueDate !== undefined &&
        (next.dueDate === null || Number.isNaN(next.dueDate))
      ) {
        delete next.dueDate
      }
      if (next.priority === undefined) {
        delete next.priority
      }
      return { ...state, cards: { ...state.cards, [action.cardId]: next } }
    }

    case 'DELETE_CARD': {
      if (!state.cards[action.cardId]) return state
      const newCards = { ...state.cards }
      delete newCards[action.cardId]
      const newColumns: Board['columns'] = {}
      for (const [id, col] of Object.entries(state.columns)) {
        newColumns[id] = {
          ...col,
          cardIds: col.cardIds.filter((cid) => cid !== action.cardId),
        }
      }
      return { ...state, cards: newCards, columns: newColumns }
    }

    case 'MOVE_CARD': {
      const fromColId = findColumnForCard(state, action.cardId)
      const toCol = state.columns[action.toColumnId]
      if (!fromColId || !toCol) return state

      const fromCol = state.columns[fromColId]
      // Remove from source.
      const sourceIds = fromCol.cardIds.filter((id) => id !== action.cardId)
      // Insert into target at toIndex (clamped).
      const targetIds = fromColId === action.toColumnId
        ? [...sourceIds]
        : [...toCol.cardIds]
      const clampedIndex = Math.max(0, Math.min(action.toIndex, targetIds.length))
      targetIds.splice(clampedIndex, 0, action.cardId)

      const newColumns = { ...state.columns }
      if (fromColId === action.toColumnId) {
        newColumns[fromColId] = { ...fromCol, cardIds: targetIds }
      } else {
        newColumns[fromColId] = { ...fromCol, cardIds: sourceIds }
        newColumns[action.toColumnId] = { ...toCol, cardIds: targetIds }
      }

      // Append a history entry on the card only for cross-column moves;
      // we don't want to spam history on in-column reordering.
      let newCards = state.cards
      if (fromColId !== action.toColumnId) {
        const card = state.cards[action.cardId]
        if (card) {
          newCards = {
            ...state.cards,
            [action.cardId]: {
              ...card,
              history: appendHistory(
                card.history,
                `Moved from "${fromCol.name}" to "${toCol.name}"`,
              ),
            },
          }
        }
      }
      return { ...state, columns: newColumns, cards: newCards }
    }

    case 'REORDER_COLUMNS': {
      // Validate that the new order has exactly the same set of column ids.
      const current = new Set(state.columnIds)
      const next = new Set(action.columnIds)
      if (
        current.size !== next.size ||
        action.columnIds.some((id) => !current.has(id))
      ) {
        return state
      }
      return { ...state, columnIds: action.columnIds }
    }

    case 'ADD_COLUMN': {
      const id = makeColumnId()
      const name = action.name.trim() || 'New column'
      return {
        ...state,
        columnIds: [...state.columnIds, id],
        columns: {
          ...state.columns,
          [id]: { id, name, cardIds: [] },
        },
      }
    }

    case 'RENAME_COLUMN': {
      const col = state.columns[action.columnId]
      const trimmed = action.name.trim()
      if (!col || !trimmed) return state
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.columnId]: { ...col, name: trimmed },
        },
      }
    }

    case 'DELETE_COLUMN': {
      const col = state.columns[action.columnId]
      if (!col) return state
      // Never let the user delete the last column.
      if (state.columnIds.length <= 1) return state
      const newColumns = { ...state.columns }
      delete newColumns[action.columnId]
      const newCards = { ...state.cards }
      for (const cid of col.cardIds) delete newCards[cid]
      return {
        ...state,
        columnIds: state.columnIds.filter((id) => id !== action.columnId),
        columns: newColumns,
        cards: newCards,
      }
    }

    case 'RESTORE_CARD': {
      const col = state.columns[action.columnId]
      if (!col) return state
      if (state.cards[action.card.id]) return state // already exists
      const newCardIds = [...col.cardIds]
      const idx = Math.max(0, Math.min(action.atIndex, newCardIds.length))
      newCardIds.splice(idx, 0, action.card.id)
      return {
        ...state,
        cards: { ...state.cards, [action.card.id]: action.card },
        columns: {
          ...state.columns,
          [action.columnId]: { ...col, cardIds: newCardIds },
        },
      }
    }

    case 'CREATE_SPRINT': {
      const id = makeSprintId()
      const sprint: Sprint = {
        id,
        name: action.name.trim() || 'New sprint',
        state: 'planning',
      }
      return {
        ...state,
        sprints: { ...(state.sprints ?? {}), [id]: sprint },
        sprintOrder: [...(state.sprintOrder ?? []), id],
      }
    }

    case 'START_SPRINT': {
      const sprint = state.sprints?.[action.sprintId]
      if (!sprint || sprint.state !== 'planning') return state
      // Only one active sprint at a time.
      if (state.activeSprintId) return state
      const updated: Sprint = {
        ...sprint,
        state: 'active',
        startedAt: Date.now(),
      }
      return {
        ...state,
        sprints: { ...state.sprints, [action.sprintId]: updated },
        activeSprintId: action.sprintId,
      }
    }

    case 'COMPLETE_SPRINT': {
      const sprint = state.sprints?.[action.sprintId]
      if (!sprint || sprint.state !== 'active') return state
      const lastColId = state.columnIds[state.columnIds.length - 1]
      const lastColCards = new Set(state.columns[lastColId]?.cardIds ?? [])
      // Cards in this sprint not in the last (Done) column go to backlog.
      const newCards: Record<CardId, Card> = {}
      for (const [id, c] of Object.entries(state.cards)) {
        if (c.sprintId === action.sprintId && !lastColCards.has(id)) {
          newCards[id] = { ...c, sprintId: undefined }
        } else {
          newCards[id] = c
        }
      }
      const updated: Sprint = {
        ...sprint,
        state: 'completed',
        completedAt: Date.now(),
      }
      const next: Board = {
        ...state,
        cards: newCards,
        sprints: { ...state.sprints, [action.sprintId]: updated },
      }
      delete next.activeSprintId
      return next
    }

    case 'DELETE_SPRINT': {
      const sprint = state.sprints?.[action.sprintId]
      if (!sprint) return state
      if (sprint.state === 'active') return state
      const newCards: Record<CardId, Card> = {}
      for (const [id, c] of Object.entries(state.cards)) {
        newCards[id] =
          c.sprintId === action.sprintId ? { ...c, sprintId: undefined } : c
      }
      const newSprints = { ...state.sprints }
      delete newSprints[action.sprintId]
      return {
        ...state,
        cards: newCards,
        sprints: newSprints,
        sprintOrder: (state.sprintOrder ?? []).filter(
          (id) => id !== action.sprintId,
        ),
      }
    }

    case 'SET_CARD_SPRINT': {
      const card = state.cards[action.cardId]
      if (!card) return state
      const newSprintId = action.sprintId ?? undefined
      if (card.sprintId === newSprintId) return state
      const updated: Card = { ...card, sprintId: newSprintId }
      if (newSprintId === undefined) delete updated.sprintId
      return {
        ...state,
        cards: { ...state.cards, [action.cardId]: updated },
      }
    }

    case 'ADD_COMMENT': {
      const card = state.cards[action.cardId]
      if (!card) return state
      const text = action.text.trim()
      if (!text) return state
      const comment: Comment = {
        id: makeCommentId(),
        authorId: action.authorId,
        text,
        at: Date.now(),
      }
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.cardId]: {
            ...card,
            comments: [...(card.comments ?? []), comment],
          },
        },
      }
    }

    case 'ADD_LINK': {
      const source = state.cards[action.cardId]
      const target = state.cards[action.targetCardId]
      if (!source || !target) return state
      if (action.cardId === action.targetCardId) return state
      const reciprocal = LINK_TYPE_META[action.linkType].reciprocal
      const sourceLinks = source.links ?? []
      const targetLinks = target.links ?? []
      // Idempotent: skip if the forward link already exists.
      if (
        sourceLinks.some(
          (l) =>
            l.type === action.linkType && l.targetCardId === action.targetCardId,
        )
      ) {
        return state
      }
      const newSourceLink: IssueLink = {
        type: action.linkType,
        targetCardId: action.targetCardId,
      }
      const newTargetLink: IssueLink = {
        type: reciprocal,
        targetCardId: action.cardId,
      }
      // Also skip the reciprocal if it somehow exists already.
      const targetHasReciprocal = targetLinks.some(
        (l) => l.type === reciprocal && l.targetCardId === action.cardId,
      )
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.cardId]: {
            ...source,
            links: [...sourceLinks, newSourceLink],
          },
          [action.targetCardId]: {
            ...target,
            links: targetHasReciprocal
              ? targetLinks
              : [...targetLinks, newTargetLink],
          },
        },
      }
    }

    case 'REMOVE_LINK': {
      const source = state.cards[action.cardId]
      const target = state.cards[action.targetCardId]
      if (!source || !target) return state
      const reciprocal = LINK_TYPE_META[action.linkType].reciprocal
      const newSourceLinks = (source.links ?? []).filter(
        (l) =>
          !(l.type === action.linkType && l.targetCardId === action.targetCardId),
      )
      const newTargetLinks = (target.links ?? []).filter(
        (l) =>
          !(l.type === reciprocal && l.targetCardId === action.cardId),
      )
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.cardId]:
            newSourceLinks.length > 0
              ? { ...source, links: newSourceLinks }
              : (() => {
                  const c = { ...source }
                  delete c.links
                  return c
                })(),
          [action.targetCardId]:
            newTargetLinks.length > 0
              ? { ...target, links: newTargetLinks }
              : (() => {
                  const c = { ...target }
                  delete c.links
                  return c
                })(),
        },
      }
    }

    case 'RESET':
      // Replace columns/cards with the demo seed but keep this board's
      // identity (id + name) so it stays selectable in the workspace.
      return { ...SAMPLE_BOARD, id: state.id, name: state.name }

    default:
      return state
  }
}

/** Load board from localStorage, falling back to SAMPLE_BOARD on miss/corruption. */
export function loadBoard(): Board {
  if (typeof localStorage === 'undefined') return SAMPLE_BOARD
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_BOARD
    const parsed = JSON.parse(raw) as Board
    // Light shape check — keeps us safe across phase upgrades.
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.columnIds) ||
      !parsed.columns ||
      !parsed.cards
    ) {
      return SAMPLE_BOARD
    }
    return parsed
  } catch {
    return SAMPLE_BOARD
  }
}

export function saveBoard(board: Board): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
}
