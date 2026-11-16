import { describe, expect, it } from 'vitest'
import { parseThemePreference, resolveTheme } from '../theme'

describe('theme', () => {
  it('reads an explicit choice and falls back to the system otherwise', () => {
    expect(parseThemePreference('dark')).toBe('dark')
    expect(parseThemePreference(null)).toBe('system')
    expect(parseThemePreference('purple')).toBe('system')
  })

  it('follows the system only when asked to', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })
})