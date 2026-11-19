import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { MailPlus, RotateCw, X } from 'lucide-react'
import {
  CreateInvitationDocument,
  InvitationsDocument,
  ResendInvitationDocument,
  RevokeInvitationDocument,
  type InvitationItemFragment,
} from '../../graphql/__generated__/graphql'
import { useFormatters } from '../../i18n/useFormatters'
import { errorCode, graphQLErrors, invalidFields } from '../../lib/graphqlErrors'
import './AdminInvitationsPage.css'

type Status = InvitationItemFragment['status']

const STATUS = {
  PENDING: { label: 'admin.invitations.status.pending', className: 'is-pending' },
  ACCEPTED: { label: 'admin.invitations.status.accepted', className: 'is-accepted' },
  EXPIRED: { label: 'admin.invitations.status.expired', className: 'is-expired' },
} as const satisfies Record<Status, { label: string; className: string }>

type Notice = { kind: 'success' | 'error'; text: string }

/** Admins invite people by email: the only way to sign up in invite mode (US-33). */
export function AdminInvitationsPage() {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const { data, loading, error } = useQuery(InvitationsDocument)
  const refetch = { refetchQueries: [InvitationsDocument] }
  const [createInvitation, { loading: sending }] = useMutation(CreateInvitationDocument, refetch)
  const [resendInvitation, { loading: resending }] = useMutation(ResendInvitationDocument, refetch)
  const [revokeInvitation, { loading: revoking }] = useMutation(RevokeInvitationDocument, refetch)
  const busy = sending || resending || revoking

  const closed = data?.registrationMode === 'CLOSED'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      const { data: result } = await createInvitation({ variables: { email: email.trim() } })

      if (result) {
        setNotice({ kind: 'success', text: t('admin.invitations.sent', { email: result.createInvitation.email }) })
        setEmail('')
      }
    } catch (failure) {
      setNotice({ kind: 'error', text: errorMessage(failure) })
    }
  }

  async function handleResend(invitation: InvitationItemFragment) {
    setNotice(null)

    try {
      await resendInvitation({ variables: { id: invitation.id } })
      setNotice({ kind: 'success', text: t('admin.invitations.resent', { email: invitation.email }) })
    } catch (failure) {
      setNotice({ kind: 'error', text: errorMessage(failure) })
    }
  }

  async function handleRevoke(invitation: InvitationItemFragment) {
    setNotice(null)

    try {
      await revokeInvitation({ variables: { id: invitation.id } })
      setNotice({ kind: 'success', text: t('admin.invitations.revoked', { email: invitation.email }) })
    } catch (failure) {
      setNotice({ kind: 'error', text: errorMessage(failure) })
    }
  }

  function errorMessage(failure: unknown): string {
    const errors = graphQLErrors(failure)

    switch (errorCode(errors)) {
      case 'EMAIL_ALREADY_REGISTERED':
        return t('admin.invitations.errors.alreadyRegistered')
      case 'REGISTRATION_DISABLED':
        return t('admin.invitations.errors.disabled')
    }

    if (invalidFields(errors).includes('email')) {
      return t('admin.invitations.errors.invalidEmail')
    }

    return t('admin.invitations.errors.generic')
  }

  return (
    <section className="admin-invitations">
      <header className="admin-invitations-header">
        <h1>{t('admin.invitations.title')}</h1>
        <p>{t('admin.invitations.intro')}</p>
      </header>

      {closed && (
        <p className="admin-invitations-warning" role="status">
          {t('admin.invitations.closed')}
        </p>
      )}

      <form className="admin-invitations-form" onSubmit={handleSubmit}>
        <label>
          <span>{t('admin.invitations.email')}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('admin.invitations.emailPlaceholder')}
            maxLength={255}
            required
            disabled={closed}
          />
        </label>
        <button type="submit" disabled={busy || closed}>
          <MailPlus size={16} aria-hidden="true" />
          {sending ? t('admin.invitations.sending') : t('admin.invitations.send')}
        </button>
      </form>

      {notice && (
        <p className={notice.kind === 'error' ? 'form-error' : 'admin-invitations-success'} role="status">
          {notice.text}
        </p>
      )}

      {error && <p className="form-error">{error.message}</p>}
      {loading && !data && <p>{t('status.loading')}</p>}

      {data &&
        (data.invitations.length === 0 ? (
          <p className="admin-invitations-empty">{t('admin.invitations.empty')}</p>
        ) : (
          <table className="admin-invitations-table">
            <thead>
              <tr>
                <th scope="col">{t('admin.invitations.columns.email')}</th>
                <th scope="col">{t('admin.invitations.columns.status')}</th>
                <th scope="col">{t('admin.invitations.columns.invitedBy')}</th>
                <th scope="col">{t('admin.invitations.columns.expires')}</th>
                <th scope="col">
                  <span className="visually-hidden">{t('admin.invitations.columns.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.invitations.map((invitation) => {
                const status = STATUS[invitation.status]
                const accepted = invitation.status === 'ACCEPTED'

                return (
                  <tr key={invitation.id}>
                    <td data-label={t('admin.invitations.columns.email')} className="admin-invitations-email">
                      {invitation.email}
                    </td>
                    <td data-label={t('admin.invitations.columns.status')}>
                      <span className={`invitation-badge ${status.className}`}>{t(status.label)}</span>
                    </td>
                    <td data-label={t('admin.invitations.columns.invitedBy')}>
                      {invitation.invitedBy?.name ?? t('admin.invitations.unknownInviter')}
                    </td>
                    <td data-label={t('admin.invitations.columns.expires')}>
                      {accepted ? '—' : fmt.longDate(parseISO(invitation.expiresAt))}
                    </td>
                    <td className="admin-invitations-actions">
                      {!accepted && (
                        <>
                          <button type="button" onClick={() => handleResend(invitation)} disabled={busy || closed}>
                            <RotateCw size={15} aria-hidden="true" />
                            {t('admin.invitations.resend')}
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => handleRevoke(invitation)}
                            disabled={busy}
                          >
                            <X size={15} aria-hidden="true" />
                            {t('admin.invitations.revoke')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ))}
    </section>
  )
}
