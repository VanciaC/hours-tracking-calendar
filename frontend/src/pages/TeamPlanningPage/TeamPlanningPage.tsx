import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { addDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TeamLegend } from '../../components/TeamLegend/TeamLegend'
import { TeamTimeline } from '../../components/TeamTimeline/TeamTimeline'
import { useNowMinutes } from '../../components/TeamTimeline/useNowMinutes'
import { TeamScheduleDocument } from '../../graphql/__generated__/graphql'
import { parseDateParam, toIsoDate } from '../../lib/calendar'
import { toTeamMembers } from '../../lib/people'
import './TeamPlanningPage.css'

/** Admin team schedule. Day view for now; week and month views come next (US-30 to US-32). */
export function TeamPlanningPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = parseDateParam(searchParams.get('date'))
  const today = toIsoDate(new Date())
  const nowMinutes = useNowMinutes()
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())

  const { data, loading, error } = useQuery(TeamScheduleDocument, {
    variables: { from: date, to: date },
  })

  const members = useMemo(() => toTeamMembers(data?.teamMembers ?? []), [data])
  const visibleMembers = members.filter((member) => !hidden.has(member.id))

  function goTo(next: string) {
    // Today keeps a clean URL: /admin/planning
    setSearchParams(next === today ? {} : { date: next })
  }

  function move(days: number) {
    goTo(toIsoDate(addDays(parseISO(date), days)))
  }

  function toggle(id: string) {
    setHidden((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const heading = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseISO(date))

  return (
    <section className="team-planning">
      <header className="team-planning-header">
        <h1>{t('admin.planning.title')}</h1>

        <div className="team-planning-nav">
          <button
            type="button"
            className="team-planning-arrow"
            onClick={() => move(-1)}
            aria-label={t('admin.planning.previousDay')}
            title={t('admin.planning.previousDay')}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className="team-planning-date">{heading}</span>
          <button
            type="button"
            className="team-planning-arrow"
            onClick={() => move(1)}
            aria-label={t('admin.planning.nextDay')}
            title={t('admin.planning.nextDay')}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="team-planning-today" onClick={() => goTo(today)} disabled={date === today}>
            {t('admin.planning.today')}
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error.message}</p>}
      {loading && !data && <p>{t('status.loading')}</p>}

      {data && (
        <>
          <TeamLegend members={members} hidden={hidden} onToggle={toggle} />
          {data.teamWorkDays.length === 0 && <p className="team-planning-empty">{t('admin.planning.empty')}</p>}
          <TeamTimeline
            members={visibleMembers}
            workDays={data.teamWorkDays}
            nowMinutes={date === today ? nowMinutes : null}
          />
        </>
      )}
    </section>
  )
}
