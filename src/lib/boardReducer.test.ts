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
