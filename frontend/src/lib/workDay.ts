import type { EntryMode } from '../graphql/__generated__/graphql'
import { isValid, parseISO } from 'date-fns'

/** A shift as the API reads and returns it. */
export interface ShiftInput {
  /** HH:MM */
  startTime: string
  /** HH:MM */
  endTime: string
  unpaidBreakMinutes: number
}

/** A shift as the form holds it: the break is kept as typed, so the input never shows a stray zero. */
export interface ShiftDraft {
  /** Stable React key and identity of the row, so its errors follow it when another row is removed. */
  key: string
  /** HH:MM */
  startTime: string
  /** HH:MM */
  endTime: string
  /** As typed; empty means no break. */
  unpaidBreak: string
}

/** What can be wrong with typed hours. The component turns the code into a translated message. */
export type HoursError =
  | { code: 'noShift' }
  | { code: 'incompleteShift' }
  | { code: 'missingStart' }
  | { code: 'missingEnd' }
  | { code: 'endBeforeStart'; shift: string }
  | { code: 'invalidBreak' }
  | { code: 'breakTooLong'; shift: string }
  | { code: 'overlap' }
  | { code: 'invalidDuration' }

export type ShiftCheck = { ok: true; minutes: number } | { ok: false; error: HoursError }

/** "08:30" or "08:30:00" -> 510. Null when empty or malformed. */
export function timeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(time)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null
}

/** "" -> 0, "15" -> 15. Null unless it is a whole number of minutes. */
export function parseBreak(text: string): number | null {
  const trimmed = text.trim()

  if (trimmed === '') {
    return 0
  }

  return /^\d+$/.test(trimmed) ? Number(trimmed) : null
}

/**
 * Checks the shifts with the same rules as the API and returns the net worked minutes,
 * or what is wrong. The API stays the source of truth.
 */
export function checkShifts(shifts: readonly ShiftInput[]): ShiftCheck {
  if (shifts.length === 0) {
    return { ok: false, error: { code: 'noShift' } }
  }

  const ranges: { start: number; end: number; unpaid: number }[] = []

  for (const shift of shifts) {
    const start = timeToMinutes(shift.startTime)
    const end = timeToMinutes(shift.endTime)
    const label = `${shift.startTime}-${shift.endTime}`

    if (start === null || end === null) {
      return { ok: false, error: { code: 'incompleteShift' } }
    }

    if (end <= start) {
      return { ok: false, error: { code: 'endBeforeStart', shift: label } }
    }

    if (!Number.isInteger(shift.unpaidBreakMinutes) || shift.unpaidBreakMinutes < 0) {
      return { ok: false, error: { code: 'invalidBreak' } }
    }

    if (shift.unpaidBreakMinutes >= end - start) {
      return { ok: false, error: { code: 'breakTooLong', shift: label } }
    }

    ranges.push({ start, end, unpaid: shift.unpaidBreakMinutes })
  }

  // Sorted by start time, two shifts overlap when one starts before the previous one ends.
  ranges.sort((a, b) => a.start - b.start)

  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].start < ranges[i - 1].end) {
      return { ok: false, error: { code: 'overlap' } }
    }
  }

  return { ok: true, minutes: ranges.reduce((total, r) => total + r.end - r.start - r.unpaid, 0) }
}

/** ("7", "30") -> 450. Null unless it is a whole number of minutes between 1 minute and 24 hours. */
export function durationFromParts(hours: string, minutes: string): number | null {
  const h = hours.trim() === '' ? 0 : Number(hours)
  const m = minutes.trim() === '' ? 0 : Number(minutes)

  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59) {
    return null
  }

  const total = h * 60 + m

  return total >= 1 && total <= 24 * 60 ? total : null
}

let lastShiftKey = 0

/** A new form row, empty unless values are given. */
export function newShift(values: Partial<Omit<ShiftDraft, 'key'>> = {}): ShiftDraft {
  lastShiftKey += 1

  return { key: `shift-${lastShiftKey}`, startTime: '', endTime: '', unpaidBreak: '', ...values }
}

/** What the hours part of a form holds, for both modes at once. */
export interface HoursValue {
  mode: EntryMode
  shifts: ShiftDraft[]
  /** Duration mode inputs, kept as typed. */
  hours: string
  minutes: string
}

/** Anything that carries hours: a recorded day or an entry template. */
export interface HoursSource {
  mode: EntryMode
  durationMinutes: number | null
  shifts: readonly { startTime: string; endTime: string; unpaidBreakMinutes: number }[]
}

export type HoursReading =
  | { ok: true; minutes: number; mode: EntryMode; durationMinutes: number | null; shifts: ShiftInput[] }
  | { ok: false; error: HoursError }

