import { beforeEach, describe, it, expect } from 'vitest'
import { SAMPLE_BOARD } from './board'
import {
  boardReducer,
  loadBoard,
  saveBoard,
  STORAGE_KEY,
} from './boardReducer'

beforeEach(() => {
  localStorage.clear()
})

describe('boardReducer · ADD_CARD', () => {
  it('appends a new card with the given title to the column', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_CARD',
      columnId: 'col-todo',
      title: 'New thing',
    })
    const newIds = next.columns['col-todo'].cardIds
    expect(newIds.length).toBe(SAMPLE_BOARD.columns['col-todo'].cardIds.length + 1)
    const added = next.cards[newIds[newIds.length - 1]]
    expect(added.title).toBe('New thing')
  })

  it('mints an issue key from the board prefix and counter', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_CARD',
      columnId: 'col-todo',
      title: 'Key-test',
    })
    const ids = next.columns['col-todo'].cardIds
    const added = next.cards[ids[ids.length - 1]]
    // Sample has prefix=KAN and nextIssueNumber=9, so this should be KAN-9.
    expect(added.key).toBe('KAN-9')
    expect(next.nextIssueNumber).toBe(10)
  })

  it('infers prefix from board name on legacy boards lacking one', () => {
    const legacy = { ...SAMPLE_BOARD, keyPrefix: undefined, nextIssueNumber: undefined }
    const next = boardReducer(legacy, {
      type: 'ADD_CARD',
      columnId: 'col-todo',
      title: 'x',
    })
    const ids = next.columns['col-todo'].cardIds
    const added = next.cards[ids[ids.length - 1]]
    // "KRA Sprint 14" -> "KS1" (first letters)
    expect(added.key).toMatch(/^KS1?-1$/)
    expect(next.nextIssueNumber).toBe(2)
  })

  it('trims whitespace and falls back to "Untitled" for empty title', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_CARD',
      columnId: 'col-todo',
      title: '   ',
    })
    const ids = next.columns['col-todo'].cardIds
    expect(next.cards[ids[ids.length - 1]].title).toBe('Untitled')
  })

  it('returns same state when column is unknown', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_CARD',
      columnId: 'col-missing',
      title: 'x',
    })
    expect(next).toBe(SAMPLE_BOARD)
  })
})

describe('boardReducer · UPDATE_CARD', () => {
  it('updates only the requested fields', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'UPDATE_CARD',
      cardId: 'c1',
      patch: { title: 'Renamed' },
    })
    expect(next.cards.c1.title).toBe('Renamed')
    // description preserved
    expect(next.cards.c1.description).toBe(SAMPLE_BOARD.cards.c1.description)
  })

  it('drops description when set to empty string', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'UPDATE_CARD',
      cardId: 'c1',
      patch: { description: '   ' },
    })
    expect(next.cards.c1.description).toBeUndefined()
  })

  it('is a no-op on unknown cardId', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'UPDATE_CARD',
      cardId: 'c-missing',
      patch: { title: 'x' },
    })
    expect(next).toBe(SAMPLE_BOARD)
  })
})

describe('boardReducer · DELETE_CARD', () => {
  it('removes the card from cards map and its parent column', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'DELETE_CARD',
      cardId: 'c1',
    })
    expect(next.cards.c1).toBeUndefined()
    expect(next.columns['col-todo'].cardIds).not.toContain('c1')
  })

  it('does not touch other columns', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'DELETE_CARD',
      cardId: 'c1',
    })
    expect(next.columns['col-done'].cardIds).toEqual(
      SAMPLE_BOARD.columns['col-done'].cardIds,
    )
  })
})

describe('boardReducer · MOVE_CARD', () => {
  it('moves a card across columns at the given index', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'MOVE_CARD',
      cardId: 'c1',
      toColumnId: 'col-done',
      toIndex: 0,
    })
    expect(next.columns['col-todo'].cardIds).not.toContain('c1')
    expect(next.columns['col-done'].cardIds[0]).toBe('c1')
  })

  it('reorders within the same column', () => {
    // c1, c2, c3 in col-todo. Move c1 to index 2 -> c2, c3, c1.
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'MOVE_CARD',
      cardId: 'c1',
      toColumnId: 'col-todo',
      toIndex: 2,
    })
    expect(next.columns['col-todo'].cardIds).toEqual(['c2', 'c3', 'c1'])
  })

  it('clamps out-of-range indices', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'MOVE_CARD',
      cardId: 'c1',
      toColumnId: 'col-done',
      toIndex: 999,
    })
    const ids = next.columns['col-done'].cardIds
    expect(ids[ids.length - 1]).toBe('c1')
  })
})

