import { useQuery } from '@apollo/client/react'
import { startOfMonth } from 'date-fns'
import { EntryTemplatesManager } from '../../components/EntryTemplatesManager/EntryTemplatesManager'
import { HourlyRatesManager } from '../../components/HourlyRatesManager/HourlyRatesManager'
import { EntryTemplatesDocument, HourlyRatesDocument } from '../../graphql/__generated__/graphql'
import { toIsoDate } from '../../lib/calendar'
import './SettingsPage.css'

export function SettingsPage() {
  const rates = useQuery(HourlyRatesDocument)
  const templates = useQuery(EntryTemplatesDocument)

  return (
    <div className="settings">
      <section className="settings-card">
        <header className="settings-card-header">
          <h2>Taux horaires</h2>
          <p>Le salaire de chaque jour est calculé avec le taux en vigueur à sa date.</p>
        </header>

        {rates.error ? (
          <p className="form-error">Impossible de charger les taux.</p>
        ) : rates.loading && !rates.data ? (
          <p>Chargement…</p>
        ) : (
          <HourlyRatesManager
            rates={rates.data?.me?.hourlyRates ?? []}
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