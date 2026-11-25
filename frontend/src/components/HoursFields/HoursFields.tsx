import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntryMode } from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import {
  hoursFieldErrors,
  newShift,
  readHours,
  type HoursError,
  type HoursValue,
  type ShiftDraft,
} from '../../lib/workDay'
import './HoursFields.css'

interface HoursFieldsProps {
  value: HoursValue
  onChange: (value: HoursValue) => void
  /** After a refused submit, every error shows, even on fields never visited. */
  showAllErrors?: boolean
}

/**
 * Mode switch, shifts or duration inputs, and a live total. Shared by the day and template forms.
 * An error shows under its input once the user leaves the field (or after a refused submit),
 * then follows the typing until it is fixed.
 */
export function HoursFields({ value, onChange, showAllErrors = false }: HoursFieldsProps) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const idPrefix = useId()
  // Fields the user has left at least once: "<shift key>:start", "duration"…
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set())

  const reading = readHours(value)
  const errors = hoursFieldErrors(value)

  function update(changes: Partial<HoursValue>) {
    onChange({ ...value, ...changes })
  }

  function updateShift(key: string, changes: Partial<ShiftDraft>) {
    update({ shifts: value.shifts.map((shift) => (shift.key === key ? { ...shift, ...changes } : shift)) })
  }

  function touch(field: string) {
    setTouched((current) => (current.has(field) ? current : new Set(current).add(field)))
  }

  function visible(...fields: string[]): boolean {
    return showAllErrors || fields.every((field) => touched.has(field))
  }

  /** aria and class props of an input, with its message id when the error shows. */
  function fieldProps(id: string, error: HoursError | undefined, shown: boolean) {
    const invalid = shown && error !== undefined

    return {
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid ? id : undefined,
    }
  }

  function message(id: string, error: HoursError | undefined, shown: boolean, className = 'field-error') {
    if (!shown || !error) return null

    return (
      <span id={id} className={className}>
        {t(`hoursErrors.${error.code}`, error)}
      </span>
    )
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

  const durationShown = visible('duration')
  const durationErrorId = `${idPrefix}-duration`

  return (
    <div className="hours-fields">
      <div className="hours-mode" role="radiogroup" aria-label={t('hours.modeLabel')}>
        {modeButton('SLOTS', t('hours.slots'))}
        {modeButton('DURATION', t('hours.duration'))}
      </div>

      {value.mode === 'SLOTS' ? (
        <div className="hours-shifts">
          {value.shifts.map((shift, index) => {
            const shiftErrors = errors.shifts[index] ?? {}
            const ids = {
              start: `${idPrefix}-${shift.key}-start`,
              end: `${idPrefix}-${shift.key}-end`,
              break: `${idPrefix}-${shift.key}-break`,
              row: `${idPrefix}-${shift.key}-row`,
            }
            const shown = {
              start: visible(`${shift.key}:start`),
              end: visible(`${shift.key}:end`),
              break: visible(`${shift.key}:break`),
              // An overlap concerns the whole shift: shown once both of its times were left.
              row: visible(`${shift.key}:start`, `${shift.key}:end`),
            }

            return (
              <div key={shift.key} className="hours-shift">
                <label>
                  <span>{t('hours.start')}</span>
                  <input
                    type="time"
                    value={shift.startTime}
                    onChange={(event) => updateShift(shift.key, { startTime: event.target.value })}
                    onBlur={() => touch(`${shift.key}:start`)}
                    {...fieldProps(ids.start, shiftErrors.start, shown.start)}
                  />
                  {message(ids.start, shiftErrors.start, shown.start)}
                </label>

                <label>
                  <span>{t('hours.end')}</span>
                  <input
                    type="time"
                    value={shift.endTime}
                    onChange={(event) => updateShift(shift.key, { endTime: event.target.value })}
                    onBlur={() => touch(`${shift.key}:end`)}
                    {...fieldProps(ids.end, shiftErrors.end, shown.end)}
                  />
                  {message(ids.end, shiftErrors.end, shown.end)}
                </label>

                <label>
                  <span>{t('hours.unpaidBreak')}</span>
                  {/* Text, not number: what is typed stays as typed, and phones open the digit keypad. */}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    placeholder="0"
                    value={shift.unpaidBreak}
                    onChange={(event) => updateShift(shift.key, { unpaidBreak: event.target.value })}
                    onBlur={() => touch(`${shift.key}:break`)}
                    {...fieldProps(ids.break, shiftErrors.break, shown.break)}
                  />
                  {message(ids.break, shiftErrors.break, shown.break)}
                </label>

                {value.shifts.length > 1 && (
                  <button
                    type="button"
                    className="hours-remove"
                    aria-label={t('hours.removeShift')}
                    onClick={() => update({ shifts: value.shifts.filter((other) => other.key !== shift.key) })}
                  >
                    ×
                  </button>
                )}

                {message(ids.row, shiftErrors.row, shown.row, 'field-error hours-shift-error')}
              </div>
            )
          })}

          {showAllErrors && errors.list && (
            <span className="field-error">{t(`hoursErrors.${errors.list.code}`, errors.list)}</span>
          )}

          <button type="button" className="hours-add" onClick={() => update({ shifts: [...value.shifts, newShift()] })}>
            {t('hours.addShift')}
          </button>
        </div>
      ) : (
        <div className="hours-duration-group">
          <div className="hours-duration">
            <label>
              <span>{t('hours.hours')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={24}
                placeholder="0"
                value={value.hours}
                onChange={(event) => update({ hours: event.target.value })}
                onBlur={() => touch('duration')}
                {...fieldProps(durationErrorId, errors.duration, durationShown)}
              />
            </label>
            <label>
              <span>{t('hours.minutes')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                step={5}
                placeholder="0"
                value={value.minutes}
                onChange={(event) => update({ minutes: event.target.value })}
                onBlur={() => touch('duration')}
                {...fieldProps(durationErrorId, errors.duration, durationShown)}
              />
            </label>
          </div>
          {message(durationErrorId, errors.duration, durationShown)}
        </div>
      )}

      <p className="hours-total">
        {t('hours.total')} <strong>{reading.ok ? fmt.duration(reading.minutes) : '–'}</strong>
      </p>
    </div>
  )
}
