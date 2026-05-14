/**
 * Single source of truth for board mutations.
 *
 * Pure reducer so it's trivial to test and easy to extend in Phase 3
 * (drag-and-drop adds MOVE_CARD and REORDER_CARD without restructuring).
 */

import {
  SAMPLE_BOARD,
  type Board,
  type Card,
  type CardId,
  type ColumnId,
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
  | { type: 'RESET' }

function makeCardId(): CardId {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
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
      return {
        ...state,
        cards: {
          ...state.cards,
          [id]: { id, title: action.title.trim() || 'Untitled' },
        },
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
      return { ...state, columns: newColumns }
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
