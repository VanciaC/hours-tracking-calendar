import { Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '../../components/LoginForm/LoginForm'
import './LoginPage.css'

/** Full-screen sign-in page: brand above the login form. */
export function LoginPage() {
  const { t } = useTranslation()

  return (
    <main className="login-page">
      <div className="login-brand">
        <Clock3 size={28} aria-hidden="true" />
        {t('app.name')}
      </div>
      <LoginForm />
    </main>
  )
}