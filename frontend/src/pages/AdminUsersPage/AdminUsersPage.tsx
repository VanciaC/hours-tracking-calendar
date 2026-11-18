import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { AdminUsersDocument } from '../../graphql/__generated__/graphql'
import { initials } from '../../lib/people'
import { useDebouncedValue } from './useDebouncedValue'
import './AdminUsersPage.css'
import { useFormatters } from '../../i18n/useFormatters'

const PER_PAGE = 20

/** Admin list of regular users, with search and pagination (US-27). */
export function AdminUsersPage() {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [input, setInput] = useState(search)
  const debouncedInput = useDebouncedValue(input, 300)

  // A new search starts again from page 1. replace: typing does not fill the browser history.
  useEffect(() => {
    const term = debouncedInput.trim()
    if (term !== search) setSearchParams(term ? { q: term } : {}, { replace: true })
  }, [debouncedInput, search, setSearchParams])

  const { data, previousData, loading, error } = useQuery(AdminUsersDocument, {
    variables: { search: search || null, page, perPage: PER_PAGE },
  })
  // Keeps the previous page on screen while the next one loads.
  const result = data?.adminUsers ?? previousData?.adminUsers

  function goToPage(next: number) {
    const params: Record<string, string> = {}
    if (search) params.q = search
    if (next > 1) params.page = String(next)
    setSearchParams(params)
  }

  return (
    <section className="admin-users">
      <header className="admin-users-header">
        <h1>{t('admin.users.title')}</h1>

        <label className="admin-users-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('admin.users.search')}
            aria-label={t('admin.users.search')}
          />
        </label>
      </header>

      {error && <p className="form-error">{error.message}</p>}
      {loading && !result && <p>{t('status.loading')}</p>}

      {result && (
        <>
          <p className="admin-users-total">{t('admin.users.total', { count: result.total })}</p>

          {result.items.length === 0 ? (
            <p className="admin-users-empty">
              {search ? t('admin.users.noMatch', { search }) : t('admin.users.empty')}
            </p>
          ) : (
            <table className={loading ? 'admin-users-table is-loading' : 'admin-users-table'}>
              <thead>
                <tr>
                  <th scope="col">{t('admin.users.columns.name')}</th>
                  <th scope="col">{t('admin.users.columns.email')}</th>
                  <th scope="col">{t('admin.users.columns.registered')}</th>
                  <th scope="col">{t('admin.users.columns.status')}</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((user) => (
                  <tr key={user.id}>
                    <td data-label={t('admin.users.columns.name')}>
                      <Link to={`/admin/utilisateurs/${user.id}`} className="admin-users-name">
                        <span className="admin-users-avatar" aria-hidden="true">
                          {initials(user.name)}
                        </span>
                        {user.name}
                      </Link>
                    </td>
                    <td data-label={t('admin.users.columns.email')}>{user.email}</td>
                    <td data-label={t('admin.users.columns.registered')}>{fmt.longDate(parseISO(user.createdAt))}</td>
                    <td data-label={t('admin.users.columns.status')}>
                      {user.emailVerifiedAt ? (
                        <span className="status-badge is-verified">{t('admin.users.verified')}</span>
                      ) : (
                        <span className="status-badge is-pending">{t('admin.users.pending')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result.lastPage > 1 && (
            <nav className="admin-users-pages" aria-label={t('admin.users.pagination')}>
              <button
                type="button"
                onClick={() => goToPage(result.page - 1)}
                disabled={result.page <= 1}
                aria-label={t('admin.users.previous')}
                title={t('admin.users.previous')}
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span>{t('admin.users.page', { page: result.page, lastPage: result.lastPage })}</span>
              <button
                type="button"
                onClick={() => goToPage(result.page + 1)}
                disabled={result.page >= result.lastPage}
                aria-label={t('admin.users.next')}
                title={t('admin.users.next')}
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
