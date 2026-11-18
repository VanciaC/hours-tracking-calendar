import { useTranslation } from 'react-i18next'
import { initials, type TeamMember } from '../../lib/people'
import './TeamLegend.css'

interface TeamLegendProps {
  members: readonly TeamMember[]
  hidden: ReadonlySet<string>
  onToggle: (id: string) => void
}

/** Who is who, and a filter: clicking a person hides or shows them in the schedule. */
export function TeamLegend({ members, hidden, onToggle }: TeamLegendProps) {
  const { t } = useTranslation()

  return (
    <div className="team-legend" role="group" aria-label={t('admin.planning.legend')}>
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          className={`team-legend-item person-${member.colorSlot}`}
          aria-pressed={!hidden.has(member.id)}
          onClick={() => onToggle(member.id)}
        >
          <span className="person-dot" aria-hidden="true">
            {initials(member.name)}
          </span>
          {member.name}
        </button>
      ))}
    </div>
  )
}
