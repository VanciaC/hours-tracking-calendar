import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  CalendarRange,
  Clock3,
  LogOut,
  PencilLine,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { CurrentUserFragment } from '../../graphql/__generated__/graphql'
import './AppShell.css'
import { initials } from '../../lib/people'

/** The personal space (own hours) or the admin panel (read-only, no entry forms). */
export type ShellArea = 'personal' | 'admin'

interface NavItem {
  to: string
  icon: LucideIcon
  label: 'nav.calendar' | 'nav.entry' | 'nav.teamPlanning' | 'nav.users'
}

const NAV: Record<ShellArea, readonly NavItem[]> = {
  personal: [
    { to: '/calendrier', icon: CalendarDays, label: 'nav.calendar' },
    { to: '/saisie', icon: PencilLine, label: 'nav.entry' },
  ],
  admin: [
    { to: '/admin/planning', icon: CalendarRange, label: 'nav.teamPlanning' },
    { to: '/admin/utilisateurs', icon: Users, label: 'nav.users' },
  ],
}

interface AppShellProps {
  user: CurrentUserFragment
  area: ShellArea
  onLogout: () => void
  children: ReactNode
}

/** Application frame: sidebar (brand, navigation, settings, user) and the page content. */
export function AppShell({ user, area, onLogout, children }: AppShellProps) {
  const { t } = useTranslation()
  const isAdmin = user.role === 'ADMIN'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            <Clock3 size={20} />
          </span>
          <span className="sidebar-brand-name">{t('app.name')}</span>
          {area === 'admin' && <span className="sidebar-area-badge">{t('nav.adminBadge')}</span>}
        </div>

        <nav className="sidebar-nav" aria-label={t('nav.label')}>
          {NAV[area].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="sidebar-link">
              <Icon size={18} aria-hidden="true" />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Switches between the two spaces, with the same account. */}
          {area === 'admin' ? (
            <NavLink to="/calendrier" className="sidebar-link">
              <UserRound size={18} aria-hidden="true" />
              <span>{t('nav.myArea')}</span>
            </NavLink>
          ) : (
            isAdmin && (
              <NavLink to="/admin" className="sidebar-link">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>{t('nav.admin')}</span>
              </NavLink>
            )
          )}

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
