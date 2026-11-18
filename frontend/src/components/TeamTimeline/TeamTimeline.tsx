import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TeamWorkDayFragment } from '../../graphql/__generated__/graphql'
import { formatShiftRange } from '../../lib/calendar'
import { initials, type TeamMember } from '../../lib/people'
import { formatMinutes, presenceByHour, timeToMinutes, timelinePosition, timelineRange } from '../../lib/teamPlanning'
import './TeamTimeline.css'
import { ArrowRight } from 'lucide-react'

interface TeamTimelineProps {
  members: readonly TeamMember[]
  workDays: readonly TeamWorkDayFragment[]
  /** Minutes since midnight when the day shown is today, to draw the current time. */
  nowMinutes: number | null
  userHref: (userId: string) => string
}

/** One day of the team: one row per person, hours across, a bar per shift (US-30). */
export function TeamTimeline({ members, workDays, nowMinutes, userHref }: TeamTimelineProps) {
  const { t } = useTranslation()

  const range = timelineRange(workDays)
  const hours = Array.from({ length: range.end - range.start }, (_, index) => range.start + index)
  const presence = presenceByHour(workDays, range)
  const busiest = Math.max(1, ...presence)
  const dayByUser = new Map(workDays.map((day) => [day.userId, day]))
  const trackStyle = { '--hours': hours.length } as CSSProperties

  const showNow = nowMinutes !== null && nowMinutes >= range.start * 60 && nowMinutes <= range.end * 60
  const nowLine = showNow ? (
    <span
      className="tt-now"
      style={{ insetInlineStart: `${timelinePosition(nowMinutes, range)}%` }}
      aria-hidden="true"
    />
  ) : null

  return (
    <div className="tt-scroll">
      <div className="tt">
        <div className="tt-row tt-scale" aria-hidden="true">
          <span />
          <div className="tt-track">
            {hours
              .filter((hour) => hour % 2 === 0)
              .map((hour) => (
                <span
                  key={hour}
                  className="tt-hour"
                  style={{ insetInlineStart: `${timelinePosition(hour * 60, range)}%` }}
                >
                  {formatMinutes(hour * 60)}
                </span>
              ))}
          </div>
        </div>

        <div className="tt-row">
          <span className="tt-label tt-label-muted">{t('admin.planning.present')}</span>
          <div className="tt-track tt-presence" style={trackStyle}>
            {presence.map((count, index) => (
              <span
                key={hours[index]}
                className="tt-presence-cell"
                style={{ '--level': count / busiest } as CSSProperties}
              >
                {count > 0 ? count : ''}
              </span>
            ))}
            {nowLine}
          </div>
        </div>

        {members.map((member) => {
          const day = dayByUser.get(member.id)

          return (
            <div key={member.id} className={`tt-row person-${member.colorSlot}`}>
              {member.isAdmin ? (
                <span className={day ? 'tt-label' : 'tt-label tt-label-muted'}>
                  <span className="person-dot" aria-hidden="true">
                    {initials(member.name)}
                  </span>
                  <span className="tt-name">{member.name}</span>
                </span>
              ) : (
                <Link
                  to={userHref(member.id)}
                  className={day ? 'tt-label tt-label-link' : 'tt-label tt-label-muted tt-label-link'}
                  title={t('admin.planning.openUser', { name: member.name })}
                >
                  <span className="person-dot" aria-hidden="true">
                    {initials(member.name)}
                  </span>
                  <span className="tt-name">{member.name}</span>
                  <ArrowRight size={14} className="tt-label-go" aria-hidden="true" />
                </Link>
              )}

              <div className="tt-track" style={trackStyle}>
                {day?.mode === 'DURATION' && (
                  <span className="tt-undated">
                    {t('admin.planning.undated', { duration: formatMinutes(day.durationMinutes) })}
                  </span>
                )}

                {day?.mode === 'SLOTS' &&
                  day.shifts.map((shift) => {
                    const start = timelinePosition(timeToMinutes(shift.startTime), range)
                    const end = timelinePosition(timeToMinutes(shift.endTime), range)
                    const label = formatShiftRange(shift.startTime, shift.endTime)

                    return (
                      <span
                        key={shift.id}
                        className="tt-bar"
                        style={{ insetInlineStart: `${start}%`, inlineSize: `${end - start}%` }}
                        title={`${member.name}, ${label}`}
                      >
                        {label}
                      </span>
                    )
                  })}

                {nowLine}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
