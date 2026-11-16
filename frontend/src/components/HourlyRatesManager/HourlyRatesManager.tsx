import { useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import {
  DeleteHourlyRateDocument,
  HourlyRatesDocument,
  SetHourlyRateDocument,
  UpdateHourlyRateDocument,
  type HourlyRateFieldsFragment,
  type SetHourlyRateMutationVariables,
} from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { HourlyRateForm } from '../HourlyRateForm/HourlyRateForm'
import './HourlyRatesManager.css'

interface HourlyRatesManagerProps {
  rates: HourlyRateFieldsFragment[]
  /** Pre-filled effective date for a new rate. */
  defaultDate: string
}

// Reloading the rates also refreshes the calendar: both read the same cached User.hourlyRates.
const REFRESH_RATES = { refetchQueries: [HourlyRatesDocument], awaitRefetchQueries: true }

export function HourlyRatesManager({ rates, defaultDate }: HourlyRatesManagerProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [newRateFormKey, setNewRateFormKey] = useState(0)
  const [failed, setFailed] = useState(false)

  const [setRate, { loading: creating }] = useMutation(SetHourlyRateDocument, REFRESH_RATES)
  const [updateRate, { loading: updating }] = useMutation(UpdateHourlyRateDocument, REFRESH_RATES)
  const [deleteRate, { loading: deleting }] = useMutation(DeleteHourlyRateDocument, REFRESH_RATES)

  const sortedRates = useMemo(() => [...rates].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)), [rates])

  function isDateTaken(date: string, exceptId?: string): boolean {
    return rates.some((rate) => rate.effectiveFrom === date && rate.id !== exceptId)
  }

  /** Runs a mutation and records whether it failed. Returns whether it succeeded. */
  async function run(mutation: () => Promise<unknown>): Promise<boolean> {
    setFailed(false)

    try {
      await mutation()
      return true
    } catch {
      setFailed(true)
      return false
    }
  }

  async function handleCreate(values: SetHourlyRateMutationVariables) {
    if (await run(() => setRate({ variables: values }))) {
      // A new key remounts the form, which empties it.
      setNewRateFormKey((key) => key + 1)
    }
  }

  async function handleUpdate(id: string, values: SetHourlyRateMutationVariables) {
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
        <h3>{t('rates.newTitle')}</h3>
        <HourlyRateForm
          key={newRateFormKey}
          initialDate={defaultDate}
          submitLabel={t('rates.add')}
          busy={creating}
          isDateTaken={(date) => isDateTaken(date)}
          onSubmit={handleCreate}
        />
      </section>

      <section>
        <h3>{t('rates.history')}</h3>

        {sortedRates.length === 0 ? (
          <p className="rates-empty">{t('rates.empty')}</p>
        ) : (
          <ul className="rates-list">
            {sortedRates.map((rate) => (
              <li key={rate.id} className={editingId === rate.id ? 'rates-item is-editing' : 'rates-item'}>
                {editingId === rate.id ? (
                  <HourlyRateForm
                    initialAmountCents={rate.amountCents}
                    initialDate={rate.effectiveFrom}
                    submitLabel={t('common.save')}
                    busy={updating}
                    isDateTaken={(date) => isDateTaken(date, rate.id)}
                    onSubmit={(values) => handleUpdate(rate.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="rates-item-info">
                      <strong>{t('calendar.stats.perHour', { amount: fmt.money(rate.amountCents) })}</strong>
                      <span>{t('rates.fromDate', { date: fmt.longDate(parseISO(rate.effectiveFrom)) })}</span>
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
                            {deleting ? t('common.deleting') : t('common.confirm')}
                          </button>
                          <button
                            type="button"
                            className="rates-button-secondary"
                            onClick={() => setConfirmingDeleteId(null)}
                          >
                            {t('common.cancel')}
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
                            {t('common.edit')}
                          </button>
                          <button
                            type="button"
                            className="rates-button-ghost-danger"
                            onClick={() => setConfirmingDeleteId(rate.id)}
                          >
                            {t('common.delete')}
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

      {failed && <p className="form-error">{t('common.operationFailed')}</p>}
    </div>
  )
}
