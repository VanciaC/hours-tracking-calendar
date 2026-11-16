import { useApolloClient, useQuery } from '@apollo/client/react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import { tokenStorage } from './auth/tokenStorage'
import { LoginForm } from './components/LoginForm/LoginForm'
import { MeDocument } from './graphql/__generated__/graphql'
import { CalendarPage } from './pages/CalendarPage/CalendarPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { EntryPage } from './pages/EntryPage/EntryPage'

export default function App() {
  const client = useApolloClient()
  const { loading, error, data } = useQuery(MeDocument)

  async function handleLogout() {
    tokenStorage.clear()
    // Refetches "me" without the token: it now returns null.
    await client.resetStore()
  }

  if (loading) {
    return <main className="app">Chargement…</main>
  }

  if (error) {
    return (
      <main className="app">
        <p className="form-error">API injoignable · {error.message}</p>
      </main>
    )
  }

  const user = data?.me ?? null

  return (
    <main className="app">
      <header className="app-header">
        <h1>Hours Tracking Calendar</h1>
        {user && (
          <>
            <nav className="app-tabs" aria-label="Navigation principale">
              <NavLink to="/calendrier">Calendrier</NavLink>
              <NavLink to="/saisie">Saisie</NavLink>
              <NavLink to="/reglages">Réglages</NavLink>
            </nav>
            <div className="session">
              <span>{user.name}</span>
              <button type="button" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </header>

      {user ? (
        <Routes>
          <Route path="/calendrier" element={<CalendarPage />} />
          <Route path="/saisie" element={<EntryPage />} />
          <Route path="/reglages" element={<SettingsPage />} />
          {/* "/" and any unknown URL lead to the calendar. */}
          <Route path="*" element={<Navigate to="/calendrier" replace />} />
        </Routes>
      ) : (
        <LoginForm />
      )}
    </main>
  )
}