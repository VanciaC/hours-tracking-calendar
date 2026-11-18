import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { RequestPasswordResetDocument } from '../../graphql/__generated__/graphql'

/** Asks for a link to choose a new password (US-24). */
export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [requestReset, { loading, data, error }] = useMutation(RequestPasswordResetDocument)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await requestReset({ variables: { email } })
    } catch {
      // The error is exposed by useMutation and rendered below.
    }
  }

  return (
    <AuthLayout>
      {data ? (
        // Same message whether the address has an account or not, like the API.
        <section className="auth-card" aria-live="polite">
          <h2>{t('forgotPassword.sentTitle')}</h2>
          <p>{t('forgotPassword.sentText', { email })}</p>
        </section>
      ) : (
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>{t('forgotPassword.title')}</h2>
          <p className="form-hint">{t('forgotPassword.intro')}</p>

          <label>
            {t('login.email')}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {t('login.serverUnreachable')}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
          </button>
        </form>
      )}

      <p className="auth-switch">
        <Link to="/">{t('forgotPassword.backToLogin')}</Link>
      </p>
    </AuthLayout>
  )
}
