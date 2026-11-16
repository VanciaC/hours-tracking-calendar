import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  EntryTemplateFieldsFragment,
  SaveWorkDayInput,
  WorkDayFieldsFragment,
} from '../../graphql/__generated__/graphql'
import { initialHoursValue, readHours, templateHours, type HoursError, type HoursValue } from '../../lib/workDay'
import { HoursFields } from '../HoursFields/HoursFields'
import './WorkDayForm.css'

interface WorkDayFormProps {
  /** The day already recorded on that date, or null for a new one. */
  workDay: WorkDayFieldsFragment | null
  templates: EntryTemplateFieldsFragment[]
  saving: boolean
  deleting: boolean
  onSave: (values: Omit<SaveWorkDayInput, 'date'>) => void
  onDelete: () => void
}

export function WorkDayForm({ workDay, templates, saving, deleting, onSave, onDelete }: WorkDayFormProps) {
  const { t } = useTranslation()

  const [hours, setHours] = useState<HoursValue>(() => {
    // A recorded day opens as it was saved, so its hours are never lost by mistake.
    if (workDay) {
      return initialHoursValue(workDay)
    }

    // A new entry always opens on shifts; the default template pre-fills it only if it is a shifts template.
    const defaultTemplate = templates.find((template) => template.isDefault && template.mode === 'SLOTS')

    return initialHoursValue(defaultTemplate ? templateHours(defaultTemplate) : null)
  })
  const [note, setNote] = useState(workDay?.note ?? '')
  // Kept as a code, so the message follows a language change.
  const [error, setError] = useState<HoursError | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function applyTemplate(template: EntryTemplateFieldsFragment) {
    setHours(initialHoursValue(templateHours(template)))
    setError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const reading = readHours(hours)

    if (!reading.ok) {
      setError(reading.error)
      return
    }

    setError(null)
    onSave({
      mode: reading.mode,
      durationMinutes: reading.durationMinutes,
      shifts: reading.shifts,
      note: note.trim() === '' ? null : note.trim(),
    })
  }

  return (
    <form className="work-day-form" onSubmit={handleSubmit} noValidate>
      {templates.length > 0 && (
        <div className="work-day-templates">
          <span>{t('entry.fillWith')}</span>
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => applyTemplate(template)}>
              {template.label ?? t('common.unnamed')}
            </button>
          ))}
        </div>
      )}

      <HoursFields value={hours} onChange={setHours} />

      <label className="work-day-note">
        <span>{t('entry.note')}</span>
        <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      {error && <p className="form-error">{t(`hoursErrors.${error.code}`, error)}</p>}

      <div className="work-day-actions">
        {workDay &&
          (confirmingDelete ? (
            <span className="work-day-confirm">
              <button type="button" className="work-day-danger" disabled={deleting} onClick={onDelete}>
                {deleting ? t('common.deleting') : t('entry.confirmDelete')}
              </button>
              <button type="button" className="work-day-secondary" onClick={() => setConfirmingDelete(false)}>
                {t('common.cancel')}
              </button>
            </span>
          ) : (
            <button type="button" className="work-day-ghost-danger" onClick={() => setConfirmingDelete(true)}>
              {t('entry.deleteDay')}
            </button>
          ))}

        <button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
