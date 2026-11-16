import { useState, type FormEvent } from 'react'
import { templateHours, type EntryTemplateDetail, type EntryTemplateInput } from '../../graphql/planning'
import { initialHoursValue, readHours, type HoursValue } from '../../lib/workDay'
import { HoursFields } from '../HoursFields/HoursFields'
import './EntryTemplateForm.css'

interface EntryTemplateFormProps {
  /** The template to edit, or null to create one. */
  template: EntryTemplateDetail | null
  submitLabel: string
  busy: boolean
  onSubmit: (input: EntryTemplateInput) => void
  onCancel: () => void
}

export function EntryTemplateForm({ template, submitLabel, busy, onSubmit, onCancel }: EntryTemplateFormProps) {
  const [label, setLabel] = useState(template?.label ?? '')
  const [hours, setHours] = useState<HoursValue>(() =>
    initialHoursValue(template ? templateHours(template) : null),
  )
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (label.trim() === '') {
      setError('Donne un nom au modèle, par exemple « Journée standard ».')
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
        <span>Nom du modèle</span>
        <input
          maxLength={100}
          placeholder="Journée standard"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>

      <HoursFields value={hours} onChange={setHours} />

      <label className="template-form-default">
        <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
        Utiliser par défaut pour les nouveaux jours
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="template-form-actions">
        <button type="button" className="template-form-cancel" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  )
}