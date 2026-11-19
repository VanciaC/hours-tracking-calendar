import { useState, type FormEvent } from 'react'
import { useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { RegisterDocument } from '../../graphql/__generated__/graphql'
import { errorCode, graphQLErrors, invalidFields } from '../../lib/graphqlErrors'

/** Same rule as the API (US-03). */
const MIN_PASSWORD_LENGTH = 8

type Invitation = {
  token: string
  email: string
}

type RegisterFormProps = {
  /** Sign-up from an emailed invitation: the address is the invited one and cannot change. */
  invitation?: Invitation
  /** Called with the address of the new account, and whether it can sign in right away. */
  onRegistered: (email: string, verified: boolean) => void
}

export function RegisterForm({ invitation, onRegistered }: RegisterFormProps) {
  const { t, i18n } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(invitation?.email ?? '')
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
        variables: {
          name,
          email,
          password,
          passwordConfirmation,
          locale: i18n.language,
          invitationToken: invitation?.token ?? null,
        },
      })

      if (data) {
        onRegistered(data.register.email, data.register.verified)
      }
    } catch {
      // The error is exposed by useMutation and rendered below.
    }
  }

  function errorMessage(): string {
    const errors = graphQLErrors(error)
    const fields = invalidFields(errors)

    switch (errorCode(errors)) {
      case 'REGISTRATION_DISABLED':
        return t('register.disabled')
      case 'INVITATION_REQUIRED':
        return t('invitation.inviteOnly.text')
      case 'INVALID_INVITATION':
        return t('invitation.invalid.text')
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
          readOnly={invitation !== undefined}
          required
        />
        {invitation && <span className="form-hint">{t('invitation.emailLocked')}</span>}
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
