import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { addDays, parseISO, subDays } from 'date-fns'
import { WorkDayForm } from '../../components/WorkDayForm/WorkDayForm'
import { evictWorkDays } from '../../graphql/cache'
import {
  DeleteWorkDayDocument,
  SaveWorkDayDocument,
  WorkDayDocument,
  type SaveWorkDayInput,
} from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { parseDateParam, toIsoDate, toMonthParam } from '../../lib/calendar'
import { parseDatesParam } from '../../lib/workDay'
import { BackToCalendarLink } from './BackToCalendarLink'
import { MultiDayEntry } from './MultiDayEntry'
import './EntryPage.css'

type Feedback = { kind: 'success'; message: 'entry.saved' | 'entry.deleted' } | { kind: 'error'; message: 'entry.saveFailed' | 'entry.deleteFailed' }

function SingleDayEntry() {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = parseDateParam(searchParams.get('date'))
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const { data, loading, error } = useQuery(WorkDayDocument, { variables: { date } })
  const [saveWorkDay, { loading: saving }] = useMutation(SaveWorkDayDocument)
  const [deleteWorkDay, { loading: deleting }] = useMutation(DeleteWorkDayDocument)

  const userId = data?.me?.id
  const workDay = data?.me?.workDays[0] ?? null

  function goTo(nextDate: string) {
    setFeedback(null)
    // Today keeps a clean URL: /saisie
    setSearchParams(nextDate === toIsoDate(new Date()) ? {} : { date: nextDate })
  }

  async function handleSave(values: Omit<SaveWorkDayInput, 'date'>) {
    if (!userId) return

    try {
      await saveWorkDay({
        variables: { input: { date, ...values } },
        update: (cache) => evictWorkDays(cache, userId),
      })
      setFeedback({ kind: 'success', message: 'entry.saved' })
    } catch {
      setFeedback({ kind: 'error', message: 'entry.saveFailed' })
    }
  }

  async function handleDelete() {
    if (!userId || !workDay) return

    try {
      await deleteWorkDay({
        variables: { id: workDay.id },
        update: (cache) => evictWorkDays(cache, userId),
      })
      setFeedback({ kind: 'success', message: 'entry.deleted' })
    } catch {
      setFeedback({ kind: 'error', message: 'entry.deleteFailed' })
    }
  }

  const day = parseISO(date)

  return (
    <div className="entry">
      <BackToCalendarLink date={date} />

      <section className="entry-card">
        <header className="entry-header">
          <button
            type="button"
            className="entry-arrow"
            aria-label={t('entry.previousDay')}
            onClick={() => goTo(toIsoDate(subDays(day, 1)))}
          >
            ‹
          </button>

          <div className="entry-title">
            <h2>{fmt.fullDate(day)}</h2>
            <input
              type="date"
              aria-label={t('entry.pickDate')}
              value={date}
              onChange={(event) => event.target.value && goTo(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="entry-arrow"
            aria-label={t('entry.nextDay')}
            onClick={() => goTo(toIsoDate(addDays(day, 1)))}
          >
            ›
          </button>
        </header>

        {feedback && (
          <p className={`entry-feedback is-${feedback.kind}`}>
            {t(feedback.message)}{' '}
            {feedback.kind === 'success' && (
              <Link to={`/calendrier?mois=${toMonthParam(day)}`}>{t('entry.viewMonth')}</Link>
            )}
          </p>
        )}

        {error ? (
          <p className="form-error">{t('entry.loadError')}</p>
        ) : loading && !data ? (
          <p>{t('status.loading')}</p>
        ) : (
          <WorkDayForm
            // A new date or a newly created day remounts the form with fresh values.
            key={`${date}-${workDay?.id ?? 'new'}`}
            workDay={workDay}
            templates={data?.me?.entryTemplates ?? []}
            saving={saving}
            deleting={deleting}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  )
}

/** One day (?date=) or several days (?dates=), depending on the URL. */
export function EntryPage() {
  const [searchParams] = useSearchParams()
  const dates = parseDatesParam(searchParams.get('dates'))

  return dates.length > 1 ? <MultiDayEntry dates={dates} /> : <SingleDayEntry />
}