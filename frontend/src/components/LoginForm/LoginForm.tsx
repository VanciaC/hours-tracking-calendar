import { useState, type FormEvent } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { AuthApiError, authApi } from '../../auth/authApi'
import { session } from '../../auth/session'
import { ResendVerification } from '../ResendVerification/ResendVerification'

type LoginFormProps = {
  /** Shows why the user is back on the sign-in page. */
  sessionExpired?: boolean
}

export function LoginForm({ sessionExpired = false }: LoginFormProps) {
  const { t } = useTranslation()
  const client = useApolloClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // "NETWORK" when the API could not be reached at all.
  const [errorCode, setErrorCode] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorCode(null)

    try {
      session.start(await authApi.login(email, password))
      // Refetches the active queries (including "me") with the new token.
      await client.resetStore()
    } catch (error) {
      setErrorCode(error instanceof AuthApiError ? error.code : 'NETWORK')
    } finally {
      setLoading(false)
    }
  }

  function errorMessage(code: string): string {
    switch (code) {
      case 'EMAIL_NOT_VERIFIED':
        return t('login.notVerified')
      case 'TOO_MANY_ATTEMPTS':
        return t('login.tooManyAttempts')
      case 'INVALID_CREDENTIALS':
      case 'HTTP_422':
        return t('login.invalidCredentials')
      default:
        return t('login.serverUnreachable')
    }
  }

  return (
    <>
      {sessionExpired && (
        <p className="auth-notice" role="status">
          {t('login.sessionExpired')}
        </p>
      )}

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{t('login.title')}</h2>

        <label>
          {t('login.email')}
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          {t('login.password')}
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorCode !== null && (
          <p className="form-error" role="alert">
            {errorMessage(errorCode)}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      {/* Outside the login form: a form cannot contain another form. */}
      {errorCode === 'EMAIL_NOT_VERIFIED' && <ResendVerification email={email} />}
    </>
  )
}
