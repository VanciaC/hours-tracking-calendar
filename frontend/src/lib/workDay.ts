import type { EntryMode } from '../graphql/__generated__/graphql'
import { isValid, parseISO } from 'date-fns'

export interface ShiftDraft {
  /** HH:MM */
  startTime: string
  /** HH:MM */
  endTime: string
  unpaidBreakMinutes: number
}

export type ShiftCheck = { ok: true; minutes: number } | { ok: false; error: string }

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

/**
 * Checks the shifts with the same rules as the API and returns the net worked minutes,
 * or a message explaining what is wrong. The API stays the source of truth.
 */
export function checkShifts(shifts: readonly ShiftDraft[]): ShiftCheck {
  if (shifts.length === 0) {
    return { ok: false, error: 'Ajoute au moins un créneau.' }
  }

  const ranges: { start: number; end: number; unpaid: number }[] = []

  for (const shift of shifts) {
    const start = timeToMinutes(shift.startTime)
    const end = timeToMinutes(shift.endTime)
    const label = `${shift.startTime}-${shift.endTime}`

    if (start === null || end === null) {
      return { ok: false, error: 'Renseigne le début et la fin de chaque créneau.' }
    }

    if (end <= start) {
      return { ok: false, error: `Le créneau ${label} doit finir après avoir commencé.` }
    }

    if (!Number.isInteger(shift.unpaidBreakMinutes) || shift.unpaidBreakMinutes < 0) {
      return { ok: false, error: 'La pause doit être un nombre entier de minutes.' }
    }

    if (shift.unpaidBreakMinutes >= end - start) {
      return { ok: false, error: `La pause du créneau ${label} doit être plus courte que le créneau.` }
    }

    ranges.push({ start, end, unpaid: shift.unpaidBreakMinutes })
  }

  // Sorted by start time, two shifts overlap when one starts before the previous one ends.
  ranges.sort((a, b) => a.start - b.start)

  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].start < ranges[i - 1].end) {
      return { ok: false, error: 'Les créneaux ne doivent pas se chevaucher.' }
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

export const EMPTY_SHIFT: ShiftDraft = { startTime: '', endTime: '', unpaidBreakMinutes: 0 }

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
  | { ok: true; minutes: number; mode: EntryMode; durationMinutes: number | null; shifts: ShiftDraft[] }
  | { ok: false; error: string }

/** Form values from a day or a template; an empty slots form when there is none. */
export function initialHoursValue(source: HoursSource | null): HoursValue {
  const shifts =
    source && source.shifts.length > 0
      ? source.shifts.map((shift) => ({
          // The API returns HH:MM:SS for recorded shifts; time inputs work with HH:MM.
          startTime: shift.startTime.slice(0, 5),
          endTime: shift.endTime.slice(0, 5),
          unpaidBreakMinutes: shift.unpaidBreakMinutes,
        }))
      : [EMPTY_SHIFT]

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
    const check = checkShifts(value.shifts)

    return check.ok
      ? { ok: true, minutes: check.minutes, mode: 'SLOTS', durationMinutes: null, shifts: value.shifts }
      : check
  }

  const duration = durationFromParts(value.hours, value.minutes)

  return duration === null
    ? { ok: false, error: 'Durée invalide. Elle doit être comprise entre 1 minute et 24 heures.' }
    : { ok: true, minutes: duration, mode: 'DURATION', durationMinutes: duration, shifts: [] }
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