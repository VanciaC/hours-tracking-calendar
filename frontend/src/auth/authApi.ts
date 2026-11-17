/** Body of a successful /auth/login, /auth/verify-email or /auth/refresh. */
export type TokenResponse = {
  accessToken: string
  expiresIn: number
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

async function post<T>(path: string, body: object = {}): Promise<T> {
  const response = await fetch(`/auth${path}`, {
    method: 'POST',
    // Sends the refresh cookie: same origin as the front end, in development as in production.
    credentials: 'same-origin',
    // auth-service only accepts JSON, which closes the door to cross-site form posts (CSRF).
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
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
  login: (email: string, password: string) => post<TokenResponse>('/login', { email, password }),
  verifyEmail: (token: string) => post<TokenResponse>('/verify-email', { token }),
  refresh: () => post<TokenResponse>('/refresh'),
  logout: () => post<void>('/logout'),
}