describe('boardReducer · RESET', () => {
  it('restores demo columns and cards', () => {
    const dirty = boardReducer(SAMPLE_BOARD, {
      type: 'DELETE_CARD',
      cardId: 'c1',
    })
    const reset = boardReducer(dirty, { type: 'RESET' })
    expect(reset.columns).toEqual(SAMPLE_BOARD.columns)
    expect(reset.cards).toEqual(SAMPLE_BOARD.cards)
  })

  it('preserves the calling board’s identity (id + name)', () => {
    const renamed = { ...SAMPLE_BOARD, id: 'board-foo', name: 'Foo Project' }
    const reset = boardReducer(renamed, { type: 'RESET' })
    expect(reset.id).toBe('board-foo')
    expect(reset.name).toBe('Foo Project')
  })
})

describe('boardReducer · ADD_COLUMN', () => {
  it('appends a new empty column', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_COLUMN',
      name: 'Blocked',
    })
    expect(next.columnIds.length).toBe(SAMPLE_BOARD.columnIds.length + 1)
    const newId = next.columnIds[next.columnIds.length - 1]
    expect(next.columns[newId].name).toBe('Blocked')
    expect(next.columns[newId].cardIds).toEqual([])
  })

  it('falls back to "New column" on blank name', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_COLUMN',
      name: '   ',
    })
    const newId = next.columnIds[next.columnIds.length - 1]
    expect(next.columns[newId].name).toBe('New column')
  })
})

describe('boardReducer · RENAME_COLUMN', () => {
  it('renames an existing column', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'RENAME_COLUMN',
      columnId: 'col-todo',
      name: 'Backlog',
    })
    expect(next.columns['col-todo'].name).toBe('Backlog')
  })

  it('is a no-op on unknown column id', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'RENAME_COLUMN',
      columnId: 'col-missing',
      name: 'x',
    })
    expect(next).toBe(SAMPLE_BOARD)
  })

  it('is a no-op on blank name', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'RENAME_COLUMN',
      columnId: 'col-todo',
      name: '   ',
    })
    expect(next).toBe(SAMPLE_BOARD)
  })
})

describe('boardReducer · DELETE_COLUMN', () => {
  it('removes the column and all its cards', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'DELETE_COLUMN',
      columnId: 'col-todo',
    })
    expect(next.columnIds).not.toContain('col-todo')
    expect(next.columns['col-todo']).toBeUndefined()
    expect(next.cards.c1).toBeUndefined()
    expect(next.cards.c2).toBeUndefined()
    expect(next.cards.c3).toBeUndefined()
    // Other columns untouched
    expect(next.columns['col-done']).toEqual(SAMPLE_BOARD.columns['col-done'])
  })

  it('refuses to delete the last remaining column', () => {
    const single = {
      ...SAMPLE_BOARD,
      columnIds: ['col-todo'],
      columns: { 'col-todo': SAMPLE_BOARD.columns['col-todo'] },
    }
    const next = boardReducer(single, {
      type: 'DELETE_COLUMN',
      columnId: 'col-todo',
    })
    expect(next).toBe(single)
  })
})

describe('boardReducer · REORDER_COLUMNS', () => {
  it('replaces the column order with the given list', () => {
    const reversed = [...SAMPLE_BOARD.columnIds].reverse()
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'REORDER_COLUMNS',
      columnIds: reversed,
    })
    expect(next.columnIds).toEqual(reversed)
  })

  it('rejects orderings with missing or extra ids', () => {
    const bad = boardReducer(SAMPLE_BOARD, {
      type: 'REORDER_COLUMNS',
      columnIds: ['col-todo', 'col-progress'],
    })
    expect(bad).toBe(SAMPLE_BOARD)
    const extra = boardReducer(SAMPLE_BOARD, {
      type: 'REORDER_COLUMNS',
      columnIds: [...SAMPLE_BOARD.columnIds, 'col-foo'],
    })
    expect(extra).toBe(SAMPLE_BOARD)
  })
})

describe('boardReducer · history', () => {
  it('appends a Created entry on ADD_CARD', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_CARD',
      columnId: 'col-todo',
      title: 'New task',
    })
    const ids = next.columns['col-todo'].cardIds
    const addedId = ids[ids.length - 1]
    expect(next.cards[addedId].history?.[0].text).toMatch(/Created in "To Do"/)
  })

  it('appends a Moved entry on cross-column MOVE_CARD', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'MOVE_CARD',
      cardId: 'c1',
      toColumnId: 'col-done',
      toIndex: 0,
    })
    const h = next.cards.c1.history ?? []
    expect(h[h.length - 1].text).toMatch(/Moved from "To Do" to "Done"/)
  })

  it('does not add a history entry on in-column reorder', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'MOVE_CARD',
      cardId: 'c1',
      toColumnId: 'col-todo',
      toIndex: 2,
    })
    const before = SAMPLE_BOARD.cards.c1.history?.length ?? 0
    const after = next.cards.c1.history?.length ?? 0
    expect(after).toBe(before)
  })
})

