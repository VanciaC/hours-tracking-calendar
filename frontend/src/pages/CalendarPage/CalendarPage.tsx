import { useState } from 'react'
import { startOfMonth } from 'date-fns'
import { CalendarMonth } from '../../components/CalendarMonth/CalendarMonth'

export function CalendarPage() {
  // Kept in state so the month navigation only needs the setter.
  const [month] = useState(() => startOfMonth(new Date()))

  return <CalendarMonth month={month} />
}