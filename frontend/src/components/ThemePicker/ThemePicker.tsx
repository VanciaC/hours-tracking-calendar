import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import type { ThemePreference } from '../../lib/theme'
import { useTheme } from '../../theme/ThemeProvider'
import './ThemePicker.css'

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
]

export function ThemePicker() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="theme-picker" role="radiogroup" aria-label="Thème">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          className={preference === value ? 'is-active' : ''}
          onClick={() => setPreference(value)}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}