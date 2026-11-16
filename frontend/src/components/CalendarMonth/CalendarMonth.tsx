import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { addMonths, endOfMonth, isSameMonth, isToday, isWeekend, parseISO, startOfMonth, subMonths } from 'date-fns'
import { CalendarDocument, type CalendarDayFragment } from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { sumWorkedMinutes, toIsoDate, visibleRange, visibleWeeks, workLevel } from '../../lib/calendar'
import { estimateGrossPay, rateSpansBetween } from '../../lib/pay'
import { entryUrl } from '../../lib/workDay'
import { useDaySelection } from './useDaySelection'
import './CalendarMonth.css'

interface CalendarMonthProps {
  /** Any date within the month to display. */
  month: Date
  onMonthChange: (month: Date) => void
}

export function CalendarMonth({ month, onMonthChange }: CalendarMonthProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const navigate = useNavigate()
  const selection = useDaySelection()
  const { from, to } = visibleRange(month)

  const { data, loading, error } = useQuery(CalendarDocument, {
    variables: { from: toIsoDate(from), to: toIsoDate(to) },
  })

  // Index work days by ISO date for an O(1) lookup per cell.
  const workDaysByDate = useMemo(() => {
    const map = new Map<string, CalendarDayFragment>()
    for (const workDay of data?.me?.workDays ?? []) {
      map.set(workDay.date, workDay)
    }
    return map
  }, [data])

  const weeks = useMemo(() => visibleWeeks(month), [month])

  // Monthly figures only count the days of the displayed month.
  const stats = useMemo(() => {
    const monthDays = weeks.flat().filter((day) => isSameMonth(day, month))
    const monthWorkDays = monthDays.flatMap((day) => {
      const workDay = workDaysByDate.get(toIsoDate(day))
      return workDay ? [workDay] : []
    })
    const minutes = sumWorkedMinutes(monthDays, workDaysByDate)
    const hourlyRates = data?.me?.hourlyRates ?? []

    return {
      minutes,
      workedDays: monthWorkDays.length,
      averageMinutes: monthWorkDays.length > 0 ? Math.round(minutes / monthWorkDays.length) : 0,
      pay: estimateGrossPay(monthWorkDays, hourlyRates),
      rateSpans: rateSpansBetween(toIsoDate(startOfMonth(month)), toIsoDate(endOfMonth(month)), hourlyRates),
    }
  }, [weeks, month, workDaysByDate, data])

  /** "Du 1er au 14 nov.", "Nov 1–14": each language orders the parts its own way. */
  function rateSpanLabel(fromIso: string, toIso: string): string {
    const day = (date: Date) => (date.getDate() === 1 ? t('calendar.firstOfMonth') : String(date.getDate()))
    const end = parseISO(toIso)

    return t('calendar.rateSpan', { from: day(parseISO(fromIso)), to: day(end), month: fmt.monthShort(end) })
  }

  if (error) {
    return <p className="calendar-error">{t('calendar.loadError')}</p>
  }

  return (
    <section className="calendar" aria-busy={loading}>
      <header className="calendar-header">
        <h2 className="calendar-title">{fmt.monthYear(month)}</h2>

        <div className="calendar-nav">
          <button
            type="button"
            className="calendar-nav-arrow"
            onClick={() => onMonthChange(subMonths(month, 1))}
            aria-label={t('calendar.previousMonth')}
          >
            ‹
          </button>
          <button type="button" onClick={() => onMonthChange(new Date())} disabled={isSameMonth(month, new Date())}>
            {t('calendar.today')}
          </button>
          <button
            type="button"
            className="calendar-nav-arrow"
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label={t('calendar.nextMonth')}
          >
            ›
          </button>
        </div>
      </header>

      {/* Grid and stats side by side on wide screens, stacked otherwise. */}
      <div className="calendar-body">
        <div className="calendar-main">
          {selection.picked.length > 0 && (
            <div className="calendar-selection" role="status" data-selection-bar>
              <span>{t('calendar.selection.count', { count: selection.picked.length })}</span>
              <button
                type="button"
                className="calendar-selection-go"
                onClick={() => navigate(entryUrl(selection.picked))}
              >
                {t('calendar.selection.go', { count: selection.picked.length })}
              </button>
              <button type="button" className="calendar-selection-clear" onClick={selection.clearPicked}>
                {t('calendar.selection.clear')}
              </button>
            </div>
          )}

          <div className="calendar-grid">
            {/* Weekday labels from the first visible week: always Monday to Sunday. */}
            {weeks[0].map((day) => (
              <div key={toIsoDate(day)} className="calendar-weekday">
                {fmt.weekdayShort(day)}
              </div>
            ))}
            <div className="calendar-weekday calendar-weekday-total">{t('calendar.week')}</div>

            {weeks.map((week) => {
              const weekMinutes = sumWorkedMinutes(week, workDaysByDate)

              return [
                ...week.map((day) => {
                  const isoDate = toIsoDate(day)
                  const workDay = workDaysByDate.get(isoDate)
                  const classes = [
                    'calendar-day',
                    isWeekend(day) && 'is-weekend',
                    workDay && `level-${workLevel(workDay.durationMinutes)}`,
                    isToday(day) && 'is-today',
                    !isSameMonth(day, month) && 'is-outside',
                    selection.selected.has(isoDate) && 'is-selected',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <Link
                      key={isoDate}
                      to={`/saisie?date=${isoDate}`}
                      className={classes}
                      aria-label={t('calendar.dayLink', { date: fmt.dayMonth(day) })}
                      {...selection.dayProps(isoDate)}
                    >
                      <span className="calendar-day-number">{day.getDate()}</span>

                      {workDay?.mode === 'SLOTS' && workDay.shifts.length > 0 && (
                        <ul className="calendar-day-shifts">
                          {workDay.shifts.map((shift) => (
                            <li key={shift.id}>{fmt.shiftRange(shift.startTime, shift.endTime)}</li>
                          ))}
                        </ul>
                      )}

                      {workDay && <span className="calendar-day-hours">{fmt.duration(workDay.durationMinutes)}</span>}
                    </Link>
                  )
                }),
                <div
                  key={`total-${toIsoDate(week[0])}`}
                  className={['calendar-week-total', weekMinutes === 0 && 'is-empty'].filter(Boolean).join(' ')}
                >
                  {weekMinutes > 0 ? fmt.duration(weekMinutes) : '–'}
                </div>,
              ]
            })}
          </div>

          <div className="calendar-footer">
            <ul className="calendar-legend" aria-label={t('calendar.legend.label')}>
              <li>
                <span className="calendar-swatch level-1" /> {t('calendar.legend.short')}
              </li>
              <li>
                <span className="calendar-swatch level-2" /> {t('calendar.legend.regular')}
              </li>
              <li>
                <span className="calendar-swatch level-3" /> {t('calendar.legend.full')}
              </li>
            </ul>

            {selection.picked.length === 0 && (
              <div className="calendar-hint" role="note">
                <svg className="calendar-hint-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 3l14 7-6 2-2 6z" />
                </svg>
                <span className="calendar-hint-title">{t('calendar.hint.title')}</span>
                <span className="calendar-hint-step">
                  <kbd>{t('calendar.hint.drag')}</kbd> {t('calendar.hint.dragDetail')}
                </span>
                <span className="calendar-hint-or">{t('calendar.hint.or')}</span>
                <span className="calendar-hint-step">
                  <kbd>{t('calendar.hint.shift')}</kbd> + <kbd>{t('calendar.hint.click')}</kbd>
                </span>
                <span className="calendar-hint-or">{t('calendar.hint.then')}</span>
                <span className="calendar-hint-step">
                  <strong>{t('calendar.selection.go', { count: 2 })}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <dl className="calendar-stats">
          <div className="calendar-stat">
            <dt>{t('calendar.stats.hours')}</dt>
            <dd>{fmt.duration(stats.minutes)}</dd>
          </div>
          <div className="calendar-stat">
            <dt>{t('calendar.stats.workedDays')}</dt>
            <dd>{stats.workedDays}</dd>
          </div>
          <div className="calendar-stat">
            <dt>{t('calendar.stats.average')}</dt>
            <dd>{stats.workedDays > 0 ? fmt.duration(stats.averageMinutes) : '–'}</dd>
          </div>
          <div className="calendar-stat calendar-stat-highlight">
            <dt>{t('calendar.stats.pay')}</dt>
            <dd>
              {fmt.money(stats.pay.grossCents)}
              {stats.rateSpans.length > 0 ? (
                <ul className="calendar-stat-rates">
                  {stats.rateSpans.map((span) => (
                    <li key={span.from}>
                      <span>{rateSpanLabel(span.from, span.to)}</span>
                      <span>{t('calendar.stats.perHour', { amount: fmt.money(span.amountCents) })}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="calendar-stat-note">{t('calendar.stats.noRate')}</span>
              )}
              {stats.pay.unpricedDays > 0 && (
                <span className="calendar-stat-note">
                  {t('calendar.stats.unpricedDays', { count: stats.pay.unpricedDays })}
                </span>
              )}
              <Link to="/reglages" className="calendar-stat-action">
                {t('calendar.stats.manageRates')}
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
