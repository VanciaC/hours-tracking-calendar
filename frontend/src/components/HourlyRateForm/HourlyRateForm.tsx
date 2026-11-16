import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { SetHourlyRateMutationVariables } from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { centsToEurosInput, parseEurosToCents } from '../../lib/pay'
import './HourlyRateForm.css'

type RateFormError = 'rates.invalidAmount' | 'rates.missingDate' | 'rates.dateTaken'

interface HourlyRateFormProps {
  initialAmountCents?: number
  /** ISO date, YYYY-MM-DD */
  initialDate: string
  submitLabel: string
  busy?: boolean
  /** Tells whether another rate already starts on that date. */
  isDateTaken?: (date: string) => boolean
  onSubmit: (values: SetHourlyRateMutationVariables) => void
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
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [amount, setAmount] = useState(
    initialAmountCents !== undefined ? centsToEurosInput(initialAmountCents, fmt.decimalSeparator) : '',
  )
  const [date, setDate] = useState(initialDate)
  // Kept as a translation key, so the message follows a language change.
  const [error, setError] = useState<RateFormError | null>(null)

  // "12,80" in French, "12.80" in English. Both separators are accepted anyway.
  const example = centsToEurosInput(1280, fmt.decimalSeparator)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amountCents = parseEurosToCents(amount)

    if (amountCents === null) {
      setError('rates.invalidAmount')
      return
    }

    if (date === '') {
      setError('rates.missingDate')
      return
    }

    if (isDateTaken?.(date)) {
      setError('rates.dateTaken')
      return
    }

    setError(null)
    onSubmit({ amountCents, effectiveFrom: date })
  }

  return (
    <form className="rate-form" onSubmit={handleSubmit} noValidate>
      <label>
        <span>{t('rates.amountLabel')}</span>
        <span className="rate-form-amount">
          <input
            inputMode="decimal"
            placeholder={example}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <span aria-hidden="true">€/h</span>
        </span>
      </label>

      <label>
        <span>{t('rates.effectiveFrom')}</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>

      {error && <p className="form-error rate-form-error">{t(error, { example })}</p>}

      <div className="rate-form-actions">
        {onCancel && (
          <button type="button" className="rate-form-cancel" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" disabled={busy}>
          {busy ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  )
}
