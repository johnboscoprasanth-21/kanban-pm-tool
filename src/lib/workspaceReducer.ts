/**
 * Workspace-level reducer. Wraps the existing boardReducer:
 *   - Board-level actions (SWITCH/CREATE/RENAME/DELETE) are handled here.
 *   - Card-level actions (ADD/UPDATE/DELETE/MOVE/RESET) are delegated to
 *     boardReducer against the currently active board.
 */

import type { Board, BoardId } from './board'
import { boardReducer, type BoardAction } from './boardReducer'
import {
  SAMPLE_WORKSPACE,
  makeBoardId,
  makeEmptyBoard,
  type Workspace,
} from './workspace'

export const STORAGE_KEY_V2 = 'kanban-pm-tool.workspace.v2'
export const LEGACY_STORAGE_KEY_V1 = 'kanban-pm-tool.board.v1'

export type WorkspaceAction =
  | BoardAction
  | { type: 'SWITCH_BOARD'; boardId: BoardId }
  | { type: 'CREATE_BOARD'; name: string }
  | { type: 'RENAME_BOARD'; boardId: BoardId; name: string }
  | { type: 'DELETE_BOARD'; boardId: BoardId }
  | { type: 'IMPORT_BOARD'; board: Board }

export function workspaceReducer(
  state: Workspace,
  action: WorkspaceAction,
): Workspace {
  switch (action.type) {
    case 'SWITCH_BOARD': {
      if (!state.boards[action.boardId]) return state
      if (state.activeBoardId === action.boardId) return state
      return { ...state, activeBoardId: action.boardId }
    }

    case 'CREATE_BOARD': {
      const newBoard = makeEmptyBoard(action.name)
      return {
        activeBoardId: newBoard.id,
        boardOrder: [...state.boardOrder, newBoard.id],
        boards: { ...state.boards, [newBoard.id]: newBoard },
      }
    }

    case 'RENAME_BOARD': {
      const board = state.boards[action.boardId]
      const trimmed = action.name.trim()
      if (!board || !trimmed) return state
      return {
        ...state,
        boards: {
          ...state.boards,
          [action.boardId]: { ...board, name: trimmed },
        },
      }
    }

    case 'DELETE_BOARD': {
      // Never let the user delete the last board.
      if (state.boardOrder.length <= 1) return state
      if (!state.boards[action.boardId]) return state
      const newBoards = { ...state.boards }
      delete newBoards[action.boardId]
      const newOrder = state.boardOrder.filter((id) => id !== action.boardId)
      const newActive =
        state.activeBoardId === action.boardId
          ? newOrder[0]
          : state.activeBoardId
      return {
        activeBoardId: newActive,
        boardOrder: newOrder,
        boards: newBoards,
      }
    }

    case 'IMPORT_BOARD': {
      // Assign a fresh board id to avoid colliding with existing ones,
      // and force the imported name to be unique enough by appending
      // " (imported)" when there's a clash.
      const incoming = action.board
      const newId = makeBoardId()
      const existingNames = new Set(
        Object.values(state.boards).map((b) => b.name),
      )
      const name = existingNames.has(incoming.name)
        ? `${incoming.name} (imported)`
        : incoming.name
      const imported: Board = { ...incoming, id: newId, name }
      return {
        activeBoardId: newId,
        boardOrder: [...state.boardOrder, newId],
        boards: { ...state.boards, [newId]: imported },
      }
    }

    default: {
      // Card-level action — apply to the active board.
      const active = state.boards[state.activeBoardId]
      if (!active) return state
      const nextBoard = boardReducer(active, action)
      if (nextBoard === active) return state
      return {
        ...state,
        boards: { ...state.boards, [state.activeBoardId]: nextBoard },
      }
    }
  }
}

function isValidWorkspace(w: unknown): w is Workspace {
  if (!w || typeof w !== 'object') return false
  const ws = w as Workspace
  return (
    typeof ws.activeBoardId === 'string' &&
    Array.isArray(ws.boardOrder) &&
    ws.boards !== null &&
    typeof ws.boards === 'object'
  )
}

/**
 * Load workspace from localStorage. Migrates Phase 2/3 single-board v1
 * storage into a workspace shape if found.
 */
export function loadWorkspace(): Workspace {
  if (typeof localStorage === 'undefined') return SAMPLE_WORKSPACE
  try {
    const v2raw = localStorage.getItem(STORAGE_KEY_V2)
    if (v2raw) {
      const parsed: unknown = JSON.parse(v2raw)
      if (isValidWorkspace(parsed)) return parsed
    }
    const v1raw = localStorage.getItem(LEGACY_STORAGE_KEY_V1)
    if (v1raw) {
      const parsed: unknown = JSON.parse(v1raw)
      const maybeBoard = parsed as Board | null
      if (
        maybeBoard &&
        typeof maybeBoard === 'object' &&
        typeof maybeBoard.id === 'string' &&
        Array.isArray(maybeBoard.columnIds)
      ) {
        return {
          activeBoardId: maybeBoard.id,
          boardOrder: [maybeBoard.id],
          boards: { [maybeBoard.id]: maybeBoard },
        }
      }
    }
    return SAMPLE_WORKSPACE
  } catch {
    return SAMPLE_WORKSPACE
  }
}

export function saveWorkspace(ws: Workspace): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(ws))
}
