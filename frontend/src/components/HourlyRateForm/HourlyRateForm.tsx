import { useState, type FormEvent } from 'react'
import type { HourlyRateInput } from '../../graphql/payroll'
import { centsToEurosInput, parseEurosToCents } from '../../lib/pay'
import './HourlyRateForm.css'

interface HourlyRateFormProps {
  initialAmountCents?: number
  /** ISO date, YYYY-MM-DD */
  initialDate: string
  submitLabel: string
  busy?: boolean
  /** Tells whether another rate already starts on that date. */
  isDateTaken?: (date: string) => boolean
  onSubmit: (values: HourlyRateInput) => void
  onCancel?: () => void
}

/** Amount + effective date form, shared by the creation and the edition of a rate. */
export function HourlyRateForm({
  initialAmountCents,
  initialDate,
  submitLabel,
  busy = false,
  isDateTaken,
  onSubmit,
  onCancel,
}: HourlyRateFormProps) {
  const [amount, setAmount] = useState(
    initialAmountCents !== undefined ? centsToEurosInput(initialAmountCents) : '',
  )
  const [date, setDate] = useState(initialDate)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amountCents = parseEurosToCents(amount)

    if (amountCents === null) {
      setError('Montant invalide, par exemple 12,80.')
      return
    }

    if (date === '') {
      setError('Choisis une date de début.')
      return
    }

    if (isDateTaken?.(date)) {
      setError('Un taux commence déjà à cette date. Modifie-le dans la liste.')
      return
    }

    setError(null)
    onSubmit({ amountCents, effectiveFrom: date })
  }

  return (
    <form className="rate-form" onSubmit={handleSubmit} noValidate>
      <label>
        <span>Taux horaire brut</span>
        <span className="rate-form-amount">
          <input
            inputMode="decimal"
            placeholder="12,80"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <span aria-hidden="true">€/h</span>
        </span>
      </label>

      <label>
        <span>À partir du</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>

      {error && <p className="form-error rate-form-error">{error}</p>}

      <div className="rate-form-actions">
        {onCancel && (
          <button type="button" className="rate-form-cancel" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  )
}