describe('boardReducer · RESTORE_CARD', () => {
  it('reinserts a removed card at the given index', () => {
    const deleted = boardReducer(SAMPLE_BOARD, {
      type: 'DELETE_CARD',
      cardId: 'c1',
    })
    const restored = boardReducer(deleted, {
      type: 'RESTORE_CARD',
      card: SAMPLE_BOARD.cards.c1,
      columnId: 'col-todo',
      atIndex: 0,
    })
    expect(restored.columns['col-todo'].cardIds[0]).toBe('c1')
    expect(restored.cards.c1).toEqual(SAMPLE_BOARD.cards.c1)
  })

  it('refuses to restore if card id is already in cards map', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'RESTORE_CARD',
      card: SAMPLE_BOARD.cards.c1,
      columnId: 'col-todo',
      atIndex: 0,
    })
    expect(next).toBe(SAMPLE_BOARD)
  })
})

describe('boardReducer · sprints', () => {
  it('CREATE_SPRINT adds a planning sprint', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'CREATE_SPRINT',
      name: 'Sprint 16',
    })
    expect(next.sprintOrder?.length).toBe(
      (SAMPLE_BOARD.sprintOrder?.length ?? 0) + 1,
    )
    const newId = next.sprintOrder![next.sprintOrder!.length - 1]
    expect(next.sprints![newId].state).toBe('planning')
  })

  it('START_SPRINT is a no-op while another sprint is active', () => {
    // SAMPLE_BOARD already has sprint-14 active
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'START_SPRINT',
      sprintId: 'sprint-15',
    })
    expect(next).toBe(SAMPLE_BOARD)
  })

  it('START_SPRINT activates when nothing is active', () => {
    const idle = { ...SAMPLE_BOARD, activeSprintId: undefined }
    const next = boardReducer(idle, {
      type: 'START_SPRINT',
      sprintId: 'sprint-15',
    })
    expect(next.activeSprintId).toBe('sprint-15')
    expect(next.sprints!['sprint-15'].state).toBe('active')
  })

  it('COMPLETE_SPRINT moves incomplete cards back to backlog', () => {
    // c1..c7 are in sprint-14; c7,c8 are in col-done.
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'COMPLETE_SPRINT',
      sprintId: 'sprint-14',
    })
    expect(next.activeSprintId).toBeUndefined()
    expect(next.sprints!['sprint-14'].state).toBe('completed')
    // c1 not in Done -> backlog
    expect(next.cards.c1.sprintId).toBeUndefined()
    // c7 in Done -> stays
    expect(next.cards.c7.sprintId).toBe('sprint-14')
  })

  it('DELETE_SPRINT refuses to delete an active sprint', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'DELETE_SPRINT',
      sprintId: 'sprint-14',
    })
    expect(next).toBe(SAMPLE_BOARD)
  })

  it('DELETE_SPRINT clears sprintId from its cards', () => {
    // sprint-15 is planning (no cards), so add one first
    const withCard = boardReducer(SAMPLE_BOARD, {
      type: 'SET_CARD_SPRINT',
      cardId: 'c1',
      sprintId: 'sprint-15',
    })
    const after = boardReducer(withCard, {
      type: 'DELETE_SPRINT',
      sprintId: 'sprint-15',
    })
    expect(after.sprints?.['sprint-15']).toBeUndefined()
    expect(after.cards.c1.sprintId).toBeUndefined()
  })

  it('SET_CARD_SPRINT updates the card', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'SET_CARD_SPRINT',
      cardId: 'c1',
      sprintId: null,
    })
    expect(next.cards.c1.sprintId).toBeUndefined()
  })
})

describe('boardReducer · comments', () => {
  it('ADD_COMMENT appends a comment to the card', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_COMMENT',
      cardId: 'c1',
      authorId: 'jbp',
      text: 'Looks good',
    })
    const comments = next.cards.c1.comments ?? []
    expect(comments.length).toBeGreaterThan(0)
    const last = comments[comments.length - 1]
    expect(last.text).toBe('Looks good')
    expect(last.authorId).toBe('jbp')
    expect(typeof last.at).toBe('number')
  })

  it('ADD_COMMENT trims whitespace and rejects empty', () => {
    const next = boardReducer(SAMPLE_BOARD, {
      type: 'ADD_COMMENT',
      cardId: 'c1',
      authorId: 'jbp',
      text: '   ',
    })
    expect(next).toBe(SAMPLE_BOARD)
  })
})

describe('loadBoard / saveBoard', () => {
  it('round-trips a board through localStorage', () => {
    saveBoard(SAMPLE_BOARD)
    expect(loadBoard()).toEqual(SAMPLE_BOARD)
  })

  it('returns SAMPLE_BOARD on empty storage', () => {
    expect(loadBoard()).toEqual(SAMPLE_BOARD)
  })

  it('returns SAMPLE_BOARD on corrupted storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadBoard()).toEqual(SAMPLE_BOARD)
  })

  it('returns SAMPLE_BOARD when stored shape is wrong', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
    expect(loadBoard()).toEqual(SAMPLE_BOARD)
  })
})
