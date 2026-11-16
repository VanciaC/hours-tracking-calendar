import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntryTemplateFieldsFragment, EntryTemplateInput } from '../../graphql/__generated__/graphql'
import { initialHoursValue, readHours, templateHours, type HoursError, type HoursValue } from '../../lib/workDay'
import { HoursFields } from '../HoursFields/HoursFields'
import './EntryTemplateForm.css'

interface EntryTemplateFormProps {
  /** The template to edit, or null to create one. */
  template: EntryTemplateFieldsFragment | null
  submitLabel: string
  busy: boolean
  onSubmit: (input: EntryTemplateInput) => void
  onCancel: () => void
}

export function EntryTemplateForm({ template, submitLabel, busy, onSubmit, onCancel }: EntryTemplateFormProps) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(template?.label ?? '')
  const [hours, setHours] = useState<HoursValue>(() => initialHoursValue(template ? templateHours(template) : null))
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)
  // Either a missing name or a problem with the hours; translated when displayed.
  const [error, setError] = useState<'missingName' | HoursError | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (label.trim() === '') {
      setError('missingName')
      return
    }

    const reading = readHours(hours)

    if (!reading.ok) {
      setError(reading.error)
      return
    }

    setError(null)
    onSubmit({
      label: label.trim(),
      mode: reading.mode,
      durationMinutes: reading.durationMinutes,
      slots: reading.shifts,
      isDefault,
    })
  }

  return (
    <form className="template-form" onSubmit={handleSubmit} noValidate>
      <label className="template-form-label">
        <span>{t('templates.nameLabel')}</span>
        <input
          maxLength={100}
          placeholder={t('templates.namePlaceholder')}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>

      <HoursFields value={hours} onChange={setHours} />

      <label className="template-form-default">
        <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
        {t('templates.useAsDefault')}
      </label>

      {error && (
        <p className="form-error">
          {error === 'missingName' ? t('templates.missingName') : t(`hoursErrors.${error.code}`, error)}
        </p>
      )}

      <div className="template-form-actions">
        <button type="button" className="template-form-cancel" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="submit" disabled={busy}>
          {busy ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  )
}
