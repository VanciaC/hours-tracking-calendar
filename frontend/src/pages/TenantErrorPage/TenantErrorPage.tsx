import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'

type TenantErrorPageProps = {
  /** unknown: no company at this address. suspended: the company's access is cut off. */
  reason: 'unknown' | 'suspended'
}

/** Shown instead of the app when the address does not lead to an active company. */
export function TenantErrorPage({ reason }: TenantErrorPageProps) {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <section className="auth-card" aria-live="polite">
        <h2>{t(`tenant.${reason}.title`)}</h2>
        <p>{t(`tenant.${reason}.text`)}</p>
      </section>
    </AuthLayout>
  )
}
