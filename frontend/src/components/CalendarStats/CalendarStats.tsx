import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import type { CalendarDayFragment } from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { estimateGrossPay, rateSpansBetween, type RatePeriod } from '../../lib/pay'
import '../CalendarMonth/CalendarMonth.css'

interface CalendarStatsProps {
  /** ISO dates of the period counted: the days of the month, or the seven days of the week. */
  days: readonly string[]
  workDaysByDate: ReadonlyMap<string, CalendarDayFragment>
  hourlyRates: readonly RatePeriod[]
  period: 'month' | 'week' | 'day'
  /** No link to manage the rates when looking at someone else's calendar. */
  readOnly?: boolean
}

/** Hours, worked days, daily average and estimated gross pay of a period (US-16, US-17, US-19). */
export function CalendarStats({ days, workDaysByDate, hourlyRates, period, readOnly = false }: CalendarStatsProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()

  const workDays = days.flatMap((day) => workDaysByDate.get(day) ?? [])
  const minutes = workDays.reduce((total, workDay) => total + workDay.durationMinutes, 0)
  const averageMinutes = workDays.length > 0 ? Math.round(minutes / workDays.length) : 0
  const pay = estimateGrossPay(workDays, hourlyRates)

  const first = days[0]
  const last = days.at(-1)
  const rateSpans = first && last ? rateSpansBetween(first, last, hourlyRates) : []

  /** "Du 1er au 14 nov." within a month, "30 novembre – 6 décembre" across two. */
  function rateSpanLabel(fromIso: string, toIso: string): string {
    const from = parseISO(fromIso)
    const to = parseISO(toIso)

    if (from.getMonth() !== to.getMonth()) {
      return `${fmt.dayMonth(from)} – ${fmt.dayMonth(to)}`
    }

    const day = (date: Date) => (date.getDate() === 1 ? t('calendar.firstOfMonth') : String(date.getDate()))

    return t('calendar.rateSpan', { from: day(from), to: day(to), month: fmt.monthShort(to) })
  }

  return (
    <dl className="calendar-stats">
      <div className="calendar-stat">
        <dt>
          {period === 'month'
            ? t('calendar.stats.hours')
            : period === 'week'
              ? t('calendar.stats.weekHours')
              : t('calendar.stats.dayHours')}
        </dt>
        <dd>{fmt.duration(minutes)}</dd>
      </div>

      {/* Worked days and a daily average mean nothing for a single day. */}
      {period !== 'day' && (
        <>
          <div className="calendar-stat">
            <dt>{t('calendar.stats.workedDays')}</dt>
            <dd>{workDays.length}</dd>
          </div>
          <div className="calendar-stat">
            <dt>{t('calendar.stats.average')}</dt>
            <dd>{workDays.length > 0 ? fmt.duration(averageMinutes) : '–'}</dd>
          </div>
        </>
      )}

      <div className="calendar-stat calendar-stat-highlight">
        <dt>{t('calendar.stats.pay')}</dt>
        <dd>
          {fmt.money(pay.grossCents)}
          {rateSpans.length > 0 ? (
            <ul className="calendar-stat-rates">
              {rateSpans.map((span) => (
                <li key={span.from}>
                  <span>{rateSpanLabel(span.from, span.to)}</span>
                  <span>{t('calendar.stats.perHour', { amount: fmt.money(span.amountCents) })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="calendar-stat-note">{t('calendar.stats.noRate')}</span>
          )}
          {pay.unpricedDays > 0 && (
            <span className="calendar-stat-note">{t('calendar.stats.unpricedDays', { count: pay.unpricedDays })}</span>
          )}
          {!readOnly && (
            <Link to="/reglages" className="calendar-stat-action">
              {t('calendar.stats.manageRates')}
            </Link>
          )}
        </dd>
      </div>
    </dl>
  )
}
