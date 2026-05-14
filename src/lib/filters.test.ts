import { describe, it, expect } from 'vitest'
import type { Card } from './board'
import {
  EMPTY_FILTER,
  isDueToday,
  isEmptyFilter,
  isOverdue,
  matchesFilter,
} from './filters'

const FIXED_NOW = new Date('2026-05-14T10:00:00+05:30') // 14-May-2026, IST

const yesterday = new Date('2026-05-13T10:00:00+05:30').getTime()
const today = new Date('2026-05-14T10:00:00+05:30').getTime()
const tomorrow = new Date('2026-05-15T10:00:00+05:30').getTime()

const card = (over: Partial<Card>): Card => ({
  id: 'c',
  title: 't',
  ...over,
})

describe('isOverdue', () => {
  it('false when no dueDate', () => {
    expect(isOverdue(card({}), FIXED_NOW)).toBe(false)
  })
  it('true when dueDate before today', () => {
    expect(isOverdue(card({ dueDate: yesterday }), FIXED_NOW)).toBe(true)
  })
  it('false when due today', () => {
    expect(isOverdue(card({ dueDate: today }), FIXED_NOW)).toBe(false)
  })
})

describe('isDueToday', () => {
  it('true when dueDate is within today', () => {
    expect(isDueToday(card({ dueDate: today }), FIXED_NOW)).toBe(true)
  })
  it('false when due tomorrow', () => {
    expect(isDueToday(card({ dueDate: tomorrow }), FIXED_NOW)).toBe(false)
  })
  it('false when undated', () => {
    expect(isDueToday(card({}), FIXED_NOW)).toBe(false)
  })
})

describe('isEmptyFilter', () => {
  it('true for default filter', () => {
    expect(isEmptyFilter(EMPTY_FILTER)).toBe(true)
  })
  it('false when overdue set', () => {
    expect(isEmptyFilter({ ...EMPTY_FILTER, overdue: true })).toBe(false)
  })
  it('false when labels populated', () => {
    expect(isEmptyFilter({ ...EMPTY_FILTER, labels: ['bug'] })).toBe(false)
  })
})

describe('matchesFilter', () => {
  it('matches everything under empty filter', () => {
    expect(matchesFilter(card({ priority: 'low' }), EMPTY_FILTER)).toBe(true)
  })

  it('priority filter excludes mismatches', () => {
    const f = { ...EMPTY_FILTER, priority: 'high' as const }
    expect(matchesFilter(card({ priority: 'high' }), f)).toBe(true)
    expect(matchesFilter(card({ priority: 'low' }), f)).toBe(false)
    expect(matchesFilter(card({}), f)).toBe(false)
  })

  it('label filter uses OR within labels list', () => {
    const f = { ...EMPTY_FILTER, labels: ['bug' as const, 'urgent' as const] }
    expect(matchesFilter(card({ labels: ['bug'] }), f)).toBe(true)
    expect(matchesFilter(card({ labels: ['urgent', 'docs'] }), f)).toBe(true)
    expect(matchesFilter(card({ labels: ['design'] }), f)).toBe(false)
    expect(matchesFilter(card({}), f)).toBe(false)
  })

  it('combines filters with AND', () => {
    const f = {
      ...EMPTY_FILTER,
      priority: 'high' as const,
      labels: ['urgent' as const],
    }
    expect(
      matchesFilter(card({ priority: 'high', labels: ['urgent'] }), f),
    ).toBe(true)
    // wrong priority
    expect(
      matchesFilter(card({ priority: 'low', labels: ['urgent'] }), f),
    ).toBe(false)
    // wrong label
    expect(
      matchesFilter(card({ priority: 'high', labels: ['bug'] }), f),
    ).toBe(false)
  })

  it('type filter passes only matching issue types', () => {
    const f = { ...EMPTY_FILTER, types: ['bug' as const] }
    expect(matchesFilter(card({ type: 'bug' }), f)).toBe(true)
    expect(matchesFilter(card({ type: 'story' }), f)).toBe(false)
    expect(matchesFilter(card({}), f)).toBe(false)
  })

  it('assignee filter treats missing as unassigned', () => {
    const f = { ...EMPTY_FILTER, assignees: ['unassigned' as const] }
    expect(matchesFilter(card({}), f)).toBe(true)
    expect(matchesFilter(card({ assignee: 'jbp' }), f)).toBe(false)
    const f2 = { ...EMPTY_FILTER, assignees: ['jbp' as const] }
    expect(matchesFilter(card({ assignee: 'jbp' }), f2)).toBe(true)
    expect(matchesFilter(card({ assignee: 'pri' }), f2)).toBe(false)
  })
})
