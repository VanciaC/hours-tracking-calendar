import { describe, expect, it } from 'vitest'
import {
  checkShifts,
  durationFromParts,
  hoursFieldErrors,
  initialHoursValue,
  newShift,
  parseBreak,
  parseDatesParam,
  readHours,
  type HoursValue,
} from '../workDay'

const shift = (startTime: string, endTime: string, unpaidBreakMinutes = 0) => ({
  startTime,
  endTime,
  unpaidBreakMinutes,
})

/** A slots form with the given rows: [start, end, break as typed]. */
const slots = (...rows: [string, string, string?][]): HoursValue => ({
  mode: 'SLOTS',
  shifts: rows.map(([startTime, endTime, unpaidBreak = '']) => newShift({ startTime, endTime, unpaidBreak })),
  hours: '',
  minutes: '',
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

describe('parseBreak', () => {
  it('reads an empty break as none and only accepts whole minutes', () => {
    expect(parseBreak('')).toBe(0)
    expect(parseBreak(' 15 ')).toBe(15)
    expect(parseBreak('015')).toBe(15)
    expect(parseBreak('1.5')).toBeNull()
    expect(parseBreak('-5')).toBeNull()
    expect(parseBreak('15m')).toBeNull()
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
    const value = initialHoursValue(null)

    expect(value).toMatchObject({ mode: 'SLOTS', hours: '', minutes: '' })
    expect(value.shifts).toEqual([{ key: expect.any(String), startTime: '', endTime: '', unpaidBreak: '' }])
  })

  it('loads a duration, trims recorded times to HH:MM and leaves no break empty', () => {
    expect(initialHoursValue({ mode: 'DURATION', durationMinutes: 450, shifts: [] })).toMatchObject({
      mode: 'DURATION',
      hours: '7',
      minutes: '30',
    })

    const value = initialHoursValue({
      mode: 'SLOTS',
      durationMinutes: 390,
      shifts: [
        { startTime: '08:00:00', endTime: '12:00:00', unpaidBreakMinutes: 0 },
        { startTime: '13:00:00', endTime: '16:00:00', unpaidBreakMinutes: 30 },
      ],
    })

    expect(value.shifts).toEqual([
      { key: expect.any(String), startTime: '08:00', endTime: '12:00', unpaidBreak: '' },
      { key: expect.any(String), startTime: '13:00', endTime: '16:00', unpaidBreak: '30' },
    ])
    expect(value.shifts[0].key).not.toBe(value.shifts[1].key)
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

  it('sends shifts in the API shape, the typed break turned into minutes', () => {
    expect(readHours(slots(['08:00', '12:00', '15']))).toEqual({
      ok: true,
      minutes: 225,
      mode: 'SLOTS',
      durationMinutes: null,
      shifts: [{ startTime: '08:00', endTime: '12:00', unpaidBreakMinutes: 15 }],
    })
  })

  it('refuses a break that is not a whole number of minutes', () => {
    expect(readHours(slots(['08:00', '12:00', 'abc']))).toEqual({ ok: false, error: { code: 'invalidBreak' } })
  })
})

describe('hoursFieldErrors', () => {
  it('finds nothing wrong with valid shifts', () => {
    expect(hoursFieldErrors(slots(['08:00', '12:00', '15'], ['13:00', '17:00']))).toEqual({ shifts: [{}, {}] })
  })

  it('puts each problem on its own field', () => {
    const errors = hoursFieldErrors(slots(['', '', ''], ['15:00', '08:00', 'x'], ['08:00', '09:00', '60']))

    expect(errors.shifts[0]).toEqual({ start: { code: 'missingStart' }, end: { code: 'missingEnd' } })
    expect(errors.shifts[1]).toEqual({
      end: { code: 'endBeforeStart', shift: '15:00-08:00' },
      break: { code: 'invalidBreak' },
    })
    expect(errors.shifts[2]).toEqual({ break: { code: 'breakTooLong', shift: '08:00-09:00' } })
  })

  it('marks the overlap on the shift that starts later', () => {
    const errors = hoursFieldErrors(slots(['11:00', '15:00'], ['08:00', '12:00']))

    expect(errors.shifts[0]).toEqual({ row: { code: 'overlap' } })
    expect(errors.shifts[1]).toEqual({})
  })

  it('checks the duration as a whole', () => {
    const value = initialHoursValue(null)

    expect(hoursFieldErrors({ ...value, mode: 'DURATION', hours: '25', minutes: '' })).toEqual({
      shifts: [],
      duration: { code: 'invalidDuration' },
    })
    expect(hoursFieldErrors({ ...value, mode: 'DURATION', hours: '7', minutes: '30' })).toEqual({ shifts: [] })
  })
})

describe('parseDatesParam', () => {
  it('keeps valid dates, once each, in order', () => {
    expect(parseDatesParam('2026-11-03,abc,2026-11-02,2026-11-03')).toEqual(['2026-11-02', '2026-11-03'])
    expect(parseDatesParam(null)).toEqual([])
  })
})
