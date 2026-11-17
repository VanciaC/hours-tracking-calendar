import { authApi, type TokenResponse } from './authApi'

/** Renews the access token this long before it expires, to absorb clock drift and slow requests. */
const RENEW_MARGIN_MS = 60_000

type AccessToken = {
  value: string
  /** Expiration date, in milliseconds since epoch. */
  expiresAt: number
}

// In memory only: unlike localStorage, a malicious script cannot read it back later.
let accessToken: AccessToken | null = null
let pendingRenewal: Promise<string | null> | null = null
let restoring: Promise<void> | null = null
const expiredListeners = new Set<() => void>()

/**
 * Keeps the access token and renews it with the refresh cookie (US-25).
 * One renewal at a time: the refresh token is single-use, so concurrent requests share it.
 */
function renew(): Promise<string | null> {
  pendingRenewal ??= authApi
    .refresh()
    .then((token) => {
      session.start(token)
      return token.accessToken
    })
    .catch(() => {
      accessToken = null
      return null
    })
    .finally(() => {
      pendingRenewal = null
    })

  return pendingRenewal
}

export const session = {
  start(token: TokenResponse): void {
    accessToken = { value: token.accessToken, expiresAt: Date.now() + token.expiresIn * 1000 }
  },

  clear(): void {
    accessToken = null
  },

  /** Access token for the next request, renewed when about to expire. Null when signed out. */
  async getAccessToken(): Promise<string | null> {
    if (accessToken === null) {
      return null
    }

    if (Date.now() < accessToken.expiresAt - RENEW_MARGIN_MS) {
      return accessToken.value
    }

    const renewed = await renew()
    if (renewed === null) {
      // The session ended on the server (expired or revoked): the app sends the user back to sign in.
      expiredListeners.forEach((listener) => listener())
    }

    return renewed
  },

  /** On page load, gets an access token from the refresh cookie when a session exists. Runs only once. */
  restore(): Promise<void> {
    restoring ??= renew().then(() => undefined)
    return restoring
  },

  /** Called when the session ends on its own. Returns the unsubscribe function. */
  onExpired(listener: () => void): () => void {
    expiredListeners.add(listener)
    return () => {
      expiredListeners.delete(listener)
    }
  },
}
