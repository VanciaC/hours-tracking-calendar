import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { calendarUrlFor } from '../../lib/calendarView'

interface BackToCalendarLinkProps {
  /** ISO date the calendar should show. */
  date: string
}

/** Link back to the calendar, on the day being edited, in the view the user came from. */
export function BackToCalendarLink({ date }: BackToCalendarLinkProps) {
  const { t } = useTranslation()

  return (
    <Link to={calendarUrlFor(date)} className="entry-back">
      <ArrowLeft size={16} aria-hidden="true" />
      {t('entry.back')}
    </Link>
  )
}
