import { useTranslation } from 'react-i18next'
import { isWeekend, parseISO } from 'date-fns'
import type { TeamWorkDayFragment } from '../../graphql/__generated__/graphql'
import { initials, type TeamMember } from '../../lib/people'
import './TeamMonth.css'

/** Beyond this, a day shows "+N" instead of more dots, to stay readable on a phone. */
const MAX_DOTS = 8

interface TeamMonthProps {
  members: readonly TeamMember[]
  workDays: readonly TeamWorkDayFragment[]
  /** Full weeks of ISO dates, Monday to Sunday. */
  weeks: readonly (readonly string[])[]
  /** Any date of the month shown, YYYY-MM-DD. */
  month: string
  today: string
  onOpenDay: (date: string) => void
}

/** One month of the team: who works each day, without times (US-32). */
export function TeamMonth({ members, workDays, weeks, month, today, onOpenDay }: TeamMonthProps) {
  const { t, i18n } = useTranslation()

  const monthPrefix = month.slice(0, 7)
  const presentIds = new Map<string, Set<string>>()
  for (const workDay of workDays) {
    const ids = presentIds.get(workDay.date) ?? new Set<string>()
    ids.add(workDay.userId)
    presentIds.set(workDay.date, ids)
  }

  const weekdayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
  const longFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })
  const listFormat = new Intl.ListFormat(i18n.language, { type: 'conjunction' })

  return (
    <div className="tm">
      {(weeks[0] ?? []).map((day) => (
        <span key={day} className="tm-weekday" aria-hidden="true">
          {weekdayFormat.format(parseISO(day))}
        </span>
      ))}

      {weeks.flat().map((day) => {
        const date = parseISO(day)
        // Member order (by name), filtered by the legend.
        const present = members.filter((member) => presentIds.get(day)?.has(member.id))
        const label = present.length
          ? t('admin.planning.monthDayLabel', {
              date: longFormat.format(date),
              names: listFormat.format(present.map((member) => member.name)),
            })
          : longFormat.format(date)

        const classes = [
          'tm-cell',
          !day.startsWith(monthPrefix) && 'tm-outside',
          isWeekend(date) && 'tm-weekend',
          day === today && 'tm-today',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button key={day} type="button" className={classes} onClick={() => onOpenDay(day)} aria-label={label}>
            <span className="tm-number">{date.getDate()}</span>

            {present.length > 0 && (
              <>
                <span className="tm-dots" aria-hidden="true">
                  {present.slice(0, MAX_DOTS).map((member) => (
                    <span key={member.id} className={`tm-dot person-${member.colorSlot}`} title={member.name}>
                      {initials(member.name).charAt(0)}
                    </span>
                  ))}
                  {present.length > MAX_DOTS && <span className="tm-more">+{present.length - MAX_DOTS}</span>}
                </span>
                <span className="tm-count" aria-hidden="true">
                  {present.length}
                </span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
