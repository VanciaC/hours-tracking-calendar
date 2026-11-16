import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  parseISO,
  isValid,
  isWeekend,
} from 'date-fns';

/** Weeks start on Monday (French convention). */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export interface DateRange {
  from: Date;
  to: Date;
}

/** Formats a date as YYYY-MM-DD, the format of the GraphQL Date scalar. */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Full weeks covering the month: from the Monday before its first day to the Sunday after its last day. */
export function visibleRange(month: Date): DateRange {
  return {
    from: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    to: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  };
}

/** Days of the visible range, grouped by week (7 days each). */
export function visibleWeeks(month: Date): Date[][] {
  const { from, to } = visibleRange(month);
  const days = eachDayOfInterval({ start: from, end: to });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

/** Sum of the net worked minutes over the given days. Days without entry count as 0. */
export function sumWorkedMinutes(
  days: Date[],
  workDaysByDate: ReadonlyMap<string, { durationMinutes: number }>,
): number {
  return days.reduce(
    (total, day) => total + (workDaysByDate.get(toIsoDate(day))?.durationMinutes ?? 0),
    0,
  )
}

/** Intensity used to tint a day: 1 short (< 4h), 2 regular (< 7h), 3 full (>= 7h). */
export function workLevel(minutes: number): 1 | 2 | 3 {
  if (minutes < 4 * 60) return 1
  if (minutes < 7 * 60) return 2
  return 3
}

/** Month as written in the URL: 2026-11 */
export function toMonthParam(month: Date): string {
  return format(month, 'yyyy-MM')
}

/** "2026-11" -> first day of that month. Missing or invalid -> first day of the current month. */
export function parseMonthParam(value: string | null, today: Date = new Date()): Date {
  if (value !== null && /^\d{4}-\d{2}$/.test(value)) {
    const month = parseISO(`${value}-01`)

    if (isValid(month)) {
      return month
    }
  }

  return startOfMonth(today)
}

/** A YYYY-MM-DD date from the URL. Missing or invalid -> today. */
export function parseDateParam(value: string | null, today: Date = new Date()): string {
  if (value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))) {
    return value
  }

  return toIsoDate(today)
}

/** Every ISO date between two dates, both included, in order whatever the order of the bounds. */
export function dateRange(a: string, b: string): string[] {
  const [from, to] = a <= b ? [a, b] : [b, a]

  return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map(toIsoDate)
}

/** Keeps Monday to Friday only. */
export function withoutWeekends(dates: readonly string[]): string[] {
  return dates.filter((date) => !isWeekend(parseISO(date)))
}

/** "08:00" or "08:30:00" -> "8h" / "8h30" */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = String(Number(hours))

  return minutes === '00' ? `${h}h` : `${h}h${minutes}`
}

/** ("08:00:00", "15:00:00") -> "8h–15h" */
export function formatShiftRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}–${formatTime(endTime)}`
}