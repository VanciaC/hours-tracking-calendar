import { useEffect, useRef, useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { tokenStorage } from '../../auth/tokenStorage'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { ResendVerification } from '../../components/ResendVerification/ResendVerification'
import { VerifyEmailDocument } from '../../graphql/__generated__/graphql'
import { errorCode, graphQLErrors } from '../../lib/graphqlErrors'

/** Opened from the link in the verification email (US-22): verifies the address, then signs the user in. */
export function VerifyEmailPage() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Read once: the token is removed from the address bar right after.
  const [token] = useState(() => searchParams.get('token'))
  const [verifyEmail, { error }] = useMutation(VerifyEmailDocument)
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

    verifyEmail({ variables: { token } })
      .then(async ({ data }) => {
        if (!data) {
          return
        }

        tokenStorage.save(data.verifyEmail.accessToken, data.verifyEmail.expiresIn)
        await client.resetStore()
        navigate('/calendrier', { replace: true })
      })
      .catch(() => {
        // The error is exposed by useMutation and rendered below.
      })
  }, [client, navigate, setSearchParams, token, verifyEmail])

  const invalidLink = token === null || errorCode(graphQLErrors(error)) === 'INVALID_VERIFICATION_TOKEN'

  if (invalidLink) {
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
        {error ? (
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
