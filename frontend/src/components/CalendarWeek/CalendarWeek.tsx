import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { addDays, isWeekend, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import type { CalendarDataFragment, CalendarDayFragment } from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { toIsoDate } from '../../lib/calendar'
import { timeToMinutes, timelinePosition, timelineRange } from '../../lib/teamPlanning'
import { CalendarStats } from '../CalendarStats/CalendarStats'
import { useNowMinutes } from '../TeamTimeline/useNowMinutes'
import '../CalendarMonth/CalendarMonth.css'
import './CalendarWeek.css'

interface CalendarWeekProps {
  /** The ISO dates shown: Monday to Sunday for a week, or a single day. */
  days: readonly string[]
  /** Called with any date of the period to show next. */
  onDateChange: (date: string) => void
  /** Work days and hourly rates of the period, loaded by the page. */
  calendar: CalendarDataFragment | null | undefined
  loading: boolean
  error?: unknown
  /** Another user's calendar seen by an admin: rows are not links to the entry form. */
  readOnly?: boolean
  /** Shown in the header, between the title and the navigation (the view switch). */
  toolbar?: ReactNode
}

/**
 * A week (one row per day) or a single day, hours across, a bar per shift,
 * with the net total of each day (US-04, US-16, US-19).
 */
export function CalendarWeek({
  days,
  onDateChange,
  calendar,
  loading,
  error,
  readOnly = false,
  toolbar,
}: CalendarWeekProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const nowMinutes = useNowMinutes()
  const today = toIsoDate(new Date())
  const singleDay = days.length === 1
  const step = singleDay ? 1 : 7

  const workDaysByDate = useMemo(() => {
    const map = new Map<string, CalendarDayFragment>()
    for (const workDay of calendar?.workDays ?? []) {
      map.set(workDay.date, workDay)
    }
    return map
  }, [calendar])

  const periodWorkDays = days.flatMap((day) => workDaysByDate.get(day) ?? [])
  const periodMinutes = periodWorkDays.reduce((total, workDay) => total + workDay.durationMinutes, 0)

  const range = timelineRange(periodWorkDays)
  const hours = Array.from({ length: range.end - range.start }, (_, index) => range.start + index)
  const trackStyle = { '--hours': hours.length } as CSSProperties
  const first = parseISO(days[0] ?? today)
  const last = parseISO(days.at(-1) ?? today)
  const showNow = nowMinutes >= range.start * 60 && nowMinutes <= range.end * 60
  const note = singleDay ? periodWorkDays[0]?.note : null

  /** 30 -> "30 min", 90 -> "1h30": a break is usually under an hour. */
  function breakLabel(minutes: number): string {
    return minutes < 60 ? t('calendar.weekView.minutes', { minutes }) : fmt.duration(minutes)
  }

  if (error) {
    return <p className="calendar-error">{t('calendar.loadError')}</p>
  }

  return (
    <section className="calendar" aria-busy={loading}>
      <header className="calendar-header">
        <h2 className="calendar-title">{singleDay ? fmt.fullDate(first) : fmt.dateRange(first, last)}</h2>

        {toolbar}

        <div className="calendar-nav">
          <button
            type="button"
            className="calendar-nav-arrow"
            onClick={() => onDateChange(toIsoDate(addDays(first, -step)))}
            aria-label={singleDay ? t('calendar.dayView.previous') : t('calendar.weekView.previous')}
          >
            ‹
          </button>
          <button type="button" onClick={() => onDateChange(today)} disabled={days.includes(today)}>
            {t('calendar.today')}
          </button>
          <button
            type="button"
            className="calendar-nav-arrow"
            onClick={() => onDateChange(toIsoDate(addDays(first, step)))}
            aria-label={singleDay ? t('calendar.dayView.next') : t('calendar.weekView.next')}
          >
            ›
          </button>
        </div>
      </header>

      <div className="calendar-body">
        <div className="calendar-main">
          <div className="cw-scroll">
            <div className="cw-grid">
              <div className="cw-row cw-scale">
                <span />
                <div className="cw-track" aria-hidden="true">
                  {hours
                    .filter((hour) => hour % 2 === 0)
                    .map((hour) => (
                      <span
                        key={hour}
                        className="cw-hour"
                        style={{ insetInlineStart: `${timelinePosition(hour * 60, range)}%` }}
                      >
                        {t('time.hour', { hours: hour })}
                      </span>
                    ))}
                </div>
                <span className="cw-total-head" title={t('calendar.weekView.totalHint')}>
                  {t('calendar.weekView.total')}
                </span>
              </div>

              {days.map((day) => {
                const date = parseISO(day)
                const workDay = workDaysByDate.get(day)
                const breakMinutes = workDay?.shifts.reduce((total, shift) => total + shift.unpaidBreakMinutes, 0) ?? 0
                const classes = ['cw-row', day === today && 'is-today', isWeekend(date) && 'is-weekend']
                  .filter(Boolean)
                  .join(' ')

                const content = (
                  <>
                    <span className="cw-day">
                      <span>{fmt.weekdayShort(date)}</span>
                      <strong>{date.getDate()}</strong>
                    </span>

                    <div className="cw-track" style={trackStyle}>
                      {workDay?.mode === 'DURATION' && (
                        <span className="cw-undated">
                          {t('calendar.weekView.undated', { duration: fmt.duration(workDay.durationMinutes) })}
                        </span>
                      )}

                      {workDay?.mode === 'SLOTS' &&
                        workDay.shifts.map((shift) => {
                          const start = timelinePosition(timeToMinutes(shift.startTime), range)
                          const end = timelinePosition(timeToMinutes(shift.endTime), range)
                          const label = fmt.shiftRange(shift.startTime, shift.endTime)

                          return (
                            <span
                              key={shift.id}
                              className="cw-bar"
                              style={{ insetInlineStart: `${start}%`, inlineSize: `${end - start}%` }}
                              title={label}
                            >
                              {label}
                            </span>
                          )
                        })}

                      {/* Empty day: an invitation, shown on hover, that the row opens the entry form. */}
                      {!workDay && !readOnly && (
                        <span className="cw-add" aria-hidden="true">
                          <Plus size={14} />
                          {t('calendar.weekView.add')}
                        </span>
                      )}

                      {day === today && showNow && (
                        <span
                          className="cw-now"
                          style={{ insetInlineStart: `${timelinePosition(nowMinutes, range)}%` }}
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <span
                      className={workDay ? 'cw-total' : 'cw-total is-empty'}
                      title={workDay ? t('calendar.weekView.totalHint') : undefined}
                    >
                      {workDay ? (
                        <>
                          <strong>{fmt.duration(workDay.durationMinutes)}</strong>
                          {breakMinutes > 0 && (
                            <small>{t('calendar.weekView.break', { duration: breakLabel(breakMinutes) })}</small>
                          )}
                        </>
                      ) : (
                        '–'
                      )}
                    </span>
                  </>
                )

                return readOnly ? (
                  <div key={day} className={classes}>
                    {content}
                  </div>
                ) : (
                  <Link
                    key={day}
                    to={`/saisie?date=${day}`}
                    className={classes}
                    aria-label={t('calendar.weekView.dayLink', { date: fmt.fullDate(date) })}
                  >
                    {content}
                  </Link>
                )
              })}

              {/* A week total only makes sense with more than one day. */}
              {!singleDay && (
                <div className="cw-row cw-foot">
                  <span className="cw-foot-label">{t('calendar.weekView.weekTotal')}</span>
                  <span className="cw-total cw-week-total">
                    <strong>{fmt.duration(periodMinutes)}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {note && (
            <p className="cw-note">
              <strong>{t('calendar.dayView.note')}</strong> {note}
            </p>
          )}
        </div>

        <CalendarStats
          days={days}
          workDaysByDate={workDaysByDate}
          hourlyRates={calendar?.hourlyRates ?? []}
          period={singleDay ? 'day' : 'week'}
          readOnly={readOnly}
        />
      </div>
    </section>
  )
}
