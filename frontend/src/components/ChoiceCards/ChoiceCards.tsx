import type { LucideIcon } from 'lucide-react'
import './ChoiceCards.css'

export interface Choice<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  /** Language of the label, when it differs from the page (e.g. a language name). */
  lang?: string
}

interface ChoiceCardsProps<T extends string> {
  /** Accessible name of the group. */
  label: string
  choices: Choice<T>[]
  value: T
  onChange: (value: T) => void
}

/** A single choice among a few options, shown as cards. */
export function ChoiceCards<T extends string>({ label, choices, value, onChange }: ChoiceCardsProps<T>) {
  return (
    <div className="choice-cards" role="radiogroup" aria-label={label}>
      {choices.map(({ value: choice, label: choiceLabel, icon: Icon, lang }) => (
        <button
          key={choice}
          type="button"
          role="radio"
          aria-checked={value === choice}
          className={value === choice ? 'is-active' : ''}
          onClick={() => onChange(choice)}
          lang={lang}
        >
          {Icon && <Icon size={18} aria-hidden="true" />}
          {choiceLabel}
        </button>
      ))}
    </div>
  )
}
