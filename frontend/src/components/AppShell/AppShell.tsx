import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock3, LogOut, PencilLine, Settings } from 'lucide-react'
import './AppShell.css'

interface AppShellProps {
  user: { name: string; email: string }
  onLogout: () => void
  children: ReactNode
}

/** "Demo User" -> "DU" */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/** Application frame: sidebar (brand, navigation, settings, user) and the page content. */
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const { t } = useTranslation()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            <Clock3 size={20} />
          </span>
          <span className="sidebar-brand-name">{t('app.name')}</span>
        </div>

        <nav className="sidebar-nav" aria-label={t('nav.label')}>
          <NavLink to="/calendrier" className="sidebar-link">
            <CalendarDays size={18} aria-hidden="true" />
            <span>{t('nav.calendar')}</span>
          </NavLink>
          <NavLink to="/saisie" className="sidebar-link">
            <PencilLine size={18} aria-hidden="true" />
            <span>{t('nav.entry')}</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/reglages" className="sidebar-link">
            <Settings size={18} aria-hidden="true" />
            <span>{t('nav.settings')}</span>
          </NavLink>

          <div className="sidebar-user">
            <span className="sidebar-avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="sidebar-user-text">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <button
              type="button"
              className="sidebar-logout"
              onClick={onLogout}
              aria-label={t('session.logout')}
              title={t('session.logout')}
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <main className="shell-content">{children}</main>
    </div>
  )
}
