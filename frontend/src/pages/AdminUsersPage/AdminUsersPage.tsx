import { useTranslation } from 'react-i18next'

/** Admin list of regular users, with search and pagination (US-27). */
export function AdminUsersPage() {
  const { t } = useTranslation()

  return (
    <section>
      <h1>{t('admin.users.title')}</h1>
      <p>{t('admin.comingSoon')}</p>
    </section>
  )
}
