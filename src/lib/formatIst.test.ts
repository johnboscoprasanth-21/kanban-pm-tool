import { describe, it, expect } from 'vitest'
import { formatIst, formatIstDate, formatIstTime } from './formatIst'

const REF = new Date('2026-01-15T08:30:45Z') // -> 14:00:45 IST

describe('formatIst', () => {
  it('formats as DD-MM-YYYY HH:MM:SS IST', () => {
    expect(formatIst(REF)).toBe('15-01-2026 14:00:45 IST')
  })

  it('formatIstDate gives DD-MM-YYYY', () => {
    expect(formatIstDate(REF)).toBe('15-01-2026')
  })

  it('formatIstTime gives HH:MM:SS', () => {
    expect(formatIstTime(REF)).toBe('14:00:45')
  })

  it('rolls date forward across IST midnight', () => {
    const d = new Date('2026-03-01T19:00:00Z') // -> 02-03-2026 00:30:00 IST
    expect(formatIst(d)).toBe('02-03-2026 00:30:00 IST')
  })
})
