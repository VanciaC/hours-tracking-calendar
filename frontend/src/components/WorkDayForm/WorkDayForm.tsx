import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  EntryTemplateFieldsFragment,
  SaveWorkDayInput,
  WorkDayFieldsFragment,
} from '../../graphql/__generated__/graphql'
import { focusFirstInvalid } from '../../lib/forms'
import { initialHoursValue, readHours, templateHours, type HoursValue } from '../../lib/workDay'
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
  const formRef = useRef<HTMLFormElement>(null)

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
  // Set by a refused submit: every error shows, even on fields never visited.
  const [submitted, setSubmitted] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const reading = readHours(hours)

  function applyTemplate(template: EntryTemplateFieldsFragment) {
    setHours(initialHoursValue(templateHours(template)))
    setSubmitted(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!reading.ok) {
      setSubmitted(true)
      focusFirstInvalid(formRef.current)
      return
    }

    onSave({
      mode: reading.mode,
      durationMinutes: reading.durationMinutes,
      shifts: reading.shifts,
      note: note.trim() === '' ? null : note.trim(),
    })
  }

  return (
    <form ref={formRef} className="work-day-form" onSubmit={handleSubmit} noValidate>
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

      <HoursFields value={hours} onChange={setHours} showAllErrors={submitted} />

      <label className="work-day-note">
        <span>{t('entry.note')}</span>
        <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      {/* The details are under each field; this line only says why nothing was saved. */}
      {submitted && !reading.ok && (
        <p className="form-error" role="alert">
          {t('hoursErrors.fixFields')}
        </p>
      )}

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
