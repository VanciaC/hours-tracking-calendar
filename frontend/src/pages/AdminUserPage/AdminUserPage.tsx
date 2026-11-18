import { useQuery } from '@apollo/client/react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye } from 'lucide-react'
import { CalendarMonth } from '../../components/CalendarMonth/CalendarMonth'
import { CalendarViewSwitch } from '../../components/CalendarViewSwitch/CalendarViewSwitch'
import { useCalendarPeriod, type CalendarView } from '../../components/CalendarViewSwitch/useCalendarPeriod'
import { CalendarWeek } from '../../components/CalendarWeek/CalendarWeek'
import { AdminUserCalendarDocument } from '../../graphql/__generated__/graphql'
import { initials } from '../../lib/people'
import './AdminUserPage.css'

/** Same views, in the same order, as the team schedule. */
const VIEWS: readonly CalendarView[] = ['jour', 'semaine', 'mois']

/** A regular user's day, week or month, hours, totals and estimated pay, read-only (US-28). */
export function AdminUserPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const period = useCalendarPeriod(VIEWS)

  const { data, previousData, loading, error } = useQuery(AdminUserCalendarDocument, {
    variables: { id, from: period.from, to: period.to },
  })

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

  // While another period loads, keeps the current one on screen instead of blinking.
  const user = data?.adminUser ?? previousData?.adminUser
  const toolbar = <CalendarViewSwitch views={VIEWS} view={period.view} onChange={period.switchTo} />

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

      {period.view === 'mois' ? (
        <CalendarMonth
          month={period.month}
          onMonthChange={period.showMonth}
          calendar={user}
          loading={loading}
          error={error}
          toolbar={toolbar}
          readOnly
        />
      ) : (
        <CalendarWeek
          days={period.days}
          onDateChange={period.showDate}
          calendar={user}
          loading={loading}
          error={error}
          toolbar={toolbar}
          readOnly
        />
      )}
    </section>
  )
}
