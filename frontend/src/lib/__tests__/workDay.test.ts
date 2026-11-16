import { describe, expect, it } from 'vitest'
import { checkShifts, durationFromParts } from '../workDay'

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
      error: 'Les créneaux ne doivent pas se chevaucher.',
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