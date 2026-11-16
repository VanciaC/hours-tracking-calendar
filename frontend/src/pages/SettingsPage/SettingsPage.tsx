import { useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { startOfMonth } from 'date-fns'
import { EntryTemplatesManager } from '../../components/EntryTemplatesManager/EntryTemplatesManager'
import { HourlyRatesManager } from '../../components/HourlyRatesManager/HourlyRatesManager'
import { LanguagePicker } from '../../components/LanguagePicker/LanguagePicker'
import { ThemePicker } from '../../components/ThemePicker/ThemePicker'
import { EntryTemplatesDocument, HourlyRatesDocument } from '../../graphql/__generated__/graphql'
import { toIsoDate } from '../../lib/calendar'
import './SettingsPage.css'

export function SettingsPage() {
  const { t } = useTranslation()
  const rates = useQuery(HourlyRatesDocument)
  const templates = useQuery(EntryTemplatesDocument)

  return (
    <div className="settings">
      <section className="settings-card">
        <header className="settings-card-header">
          <h2>{t('settings.rates.title')}</h2>
          <p>{t('settings.rates.description')}</p>
        </header>

        {rates.error ? (
          <p className="form-error">{t('settings.rates.loadError')}</p>
        ) : rates.loading && !rates.data ? (
          <p>{t('status.loading')}</p>
        ) : (
          <HourlyRatesManager
            rates={rates.data?.me?.hourlyRates ?? []}
            defaultDate={toIsoDate(startOfMonth(new Date()))}
          />
        )}
      </section>

      <section className="settings-card">
        <header className="settings-card-header">
          <h2>{t('settings.templates.title')}</h2>
          <p>{t('settings.templates.description')}</p>
        </header>

        {templates.error ? (
          <p className="form-error">{t('settings.templates.loadError')}</p>
        ) : templates.loading && !templates.data ? (
          <p>{t('status.loading')}</p>
        ) : (
          <EntryTemplatesManager templates={templates.data?.me?.entryTemplates ?? []} />
        )}
      </section>

      <section className="settings-card">
        <header className="settings-card-header">
          <h2>{t('settings.appearance.title')}</h2>
          <p>{t('settings.appearance.description')}</p>
        </header>

        <ThemePicker />
      </section>

      <section className="settings-card">
        <header className="settings-card-header">
          <h2>{t('settings.language.title')}</h2>
          <p>{t('settings.language.description')}</p>
        </header>

        <LanguagePicker />
      </section>
    </div>
  )
}