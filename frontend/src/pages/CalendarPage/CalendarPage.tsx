import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { useSearchParams } from 'react-router'
import { isSameMonth } from 'date-fns'
import { CalendarMonth } from '../../components/CalendarMonth/CalendarMonth'
import { CalendarDocument } from '../../graphql/__generated__/graphql'
import { parseMonthParam, toIsoDate, toMonthParam, visibleRange } from '../../lib/calendar'

export function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const monthParam = searchParams.get('mois')

  // Memoized on the URL value so the month stays the same object between renders.
  const month = useMemo(() => parseMonthParam(monthParam), [monthParam])
  const { from, to } = useMemo(() => visibleRange(month), [month])

  const { data, loading, error } = useQuery(CalendarDocument, {
    variables: { from: toIsoDate(from), to: toIsoDate(to) },
  })

  function handleMonthChange(next: Date) {
    // The current month keeps a clean URL: /calendrier
    setSearchParams(isSameMonth(next, new Date()) ? {} : { mois: toMonthParam(next) })
  }

  return (
    <CalendarMonth
      month={month}
      onMonthChange={handleMonthChange}
      calendar={data?.me}
      loading={loading}
      error={error}
    />
  )
}
