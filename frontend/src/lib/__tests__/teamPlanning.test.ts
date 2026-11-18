import { describe, expect, it } from 'vitest'
import {
  formatMinutes,
  presenceByHour,
  timeToMinutes,
  timelinePosition,
  timelineRange,
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

describe('time helpers', () => {
  it('converts a time to minutes and minutes to a label', () => {
    expect(timeToMinutes('08:30:00')).toBe(510)
    expect(formatMinutes(450)).toBe('7h30')
    expect(formatMinutes(420)).toBe('7h')
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
