import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { session } from '../../auth/session'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { ResetPasswordDocument } from '../../graphql/__generated__/graphql'
import { errorCode, graphQLErrors } from '../../lib/graphqlErrors'

/** Same rule as the API (and as sign-up). */
const MIN_PASSWORD_LENGTH = 8

type Status = 'form' | 'done' | 'invalid'
type FormError = 'tooShort' | 'mismatch' | 'network'

/** Opened from the link in the reset email (US-24): sets a new password. */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const [searchParams, setSearchParams] = useSearchParams()
  // Read once: the token is removed from the address bar right after.
  const [token] = useState(() => searchParams.get('token'))
  const [status, setStatus] = useState<Status>(token === null ? 'invalid' : 'form')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState<FormError | null>(null)
  const [resetPassword, { loading }] = useMutation(ResetPasswordDocument)

  // Keeps the token out of the browser history.
  useEffect(() => {
    if (searchParams.has('token')) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Checked here first, for an immediate answer. The API checks again.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError('tooShort')
      return
    }

    if (password !== confirmation) {
      setFormError('mismatch')
      return
    }

    if (token === null) {
      return
    }

    setFormError(null)

    try {
      await resetPassword({ variables: { token, password, passwordConfirmation: confirmation } })
      // Every session of the account was revoked by the API: this browser forgets its own too.
      session.clear()
      await client.resetStore()
      setStatus('done')
    } catch (error) {
      if (errorCode(graphQLErrors(error)) === 'INVALID_RESET_TOKEN') {
        setStatus('invalid')
      } else {
        setFormError('network')
      }
    }
  }

  function formErrorMessage(error: FormError): string {
    switch (error) {
      case 'tooShort':
        return t('resetPassword.tooShort', { min: MIN_PASSWORD_LENGTH })
      case 'mismatch':
        return t('resetPassword.mismatch')
      case 'network':
        return t('login.serverUnreachable')
    }
  }

  if (status === 'done') {
    return (
      <AuthLayout>
        <section className="auth-card" aria-live="polite">
          <h2>{t('resetPassword.doneTitle')}</h2>
          <p>{t('resetPassword.doneText')}</p>
          <Link to="/" className="auth-button-link">
            {t('resetPassword.toLogin')}
          </Link>
        </section>
      </AuthLayout>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthLayout>
        <section className="auth-card">
          <h2>{t('resetPassword.invalidTitle')}</h2>
          <p>{t('resetPassword.invalidText')}</p>
          <Link to="/mot-de-passe-oublie" className="auth-button-link">
            {t('resetPassword.requestNew')}
          </Link>
        </section>
        <p className="auth-switch">
          <Link to="/">{t('forgotPassword.backToLogin')}</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h2>{t('resetPassword.title')}</h2>
        <p className="form-hint">{t('resetPassword.intro')}</p>

        <label>
          {t('resetPassword.password')}
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="reset-password-hint"
            required
          />
        </label>
        <p id="reset-password-hint" className="form-hint">
          {t('resetPassword.hint', { min: MIN_PASSWORD_LENGTH })}
        </p>

        <label>
          {t('resetPassword.confirmation')}
          <input
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </label>

        {formError !== null && (
          <p className="form-error" role="alert">
            {formErrorMessage(formError)}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
        </button>
      </form>

      <p className="auth-switch">
        <Link to="/">{t('forgotPassword.backToLogin')}</Link>
      </p>
    </AuthLayout>
  )
}
