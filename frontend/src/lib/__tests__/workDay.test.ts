import { describe, expect, it } from 'vitest'
import { checkShifts, durationFromParts, initialHoursValue, parseDatesParam, readHours } from '../workDay'

const shift = (startTime: string, endTime: string, unpaidBreakMinutes = 0) => ({
  startTime,
  endTime,
  unpaidBreakMinutes,
})

describe('checkShifts', () => {
  it('counts a paid break as worked time', () => {
    expect(checkShifts([shift('08:00', '15:00')])).toEqual({ ok: true, minutes: 420 })
  })

  it('deducts unpaid breaks and sums shifts typed in any order', () => {
    expect(checkShifts([shift('13:00', '17:30', 30), shift('08:00', '12:00')])).toEqual({
      ok: true,
      minutes: 480,
    })
  })

  it('rejects overlapping shifts', () => {
    expect(checkShifts([shift('11:00', '15:00'), shift('08:00', '12:00')])).toEqual({
      ok: false,
      error: { code: 'overlap' },
    })
  })

  it('rejects a shift ending before it starts and a break as long as the shift', () => {
    expect(checkShifts([shift('15:00', '08:00')]).ok).toBe(false)
    expect(checkShifts([shift('08:00', '09:00', 60)]).ok).toBe(false)
  })

  it('rejects an empty or incomplete list', () => {
    expect(checkShifts([]).ok).toBe(false)
    expect(checkShifts([shift('08:00', '')]).ok).toBe(false)
  })
})

describe('durationFromParts', () => {
  it('builds a duration and rejects impossible ones', () => {
    expect(durationFromParts('7', '30')).toBe(450)
    expect(durationFromParts('7', '')).toBe(420)
    expect(durationFromParts('0', '0')).toBeNull()
    expect(durationFromParts('25', '0')).toBeNull()
    expect(durationFromParts('7', '60')).toBeNull()
  })
})

describe('initialHoursValue', () => {
  it('starts an empty slots form when there is nothing to load', () => {
    expect(initialHoursValue(null)).toEqual({
      mode: 'SLOTS',
      shifts: [{ startTime: '', endTime: '', unpaidBreakMinutes: 0 }],
      hours: '',
      minutes: '',
    })
  })

  it('loads a duration and trims recorded times to HH:MM', () => {
    expect(initialHoursValue({ mode: 'DURATION', durationMinutes: 450, shifts: [] })).toMatchObject({
      mode: 'DURATION',
      hours: '7',
      minutes: '30',
    })

    const slots = initialHoursValue({
      mode: 'SLOTS',
      durationMinutes: 420,
      shifts: [{ startTime: '08:00:00', endTime: '15:00:00', unpaidBreakMinutes: 0 }],
    })

    expect(slots.shifts).toEqual([{ startTime: '08:00', endTime: '15:00', unpaidBreakMinutes: 0 }])
  })
})

describe('readHours', () => {
  it('only reads the active mode', () => {
    const value = initialHoursValue(null)

    expect(readHours({ ...value, mode: 'DURATION', hours: '3', minutes: '30' })).toEqual({
      ok: true,
      minutes: 210,
      mode: 'DURATION',
      durationMinutes: 210,
      shifts: [],
    })
    expect(readHours(value).ok).toBe(false)
  })
})

describe('parseDatesParam', () => {
  it('keeps valid dates, once each, in order', () => {
    expect(parseDatesParam('2026-11-03,abc,2026-11-02,2026-11-03')).toEqual(['2026-11-02', '2026-11-03'])
    expect(parseDatesParam(null)).toEqual([])
  })
})