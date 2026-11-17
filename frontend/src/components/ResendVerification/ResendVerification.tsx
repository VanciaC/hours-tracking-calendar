import { useState, type FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { ResendVerificationEmailDocument } from '../../graphql/__generated__/graphql'

type ResendVerificationProps = {
  /** Known address: only the button is shown. Without it, the user types the address. */
  email?: string
}

/** Sends a new verification email (US-23). */
export function ResendVerification({ email: knownEmail }: ResendVerificationProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState(knownEmail ?? '')
  const [resend, { loading, data, error }] = useMutation(ResendVerificationEmailDocument)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await resend({ variables: { email } })
    } catch {
      // The error is exposed by useMutation and rendered below.
    }
  }

  // Same message whether the address has an account or not, like the API.
  if (data) {
    return (
      <p className="auth-notice" role="status">
        {t('resend.sent')}
      </p>
    )
  }

  return (
    <form className="resend-verification" onSubmit={handleSubmit}>
      {knownEmail === undefined && (
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
      )}

      {error && (
        <p className="form-error" role="alert">
          {t('login.serverUnreachable')}
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading ? t('resend.sending') : t('resend.submit')}
      </button>
    </form>
  )
}
