import { createContext, useContext } from 'react'
import type { ThemePreference } from '../lib/theme'

export interface ThemeContextValue {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

// Kept out of ThemeProvider.tsx so that file only exports a component (needed by Vite fast refresh).
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>.')
  }

  return context
}
