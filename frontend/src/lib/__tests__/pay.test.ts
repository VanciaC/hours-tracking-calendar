import { describe, expect, it } from 'vitest'
import { estimateGrossPay, rateAt, rateSpansBetween, parseEurosToCents, centsToEurosInput } from '../pay'

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

describe('rateSpansBetween', () => {
  const novemberRates = [
    { amountCents: 1250, effectiveFrom: '2026-01-01' },
    { amountCents: 1280, effectiveFrom: '2026-11-15' },
    { amountCents: 1271, effectiveFrom: '2026-11-01' },
  ]

  it('splits the period at each rate change', () => {
    expect(rateSpansBetween('2026-11-01', '2026-11-30', novemberRates)).toEqual([
      { from: '2026-11-01', to: '2026-11-14', amountCents: 1271 },
      { from: '2026-11-15', to: '2026-11-30', amountCents: 1280 },
    ])
  })

  it('clips a rate that started before the period', () => {
    expect(rateSpansBetween('2026-10-01', '2026-10-31', novemberRates)).toEqual([
      { from: '2026-10-01', to: '2026-10-31', amountCents: 1250 },
    ])
  })

  it('returns nothing before the first rate', () => {
    expect(rateSpansBetween('2025-12-01', '2025-12-31', novemberRates)).toEqual([])
  })
})

describe('parseEurosToCents', () => {
  it('accepts a comma or a dot as decimal separator', () => {
    expect(parseEurosToCents('12,80')).toBe(1280)
    expect(parseEurosToCents('12.8')).toBe(1280)
    expect(parseEurosToCents(' 13 ')).toBe(1300)
  })

  it('rejects invalid or non positive amounts', () => {
    expect(parseEurosToCents('')).toBeNull()
    expect(parseEurosToCents('abc')).toBeNull()
    expect(parseEurosToCents('12,805')).toBeNull()
    expect(parseEurosToCents('-5')).toBeNull()
    expect(parseEurosToCents('0')).toBeNull()
  })
})

describe('centsToEurosInput', () => {
  it('formats cents for an amount input', () => {
    expect(centsToEurosInput(1280)).toBe('12,80')
  })
})
