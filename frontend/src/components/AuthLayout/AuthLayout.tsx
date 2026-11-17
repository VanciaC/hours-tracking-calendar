import type { ReactNode } from 'react'
import { Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './AuthLayout.css'

/** Full-screen layout of the signed-out screens: brand above the content. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <main className="auth-layout">
      <div className="auth-brand">
        <Clock3 size={28} aria-hidden="true" />
        {t('app.name')}
      </div>
      {children}
    </main>
  )
}
