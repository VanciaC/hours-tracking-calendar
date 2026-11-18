import { describe, expect, it } from 'vitest'
import {
  daySummary,
  monthGridOf,
  presenceByHour,
  timeToMinutes,
  timelinePosition,
  timelineRange,
  weekOf,
  type TimelineDay,
} from '../teamPlanning'

function slots(userId: string, ...shifts: [string, string][]): TimelineDay {
  return {
    userId,
    mode: 'SLOTS',
    durationMinutes: 0,
    shifts: shifts.map(([startTime, endTime]) => ({ startTime, endTime })),
  }
}

describe('timeToMinutes', () => {
  it('converts a time to minutes since midnight', () => {
    expect(timeToMinutes('08:30:00')).toBe(510)
    expect(timeToMinutes('00:00:00')).toBe(0)
  })
})

describe('timelineRange', () => {
  it('shows 6h to 22h by default', () => {
    expect(timelineRange([])).toEqual({ start: 6, end: 22 })
  })

  it('widens to the hour around earlier or later shifts', () => {
    expect(timelineRange([slots('1', ['05:30:00', '09:00:00'], ['20:00:00', '22:15:00'])])).toEqual({
      start: 5,
      end: 23,
    })
  })
})

describe('timelinePosition', () => {
  it('places a time in percent of the range', () => {
    const range = { start: 6, end: 22 }

    expect(timelinePosition(6 * 60, range)).toBe(0)
    expect(timelinePosition(14 * 60, range)).toBe(50)
    expect(timelinePosition(22 * 60, range)).toBe(100)
  })
})

describe('presenceByHour', () => {
  const range = { start: 8, end: 12 }

  it('counts the people whose shifts overlap each hour', () => {
    const days = [slots('1', ['08:00:00', '10:00:00']), slots('2', ['09:30:00', '12:00:00'])]

    expect(presenceByHour(days, range)).toEqual([1, 2, 1, 1])
  })

  it('counts a person once even with two shifts in the same hour', () => {
    const days = [slots('1', ['08:00:00', '08:30:00'], ['08:45:00', '09:00:00'])]

    expect(presenceByHour(days, range)).toEqual([1, 0, 0, 0])
  })

  it('ignores days typed as a duration', () => {
    const days: TimelineDay[] = [{ userId: '1', mode: 'DURATION', durationMinutes: 420, shifts: [] }]

    expect(presenceByHour(days, range)).toEqual([0, 0, 0, 0])
  })
})

describe('weekOf', () => {
  it('returns Monday to Sunday of the week containing the date', () => {
    const week = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']

    expect(weekOf('2026-11-18')).toEqual(week)
    expect(weekOf('2026-11-16')).toEqual(week)
    expect(weekOf('2026-11-22')).toEqual(week)
  })

  it('handles a week across two months', () => {
    expect(weekOf('2026-12-01')[0]).toBe('2026-11-30')
  })
})

describe('daySummary', () => {
  // Simple stand-ins for useFormatters: the test checks what is formatted, not how.
  const format = {
    shiftRange: (start: string, end: string) => `${start}-${end}`,
    duration: (minutes: number) => `${minutes}min`,
  }

  it('goes from the first start to the last end', () => {
    expect(daySummary(slots('1', ['11:00:00', '15:00:00'], ['18:00:00', '23:00:00']), format)).toBe('11:00:00-23:00:00')
  })

  it('shows the duration of a day typed as one', () => {
    expect(daySummary({ userId: '1', mode: 'DURATION', durationMinutes: 450, shifts: [] }, format)).toBe('450min')
  })
})

describe('monthGridOf', () => {
  it('covers the month with full weeks, Monday to Sunday', () => {
    // November 2026 starts on a Sunday and ends on a Monday.
    const weeks = monthGridOf('2026-11-18')

    expect(weeks).toHaveLength(6)
    expect(weeks[0]?.[0]).toBe('2026-10-26')
    expect(weeks.at(-1)?.at(-1)).toBe('2026-12-06')
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })
})
