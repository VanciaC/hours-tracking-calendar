import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { isSameMonth } from 'date-fns'
import { CalendarMonth } from '../../components/CalendarMonth/CalendarMonth'
import { parseMonthParam, toMonthParam } from '../../lib/calendar'

export function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const monthParam = searchParams.get('mois')

  // Memoized on the URL value so the month stays the same object between renders.
  const month = useMemo(() => parseMonthParam(monthParam), [monthParam])

  function handleMonthChange(next: Date) {
    // The current month keeps a clean URL: /calendrier
    setSearchParams(isSameMonth(next, new Date()) ? {} : { mois: toMonthParam(next) })
  }

  return <CalendarMonth month={month} onMonthChange={handleMonthChange} />
}