/** Form values from a day or a template; an empty slots form when there is none. */
export function initialHoursValue(source: HoursSource | null): HoursValue {
  const shifts =
    source && source.shifts.length > 0
      ? source.shifts.map((shift) =>
          newShift({
            // The API returns HH:MM:SS for recorded shifts; time inputs work with HH:MM.
            startTime: shift.startTime.slice(0, 5),
            endTime: shift.endTime.slice(0, 5),
            // No break shows an empty input, not a zero to erase.
            unpaidBreak: shift.unpaidBreakMinutes > 0 ? String(shift.unpaidBreakMinutes) : '',
          }),
        )
      : [newShift()]

  const duration = source?.mode === 'DURATION' ? source.durationMinutes : null

  return {
    mode: source?.mode ?? 'SLOTS',
    shifts,
    hours: duration !== null ? String(Math.floor(duration / 60)) : '',
    minutes: duration !== null ? String(duration % 60) : '',
  }
}

/** Validates the active mode only and returns what to send to the API. */
export function readHours(value: HoursValue): HoursReading {
  if (value.mode === 'SLOTS') {
    const shifts: ShiftInput[] = []

    for (const shift of value.shifts) {
      const unpaidBreakMinutes = parseBreak(shift.unpaidBreak)

      if (unpaidBreakMinutes === null) {
        return { ok: false, error: { code: 'invalidBreak' } }
      }

      shifts.push({ startTime: shift.startTime, endTime: shift.endTime, unpaidBreakMinutes })
    }

    const check = checkShifts(shifts)

    return check.ok ? { ok: true, minutes: check.minutes, mode: 'SLOTS', durationMinutes: null, shifts } : check
  }

  const duration = durationFromParts(value.hours, value.minutes)

  return duration === null
    ? { ok: false, error: { code: 'invalidDuration' } }
    : { ok: true, minutes: duration, mode: 'DURATION', durationMinutes: duration, shifts: [] }
}

/** The errors of one shift row, each shown under its own input; `row` concerns the shift as a whole. */
export interface ShiftFieldErrors {
  start?: HoursError
  end?: HoursError
  break?: HoursError
  row?: HoursError
}

/** Every error of the form at once, attached to the field it concerns. */
export interface HoursFieldErrors {
  /** Same order as the shifts of the form. */
  shifts: ShiftFieldErrors[]
  duration?: HoursError
  /** The list itself: no shift at all. */
  list?: HoursError
}

/** Same rules as readHours, but every problem at once, on the field it concerns. */
export function hoursFieldErrors(value: HoursValue): HoursFieldErrors {
  if (value.mode === 'DURATION') {
    return durationFromParts(value.hours, value.minutes) === null
      ? { shifts: [], duration: { code: 'invalidDuration' } }
      : { shifts: [] }
  }

  if (value.shifts.length === 0) {
    return { shifts: [], list: { code: 'noShift' } }
  }

  // The time range of each shift, when its start and end are valid.
  const ranges: ({ start: number; end: number } | null)[] = []

  const shifts = value.shifts.map((shift) => {
    const errors: ShiftFieldErrors = {}
    const start = timeToMinutes(shift.startTime)
    const end = timeToMinutes(shift.endTime)
    const label = `${shift.startTime}-${shift.endTime}`
    const unpaid = parseBreak(shift.unpaidBreak)

    if (start === null) {
      errors.start = { code: 'missingStart' }
    }

    if (end === null) {
      errors.end = { code: 'missingEnd' }
    } else if (start !== null && end <= start) {
      errors.end = { code: 'endBeforeStart', shift: label }
    }

    const range = start !== null && end !== null && end > start ? { start, end } : null

    if (unpaid === null) {
      errors.break = { code: 'invalidBreak' }
    } else if (range && unpaid >= range.end - range.start) {
      errors.break = { code: 'breakTooLong', shift: label }
    }

    ranges.push(range)
    return errors
  })

  // Two shifts overlap: the error goes on the one that starts later (the second one when equal).
  ranges.forEach((range, i) => {
    if (!range) return

    const overlaps = ranges.some(
      (other, j) =>
        other !== null &&
        j !== i &&
        range.start < other.end &&
        other.start < range.end &&
        (range.start > other.start || (range.start === other.start && i > j)),
    )

    if (overlaps) {
      shifts[i].row = { code: 'overlap' }
    }
  })

  return { shifts }
}

/** Same limit as the API. */
export const MAX_DAYS_PER_ENTRY = 62

/** "2026-11-03,abc,2026-11-02" -> ["2026-11-02", "2026-11-03"]: valid, unique, sorted, at most 62. */
export function parseDatesParam(value: string | null): string[] {
  if (!value) {
    return []
  }

  const valid = value.split(',').filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && isValid(parseISO(date)))

  return [...new Set(valid)].sort().slice(0, MAX_DAYS_PER_ENTRY)
}

/** Entry page URL for one or several days. */
export function entryUrl(dates: readonly string[]): string {
  return dates.length === 1 ? `/saisie?date=${dates[0]}` : `/saisie?dates=${dates.join(',')}`
}

/** A template's hours, in the shape the hours form reads. */
export function templateHours(template: {
  mode: EntryMode
  durationMinutes: number | null
  slots: readonly { startTime: string; endTime: string; unpaidBreakMinutes: number }[]
}): HoursSource {
  return { mode: template.mode, durationMinutes: template.durationMinutes, shifts: template.slots }
}
