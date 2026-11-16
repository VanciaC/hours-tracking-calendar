import { describe, expect, it } from 'vitest'
import { estimateGrossPay, formatCents, rateAt } from '../pay'

const rates = [
  { amountCents: 1300, effectiveFrom: '2026-11-01' },
  { amountCents: 1250, effectiveFrom: '2026-01-01' },
]

describe('rateAt', () => {
  it('returns the most recent rate in force on the date', () => {
    expect(rateAt('2026-11-16', rates)?.amountCents).toBe(1300)
    expect(rateAt('2026-10-31', rates)?.amountCents).toBe(1250)
  })

  it('applies a rate from its effective date included', () => {
    expect(rateAt('2026-11-01', rates)?.amountCents).toBe(1300)
  })

  it('returns null before the first rate', () => {
    expect(rateAt('2025-12-31', rates)).toBeNull()
  })

  it('does not depend on the order of the rates', () => {
    expect(rateAt('2026-11-16', [...rates].reverse())?.amountCents).toBe(1300)
  })
})

describe('estimateGrossPay', () => {
  it('prices each day at the rate in force on its date', () => {
    const days = [
      { date: '2026-10-30', durationMinutes: 60 }, // 12.50
      { date: '2026-11-02', durationMinutes: 120 }, // 26.00
    ]

    expect(estimateGrossPay(days, rates)).toEqual({ grossCents: 3850, unpricedDays: 0 })
  })

  it('rounds only once, on the total', () => {
    // 3 x 1 min at 13.00 = 39 cents. Rounding each day (21.67 -> 22) would give 66.
    const days = Array.from({ length: 3 }, () => ({ date: '2026-11-02', durationMinutes: 1 }))

    expect(estimateGrossPay(days, rates).grossCents).toBe(65)
  })

  it('counts the days without any applicable rate apart', () => {
    const days = [
      { date: '2025-12-31', durationMinutes: 420 },
      { date: '2026-11-02', durationMinutes: 60 },
    ]

    expect(estimateGrossPay(days, rates)).toEqual({ grossCents: 1300, unpricedDays: 1 })
  })

  it('returns zero for no worked day', () => {
    expect(estimateGrossPay([], rates)).toEqual({ grossCents: 0, unpricedDays: 0 })
  })
})

describe('formatCents', () => {
  it('formats cents as euros the French way', () => {
    // Intl uses narrow no-break spaces: normalize them to compare.
    expect(formatCents(82875).replace(/\s/g, ' ')).toBe('828,75 €')
  })
})