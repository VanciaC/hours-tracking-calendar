import { useState, type FormEvent } from 'react'
import type { EntryMode } from '../../graphql/calendar'
import type { SaveWorkDayInput, WorkDayDetail } from '../../graphql/planning'
import { formatDuration } from '../../lib/calendar'
import { checkShifts, durationFromParts, type ShiftDraft } from '../../lib/workDay'
import './WorkDayForm.css'

interface WorkDayFormProps {
  /** The day already recorded on that date, or null for a new one. */
  workDay: WorkDayDetail | null
  saving: boolean
  deleting: boolean
  onSave: (values: Omit<SaveWorkDayInput, 'date'>) => void
  onDelete: () => void
}

const EMPTY_SHIFT: ShiftDraft = { startTime: '', endTime: '', unpaidBreakMinutes: 0 }

function initialShifts(workDay: WorkDayDetail | null): ShiftDraft[] {
  if (!workDay || workDay.shifts.length === 0) {
    return [EMPTY_SHIFT]
  }

  // The API returns HH:MM:SS; time inputs work with HH:MM.
  return workDay.shifts.map((shift) => ({
    startTime: shift.startTime.slice(0, 5),
    endTime: shift.endTime.slice(0, 5),
    unpaidBreakMinutes: shift.unpaidBreakMinutes,
  }))
}

export function WorkDayForm({ workDay, saving, deleting, onSave, onDelete }: WorkDayFormProps) {
  const [mode, setMode] = useState<EntryMode>(workDay?.mode ?? 'SLOTS')
  const [shifts, setShifts] = useState<ShiftDraft[]>(() => initialShifts(workDay))
  const [hours, setHours] = useState(workDay?.mode === 'DURATION' ? String(Math.floor(workDay.durationMinutes / 60)) : '')
  const [minutes, setMinutes] = useState(workDay?.mode === 'DURATION' ? String(workDay.durationMinutes % 60) : '')
  const [note, setNote] = useState(workDay?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Live total: shown as soon as what is typed is valid.
  const shiftCheck = checkShifts(shifts)
  const total = mode === 'SLOTS' ? (shiftCheck.ok ? shiftCheck.minutes : null) : durationFromParts(hours, minutes)

  function updateShift(index: number, changes: Partial<ShiftDraft>) {
    setShifts((current) => current.map((shift, i) => (i === index ? { ...shift, ...changes } : shift)))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanNote = note.trim() === '' ? null : note.trim()

    if (mode === 'SLOTS') {
      if (!shiftCheck.ok) {
        setError(shiftCheck.error)
        return
      }

      setError(null)
      onSave({ mode, durationMinutes: null, shifts, note: cleanNote })
      return
    }

    const duration = durationFromParts(hours, minutes)

    if (duration === null) {
      setError('Durée invalide. Elle doit être comprise entre 1 minute et 24 heures.')
      return
    }

    setError(null)
    onSave({ mode, durationMinutes: duration, shifts: [], note: cleanNote })
  }

  return (
    <form className="work-day-form" onSubmit={handleSubmit} noValidate>
      <div className="work-day-mode" role="radiogroup" aria-label="Type de saisie">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'SLOTS'}
          className={mode === 'SLOTS' ? 'is-active' : ''}
          onClick={() => setMode('SLOTS')}
        >
          Créneaux
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'DURATION'}
          className={mode === 'DURATION' ? 'is-active' : ''}
          onClick={() => setMode('DURATION')}
        >
          Durée
        </button>
      </div>

      {mode === 'SLOTS' ? (
        <div className="work-day-shifts">
          {shifts.map((shift, index) => (
            <div key={index} className="work-day-shift">
              <label>
                <span>Début</span>
                <input
                  type="time"
                  value={shift.startTime}
                  onChange={(event) => updateShift(index, { startTime: event.target.value })}
                />
              </label>
              <label>
                <span>Fin</span>
                <input
                  type="time"
                  value={shift.endTime}
                  onChange={(event) => updateShift(index, { endTime: event.target.value })}
                />
              </label>
              <label>
                <span>Pause non payée (min)</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={shift.unpaidBreakMinutes}
                  onChange={(event) =>
                    updateShift(index, {
                      unpaidBreakMinutes: event.target.value === '' ? 0 : Number(event.target.value),
                    })
                  }
                />
              </label>
              {shifts.length > 1 && (
                <button
                  type="button"
                  className="work-day-remove"
                  aria-label="Retirer ce créneau"
                  onClick={() => setShifts((current) => current.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="work-day-add"
            onClick={() => setShifts((current) => [...current, EMPTY_SHIFT])}
          >
            + Ajouter un créneau
          </button>
        </div>
      ) : (
        <div className="work-day-duration">
          <label>
            <span>Heures</span>
            <input type="number" min={0} max={24} value={hours} onChange={(event) => setHours(event.target.value)} />
          </label>
          <label>
            <span>Minutes</span>
            <input type="number" min={0} max={59} step={5} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
          </label>
        </div>
      )}

      <label className="work-day-note">
        <span>Note (facultative)</span>
        <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      <p className="work-day-total">
        Total <strong>{total !== null ? formatDuration(total) : '–'}</strong>
      </p>

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