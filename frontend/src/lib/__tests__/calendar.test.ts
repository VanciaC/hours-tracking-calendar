import { describe, expect, it } from 'vitest'
import { dateRange, formatDuration, formatLongDate, formatShiftRange, parseDateParam, parseMonthParam, sumWorkedMinutes, toIsoDate, toMonthParam, visibleRange, withoutWeekends, workLevel } from '../calendar'

describe('formatDuration', () => {
  it('formats minutes as hours', () => {
    expect(formatDuration(420)).toBe('7h')
    expect(formatDuration(450)).toBe('7h30')
    expect(formatDuration(5)).toBe('0h05')
  })
})

describe('visibleRange', () => {
  it('covers full weeks from Monday to Sunday', () => {
    const { from, to } = visibleRange(new Date(2026, 10, 15)) // November 2026

    expect(toIsoDate(from)).toBe('2026-10-26')
    expect(toIsoDate(to)).toBe('2026-12-06')
  })
})

describe('sumWorkedMinutes', () => {
  it('sums the days with an entry and ignores the others', () => {
    const workDays = new Map([
      ['2026-11-02', { durationMinutes: 480 }],
      ['2026-11-03', { durationMinutes: 375 }],
    ])
    const days = [new Date(2026, 10, 2), new Date(2026, 10, 3), new Date(2026, 10, 4)]

    expect(sumWorkedMinutes(days, workDays)).toBe(855)
  })
})

describe('workLevel', () => {
  it('maps durations to intensity levels', () => {
    expect(workLevel(239)).toBe(1)
    expect(workLevel(240)).toBe(2)
    expect(workLevel(420)).toBe(3)
  })
})

describe('formatLongDate', () => {
  it('formats a date in full, the French way', () => {
    expect(formatLongDate('2026-11-01')).toBe('1er novembre 2026')
    expect(formatLongDate('2026-11-15')).toBe('15 novembre 2026')
  })
})

describe('month URL param', () => {
  const today = new Date(2026, 10, 16)

  it('reads a valid month and writes it back', () => {
    const month = parseMonthParam('2026-10', today)

    expect(toIsoDate(month)).toBe('2026-10-01')
    expect(toMonthParam(month)).toBe('2026-10')
  })

  it('falls back to the current month when missing or invalid', () => {
    expect(toIsoDate(parseMonthParam(null, today))).toBe('2026-11-01')
    expect(toIsoDate(parseMonthParam('2026-13', today))).toBe('2026-11-01')
    expect(toIsoDate(parseMonthParam('abc', today))).toBe('2026-11-01')
  })
})

describe('parseDateParam', () => {
  it('keeps a valid date and falls back to today otherwise', () => {
    const today = new Date(2026, 10, 16)

    expect(parseDateParam('2026-11-02', today)).toBe('2026-11-02')
    expect(parseDateParam('2026-02-30', today)).toBe('2026-11-16')
    expect(parseDateParam(null, today)).toBe('2026-11-16')
  })
})

describe('dateRange', () => {
  it('lists every day between two dates, in order', () => {
    expect(dateRange('2026-11-04', '2026-11-02')).toEqual(['2026-11-02', '2026-11-03', '2026-11-04'])
  })
})

describe('withoutWeekends', () => {
  it('drops Saturdays and Sundays from a range', () => {
    // Friday 13 to Monday 16 November 2026.
    expect(withoutWeekends(dateRange('2026-11-13', '2026-11-16'))).toEqual(['2026-11-13', '2026-11-16'])
  })
})

describe('formatShiftRange', () => {
  it('writes a shift the French way, without leading zeros', () => {
    expect(formatShiftRange('08:00:00', '15:00:00')).toBe('8h–15h')
    expect(formatShiftRange('08:30', '12:45')).toBe('8h30–12h45')
  })
})