import { useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntryTemplateFieldsFragment, EntryTemplateInput } from '../../graphql/__generated__/graphql'
import { focusFirstInvalid } from '../../lib/forms'
import { initialHoursValue, readHours, templateHours, type HoursValue } from '../../lib/workDay'
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
  const formRef = useRef<HTMLFormElement>(null)
  const nameErrorId = useId()
  const [label, setLabel] = useState(template?.label ?? '')
  const [hours, setHours] = useState<HoursValue>(() => initialHoursValue(template ? templateHours(template) : null))
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)
  const [nameTouched, setNameTouched] = useState(false)
  // Set by a refused submit: every error shows, even on fields never visited.
  const [submitted, setSubmitted] = useState(false)

  const reading = readHours(hours)
  const nameMissing = label.trim() === ''
  const showNameError = nameMissing && (nameTouched || submitted)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (nameMissing || !reading.ok) {
      setSubmitted(true)
      focusFirstInvalid(formRef.current)
      return
    }

    onSubmit({
      label: label.trim(),
      mode: reading.mode,
      durationMinutes: reading.durationMinutes,
      slots: reading.shifts,
      isDefault,
    })
  }

  return (
    <form ref={formRef} className="template-form" onSubmit={handleSubmit} noValidate>
      <label className="template-form-label">
        <span>{t('templates.nameLabel')}</span>
        <input
          maxLength={100}
          placeholder={t('templates.namePlaceholder')}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onBlur={() => setNameTouched(true)}
          aria-invalid={showNameError || undefined}
          aria-describedby={showNameError ? nameErrorId : undefined}
        />
        {showNameError && (
          <span id={nameErrorId} className="field-error">
            {t('templates.missingName')}
          </span>
        )}
      </label>

      <HoursFields value={hours} onChange={setHours} showAllErrors={submitted} />

      <label className="template-form-default">
        <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
        {t('templates.useAsDefault')}
      </label>

      {/* The details are under each field; this line only says why nothing was saved. */}
      {submitted && (nameMissing || !reading.ok) && (
        <p className="form-error" role="alert">
          {t('hoursErrors.fixFields')}
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
