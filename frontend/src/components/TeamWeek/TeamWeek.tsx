import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { isWeekend, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import type { TeamWorkDayFragment } from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { initials, type TeamMember } from '../../lib/people'
import { daySummary, timeToMinutes, timelinePosition, timelineRange } from '../../lib/teamPlanning'
import './TeamWeek.css'

interface TeamWeekProps {
  members: readonly TeamMember[]
  workDays: readonly TeamWorkDayFragment[]
  /** The seven ISO dates shown, Monday to Sunday. */
  days: readonly string[]
  today: string
  onOpenDay: (date: string) => void
  /** Link to a person's page, built by the page that knows the view and date shown. */
  userHref: (userId: string) => string
}

/** One week of the team: one row per person, one column per day (US-31). */
export function TeamWeek({ members, workDays, days, today, onOpenDay, userHref }: TeamWeekProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()

  // One scale for the whole week, so the cells can be compared at a glance.
  const range = timelineRange(workDays)
  const dayByPersonAndDate = new Map(workDays.map((day) => [`${day.userId}|${day.date}`, day]))
  const presentByDay = days.map(
    (day) => new Set(workDays.filter((workDay) => workDay.date === day).map((workDay) => workDay.userId)).size,
  )

  function columnClass(day: string): string {
    return [day === today && 'tw-today', isWeekend(parseISO(day)) && 'tw-weekend'].filter(Boolean).join(' ')
  }

  return (
    <div className="tw-scroll">
      <div className="tw">
        <div className="tw-row tw-head">
          <span />
          {days.map((day) => {
            const date = parseISO(day)

            return (
              <button
                key={day}
                type="button"
                className={`tw-day ${columnClass(day)}`}
                onClick={() => onOpenDay(day)}
                aria-label={t('admin.planning.openDay', { date: fmt.fullDate(date) })}
              >
                <span className="tw-weekday">{fmt.weekdayShort(date)}</span>
                <span className="tw-date">{fmt.dayMonth(date)}</span>
              </button>
            )
          })}
        </div>

        {members.map((member) => {
          const label = (
            <>
              <span className="person-dot" aria-hidden="true">
                {initials(member.name)}
              </span>
              <span className="tw-name">{member.name}</span>
            </>
          )

          return (
            <div key={member.id} className={`tw-row person-${member.colorSlot}`}>
              {/* Admins have no user page to open (RG-12). */}
              {member.isAdmin ? (
                <span className="tw-label">{label}</span>
              ) : (
                <Link
                  to={userHref(member.id)}
                  className="tw-label tw-label-link"
                  title={t('admin.planning.openUser', { name: member.name })}
                >
                  {label}
                  <ArrowRight size={14} className="tw-label-go" aria-hidden="true" />
                </Link>
              )}

              {days.map((day) => {
                const workDay = dayByPersonAndDate.get(`${member.id}|${day}`)

                if (!workDay) {
                  return <span key={day} className={`tw-cell ${columnClass(day)}`} />
                }

                const summary = daySummary(workDay, fmt)
                const undated = workDay.mode === 'DURATION'

                return (
                  <button
                    key={day}
                    type="button"
                    className={`tw-cell tw-cell-filled ${columnClass(day)}`}
                    onClick={() => onOpenDay(day)}
                    title={`${member.name}, ${summary}`}
                    aria-label={`${member.name}, ${fmt.fullDate(parseISO(day))}, ${summary}`}
                  >
                    {!undated && (
                      <span className="tw-mini" aria-hidden="true">
                        {workDay.shifts.map((shift) => {
                          const start = timelinePosition(timeToMinutes(shift.startTime), range)
                          const end = timelinePosition(timeToMinutes(shift.endTime), range)

                          return (
                            <span
                              key={shift.id}
                              className="tw-mini-bar"
                              style={{ insetInlineStart: `${start}%`, inlineSize: `${end - start}%` }}
                            />
                          )
                        })}
                      </span>
                    )}
                    <span className={undated ? 'tw-summary tw-summary-undated' : 'tw-summary'}>{summary}</span>
                  </button>
                )
              })}
            </div>
          )
        })}

        <div className="tw-row tw-foot">
          <span className="tw-label tw-label-muted">{t('admin.planning.present')}</span>
          {days.map((day, index) => (
            <span key={day} className={`tw-count ${columnClass(day)}`}>
              {presentByDay[index]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
