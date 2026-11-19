import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { RegisterForm } from '../../components/RegisterForm/RegisterForm'
import { ResendVerification } from '../../components/ResendVerification/ResendVerification'
import { InvitationPreviewDocument, RegistrationModeDocument } from '../../graphql/__generated__/graphql'

type Registered = { email: string; verified: boolean }

/**
 * Sign-up page (US-03, US-33).
 * From an invitation link (?invitation=…): the form, with the invited address.
 * Without one: the form in open mode, otherwise a note that sign-up is by invitation.
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('invitation')
  const [registered, setRegistered] = useState<Registered | null>(null)

  const mode = useQuery(RegistrationModeDocument, { skip: token !== null })
  const preview = useQuery(InvitationPreviewDocument, {
    variables: { token: token ?? '' },
    skip: token === null,
  })

  function handleRegistered(email: string, verified: boolean) {
    setRegistered({ email, verified })
  }

  function content() {
    if (registered) {
      return registered.verified ? <AccountReady /> : <CheckYourInbox email={registered.email} />
    }

    if (token !== null) {
      if (preview.loading) return <p className="auth-card">{t('status.loading')}</p>
      if (preview.error) return <Notice title={t('register.title')} text={t('login.serverUnreachable')} />

      const invitedEmail = preview.data?.invitation?.email
      if (!invitedEmail) return <Notice title={t('invitation.invalid.title')} text={t('invitation.invalid.text')} />

      return (
        <SignUp form={<RegisterForm invitation={{ token, email: invitedEmail }} onRegistered={handleRegistered} />} />
      )
    }

    if (mode.loading) return <p className="auth-card">{t('status.loading')}</p>
    if (mode.data?.registrationMode !== 'OPEN') {
      return <Notice title={t('invitation.inviteOnly.title')} text={t('invitation.inviteOnly.text')} />
    }

    return <SignUp form={<RegisterForm onRegistered={handleRegistered} />} />
  }

  return (
    <AuthLayout>
      {content()}

      {!registered?.verified && (
        <p className="auth-switch">
          {t('register.haveAccount')} <Link to="/">{t('register.toLogin')}</Link>
        </p>
      )}
    </AuthLayout>
  )
}

/** The form, then the privacy notice: told at the moment the data is collected (GDPR article 13). */
function SignUp({ form }: { form: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <>
      {form}
      <p className="auth-legal">
        {t('privacy.signupNotice')} <Link to="/confidentialite">{t('privacy.signupLink')}</Link>
      </p>
    </>
  )
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <section className="auth-card" aria-live="polite">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  )
}

/** Invited: the account is already verified, no email to wait for. */
function AccountReady() {
  const { t } = useTranslation()

  return (
    <section className="auth-card" aria-live="polite">
      <h2>{t('invitation.ready.title')}</h2>
      <p>{t('invitation.ready.text')}</p>
      <Link to="/" className="auth-button-link">
        {t('invitation.ready.toLogin')}
      </Link>
    </section>
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
