import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../authApi'
import { session } from '../session'

vi.mock('../authApi', () => ({
  authApi: { refresh: vi.fn() },
}))

const refresh = vi.mocked(authApi.refresh)

describe('session', () => {
  beforeEach(() => {
    session.clear()
    refresh.mockReset()
  })

  it('returns the current token while it is far from expiring', async () => {
    session.start({ accessToken: 'current', expiresIn: 900 })

    await expect(session.getAccessToken()).resolves.toBe('current')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('renews a token about to expire only once for concurrent requests', async () => {
    session.start({ accessToken: 'old', expiresIn: 30 })
    refresh.mockResolvedValue({ accessToken: 'new', expiresIn: 900 })

    const tokens = await Promise.all([session.getAccessToken(), session.getAccessToken()])

    expect(tokens).toEqual(['new', 'new'])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('reports the end of the session when the renewal fails', async () => {
    session.start({ accessToken: 'old', expiresIn: 30 })
    refresh.mockRejectedValue(new Error('revoked'))
    const onExpired = vi.fn()
    const unsubscribe = session.onExpired(onExpired)

    await expect(session.getAccessToken()).resolves.toBeNull()
    expect(onExpired).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('returns no token when signed out', async () => {
    await expect(session.getAccessToken()).resolves.toBeNull()
    expect(refresh).not.toHaveBeenCalled()
  })
})
