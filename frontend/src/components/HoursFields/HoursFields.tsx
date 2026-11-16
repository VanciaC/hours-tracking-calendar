import type { EntryMode } from '../../graphql/__generated__/graphql'
import { formatDuration } from '../../lib/calendar'
import { EMPTY_SHIFT, readHours, type HoursValue, type ShiftDraft } from '../../lib/workDay'
import './HoursFields.css'

interface HoursFieldsProps {
  value: HoursValue
  onChange: (value: HoursValue) => void
}

/** Mode switch, shifts or duration inputs, and a live total. Shared by the day and template forms. */
export function HoursFields({ value, onChange }: HoursFieldsProps) {
  const reading = readHours(value)

  function update(changes: Partial<HoursValue>) {
    onChange({ ...value, ...changes })
  }

  function updateShift(index: number, changes: Partial<ShiftDraft>) {
    update({ shifts: value.shifts.map((shift, i) => (i === index ? { ...shift, ...changes } : shift)) })
  }

  function modeButton(mode: EntryMode, label: string) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={value.mode === mode}
        className={value.mode === mode ? 'is-active' : ''}
        onClick={() => update({ mode })}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="hours-fields">
      <div className="hours-mode" role="radiogroup" aria-label="Type de saisie">
        {modeButton('SLOTS', 'Créneaux')}
        {modeButton('DURATION', 'Durée')}
      </div>

      {value.mode === 'SLOTS' ? (
        <div className="hours-shifts">
          {value.shifts.map((shift, index) => (
            <div key={index} className="hours-shift">
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
              {value.shifts.length > 1 && (
                <button
                  type="button"
                  className="hours-remove"
                  aria-label="Retirer ce créneau"
                  onClick={() => update({ shifts: value.shifts.filter((_, i) => i !== index) })}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="hours-add"
            onClick={() => update({ shifts: [...value.shifts, EMPTY_SHIFT] })}
          >
            + Ajouter un créneau
          </button>
        </div>
      ) : (
        <div className="hours-duration">
          <label>
            <span>Heures</span>
            <input
              type="number"
              min={0}
              max={24}
              value={value.hours}
              onChange={(event) => update({ hours: event.target.value })}
            />
          </label>
          <label>
            <span>Minutes</span>
            <input
              type="number"
              min={0}
              max={59}
              step={5}
              value={value.minutes}
              onChange={(event) => update({ minutes: event.target.value })}
            />
          </label>
        </div>
      )}

      <p className="hours-total">
        Total <strong>{reading.ok ? formatDuration(reading.minutes) : '–'}</strong>
      </p>
    </div>
  )
}