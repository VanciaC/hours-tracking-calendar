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
  label: 'nav.calendar' | 'nav.entry' | 'nav.teamPlanning' | 'nav.users' | 'nav.invitations' | 'nav.settings'
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

const SETTINGS_NAV: NavItem = { to: '/reglages', icon: Settings, label: 'nav.settings' }

/**
 * Bottom tab bar of small screens: five tabs at most, so they stay readable.
 * The invitations stay one tap away, through the invite button of the users page.
 */
const ADMIN_TABS: readonly NavItem[] = [...PERSONAL_NAV, ADMIN_NAV[0], ADMIN_NAV[1], SETTINGS_NAV]
const USER_TABS: readonly NavItem[] = [...PERSONAL_NAV, SETTINGS_NAV]

interface AppShellProps {
  user: CurrentUserFragment
  onLogout: () => void
  children: ReactNode
}

/**
 * Application frame.
 * Wide screens: sidebar (brand, navigation, settings, user) next to the page content.
 * Small screens: a slim top bar and a bottom tab bar, within reach of the thumb.
 * Admins see two clearly separated sections: the admin panel and their own space.
 */
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const { t } = useTranslation()
  const isAdmin = user.role === 'ADMIN'
  const tabs = isAdmin ? ADMIN_TABS : USER_TABS

  function renderLink({ to, icon: Icon, label }: NavItem) {
    return (
      <NavLink key={to} to={to} className="sidebar-link">
        <Icon size={18} aria-hidden="true" />
        <span>{t(label)}</span>
      </NavLink>
    )
  }

  function renderTab({ to, icon: Icon, label }: NavItem) {
    return (
      <NavLink key={to} to={to} className="tabbar-link">
        <Icon size={20} aria-hidden="true" />
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
          {renderLink(SETTINGS_NAV)}

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

      {/* Small screens only: brand, who is signed in, and the logout button. */}
      <header className="topbar">
        <span className="sidebar-logo" aria-hidden="true">
          <Clock3 size={18} />
        </span>
        <span className="topbar-name">{t('app.name')}</span>
        <span className="topbar-avatar" title={user.name} aria-hidden="true">
          {initials(user.name)}
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
      </header>

      <main className="shell-content">
        {children}

        {/* Small screens only: the sidebar holding this link is hidden. */}
        <Link to="/confidentialite" className="shell-legal">
          {t('privacy.link')}
        </Link>
      </main>

      <nav className="tabbar" aria-label={t('nav.label')}>
        {tabs.map(renderTab)}
      </nav>
    </div>
  )
}
