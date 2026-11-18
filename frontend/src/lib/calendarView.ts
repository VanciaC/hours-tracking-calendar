import { parseISO } from 'date-fns'
import { toMonthParam } from './calendar'

/** Values of the ?vue= URL parameter of the calendar. The month is the default. */
export type CalendarView = 'jour' | 'semaine' | 'mois'

const STORAGE_KEY = 'htc.calendarView'

/**
 * Remembers the calendar view for the rest of the tab's session, so leaving the calendar
 * for the entry form and coming back keeps it. sessionStorage: forgotten when the tab closes.
 */
export function rememberCalendarView(view: CalendarView): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, view)
  } catch {
    // Storage disabled (some private modes): the calendar simply opens on the month.
  }
}

export function rememberedCalendarView(): CalendarView {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'semaine' ? 'semaine' : 'mois'
  } catch {
    return 'mois'
  }
}

/** Back to the default month view, e.g. after signing in: each session starts fresh. */
export function forgetCalendarView(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage disabled: nothing was remembered anyway.
  }
}

/** The calendar on the given day, in the view the user was last using. */
export function calendarUrlFor(date: string): string {
  return rememberedCalendarView() === 'semaine'
    ? `/calendrier?vue=semaine&date=${date}`
    : `/calendrier?mois=${toMonthParam(parseISO(date))}`
}
