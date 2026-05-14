import { describe, it, expect } from 'vitest'
import { SAMPLE_BOARD, cardsInColumn, totalCards } from './board'

describe('SAMPLE_BOARD', () => {
  it('exposes 4 columns in correct order', () => {
    expect(SAMPLE_BOARD.columnIds).toEqual([
      'col-todo',
      'col-progress',
      'col-review',
      'col-done',
    ])
  })

  it('every column id resolves to a column', () => {
    for (const id of SAMPLE_BOARD.columnIds) {
      expect(SAMPLE_BOARD.columns[id]).toBeDefined()
    }
  })

  it('every cardId referenced by a column resolves to a card', () => {
    for (const col of Object.values(SAMPLE_BOARD.columns)) {
      for (const cid of col.cardIds) {
        expect(SAMPLE_BOARD.cards[cid]).toBeDefined()
      }
    }
  })
})

describe('cardsInColumn', () => {
  it('returns cards in column order', () => {
    const cards = cardsInColumn(SAMPLE_BOARD, 'col-todo')
    expect(cards.map((c) => c.id)).toEqual(['c1', 'c2', 'c3'])
  })

  it('returns empty array for unknown column', () => {
    expect(cardsInColumn(SAMPLE_BOARD, 'col-missing')).toEqual([])
  })
})

describe('totalCards', () => {
  it('counts all cards on the board', () => {
    expect(totalCards(SAMPLE_BOARD)).toBe(8)
  })
})
