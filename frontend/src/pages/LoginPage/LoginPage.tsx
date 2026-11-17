import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { LoginForm } from '../../components/LoginForm/LoginForm'

/** Sign-in page, shown for any URL while signed out. */
export function LoginPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <LoginForm />
      <p className="auth-switch">
        {t('login.noAccount')} <Link to="/inscription">{t('login.toRegister')}</Link>
      </p>
    </AuthLayout>
  )
}
