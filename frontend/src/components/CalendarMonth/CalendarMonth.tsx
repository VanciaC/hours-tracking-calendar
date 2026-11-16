import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { endOfMonth, format, isSameMonth, isToday, isWeekend, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CALENDAR_QUERY, type CalendarWorkDay } from '../../graphql/calendar'
import {
  formatDayRange,
  formatDuration,
  sumWorkedMinutes,
  toIsoDate,
  visibleRange,
  visibleWeeks,
  workLevel,
} from '../../lib/calendar'
import './CalendarMonth.css'
import { estimateGrossPay, formatCents, rateSpansBetween } from '../../lib/pay'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface CalendarMonthProps {
  /** Any date within the month to display. */
  month: Date
}

export function CalendarMonth({ month }: CalendarMonthProps) {
  const { from, to } = visibleRange(month)

  const { data, loading, error } = useQuery(CALENDAR_QUERY, {
    variables: { from: toIsoDate(from), to: toIsoDate(to) },
  })

  // Index work days by ISO date for an O(1) lookup per cell.
  const workDaysByDate = useMemo(() => {
    const map = new Map<string, CalendarWorkDay>()
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
      rateSpans: rateSpansBetween(
        toIsoDate(startOfMonth(month)),
        toIsoDate(endOfMonth(month)),
        hourlyRates,
      ),
    }
  }, [weeks, month, workDaysByDate, data])

  if (error) {
    return <p className="calendar-error">Impossible de charger le calendrier.</p>
  }

  return (
    <section className="calendar" aria-busy={loading}>
      <header className="calendar-header">
        <h2 className="calendar-title">{format(month, 'MMMM yyyy', { locale: fr })}</h2>
      </header>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}
        <div className="calendar-weekday calendar-weekday-total">Semaine</div>

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
              ].filter(Boolean).join(' ')

              return (
                <div key={isoDate} className={classes}>
                  <span className="calendar-day-number">{format(day, 'd')}</span>
                  {workDay && (
                    <span className="calendar-day-hours">{formatDuration(workDay.durationMinutes)}</span>
                  )}
                </div>
              )
            }),
            <div
              key={`total-${toIsoDate(week[0])}`}
              className={['calendar-week-total', weekMinutes === 0 && 'is-empty'].filter(Boolean).join(' ')}
            >
              {weekMinutes > 0 ? formatDuration(weekMinutes) : '–'}
            </div>,
          ]
        })}
      </div>

      <ul className="calendar-legend" aria-label="Légende">
        <li><span className="swatch level-1" /> moins de 4h</li>
        <li><span className="swatch level-2" /> 4h à 7h</li>
        <li><span className="swatch level-3" /> 7h et plus</li>
      </ul>

      <dl className="calendar-stats">
        <div className="calendar-stat">
          <dt>Heures du mois</dt>
          <dd>{formatDuration(stats.minutes)}</dd>
        </div>
        <div className="calendar-stat">
          <dt>Jours travaillés</dt>
          <dd>{stats.workedDays}</dd>
        </div>
        <div className="calendar-stat">
          <dt>Moyenne par jour</dt>
          <dd>{stats.workedDays > 0 ? formatDuration(stats.averageMinutes) : '–'}</dd>
        </div>
        <div className="calendar-stat calendar-stat-highlight">
          <dt>Salaire brut estimé</dt>
          <dd>
            {formatCents(stats.pay.grossCents)}
            {stats.rateSpans.length > 0 ? (
              <ul className="calendar-stat-rates">
                {stats.rateSpans.map((span) => (
                  <li key={span.from}>
                    <span>{formatDayRange(span.from, span.to)}</span>
                    <span>{formatCents(span.amountCents)}/h</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="calendar-stat-note">Aucun taux horaire défini</span>
            )}
            {stats.pay.unpricedDays > 0 && (
              <span className="calendar-stat-note">
                {stats.pay.unpricedDays} jour(s) sans taux horaire, non compté(s)
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}