import { useEffect, useRef, useState } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuthApiError, authApi } from '../../auth/authApi'
import { session } from '../../auth/session'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { ResendVerification } from '../../components/ResendVerification/ResendVerification'

type Failure = 'invalid' | 'network'

/** Opened from the link in the verification email (US-22): verifies the address, then signs the user in. */
export function VerifyEmailPage() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Read once: the token is removed from the address bar right after.
  const [token] = useState(() => searchParams.get('token'))
  const [failure, setFailure] = useState<Failure | null>(null)
  const sent = useRef(false)

  useEffect(() => {
    // StrictMode runs effects twice in development, and the token is single-use: send it only once.
    if (sent.current) {
      return
    }
    sent.current = true

    // Keeps the token out of the browser history.
    setSearchParams({}, { replace: true })

    if (token === null) {
      return
    }

    authApi
      .verifyEmail(token)
      .then(async (accessToken) => {
        session.start(accessToken)
        await client.resetStore()
        navigate('/calendrier', { replace: true })
      })
      .catch((error: unknown) => {
        const invalid = error instanceof AuthApiError && error.code === 'INVALID_VERIFICATION_TOKEN'
        setFailure(invalid ? 'invalid' : 'network')
      })
  }, [client, navigate, setSearchParams, token])

  if (token === null || failure === 'invalid') {
    return (
      <AuthLayout>
        <section className="auth-card">
          <h2>{t('verifyEmail.invalidTitle')}</h2>
          <p>{t('verifyEmail.invalidText')}</p>
          <ResendVerification />
        </section>
        <p className="auth-switch">
          <Link to="/">{t('verifyEmail.backToLogin')}</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <section className="auth-card" aria-live="polite">
        {failure === 'network' ? (
          <p className="form-error" role="alert">
            {t('login.serverUnreachable')}
          </p>
        ) : (
          <p>{t('verifyEmail.verifying')}</p>
        )}
      </section>
    </AuthLayout>
  )
}
