import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { useFormatters } from '../../i18n/useFormatters'
import { PRIVACY_CONTACT, PRIVACY_OWNER, PRIVACY_UPDATED } from '../../lib/privacy'
import './PrivacyPage.css'

/** What the app collects, why, who sees it and for how long (GDPR article 13). Open to everyone. */
export function PrivacyPage() {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const navigate = useNavigate()

  function goBack() {
    // Opened from a link in the app: back to where it was. Opened directly: back to the start.
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <AuthLayout showPrivacyLink={false}>
      <article className="privacy">
        <button type="button" className="privacy-back" onClick={goBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t('privacy.back')}
        </button>

        <h1>{t('privacy.title')}</h1>
        <p className="privacy-updated">{t('privacy.updated', { date: fmt.longDate(parseISO(PRIVACY_UPDATED)) })}</p>
        <p>{t('privacy.intro')}</p>

        <section>
          <h2>{t('privacy.controller.title')}</h2>
          <p>{t('privacy.controller.text', { name: PRIVACY_OWNER })}</p>
          <p>
            {t('privacy.contact')} <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>
          </p>
        </section>

        <section>
          <h2>{t('privacy.data.title')}</h2>
          <ul>
            <li>{t('privacy.data.account')}</li>
            <li>{t('privacy.data.hours')}</li>
            <li>{t('privacy.data.rates')}</li>
            <li>{t('privacy.data.technical')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.purposes.title')}</h2>
          <p>{t('privacy.purposes.text')}</p>
        </section>

        <section>
          <h2>{t('privacy.legalBasis.title')}</h2>
          <p>{t('privacy.legalBasis.text')}</p>
        </section>

        <section>
          <h2>{t('privacy.recipients.title')}</h2>
          <ul>
            <li>{t('privacy.recipients.you')}</li>
            <li>{t('privacy.recipients.admins')}</li>
            <li>{t('privacy.recipients.providers')}</li>
          </ul>
          <p>{t('privacy.recipients.noSale')}</p>
        </section>

        <section>
          <h2>{t('privacy.retention.title')}</h2>
          <ul>
            <li>{t('privacy.retention.account')}</li>
            <li>{t('privacy.retention.request')}</li>
            <li>{t('privacy.retention.unverified')}</li>
            <li>{t('privacy.retention.inactive')}</li>
            <li>{t('privacy.retention.backups')}</li>
            <li>{t('privacy.retention.links')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.storage.title')}</h2>
          <p>{t('privacy.storage.text')}</p>
        </section>

        <section>
          <h2>{t('privacy.rights.title')}</h2>
          <p>{t('privacy.rights.text')}</p>
          <p>
            {t('privacy.rights.complaint')}{' '}
            <a href="https://www.cnil.fr/fr/adresser-une-plainte" target="_blank" rel="noreferrer">
              cnil.fr
            </a>
          </p>
        </section>
      </article>
    </AuthLayout>
  )
}
