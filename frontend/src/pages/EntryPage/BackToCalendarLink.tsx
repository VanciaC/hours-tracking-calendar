import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { parseISO } from 'date-fns'
import { toMonthParam } from '../../lib/calendar'

interface BackToCalendarLinkProps {
  /** ISO date whose month the calendar should open on. */
  date: string
}

/** Link back to the calendar, on the month of the day being edited. */
export function BackToCalendarLink({ date }: BackToCalendarLinkProps) {
  return (
    <Link to={`/calendrier?mois=${toMonthParam(parseISO(date))}`} className="entry-back">
      <ArrowLeft size={16} aria-hidden="true" />
      Retour au calendrier
    </Link>
  )
}