import { useApolloClient, useQuery } from '@apollo/client/react'
import { tokenStorage } from './auth/tokenStorage'
import { LoginForm } from './components/LoginForm'
import { ME_QUERY, type MeQueryData } from './graphql/auth'

export default function App() {
  const client = useApolloClient()
  const { loading, error, data } = useQuery<MeQueryData>(ME_QUERY)

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

      {user ? <p className="hint">Le calendrier arrive avec US-04.</p> : <LoginForm />}
    </main>
  )
}
