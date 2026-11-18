import { useEffect, useState } from 'react'
import { useApolloClient, useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, Route, Routes } from 'react-router'
import { authApi } from './auth/authApi'
import { session } from './auth/session'
import { useRestoredSession } from './auth/useRestoredSession'
import { AppShell } from './components/AppShell/AppShell'
import { MeDocument } from './graphql/__generated__/graphql'
import { CalendarPage } from './pages/CalendarPage/CalendarPage'
import { EntryPage } from './pages/EntryPage/EntryPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage/VerifyEmailPage'
import { AdminUsersPage } from './pages/AdminUsersPage/AdminUsersPage'
import { TeamPlanningPage } from './pages/TeamPlanningPage/TeamPlanningPage'

export default function App() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const restored = useRestoredSession()
  const [sessionExpired, setSessionExpired] = useState(false)
  // Waits for the session restore, so "me" is asked with the access token when there is one.
  const { loading, error, data } = useQuery(MeDocument, { skip: !restored })

  useEffect(
    () =>
      session.onExpired(() => {
        setSessionExpired(true)
        // Refetches "me" without a token: it now returns null, which shows the sign-in page.
        void client.resetStore()
      }),
    [client],
  )

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // Signed out locally anyway: the access token expires within minutes.
    }

    session.clear()
    setSessionExpired(false)
    await client.resetStore()
  }

  if (!restored || loading) {
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

  return (
    <Routes>
      {/* Signed in or not: the link from the email can be opened in any browser. */}
      <Route path="/verifier-email" element={<VerifyEmailPage />} />

      {user ? (
        <>
          {/* Personal space: every page below is rendered inside the shell, in place of <Outlet />. */}
          <Route
            element={
              <AppShell user={user} area="personal" onLogout={handleLogout}>
                <Outlet />
              </AppShell>
            }
          >
            <Route path="/calendrier" element={<CalendarPage />} />
            <Route path="/saisie" element={<EntryPage />} />
            <Route path="/reglages" element={<SettingsPage />} />
          </Route>

          {/* Admin panel. For a regular user these routes do not exist, so /admin falls to "*" below.
              This only hides screens: the API refuses every admin query without the role. */}
          {user.role === 'ADMIN' && (
            <Route
              path="/admin"
              element={
                <AppShell user={user} area="admin" onLogout={handleLogout}>
                  <Outlet />
                </AppShell>
              }
            >
              <Route index element={<Navigate to="planning" replace />} />
              <Route path="planning" element={<TeamPlanningPage />} />
              <Route path="utilisateurs" element={<AdminUsersPage />} />
              <Route path="*" element={<Navigate to="/admin/planning" replace />} />
            </Route>
          )}

          {/* "/" and any unknown URL lead to the calendar. */}
          <Route path="*" element={<Navigate to="/calendrier" replace />} />
        </>
      ) : (
        <>
          <Route path="/inscription" element={<RegisterPage />} />
          {/* Any other URL shows the sign-in page, and stays the same once signed in. */}
          <Route path="*" element={<LoginPage sessionExpired={sessionExpired} />} />
        </>
      )}
    </Routes>
  )
}
