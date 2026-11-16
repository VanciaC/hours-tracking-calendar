import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { INTL_LOCALES, isLanguage } from '../lib/language'

/**
 * Formatters for the current language: dates and money through Intl,
 * durations through the translations. Recreated only when the language changes.
 */
export function useFormatters() {
  const { t, i18n } = useTranslation()
  const locale = INTL_LOCALES[isLanguage(i18n.language) ? i18n.language : 'fr']

  return useMemo(() => {
    const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
    const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const monthShort = new Intl.DateTimeFormat(locale, { month: 'short' })
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })

    return {
      /** "novembre 2026", "November 2026" */
      monthYear: (date: Date) => monthYear.format(date),
      /** "16 novembre", "16 November" */
      dayMonth: (date: Date) => dayMonth.format(date),
      /** "lun", "Mon" (trailing dot removed: the column labels are short on purpose) */
      weekdayShort: (date: Date) => weekdayShort.format(date).replace(/\.$/, ''),
      /** "nov.", "Nov" */
      monthShort: (date: Date) => monthShort.format(date),
      /** 97500 -> "975,00 €", "€975.00" */
      money: (cents: number) => money.format(cents / 100),
      /** 450 -> "7h30", "7h 30m" */
      duration: (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const rest = minutes % 60

        return rest === 0
          ? t('duration.hours', { hours })
          : t('duration.hoursMinutes', { hours, minutes: String(rest).padStart(2, '0') })
      },
    }
  }, [locale, t])
}