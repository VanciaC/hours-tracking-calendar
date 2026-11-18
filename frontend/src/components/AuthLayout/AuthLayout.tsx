import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: ReactNode
  /** The privacy page itself hides the link to itself. */
  showPrivacyLink?: boolean
}

/** Full-screen layout of the signed-out screens: brand above the content, privacy link below. */
export function AuthLayout({ children, showPrivacyLink = true }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <main className="auth-layout">
      <div className="auth-brand">
        <Clock3 size={28} aria-hidden="true" />
        {t('app.name')}
      </div>
      {children}
      {showPrivacyLink && (
        <Link to="/confidentialite" className="auth-legal-link">
          {t('privacy.link')}
        </Link>
      )}
    </main>
  )
}
