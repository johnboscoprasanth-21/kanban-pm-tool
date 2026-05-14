import { beforeEach, describe, it, expect } from 'vitest'
import { SAMPLE_BOARD } from './board'
import { SAMPLE_WORKSPACE, type Workspace } from './workspace'
import {
  workspaceReducer,
  loadWorkspace,
  saveWorkspace,
  STORAGE_KEY_V2,
  LEGACY_STORAGE_KEY_V1,
} from './workspaceReducer'

beforeEach(() => {
  localStorage.clear()
})

describe('workspaceReducer · SWITCH_BOARD', () => {
  it('switches the active board', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'SWITCH_BOARD',
      boardId: 'board-personal',
    })
    expect(next.activeBoardId).toBe('board-personal')
  })

  it('is a no-op for unknown board id', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'SWITCH_BOARD',
      boardId: 'b-missing',
    })
    expect(next).toBe(SAMPLE_WORKSPACE)
  })
})

describe('workspaceReducer · CREATE_BOARD', () => {
  it('appends a new empty board and switches to it', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'CREATE_BOARD',
      name: 'Q3 Planning',
    })
    expect(next.boardOrder.length).toBe(SAMPLE_WORKSPACE.boardOrder.length + 1)
    const newId = next.boardOrder[next.boardOrder.length - 1]
    expect(next.activeBoardId).toBe(newId)
    expect(next.boards[newId].name).toBe('Q3 Planning')
    expect(next.boards[newId].columnIds).toEqual([
      'col-todo',
      'col-progress',
      'col-review',
      'col-done',
    ])
  })

  it('falls back to "New board" when name is blank', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'CREATE_BOARD',
      name: '   ',
    })
    const newId = next.boardOrder[next.boardOrder.length - 1]
    expect(next.boards[newId].name).toBe('New board')
  })
})

describe('workspaceReducer · RENAME_BOARD', () => {
  it('renames a board', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'RENAME_BOARD',
      boardId: 'board-personal',
      name: 'Side Quests',
    })
    expect(next.boards['board-personal'].name).toBe('Side Quests')
  })

  it('is a no-op when name is blank', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'RENAME_BOARD',
      boardId: 'board-personal',
      name: '   ',
    })
    expect(next).toBe(SAMPLE_WORKSPACE)
  })
})

describe('workspaceReducer · DELETE_BOARD', () => {
  it('removes the board and reassigns active if needed', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'DELETE_BOARD',
      boardId: SAMPLE_BOARD.id,
    })
    expect(next.boardOrder).not.toContain(SAMPLE_BOARD.id)
    expect(next.activeBoardId).toBe('board-personal')
  })

  it('refuses to delete the last board', () => {
    const singleBoard: Workspace = {
      activeBoardId: SAMPLE_BOARD.id,
      boardOrder: [SAMPLE_BOARD.id],
      boards: { [SAMPLE_BOARD.id]: SAMPLE_BOARD },
    }
    const next = workspaceReducer(singleBoard, {
      type: 'DELETE_BOARD',
      boardId: SAMPLE_BOARD.id,
    })
    expect(next).toBe(singleBoard)
  })
})

describe('workspaceReducer · IMPORT_BOARD', () => {
  it('adds an imported board with a fresh id and switches to it', () => {
    const imported = {
      ...SAMPLE_BOARD,
      id: 'will-be-replaced',
      name: 'Imported',
    }
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'IMPORT_BOARD',
      board: imported,
    })
    expect(next.boardOrder.length).toBe(SAMPLE_WORKSPACE.boardOrder.length + 1)
    const newId = next.activeBoardId
    expect(newId).not.toBe('will-be-replaced')
    expect(next.boards[newId].name).toBe('Imported')
  })

  it('renames on name clash', () => {
    const clash = { ...SAMPLE_BOARD, name: SAMPLE_BOARD.name }
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'IMPORT_BOARD',
      board: clash,
    })
    expect(next.boards[next.activeBoardId].name).toMatch(/imported/i)
  })
})

describe('workspaceReducer · delegated card actions', () => {
  it('ADD_CARD applies to the active board only', () => {
    const next = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'ADD_CARD',
      columnId: 'col-todo',
      title: 'Workspace test',
    })
    const activeBoard = next.boards[next.activeBoardId]
    const newId =
      activeBoard.columns['col-todo'].cardIds[
        activeBoard.columns['col-todo'].cardIds.length - 1
      ]
    expect(activeBoard.cards[newId].title).toBe('Workspace test')
    // Personal board untouched.
    expect(next.boards['board-personal']).toBe(SAMPLE_WORKSPACE.boards['board-personal'])
  })

  it('RESET preserves the active board’s id and name', () => {
    const ws = workspaceReducer(SAMPLE_WORKSPACE, {
      type: 'SWITCH_BOARD',
      boardId: 'board-personal',
    })
    const reset = workspaceReducer(ws, { type: 'RESET' })
    expect(reset.boards['board-personal'].id).toBe('board-personal')
    expect(reset.boards['board-personal'].name).toBe('Personal')
  })
})

describe('loadWorkspace · storage and migration', () => {
  it('round-trips through localStorage', () => {
    saveWorkspace(SAMPLE_WORKSPACE)
    expect(loadWorkspace()).toEqual(SAMPLE_WORKSPACE)
  })

  it('returns SAMPLE_WORKSPACE on empty storage', () => {
    expect(loadWorkspace()).toEqual(SAMPLE_WORKSPACE)
  })

  it('migrates a v1 single-board into a workspace', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY_V1, JSON.stringify(SAMPLE_BOARD))
    const ws = loadWorkspace()
    expect(ws.activeBoardId).toBe(SAMPLE_BOARD.id)
    expect(ws.boardOrder).toEqual([SAMPLE_BOARD.id])
    expect(ws.boards[SAMPLE_BOARD.id]).toEqual(SAMPLE_BOARD)
  })

  it('falls back to SAMPLE_WORKSPACE on corrupted v2 storage', () => {
    localStorage.setItem(STORAGE_KEY_V2, 'not-json')
    expect(loadWorkspace()).toEqual(SAMPLE_WORKSPACE)
  })

  it('prefers v2 over v1 when both exist', () => {
    saveWorkspace(SAMPLE_WORKSPACE)
    localStorage.setItem(LEGACY_STORAGE_KEY_V1, JSON.stringify(SAMPLE_BOARD))
    const ws = loadWorkspace()
    expect(ws.boardOrder).toEqual(SAMPLE_WORKSPACE.boardOrder)
  })
})
