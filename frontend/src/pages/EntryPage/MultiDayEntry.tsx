import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { WorkDayForm } from '../../components/WorkDayForm/WorkDayForm'
import { evictWorkDays } from '../../graphql/cache'
import {
  SaveWorkDaysDocument,
  WorkDaysRangeDocument,
  type SaveWorkDayInput,
} from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { toMonthParam } from '../../lib/calendar'
import { BackToCalendarLink } from './BackToCalendarLink'

type Feedback = { kind: 'success' } | { kind: 'error' }

interface MultiDayEntryProps {
  /** Sorted, unique ISO dates; at least two. */
  dates: string[]
}

export function MultiDayEntry({ dates }: MultiDayEntryProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const { data, loading, error } = useQuery(WorkDaysRangeDocument, {
    variables: { from: dates[0], to: dates[dates.length - 1] },
  })
  const [saveWorkDays, { loading: saving }] = useMutation(SaveWorkDaysDocument)

  const userId = data?.me?.id
  const monthUrl = `/calendrier?mois=${toMonthParam(parseISO(dates[0]))}`

  // Selected days that already have hours: they will be replaced.
  const filled = useMemo(() => {
    const selected = new Set(dates)
    return new Set((data?.me?.workDays ?? []).map((day) => day.date).filter((date) => selected.has(date)))
  }, [data, dates])

  async function handleSave(values: Omit<SaveWorkDayInput, 'date'>) {
    if (!userId) return

    try {
      await saveWorkDays({
        variables: { dates, hours: values },
        update: (cache) => evictWorkDays(cache, userId),
      })
      setFeedback({ kind: 'success' })
    } catch {
      setFeedback({ kind: 'error' })
    }
  }

  return (
    <div className="entry">
      <BackToCalendarLink date={dates[0]} />

      <section className="entry-card">
        <header className="entry-multi-header">
          <h2>{t('entry.multi.title', { count: dates.length })}</h2>
        </header>

        <ul className="entry-days">
          {dates.map((date) => (
            <li key={date} className={filled.has(date) ? 'is-filled' : ''}>
              {fmt.shortDate(parseISO(date))}
            </li>
          ))}
        </ul>

        {filled.size > 0 && (
          <p className="entry-feedback is-warning">{t('entry.multi.filledWarning', { count: filled.size })}</p>
        )}

        {feedback?.kind === 'success' && (
          <p className="entry-feedback is-success">
            {t('entry.multi.saved', { count: dates.length })} <Link to={monthUrl}>{t('entry.viewMonth')}</Link>
          </p>
        )}

        {feedback?.kind === 'error' && <p className="entry-feedback is-error">{t('entry.multi.saveFailed')}</p>}

        {error ? (
          <p className="form-error">{t('entry.multi.loadError')}</p>
        ) : loading && !data ? (
          <p>{t('status.loading')}</p>
        ) : (
          <WorkDayForm
            key={dates.join(',')}
            workDay={null}
            templates={data?.me?.entryTemplates ?? []}
            saving={saving}
            deleting={false}
            onSave={handleSave}
            onDelete={() => {}}
          />
        )}
      </section>
    </div>
  )
}