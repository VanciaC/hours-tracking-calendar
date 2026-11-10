import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

// Requête de test qui traverse le router et touche auth-service.
const API_STATUS = gql`
  query ApiStatus {
    me {
      id
      name
    }
  }
`

type ApiStatusData = {
  me: { id: string; name: string } | null
}

export default function App() {
  const { loading, error, data } = useQuery<ApiStatusData>(API_STATUS)

  return (
    <main className="app">
      <h1>Hours Tracking Calendar</h1>

      <p className="status">
        {loading && 'Connexion à l’API…'}
        {error && <span className="ko">API injoignable · {error.message}</span>}
        {!loading && !error && (
          <span className="ok">
            API connectée · {data?.me ? `connecté en tant que ${data.me.name}` : 'non connecté'}
          </span>
        )}
      </p>

      <p className="hint">Le calendrier arrive avec US-04.</p>
    </main>
  )
}
