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