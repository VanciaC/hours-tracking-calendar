import { useState } from 'react'
import { useApolloClient, useQuery } from '@apollo/client/react'
import { startOfMonth } from 'date-fns'
import { tokenStorage } from './auth/tokenStorage'
import { CalendarMonth } from './components/CalendarMonth/CalendarMonth'
import { LoginForm } from './components/LoginForm/LoginForm'
import { ME_QUERY, type MeQueryData } from './graphql/auth'

export default function App() {
  const client = useApolloClient()
  const { loading, error, data } = useQuery<MeQueryData>(ME_QUERY)
  // Kept in state so the month navigation (step 6) only needs the setter.
  const [month] = useState(() => startOfMonth(new Date()))

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
          <div className="session">
            <span>{user.name}</span>
            <button type="button" onClick={handleLogout}>
              Se déconnecter
            </button>
          </div>
        )}
      </header>

      {user ? <CalendarMonth month={month} /> : <LoginForm />}
    </main>
  )
}