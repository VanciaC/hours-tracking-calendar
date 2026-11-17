import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { RegisterForm } from '../../components/RegisterForm/RegisterForm'
import { ResendVerification } from '../../components/ResendVerification/ResendVerification'

/** Sign-up page (US-03), then "check your inbox" once the account is created. */
export function RegisterPage() {
  const { t } = useTranslation()
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  return (
    <AuthLayout>
      {registeredEmail === null ? (
        <RegisterForm onRegistered={setRegisteredEmail} />
      ) : (
        <CheckYourInbox email={registeredEmail} />
      )}

      <p className="auth-switch">
        {t('register.haveAccount')} <Link to="/">{t('register.toLogin')}</Link>
      </p>
    </AuthLayout>
  )
}

function CheckYourInbox({ email }: { email: string }) {
  const { t } = useTranslation()

  return (
    <section className="auth-card" aria-live="polite">
      <h2>{t('checkEmail.title')}</h2>
      <p>{t('checkEmail.text', { email })}</p>
      <p>{t('checkEmail.notReceived')}</p>
      <ResendVerification email={email} />
    </section>
  )
}
