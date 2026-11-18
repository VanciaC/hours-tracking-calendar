import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { isSameMonth, parseISO } from 'date-fns'
import { parseDateParam, parseMonthParam, toIsoDate, toMonthParam, visibleRange } from '../../lib/calendar'
import { rememberCalendarView, type CalendarView } from '../../lib/calendarView'
import { weekOf } from '../../lib/teamPlanning'

// Re-exported so the switch keeps importing the type from here.
export type { CalendarView } from '../../lib/calendarView'

/**
 * The calendar view and period, read from the URL: ?mois=2026-11 for a month,
 * ?vue=semaine&date=2026-11-18 for a week, ?vue=jour&date=2026-11-18 for a day.
 * The current period keeps a short URL.
 *
 * @param views the views this page offers. Must be a constant: it is not watched.
 */
export function useCalendarPeriod(views: readonly CalendarView[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('vue')
  const view: CalendarView = views.find((option) => option === requested) ?? 'mois'
  const monthParam = searchParams.get('mois')
  const date = parseDateParam(searchParams.get('date'))

  // Whatever brought us here (the switch, a link, the menu), this is now the view to come back to.
  useEffect(() => {
    rememberCalendarView(view)
  }, [view])

  const month = useMemo(() => parseMonthParam(monthParam), [monthParam])

  // The days shown by the timeline views: the week, or the day alone.
  const days = useMemo(() => (view === 'jour' ? [date] : weekOf(date)), [view, date])

  // The days to load.
  const { from, to } = useMemo(() => {
    if (view !== 'mois') {
      return { from: days[0] ?? date, to: days.at(-1) ?? date }
    }

    const range = visibleRange(month)

    return { from: toIsoDate(range.from), to: toIsoDate(range.to) }
  }, [view, days, date, month])

  function showMonth(next: Date) {
    setSearchParams(isSameMonth(next, new Date()) ? {} : { mois: toMonthParam(next) })
  }

  function showWeek(next: string) {
    const today = toIsoDate(new Date())
    setSearchParams(weekOf(next).includes(today) ? { vue: 'semaine' } : { vue: 'semaine', date: next })
  }

  function showDay(next: string) {
    const today = toIsoDate(new Date())
    setSearchParams(next === today ? { vue: 'jour' } : { vue: 'jour', date: next })
  }

  /** Moves the day or week view to the period containing this date. */
  function showDate(next: string) {
    if (view === 'jour') showDay(next)
    else showWeek(next)
  }

  function switchTo(next: CalendarView) {
    if (next === 'mois') {
      showMonth(parseISO(date))
      return
    }

    // From the month: today in the current month, otherwise its first day. From a day or a week: the same date.
    const today = new Date()
    const anchor = view === 'mois' ? toIsoDate(isSameMonth(month, today) ? today : month) : date

    if (next === 'semaine') showWeek(anchor)
    else showDay(anchor)
  }

  return { view, month, days, from, to, showMonth, showDate, switchTo }
}
