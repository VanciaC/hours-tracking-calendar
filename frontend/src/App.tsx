import { useEffect, useRef, useState } from 'react'
import { useApolloClient, useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { authApi } from './auth/authApi'
import { session } from './auth/session'
import { useRestoredSession } from './auth/useRestoredSession'
import { AppShell } from './components/AppShell/AppShell'
import { MeDocument } from './graphql/__generated__/graphql'
import { forgetCalendarView } from './lib/calendarView'
import { forgetPlanningView } from './lib/planningView'
import { AdminInvitationsPage } from './pages/AdminInvitationsPage/AdminInvitationsPage'
import { AdminUserPage } from './pages/AdminUserPage/AdminUserPage'
import { AdminUsersPage } from './pages/AdminUsersPage/AdminUsersPage'
import { CalendarPage } from './pages/CalendarPage/CalendarPage'
import { EntryPage } from './pages/EntryPage/EntryPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { PrivacyPage } from './pages/PrivacyPage/PrivacyPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage/ResetPasswordPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { TeamPlanningPage } from './pages/TeamPlanningPage/TeamPlanningPage'
import { TenantErrorPage } from './pages/TenantErrorPage/TenantErrorPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage/VerifyEmailPage'
import { TenantContext } from './tenant/TenantContext'
import { useCurrentTenant } from './tenant/useCurrentTenant'

/** Signed in or not, this page handles what comes after the email link itself. */
const VERIFY_EMAIL_PATH = '/verifier-email'

export default function App() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const navigate = useNavigate()
  const location = useLocation()
  const tenant = useCurrentTenant()
  const restored = useRestoredSession()
  const [sessionExpired, setSessionExpired] = useState(false)
  // Waits for the company and the session restore, so "me" is asked with the access token when there is one.
  const { loading, error, data } = useQuery(MeDocument, { skip: !restored || tenant.status !== 'ready' })

  const settled = restored && !loading
  const userId = data?.me?.id ?? null

  useEffect(
    () =>
      session.onExpired(() => {
        setSessionExpired(true)
        // Refetches "me" without a token: it now returns null, which shows the sign-in page.
        void client.resetStore()
      }),
    [client],
  )

  /*
   * After signing in, whatever the account, start from the role's home page:
   * the month calendar, or the team schedule for admins. undefined = not known yet,
   * so reloading a page while signed in keeps it.
   */
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!settled || tenant.status !== 'ready') return

    const signedIn = previousUserId.current === null && userId !== null
    previousUserId.current = userId

    if (signedIn && location.pathname !== VERIFY_EMAIL_PATH) {
      forgetCalendarView()
      forgetPlanningView()
      navigate('/', { replace: true })
    }
  }, [settled, tenant.status, userId, location.pathname, navigate])

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

  // The address must lead to an active company before anything else.
  if (tenant.status === 'unknown' || tenant.status === 'suspended') {
    return <TenantErrorPage reason={tenant.status} />
  }

  if (tenant.status === 'unreachable') {
    return (
      <main className="app-status">
        <p className="form-error">{t('status.apiUnreachable', { message: '' })}</p>
      </main>
    )
  }

  if (tenant.status === 'loading' || !settled) {
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
  const isAdmin = user?.role === 'ADMIN'

  return (
    <TenantContext value={tenant.tenant}>
      <Routes>
        {/* Signed in or not: the link from the email can be opened in any browser. */}
        <Route path={VERIFY_EMAIL_PATH} element={<VerifyEmailPage />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />

        {user ? (
          // One shell for everyone: admins get the admin section in the same sidebar.
          <Route
            element={
              <AppShell user={user} onLogout={handleLogout}>
                <Outlet />
              </AppShell>
            }
          >
            <Route path="/calendrier" element={<CalendarPage />} />
            <Route path="/saisie" element={<EntryPage />} />
            <Route path="/reglages" element={<SettingsPage />} />

            {/* For a regular user these routes do not exist, so /admin falls to "*" below.
                This only hides screens: the API refuses every admin query without the role. */}
            {isAdmin && (
              <>
                <Route path="/admin" element={<Navigate to="/admin/planning" replace />} />
                <Route path="/admin/planning" element={<TeamPlanningPage />} />
                <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
                <Route path="/admin/utilisateurs/:id" element={<AdminUserPage />} />
                <Route path="/admin/invitations" element={<AdminInvitationsPage />} />
              </>
            )}

            {/* "/" and any unknown URL: admins land on the team schedule, everyone else on their calendar. */}
            <Route path="*" element={<Navigate to={isAdmin ? '/admin/planning' : '/calendrier'} replace />} />
          </Route>
        ) : (
          <>
            <Route path="/inscription" element={<RegisterPage />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            {/* Any other URL shows the sign-in page. Once signed in, the app starts from the home page. */}
            <Route path="*" element={<LoginPage sessionExpired={sessionExpired} />} />
          </>
        )}
      </Routes>
    </TenantContext>
  )
}
