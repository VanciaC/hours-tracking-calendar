/** Body of a successful /auth/login, /auth/verify-email or /auth/refresh. */
export type TokenResponse = {
  accessToken: string
  expiresIn: number
}

/** The company of the current address, from /auth/tenant. */
export type TenantInfo = {
  slug: string
  name: string
}

/** Error answered by an /auth endpoint, with the code set by auth-service (e.g. "EMAIL_NOT_VERIFIED"). */
export class AuthApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code)
    this.name = 'AuthApiError'
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body: object = {}): Promise<T> {
  const response = await fetch(`/auth${path}`, {
    method,
    // Sends the refresh cookie: same origin as the front end, in development as in production.
    credentials: 'same-origin',
    // auth-service only accepts JSON posts, which closes the door to cross-site form posts (CSRF).
    headers:
      method === 'POST'
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const code =
      typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
        ? data.code
        : `HTTP_${response.status}`

    throw new AuthApiError(code, response.status)
  }

  return data as T
}

/** Session endpoints of auth-service. The refresh token stays in an httpOnly cookie, out of reach of this code. */
export const authApi = {
  currentTenant: () => request<TenantInfo>('GET', '/tenant'),
  login: (email: string, password: string) => request<TokenResponse>('POST', '/login', { email, password }),
  verifyEmail: (token: string) => request<TokenResponse>('POST', '/verify-email', { token }),
  refresh: () => request<TokenResponse>('POST', '/refresh'),
  logout: () => request<void>('POST', '/logout'),
}
