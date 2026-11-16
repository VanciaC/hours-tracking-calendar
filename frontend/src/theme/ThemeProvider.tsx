import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme,
  type ThemePreference,
} from '../lib/theme'

interface ThemeContextValue {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    // Storage can be unavailable (private mode, blocked cookies): follow the system.
    return 'system'
  }
}

/** Applies the theme to <html data-theme> and keeps it in sync with the user's choice and the system. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function apply() {
      document.documentElement.dataset.theme = resolveTheme(preference, media.matches)
    }

    apply()

    // Follow live system changes (e.g. automatic dark mode at sunset).
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  function setPreference(next: ThemePreference) {
    setPreferenceState(next)

    try {
      if (next === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      }
    } catch {
      // Not saved, but still applied for this visit.
    }
  }

  return <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>.')
  }

  return context
}