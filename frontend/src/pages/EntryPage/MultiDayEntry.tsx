import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { WorkDayForm } from '../../components/WorkDayForm/WorkDayForm'
import { evictWorkDays } from '../../graphql/cache'
import {
  SaveWorkDaysDocument,
  WorkDaysRangeDocument,
  type SaveWorkDayInput,
} from '../../graphql/__generated__/graphql'
import { toMonthParam } from '../../lib/calendar'

type Feedback = { kind: 'success' | 'error'; message: string }

interface MultiDayEntryProps {
  /** Sorted, unique ISO dates; at least two. */
  dates: string[]
}

export function MultiDayEntry({ dates }: MultiDayEntryProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const { data, loading, error } = useQuery(WorkDaysRangeDocument, {
    variables: { from: dates[0], to: dates[dates.length - 1] },
  })
  const [saveWorkDays, { loading: saving }] = useMutation(SaveWorkDaysDocument)

  const userId = data?.me?.id

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
      setFeedback({ kind: 'success', message: `${dates.length} jours enregistrés.` })
    } catch {
      setFeedback({ kind: 'error', message: "L'enregistrement a échoué. Aucun jour n'a été modifié." })
    }
  }

  return (
    <div className="entry">
      <section className="entry-card">
        <header className="entry-multi-header">
          <h2>{dates.length} jours sélectionnés</h2>
          <Link to={`/calendrier?mois=${toMonthParam(parseISO(dates[0]))}`}>Changer la sélection</Link>
        </header>

        <ul className="entry-days">
          {dates.map((date) => (
            <li key={date} className={filled.has(date) ? 'is-filled' : ''}>
              {format(parseISO(date), 'EEE d MMM', { locale: fr })}
            </li>
          ))}
        </ul>

        {filled.size > 0 && (
          <p className="entry-feedback is-warning">
            {filled.size === 1 ? '1 de ces jours a' : `${filled.size} de ces jours ont`} déjà des heures
            (encadrés) : elles seront remplacées.
          </p>
        )}

        {feedback && (
          <p className={`entry-feedback is-${feedback.kind}`}>
            {feedback.message}{' '}
            {feedback.kind === 'success' && (
              <Link to={`/calendrier?mois=${toMonthParam(parseISO(dates[0]))}`}>Voir le mois</Link>
            )}
          </p>
        )}

        {error ? (
          <p className="form-error">Impossible de charger ces journées.</p>
        ) : loading && !data ? (
          <p>Chargement…</p>
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