import { useQuery } from '@apollo/client/react'
import { startOfMonth } from 'date-fns'
import { HourlyRatesManager } from '../../components/HourlyRatesManager/HourlyRatesManager'
import { HOURLY_RATES_QUERY } from '../../graphql/payroll'
import { toIsoDate } from '../../lib/calendar'
import './SettingsPage.css'
import { EntryTemplatesManager } from '../../components/EntryTemplatesManager/EntryTemplatesManager'
import { ENTRY_TEMPLATES_QUERY } from '../../graphql/planning'

export function SettingsPage() {
  const { data, loading, error } = useQuery(HOURLY_RATES_QUERY)
  const templates = useQuery(ENTRY_TEMPLATES_QUERY)

  return (
    <div className="settings">
      <section className="settings-card">
        <header className="settings-card-header">
          <h2>Taux horaires</h2>
          <p>Le salaire de chaque jour est calculé avec le taux en vigueur à sa date.</p>
        </header>

        {error ? (
          <p className="form-error">Impossible de charger les taux.</p>
        ) : loading && !data ? (
          <p>Chargement…</p>
        ) : (
          <HourlyRatesManager
            rates={data?.me?.hourlyRates ?? []}
            defaultDate={toIsoDate(startOfMonth(new Date()))}
          />
        )}
      </section>
      <section className="settings-card">
        <header className="settings-card-header">
          <h2>Modèles de saisie</h2>
          <p>Tes journées habituelles, pour remplir un jour en un clic. Le modèle par défaut pré-remplit les jours vides.</p>
        </header>

        {templates.error ? (
          <p className="form-error">Impossible de charger les modèles.</p>
        ) : templates.loading && !templates.data ? (
          <p>Chargement…</p>
        ) : (
          <EntryTemplatesManager templates={templates.data?.me?.entryTemplates ?? []} />
        )}
      </section>
    </div>
  )
}