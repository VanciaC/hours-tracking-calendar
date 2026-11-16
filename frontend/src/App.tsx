import { useApolloClient, useQuery } from '@apollo/client/react'
import { Navigate, Route, Routes } from 'react-router'
import { tokenStorage } from './auth/tokenStorage'
import { AppShell } from './components/AppShell/AppShell'
import { MeDocument } from './graphql/__generated__/graphql'
import { CalendarPage } from './pages/CalendarPage/CalendarPage'
import { EntryPage } from './pages/EntryPage/EntryPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { useTranslation } from 'react-i18next'


export default function App() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const { loading, error, data } = useQuery(MeDocument)

  async function handleLogout() {
    tokenStorage.clear()
    // Refetches "me" without the token: it now returns null.
    await client.resetStore()
  }

  if (loading) {
    return <main className="app-status">{t('status.loading')}</main>
  }

  if (error) {
    return (
      <main className="app-status">
        <p className="form-error">{t('status.apiUnreachable', { message: error.message })}</p>
      </main>
    )
  }

  const user = data?.me ?? null

  if (!user) {
    return <LoginPage />
  }

  return (
    <AppShell user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/calendrier" element={<CalendarPage />} />
        <Route path="/saisie" element={<EntryPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        {/* "/" and any unknown URL lead to the calendar. */}
        <Route path="*" element={<Navigate to="/calendrier" replace />} />
      </Routes>
    </AppShell>
  )
}