import { useTranslation } from 'react-i18next'

/** Admin team schedule: day, week and month views (US-30 to US-32). */
export function TeamPlanningPage() {
  const { t } = useTranslation()

  return (
    <section>
      <h1>{t('admin.planning.title')}</h1>
      <p>{t('admin.comingSoon')}</p>
    </section>
  )
}
