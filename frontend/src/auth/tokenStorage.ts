const STORAGE_KEY = 'htc.accessToken'

type StoredToken = {
  value: string
  /** Expiration date, in milliseconds since epoch. */
  expiresAt: number
}

/**
 * Persists the access token in localStorage so the session survives a page reload.
 */
export const tokenStorage = {
  save(accessToken: string, expiresInSeconds: number): void {
    const token: StoredToken = {
      value: accessToken,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
  },

  /** Returns the token, or null when there is none or it has expired. */
  get(): string | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }

    try {
      const token = JSON.parse(raw) as StoredToken
      if (Date.now() >= token.expiresAt) {
        this.clear()
        return null
      }
      return token.value
    } catch {
      this.clear()
      return null
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
