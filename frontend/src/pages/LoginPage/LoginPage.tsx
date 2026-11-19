import { useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { LoginForm } from '../../components/LoginForm/LoginForm'
import { RegistrationModeDocument } from '../../graphql/__generated__/graphql'

type LoginPageProps = {
  sessionExpired?: boolean
}

/** Sign-in page, shown for any URL while signed out. */
export function LoginPage({ sessionExpired = false }: LoginPageProps) {
  const { t } = useTranslation()
  const { data } = useQuery(RegistrationModeDocument)

  return (
    <AuthLayout>
      <LoginForm sessionExpired={sessionExpired} />

      {/* Invited people arrive from their email: the link only makes sense when anyone may sign up. */}
      {data?.registrationMode === 'OPEN' && (
        <p className="auth-switch">
          {t('login.noAccount')} <Link to="/inscription">{t('login.toRegister')}</Link>
        </p>
      )}
    </AuthLayout>
  )
}
