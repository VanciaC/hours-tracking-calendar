import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { initials, type TeamMember } from '../../lib/people'
import './TeamFilter.css'

interface TeamFilterProps {
  members: readonly TeamMember[]
  hidden: ReadonlySet<string>
  onChange: (hidden: ReadonlySet<string>) => void
}

/**
 * Chooses who is shown in the team schedule. A compact button opening a panel with a search,
 * so it stays usable with many people. The checkboxes also act as the color legend.
 */
export function TeamFilter({ members, hidden, onChange }: TeamFilterProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Closes on a click outside or on Escape, like any menu.
  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const shown = members.filter((member) => !hidden.has(member.id)).length
  const query = search.trim().toLocaleLowerCase()
  const matches = query ? members.filter((member) => member.name.toLocaleLowerCase().includes(query)) : members

  function toggle(id: string) {
    const next = new Set(hidden)
    if (!next.delete(id)) next.add(id)
    onChange(next)
  }

  return (
    <div className="team-filter" ref={rootRef}>
      <button
        type="button"
        className={shown < members.length ? 'team-filter-button is-filtered' : 'team-filter-button'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((previous) => !previous)}
      >
        <Users size={16} aria-hidden="true" />
        {t('admin.planning.filter.button')}
        <span className="team-filter-count">{t('admin.planning.filter.count', { shown, total: members.length })}</span>
      </button>

      {open && (
        <div id={panelId} className="team-filter-panel">
          <input
            type="search"
            className="team-filter-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.planning.filter.search')}
            aria-label={t('admin.planning.filter.search')}
          />

          <div className="team-filter-actions">
            <button type="button" onClick={() => onChange(new Set())}>
              {t('admin.planning.filter.showAll')}
            </button>
            <button type="button" onClick={() => onChange(new Set(members.map((member) => member.id)))}>
              {t('admin.planning.filter.hideAll')}
            </button>
          </div>

          {matches.length > 0 ? (
            <ul className="team-filter-list">
              {matches.map((member) => (
                <li key={member.id}>
                  <label className={`team-filter-item person-${member.colorSlot}`}>
                    <input type="checkbox" checked={!hidden.has(member.id)} onChange={() => toggle(member.id)} />
                    <span className="person-dot" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                    <span className="team-filter-name">{member.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="team-filter-empty">{t('admin.planning.filter.noMatch')}</p>
          )}
        </div>
      )}
    </div>
  )
}
