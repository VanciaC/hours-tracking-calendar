export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ja', 'ar'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/** Same convention as the theme: one key per device preference. */
export const LANGUAGE_STORAGE_KEY = 'htc.language'

/** Used when neither the saved choice nor the browser languages are supported. */
export const DEFAULT_LANGUAGE: Language = 'en'

/** Each language written in itself, so anyone can find theirs. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  ja: '日本語',
  ar: 'العربية',
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * The saved choice first, then the first supported browser language ("fr-CA" counts as "fr"),
 * then the default.
 */
export function pickLanguage(saved: string | null, browserLanguages: readonly string[]): Language {
  if (isLanguage(saved)) {
    return saved
  }

  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split('-')[0]

    if (isLanguage(base)) {
      return base
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * Regional locale used by Intl to format dates, numbers and money in each language.
 * Arabic uses Latin digits ("nu-latn"): consistent with time inputs and day numbers,
 * and the base "ar" locale keeps the Gregorian calendar.
 */
export const INTL_LOCALES: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  ja: 'ja-JP',
  ar: 'ar-u-nu-latn',
}
