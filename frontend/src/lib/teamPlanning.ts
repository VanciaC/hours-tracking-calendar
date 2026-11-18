import { addDays, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { formatShiftRange, formatTime, toIsoDate, visibleWeeks } from './calendar'

export interface TimelineShift {
  startTime: string
  endTime: string
}

export interface TimelineDay {
  userId: string
  mode: 'DURATION' | 'SLOTS'
  durationMinutes: number
  shifts: readonly TimelineShift[]
}

/** Whole hours shown on the timeline, end excluded. */
export interface HourRange {
  start: number
  end: number
}

export const DEFAULT_START_HOUR = 6
export const DEFAULT_END_HOUR = 22

/** "08:30:00" -> 510 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':')

  return Number(hours) * 60 + Number(minutes)
}

/** 450 -> "7h30", 420 -> "7h" */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = String(minutes % 60).padStart(2, '0')

  return formatTime(`${hours}:${rest}`)
}

/** 6h to 22h, widened to the hour around any shift starting earlier or ending later. */
export function timelineRange(days: readonly Pick<TimelineDay, 'shifts'>[]): HourRange {
  let start = DEFAULT_START_HOUR * 60
  let end = DEFAULT_END_HOUR * 60

  for (const day of days) {
    for (const shift of day.shifts) {
      start = Math.min(start, timeToMinutes(shift.startTime))
      end = Math.max(end, timeToMinutes(shift.endTime))
    }
  }

  return { start: Math.floor(start / 60), end: Math.ceil(end / 60) }
}

/** Where a time sits on the timeline, in percent of its width. */
export function timelinePosition(minutes: number, range: HourRange): number {
  return ((minutes - range.start * 60) / ((range.end - range.start) * 60)) * 100
}

/**
 * Number of people working during each hour of the range. A shift counts when it overlaps
 * the hour. Days typed as a duration have no times, so they are not counted.
 */
export function presenceByHour(days: readonly TimelineDay[], range: HourRange): number[] {
  const counts: number[] = []

  for (let hour = range.start; hour < range.end; hour++) {
    const from = hour * 60
    const to = from + 60
    const present = new Set(
      days
        .filter((day) =>
          day.shifts.some((shift) => timeToMinutes(shift.startTime) < to && timeToMinutes(shift.endTime) > from),
        )
        .map((day) => day.userId),
    )

    counts.push(present.size)
  }

  return counts
}

/** The seven ISO dates, Monday to Sunday, of the week containing the date. */
export function weekOf(date: string): string[] {
  const monday = startOfWeek(parseISO(date), { weekStartsOn: 1 })

  return Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(monday, index)))
}

/** "9h–17h" from the first start to the last end, or the duration for a day typed as one. */
export function daySummary(day: TimelineDay): string {
  const first = day.shifts[0]
  const last = day.shifts.at(-1)

  if (day.mode === 'DURATION' || !first || !last) {
    return formatMinutes(day.durationMinutes)
  }

  return formatShiftRange(first.startTime, last.endTime)
}

/** Full weeks, Monday to Sunday, covering the month of the date: at most 6 weeks, 42 days. */
export function monthGridOf(date: string): string[][] {
  return visibleWeeks(startOfMonth(parseISO(date))).map((week) => week.map(toIsoDate))
}
