import { useState, type FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { RegisterDocument } from '../../graphql/__generated__/graphql'
import { errorCode, graphQLErrors, invalidFields } from '../../lib/graphqlErrors'

/** Same rule as the API (US-03). */
const MIN_PASSWORD_LENGTH = 8

type RegisterFormProps = {
  /** Called with the address the verification email was sent to. */
  onRegistered: (email: string) => void
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { t, i18n } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [register, { loading, error }] = useMutation(RegisterDocument)

  // Only flagged once the user has started typing the confirmation.
  const passwordsMismatch = passwordConfirmation !== '' && password !== passwordConfirmation

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== passwordConfirmation) {
      return
    }

    try {
      const { data } = await register({
        variables: { name, email, password, passwordConfirmation, locale: i18n.language },
      })

      if (data) {
        onRegistered(data.register.email)
      }
    } catch {
      // The error is exposed by useMutation and rendered below.
    }
  }

  function errorMessage(): string {
    const errors = graphQLErrors(error)
    const fields = invalidFields(errors)

    if (errorCode(errors) === 'REGISTRATION_DISABLED') {
      return t('register.disabled')
    }
    if (fields.includes('email')) {
      return t('register.emailTaken')
    }
    if (fields.length > 0) {
      return t('register.invalid')
    }

    return t('login.serverUnreachable')
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h2>{t('register.title')}</h2>

      <label>
        {t('register.name')}
        <input
          type="text"
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

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

      <label>
        {t('login.password')}
        <input
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <span className="form-hint">{t('register.passwordHint', { min: MIN_PASSWORD_LENGTH })}</span>
      </label>

      <label>
        {t('register.passwordConfirmation')}
        <input
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          aria-invalid={passwordsMismatch}
          required
        />
        {passwordsMismatch && <span className="form-hint">{t('register.passwordMismatch')}</span>}
      </label>

      {error && (
        <p className="form-error" role="alert">
          {errorMessage()}
        </p>
      )}

      <button type="submit" disabled={loading || passwordsMismatch}>
        {loading ? t('register.submitting') : t('register.submit')}
      </button>
    </form>
  )
}
