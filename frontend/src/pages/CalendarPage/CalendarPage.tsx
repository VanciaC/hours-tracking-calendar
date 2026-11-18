import { useQuery } from '@apollo/client/react'
import { CalendarMonth } from '../../components/CalendarMonth/CalendarMonth'
import { CalendarViewSwitch } from '../../components/CalendarViewSwitch/CalendarViewSwitch'
import { useCalendarPeriod, type CalendarView } from '../../components/CalendarViewSwitch/useCalendarPeriod'
import { CalendarWeek } from '../../components/CalendarWeek/CalendarWeek'
import { CalendarDocument } from '../../graphql/__generated__/graphql'

/** The personal calendar: no day view, the entry form already shows one day. */
const VIEWS: readonly CalendarView[] = ['mois', 'semaine']

export function CalendarPage() {
  const period = useCalendarPeriod(VIEWS)

  const { data, loading, error } = useQuery(CalendarDocument, {
    variables: { from: period.from, to: period.to },
  })

  const toolbar = <CalendarViewSwitch views={VIEWS} view={period.view} onChange={period.switchTo} />

  return period.view === 'mois' ? (
    <CalendarMonth
      month={period.month}
      onMonthChange={period.showMonth}
      calendar={data?.me}
      loading={loading}
      error={error}
      toolbar={toolbar}
    />
  ) : (
    <CalendarWeek
      days={period.days}
      onDateChange={period.showDate}
      calendar={data?.me}
      loading={loading}
      error={error}
      toolbar={toolbar}
    />
  )
}
