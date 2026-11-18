import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { addDays, addMonths, parseISO } from 'date-fns'
import { CalendarClock, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { TeamFilter } from '../../components/TeamFilter/TeamFilter'
import { TeamMonth } from '../../components/TeamMonth/TeamMonth'
import { TeamTimeline } from '../../components/TeamTimeline/TeamTimeline'
import { useNowMinutes } from '../../components/TeamTimeline/useNowMinutes'
import { TeamWeek } from '../../components/TeamWeek/TeamWeek'
import { TeamScheduleDocument } from '../../graphql/__generated__/graphql'
import { parseDateParam, toIsoDate } from '../../lib/calendar'
import { toTeamMembers } from '../../lib/people'
import { parsePlanningView, rememberPlanningView, type PlanningView } from '../../lib/planningView'
import { monthGridOf, weekOf } from '../../lib/teamPlanning'
import './TeamPlanningPage.css'
import { useFormatters } from '../../i18n/useFormatters'

const VIEWS: readonly {
  view: PlanningView
  icon: LucideIcon
  label: 'admin.planning.views.day' | 'admin.planning.views.week' | 'admin.planning.views.month'
}[] = [
  { view: 'jour', icon: CalendarClock, label: 'admin.planning.views.day' },
  { view: 'semaine', icon: CalendarRange, label: 'admin.planning.views.week' },
  { view: 'mois', icon: CalendarDays, label: 'admin.planning.views.month' },
]

/** Admin team schedule, by day, week or month (US-30 to US-32). */
export function TeamPlanningPage() {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [searchParams, setSearchParams] = useSearchParams()
  // Coming back from another admin page, the URL has no view: the last one used is kept.
  const view = parsePlanningView(searchParams.get('vue'))
  const date = parseDateParam(searchParams.get('date'))
  const today = toIsoDate(new Date())
  const nowMinutes = useNowMinutes()
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())

  const weeks = useMemo(() => (view === 'mois' ? monthGridOf(date) : []), [view, date])
  const days = useMemo(() => {
    if (view === 'mois') return weeks.flat()
    return view === 'semaine' ? weekOf(date) : [date]
  }, [view, date, weeks])
  const from = days[0] ?? date
  const to = days.at(-1) ?? date

  const { data, loading, error } = useQuery(TeamScheduleDocument, { variables: { from, to } })

  const members = useMemo(() => toTeamMembers(data?.teamMembers ?? []), [data])
  const visibleMembers = members.filter((member) => !hidden.has(member.id))

  function show(nextView: PlanningView, nextDate: string) {
    // Remembered before the URL changes: an URL without ?vue= reads the memory.
    rememberPlanningView(nextView)

    const params: Record<string, string> = {}
    if (nextView !== 'jour') params.vue = nextView
    if (nextDate !== today) params.date = nextDate
    setSearchParams(params)
  }

  function move(direction: 1 | -1) {
    const current = parseISO(date)
    const next =
      view === 'mois' ? addMonths(current, direction) : addDays(current, direction * (view === 'semaine' ? 7 : 1))

    show(view, toIsoDate(next))
  }

  /** The person's page on the same day or week, in the same view, as the schedule shown. */
  function userHref(userId: string): string {
    const params = new URLSearchParams({ vue: view === 'semaine' ? 'semaine' : 'jour' })
    if (date !== today) params.set('date', date)

    return `/admin/utilisateurs/${userId}?${params.toString()}`
  }

  // In the month view, the grid also shows days of the neighbouring months: compare months instead.
  const showsToday = view === 'mois' ? date.slice(0, 7) === today.slice(0, 7) : days.includes(today)

  const heading =
    view === 'jour'
      ? fmt.fullDate(parseISO(date))
      : view === 'semaine'
        ? fmt.dateRange(parseISO(from), parseISO(to))
        : fmt.monthYear(parseISO(date))

  const labels = {
    jour: [t('admin.planning.previousDay'), t('admin.planning.nextDay'), t('admin.planning.empty')],
    semaine: [t('admin.planning.previousWeek'), t('admin.planning.nextWeek'), t('admin.planning.emptyWeek')],
    mois: [t('admin.planning.previousMonth'), t('admin.planning.nextMonth'), t('admin.planning.emptyMonth')],
  } as const
  const [previousLabel, nextLabel, emptyLabel] = labels[view]

  return (
    <section className="team-planning">
      <header className="team-planning-header">
        <div className="team-planning-top">
          <h1>{t('admin.planning.title')}</h1>

          <div className="team-planning-nav">
            <button
              type="button"
              className="team-planning-arrow"
              onClick={() => move(-1)}
              aria-label={previousLabel}
              title={previousLabel}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="team-planning-date">{heading}</span>
            <button
              type="button"
              className="team-planning-arrow"
              onClick={() => move(1)}
              aria-label={nextLabel}
              title={nextLabel}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="team-planning-today"
              onClick={() => show(view, today)}
              disabled={showsToday}
            >
              {t('admin.planning.today')}
            </button>
          </div>
        </div>

        <div className="team-planning-toolbar">
          <div className="team-planning-views" role="group" aria-label={t('admin.planning.views.label')}>
            {VIEWS.map(({ view: option, icon: Icon, label }) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => show(option, date)}>
                <Icon size={18} aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </div>

          <TeamFilter members={members} hidden={hidden} onChange={setHidden} />
        </div>
      </header>

      {error && <p className="form-error">{error.message}</p>}
      {loading && !data && <p>{t('status.loading')}</p>}

      {data && (
        <>
          {data.teamWorkDays.length === 0 && <p className="team-planning-empty">{emptyLabel}</p>}

          {view === 'jour' && (
            <TeamTimeline
              members={visibleMembers}
              workDays={data.teamWorkDays}
              nowMinutes={date === today ? nowMinutes : null}
              userHref={userHref}
            />
          )}
          {view === 'semaine' && (
            <TeamWeek
              members={visibleMembers}
              workDays={data.teamWorkDays}
              days={days}
              today={today}
              onOpenDay={(day) => show('jour', day)}
              userHref={userHref}
            />
          )}
          {view === 'mois' && (
            <TeamMonth
              members={visibleMembers}
              workDays={data.teamWorkDays}
              weeks={weeks}
              month={date}
              today={today}
              onOpenDay={(day) => show('jour', day)}
            />
          )}
        </>
      )}
    </section>
  )
}
