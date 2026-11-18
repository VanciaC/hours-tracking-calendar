import { useTranslation } from 'react-i18next'
import { CalendarClock, CalendarDays, CalendarRange, type LucideIcon } from 'lucide-react'
import type { CalendarView } from './useCalendarPeriod'
import './CalendarViewSwitch.css'

const OPTIONS: Record<
  CalendarView,
  { icon: LucideIcon; label: 'calendar.views.day' | 'calendar.views.week' | 'calendar.views.month' }
> = {
  jour: { icon: CalendarClock, label: 'calendar.views.day' },
  semaine: { icon: CalendarRange, label: 'calendar.views.week' },
  mois: { icon: CalendarDays, label: 'calendar.views.month' },
}

interface CalendarViewSwitchProps {
  /** The views offered, in display order. */
  views: readonly CalendarView[]
  view: CalendarView
  onChange: (view: CalendarView) => void
}

/** Day / week / month switch of a calendar. */
export function CalendarViewSwitch({ views, view, onChange }: CalendarViewSwitchProps) {
  const { t } = useTranslation()

  return (
    <div className="calendar-views" role="group" aria-label={t('calendar.views.label')}>
      {views.map((option) => {
        const { icon: Icon, label } = OPTIONS[option]

        return (
          <button key={option} type="button" aria-pressed={view === option} onClick={() => onChange(option)}>
            <Icon size={16} aria-hidden="true" />
            {t(label)}
          </button>
        )
      })}
    </div>
  )
}
