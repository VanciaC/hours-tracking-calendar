import { describe, expect, it } from 'vitest'
import { pickLanguage } from '../language'

describe('pickLanguage', () => {
  it('prefers the saved choice', () => {
    expect(pickLanguage('en', ['fr-FR'])).toBe('en')
  })

  it('falls back to the first supported browser language, ignoring the region', () => {
    expect(pickLanguage(null, ['de-DE', 'fr-CA', 'en-US'])).toBe('fr')
  })

  it('uses the default when nothing is supported', () => {
    expect(pickLanguage('klingon', ['de-DE'])).toBe('en')
  })

	it('recognizes Japanese and Arabic browsers, whatever the region', () => {
    expect(pickLanguage(null, ['ja-JP'])).toBe('ja')
    expect(pickLanguage(null, ['ar-MA'])).toBe('ar')
  })
})