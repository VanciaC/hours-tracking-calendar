import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { addDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TeamLegend } from '../../components/TeamLegend/TeamLegend'
import { TeamTimeline } from '../../components/TeamTimeline/TeamTimeline'
import { useNowMinutes } from '../../components/TeamTimeline/useNowMinutes'
import { TeamWeek } from '../../components/TeamWeek/TeamWeek'
import { TeamScheduleDocument } from '../../graphql/__generated__/graphql'
import { parseDateParam, toIsoDate } from '../../lib/calendar'
import { toTeamMembers } from '../../lib/people'
import { weekOf } from '../../lib/teamPlanning'
import './TeamPlanningPage.css'

/** Values of the ?vue= URL parameter. The day view is the default and keeps a clean URL. */
type PlanningView = 'jour' | 'semaine'

const STEP_DAYS: Record<PlanningView, number> = { jour: 1, semaine: 7 }

/** Admin team schedule, by day or by week (US-30, US-31). */
export function TeamPlanningPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const view: PlanningView = searchParams.get('vue') === 'semaine' ? 'semaine' : 'jour'
  const date = parseDateParam(searchParams.get('date'))
  const today = toIsoDate(new Date())
  const nowMinutes = useNowMinutes()
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())

  const days = useMemo(() => (view === 'semaine' ? weekOf(date) : [date]), [view, date])
  const from = days[0] ?? date
  const to = days.at(-1) ?? date

  const { data, loading, error } = useQuery(TeamScheduleDocument, { variables: { from, to } })

  const members = useMemo(() => toTeamMembers(data?.teamMembers ?? []), [data])
  const visibleMembers = members.filter((member) => !hidden.has(member.id))

  function show(nextView: PlanningView, nextDate: string) {
    const params: Record<string, string> = {}
    if (nextView !== 'jour') params.vue = nextView
    if (nextDate !== today) params.date = nextDate
    setSearchParams(params)
  }

  function move(direction: 1 | -1) {
    show(view, toIsoDate(addDays(parseISO(date), direction * STEP_DAYS[view])))
  }

  function toggle(id: string) {
    setHidden((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const heading =
    view === 'jour'
      ? new Intl.DateTimeFormat(i18n.language, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(parseISO(date))
      : new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).formatRange(
          parseISO(from),
          parseISO(to),
        )

  const previousLabel = view === 'jour' ? t('admin.planning.previousDay') : t('admin.planning.previousWeek')
  const nextLabel = view === 'jour' ? t('admin.planning.nextDay') : t('admin.planning.nextWeek')

  return (
    <section className="team-planning">
      <header className="team-planning-header">
        <h1>{t('admin.planning.title')}</h1>

        <div className="team-planning-views" role="group" aria-label={t('admin.planning.views.label')}>
          <button type="button" aria-pressed={view === 'jour'} onClick={() => show('jour', date)}>
            {t('admin.planning.views.day')}
          </button>
          <button type="button" aria-pressed={view === 'semaine'} onClick={() => show('semaine', date)}>
            {t('admin.planning.views.week')}
          </button>
        </div>

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
            disabled={days.includes(today)}
          >
            {t('admin.planning.today')}
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error.message}</p>}
      {loading && !data && <p>{t('status.loading')}</p>}

      {data && (
        <>
          <TeamLegend members={members} hidden={hidden} onToggle={toggle} />

          {data.teamWorkDays.length === 0 && (
            <p className="team-planning-empty">
              {view === 'jour' ? t('admin.planning.empty') : t('admin.planning.emptyWeek')}
            </p>
          )}

          {view === 'jour' ? (
            <TeamTimeline
              members={visibleMembers}
              workDays={data.teamWorkDays}
              nowMinutes={date === today ? nowMinutes : null}
            />
          ) : (
            <TeamWeek
              members={visibleMembers}
              workDays={data.teamWorkDays}
              days={days}
              today={today}
              onOpenDay={(day) => show('jour', day)}
            />
          )}
        </>
      )}
    </section>
  )
}
