import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'
import { addDays, format, parseISO, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { WorkDayForm } from '../../components/WorkDayForm/WorkDayForm'
import {
  DELETE_WORK_DAY_MUTATION,
  SAVE_WORK_DAY_MUTATION,
  WORK_DAY_QUERY,
  evictWorkDays,
  type SaveWorkDayInput,
} from '../../graphql/planning'
import { formatLongDate, parseDateParam, toIsoDate, toMonthParam } from '../../lib/calendar'
import './EntryPage.css'

type Feedback = { kind: 'success' | 'error'; message: string }

export function EntryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = parseDateParam(searchParams.get('date'))
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const { data, loading, error } = useQuery(WORK_DAY_QUERY, { variables: { date } })
  const [saveWorkDay, { loading: saving }] = useMutation(SAVE_WORK_DAY_MUTATION)
  const [deleteWorkDay, { loading: deleting }] = useMutation(DELETE_WORK_DAY_MUTATION)

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
      setFeedback({ kind: 'success', message: 'Journée enregistrée.' })
    } catch {
      setFeedback({ kind: 'error', message: "L'enregistrement a échoué. Vérifie la saisie et réessaie." })
    }
  }

  async function handleDelete() {
    if (!userId || !workDay) return

    try {
      await deleteWorkDay({
        variables: { id: workDay.id },
        update: (cache) => evictWorkDays(cache, userId),
      })
      setFeedback({ kind: 'success', message: 'Journée supprimée.' })
    } catch {
      setFeedback({ kind: 'error', message: 'La suppression a échoué. Réessaie dans un instant.' })
    }
  }

  const day = parseISO(date)

  return (
    <div className="entry">
      <section className="entry-card">
        <header className="entry-header">
          <button type="button" className="entry-arrow" aria-label="Jour précédent" onClick={() => goTo(toIsoDate(subDays(day, 1)))}>
            ‹
          </button>

          <div className="entry-title">
            <h2>
              {format(day, 'EEEE', { locale: fr })} {formatLongDate(date)}
            </h2>
            <input
              type="date"
              aria-label="Choisir une date"
              value={date}
              onChange={(event) => event.target.value && goTo(event.target.value)}
            />
          </div>

          <button type="button" className="entry-arrow" aria-label="Jour suivant" onClick={() => goTo(toIsoDate(addDays(day, 1)))}>
            ›
          </button>
        </header>

        {feedback && (
          <p className={`entry-feedback is-${feedback.kind}`}>
            {feedback.message}{' '}
            {feedback.kind === 'success' && (
              <Link to={`/calendrier?mois=${toMonthParam(day)}`}>Voir le mois</Link>
            )}
          </p>
        )}

        {error ? (
          <p className="form-error">Impossible de charger cette journée.</p>
        ) : loading && !data ? (
          <p>Chargement…</p>
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