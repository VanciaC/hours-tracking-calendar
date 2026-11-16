import { useState, type FormEvent } from 'react'
import { CombinedGraphQLErrors } from '@apollo/client'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { tokenStorage } from '../../auth/tokenStorage'
import { LoginDocument } from '../../graphql/__generated__/graphql'
import './LoginForm.css'

export function LoginForm() {
  const { t } = useTranslation()
  const client = useApolloClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [login, { loading, error }] = useMutation(LoginDocument)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const { data } = await login({ variables: { email, password } })
      if (!data) {
        return
      }

      tokenStorage.save(data.login.accessToken, data.login.expiresIn)
      // Refetches the active queries (including "me") with the new token.
      await client.resetStore()
    } catch {
      // The error is exposed by useMutation and rendered below.
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
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

      {error && (
        <p className="form-error" role="alert">
          {CombinedGraphQLErrors.is(error) ? t('login.invalidCredentials') : t('login.serverUnreachable')}
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading ? t('login.submitting') : t('login.submit')}
      </button>
    </form>
  )
}
