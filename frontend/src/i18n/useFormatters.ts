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
    const fullDate = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const longDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    const shortDate = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
    const decimalSeparator =
      new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === 'decimal')?.value ?? '.'

    /** Formats a date, writing the first day of the month the way the language does ("1er" in French). */
    function withFirstOfMonth(format: Intl.DateTimeFormat, date: Date): string {
      return format
        .formatToParts(date)
        .map((part) => (part.type === 'day' && part.value === '1' ? t('calendar.firstOfMonth') : part.value))
        .join('')
    }

    return {
      /** "novembre 2026", "November 2026" */
      monthYear: (date: Date) => monthYear.format(date),
      /** "16 novembre", "16 November" */
      dayMonth: (date: Date) => dayMonth.format(date),
      /** "lun", "Mon" (trailing dot removed: the column labels are short on purpose) */
      weekdayShort: (date: Date) => weekdayShort.format(date).replace(/\.$/, ''),
      /** "nov.", "Nov" */
      monthShort: (date: Date) => monthShort.format(date),
      /** "lundi 16 novembre 2026", "Monday 16 November 2026" */
      fullDate: (date: Date) => withFirstOfMonth(fullDate, date),
      /** "1er novembre 2026", "1 November 2026" */
      longDate: (date: Date) => withFirstOfMonth(longDate, date),
      /** "lun. 2 nov.", "Mon 2 Nov" */
      shortDate: (date: Date) => shortDate.format(date),
      /** 97500 -> "975,00 €", "€975.00" */
      money: (cents: number) => money.format(cents / 100),
      /** "," in French, "." in English: how amounts are typed. */
      decimalSeparator,
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