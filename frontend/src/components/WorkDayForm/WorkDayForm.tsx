import { useState, type FormEvent } from 'react'
import {
  templateHours,
  type EntryTemplateDetail,
  type SaveWorkDayInput,
  type WorkDayDetail,
} from '../../graphql/planning'
import { initialHoursValue, readHours, type HoursValue } from '../../lib/workDay'
import { HoursFields } from '../HoursFields/HoursFields'
import './WorkDayForm.css'

interface WorkDayFormProps {
  /** The day already recorded on that date, or null for a new one. */
  workDay: WorkDayDetail | null
  templates: EntryTemplateDetail[]
  saving: boolean
  deleting: boolean
  onSave: (values: Omit<SaveWorkDayInput, 'date'>) => void
  onDelete: () => void
}

export function WorkDayForm({ workDay, templates, saving, deleting, onSave, onDelete }: WorkDayFormProps) {
  // A recorded day loads its own hours; a new day starts from the default template, if any.
  const [hours, setHours] = useState<HoursValue>(() => {
    const defaultTemplate = templates.find((template) => template.isDefault)
    return initialHoursValue(workDay ?? (defaultTemplate ? templateHours(defaultTemplate) : null))
  })
  const [note, setNote] = useState(workDay?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function applyTemplate(template: EntryTemplateDetail) {
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
          <span>Remplir avec</span>
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => applyTemplate(template)}>
              {template.label ?? 'Sans nom'}
            </button>
          ))}
        </div>
      )}

      <HoursFields value={hours} onChange={setHours} />

      <label className="work-day-note">
        <span>Note (facultative)</span>
        <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="work-day-actions">
        {workDay &&
          (confirmingDelete ? (
            <span className="work-day-confirm">
              <button type="button" className="work-day-danger" disabled={deleting} onClick={onDelete}>
                {deleting ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
              <button type="button" className="work-day-secondary" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </button>
            </span>
          ) : (
            <button type="button" className="work-day-ghost-danger" onClick={() => setConfirmingDelete(true)}>
              Supprimer ce jour
            </button>
          ))}

        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}