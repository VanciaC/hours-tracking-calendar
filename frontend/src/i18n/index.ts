import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY, pickLanguage, type Language } from '../lib/language'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { ar } from './locales/ar'
import { ja } from './locales/ja'

export const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ja: { translation: ja },
  ar: { translation: ar },
} satisfies Record<Language, { translation: unknown }>

function readSavedLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Keeps <html lang>, <html dir> and the tab title in line with the current language. */
function syncDocument(language: string) {
  document.documentElement.lang = language
  // "rtl" for Arabic: the browser then lays out text, flex and grid from right to left.
  document.documentElement.dir = i18n.dir(language)
  document.title = i18n.t('app.name')
}

void i18n.use(initReactI18next).init({
  resources,
  lng: pickLanguage(readSavedLanguage(), navigator.languages),
  // A key missing in a language shows the French text rather than the raw key.
  fallbackLng: 'fr',
  interpolation: {
    // React already escapes every value it renders.
    escapeValue: false,
  },
})

syncDocument(i18n.language)
i18n.on('languageChanged', syncDocument)

/** Switches the interface language and remembers it on this device. */
export function changeLanguage(language: Language): void {
  void i18n.changeLanguage(language)

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Not saved, but still applied for this visit.
  }
}

export default i18n
