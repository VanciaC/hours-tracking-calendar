import { Clock3 } from 'lucide-react'
import { APP_NAME } from '../../components/AppShell/AppShell'
import { LoginForm } from '../../components/LoginForm/LoginForm'
import './LoginPage.css'

/** Full-screen sign-in page: brand above the login form. */
export function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-brand">
        <Clock3 size={28} aria-hidden="true" />
        {APP_NAME}
      </div>
      <LoginForm />
    </main>
  )
}