import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  CalendarRange,
  Clock3,
  LogOut,
  MailPlus,
  PencilLine,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { CurrentUserFragment } from '../../graphql/__generated__/graphql'
import { initials } from '../../lib/people'
import './AppShell.css'

interface NavItem {
  to: string
  icon: LucideIcon
  label: 'nav.calendar' | 'nav.entry' | 'nav.teamPlanning' | 'nav.users' | 'nav.invitations'
}

const ADMIN_NAV: readonly NavItem[] = [
  { to: '/admin/planning', icon: CalendarRange, label: 'nav.teamPlanning' },
  { to: '/admin/utilisateurs', icon: Users, label: 'nav.users' },
  { to: '/admin/invitations', icon: MailPlus, label: 'nav.invitations' },
]

const PERSONAL_NAV: readonly NavItem[] = [
  { to: '/calendrier', icon: CalendarDays, label: 'nav.calendar' },
  { to: '/saisie', icon: PencilLine, label: 'nav.entry' },
]

interface AppShellProps {
  user: CurrentUserFragment
  onLogout: () => void
  children: ReactNode
}

/**
 * Application frame: sidebar (brand, navigation, settings, user) and the page content.
 * Admins see two clearly separated sections: the admin panel and their own space.
 */
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const { t } = useTranslation()
  const isAdmin = user.role === 'ADMIN'

  function renderLink({ to, icon: Icon, label }: NavItem) {
    return (
      <NavLink key={to} to={to} className="sidebar-link">
        <Icon size={18} aria-hidden="true" />
        <span>{t(label)}</span>
      </NavLink>
    )
  }

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
          {isAdmin && (
            <div className="sidebar-section sidebar-section-admin" role="group" aria-labelledby="nav-section-admin">
              <span id="nav-section-admin" className="sidebar-section-title">
                <ShieldCheck size={14} aria-hidden="true" />
                {t('nav.admin')}
              </span>
              {ADMIN_NAV.map(renderLink)}
            </div>
          )}

          <div className="sidebar-section" role="group" aria-labelledby={isAdmin ? 'nav-section-personal' : undefined}>
            {isAdmin && (
              <span id="nav-section-personal" className="sidebar-section-title">
                {t('nav.myArea')}
              </span>
            )}
            {PERSONAL_NAV.map(renderLink)}
          </div>
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

          <Link to="/confidentialite" className="sidebar-legal">
            {t('privacy.link')}
          </Link>
        </div>
      </aside>

      <main className="shell-content">{children}</main>
    </div>
  )
}
