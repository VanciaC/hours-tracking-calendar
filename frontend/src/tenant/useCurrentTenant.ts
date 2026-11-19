import { useEffect, useState } from 'react'
import { AuthApiError, authApi, type TenantInfo } from '../auth/authApi'

export type TenantState =
  | { status: 'loading' }
  | { status: 'ready'; tenant: TenantInfo }
  | { status: 'unknown' }
  | { status: 'suspended' }
  | { status: 'unreachable' }

/** The company of the address typed in the browser, asked once to auth-service. */
export function useCurrentTenant(): TenantState {
  const [state, setState] = useState<TenantState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    authApi.currentTenant().then(
      (tenant) => {
        if (!cancelled) setState({ status: 'ready', tenant })
      },
      (error: unknown) => {
        if (cancelled) return

        const code = error instanceof AuthApiError ? error.code : null

        if (code === 'TENANT_NOT_FOUND') setState({ status: 'unknown' })
        else if (code === 'TENANT_SUSPENDED') setState({ status: 'suspended' })
        else setState({ status: 'unreachable' })
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
