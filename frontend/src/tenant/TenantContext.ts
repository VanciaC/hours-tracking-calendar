import { createContext, useContext } from 'react'
import type { TenantInfo } from '../auth/authApi'

/** The company of the current address, once known. */
export const TenantContext = createContext<TenantInfo | null>(null)

export function useTenant(): TenantInfo | null {
  return useContext(TenantContext)
}
