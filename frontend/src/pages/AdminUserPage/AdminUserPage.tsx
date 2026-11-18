import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { isSameMonth } from 'date-fns'
import { ArrowLeft, Eye } from 'lucide-react'
import { CalendarMonth } from '../../components/CalendarMonth/CalendarMonth'
import { AdminUserCalendarDocument } from '../../graphql/__generated__/graphql'
import { parseMonthParam, toIsoDate, toMonthParam, visibleRange } from '../../lib/calendar'
import { initials } from '../../lib/people'
import './AdminUserPage.css'

/** A regular user's month, hours, totals and estimated pay, read-only (US-28). */
export function AdminUserPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const monthParam = searchParams.get('mois')

  const month = useMemo(() => parseMonthParam(monthParam), [monthParam])
  const { from, to } = useMemo(() => visibleRange(month), [month])

  const { data, previousData, loading, error } = useQuery(AdminUserCalendarDocument, {
    variables: { id, from: toIsoDate(from), to: toIsoDate(to) },
  })

  function handleMonthChange(next: Date) {
    setSearchParams(isSameMonth(next, new Date()) ? {} : { mois: toMonthParam(next) })
  }

  const backLink = (
    <Link to="/admin/utilisateurs" className="admin-user-back">
      <ArrowLeft size={16} aria-hidden="true" />
      {t('admin.user.back')}
    </Link>
  )

  // Unknown id, or another admin: the API answers null (RG-12).
  if (data && data.adminUser === null) {
    return (
      <section className="admin-user">
        {backLink}
        <p className="admin-user-missing">{t('admin.user.notFound')}</p>
      </section>
    )
  }

  // While another month loads, keeps the current one on screen instead of blinking.
  const user = data?.adminUser ?? previousData?.adminUser

  return (
    <section className="admin-user">
      {backLink}

      {user && (
        <header className="admin-user-header">
          <span className="admin-user-avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <div className="admin-user-identity">
            <h1>{user.name}</h1>
            <span>{user.email}</span>
          </div>
          <span className="admin-user-readonly">
            <Eye size={14} aria-hidden="true" />
            {t('admin.user.readOnly')}
          </span>
        </header>
      )}

      <CalendarMonth
        month={month}
        onMonthChange={handleMonthChange}
        calendar={user}
        loading={loading}
        error={error}
        readOnly
      />
    </section>
  )
}
