import { useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import type { HourlyRate } from '../../graphql/calendar'
import {
  DELETE_HOURLY_RATE_MUTATION,
  HOURLY_RATES_QUERY,
  SET_HOURLY_RATE_MUTATION,
  UPDATE_HOURLY_RATE_MUTATION,
  type HourlyRateInput,
} from '../../graphql/payroll'
import { formatLongDate } from '../../lib/calendar'
import { formatCents } from '../../lib/pay'
import { HourlyRateForm } from '../HourlyRateForm/HourlyRateForm'
import './HourlyRatesManager.css'

interface HourlyRatesManagerProps {
  rates: HourlyRate[]
  /** Pre-filled effective date for a new rate. */
  defaultDate: string
}

// Reloading the rates also refreshes the calendar: both read the same cached User.hourlyRates.
const REFRESH_RATES = { refetchQueries: [HOURLY_RATES_QUERY], awaitRefetchQueries: true }

export function HourlyRatesManager({ rates, defaultDate }: HourlyRatesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [newRateFormKey, setNewRateFormKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [setRate, { loading: creating }] = useMutation(SET_HOURLY_RATE_MUTATION, REFRESH_RATES)
  const [updateRate, { loading: updating }] = useMutation(UPDATE_HOURLY_RATE_MUTATION, REFRESH_RATES)
  const [deleteRate, { loading: deleting }] = useMutation(DELETE_HOURLY_RATE_MUTATION, REFRESH_RATES)

  const sortedRates = useMemo(
    () => [...rates].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)),
    [rates],
  )

  function isDateTaken(date: string, exceptId?: string): boolean {
    return rates.some((rate) => rate.effectiveFrom === date && rate.id !== exceptId)
  }

  /** Runs a mutation and turns any failure into a message. Returns whether it succeeded. */
  async function run(mutation: () => Promise<unknown>): Promise<boolean> {
    setError(null)

    try {
      await mutation()
      return true
    } catch {
      setError("L'opération a échoué. Réessaie dans un instant.")
      return false
    }
  }

  async function handleCreate(values: HourlyRateInput) {
    if (await run(() => setRate({ variables: values }))) {
      // A new key remounts the form, which empties it.
      setNewRateFormKey((key) => key + 1)
    }
  }

  async function handleUpdate(id: string, values: HourlyRateInput) {
    if (await run(() => updateRate({ variables: { id, ...values } }))) {
      setEditingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (await run(() => deleteRate({ variables: { id } }))) {
      setConfirmingDeleteId(null)
    }
  }

  return (
    <div className="rates-manager">
      <section>
        <h3>Nouveau taux</h3>
        <HourlyRateForm
          key={newRateFormKey}
          initialDate={defaultDate}
          submitLabel="Ajouter"
          busy={creating}
          isDateTaken={(date) => isDateTaken(date)}
          onSubmit={handleCreate}
        />
      </section>

      <section>
        <h3>Historique</h3>

        {sortedRates.length === 0 ? (
          <p className="rates-empty">Aucun taux enregistré pour l'instant.</p>
        ) : (
          <ul className="rates-list">
            {sortedRates.map((rate) => (
              <li key={rate.id} className={editingId === rate.id ? 'rates-item is-editing' : 'rates-item'}>
                {editingId === rate.id ? (
                  <HourlyRateForm
                    initialAmountCents={rate.amountCents}
                    initialDate={rate.effectiveFrom}
                    submitLabel="Enregistrer"
                    busy={updating}
                    isDateTaken={(date) => isDateTaken(date, rate.id)}
                    onSubmit={(values) => handleUpdate(rate.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="rates-item-info">
                      <strong>{formatCents(rate.amountCents)}/h</strong>
                      <span>à partir du {formatLongDate(rate.effectiveFrom)}</span>
                    </div>

                    <div className="rates-item-actions">
                      {confirmingDeleteId === rate.id ? (
                        <>
                          <button
                            type="button"
                            className="rates-button-danger"
                            disabled={deleting}
                            onClick={() => handleDelete(rate.id)}
                          >
                            {deleting ? 'Suppression…' : 'Confirmer'}
                          </button>
                          <button
                            type="button"
                            className="rates-button-secondary"
                            onClick={() => setConfirmingDeleteId(null)}
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="rates-button-secondary"
                            onClick={() => {
                              setEditingId(rate.id)
                              setConfirmingDeleteId(null)
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="rates-button-ghost-danger"
                            onClick={() => setConfirmingDeleteId(rate.id)}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="form-error">{error}</p>}
    </div>
  )
}