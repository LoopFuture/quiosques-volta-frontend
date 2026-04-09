import { TokenResponse } from 'expo-auth-session'
import {
  createStoredAuthSession,
  isStoredAuthSessionFresh,
  mergeStoredAuthSession,
  toAppAuthSession,
} from '@/features/auth/models/session'

describe('auth session models', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('normalizes and merges stored auth sessions', () => {
    jest.spyOn(Date, 'now').mockReturnValue(2_000_000 * 1000)

    const createdFromConfig = createStoredAuthSession({
      accessToken: 'access-token',
      expiresIn: '3600' as never,
      idToken: 'id-token',
      issuedAt: undefined,
      refreshToken: 'refresh-token',
      scope: 'openid profile',
      tokenType: undefined,
    })

    expect(createdFromConfig).toEqual({
      accessToken: 'access-token',
      expiresIn: undefined,
      idToken: 'id-token',
      issuedAt: 2_000_000,
      refreshToken: 'refresh-token',
      scope: 'openid profile',
      tokenType: 'bearer',
    })

    const mergedSession = mergeStoredAuthSession(
      {
        accessToken: 'current-access',
        expiresIn: 120,
        idToken: 'current-id',
        issuedAt: 1_700_000_000,
        refreshToken: 'current-refresh',
        scope: 'openid profile email',
        tokenType: 'bearer',
      },
      new TokenResponse({
        accessToken: 'next-access',
        expiresIn: 300,
        issuedAt: 1_700_000_100,
        tokenType: 'bearer',
      }),
    )

    expect(mergedSession).toEqual({
      accessToken: 'next-access',
      expiresIn: 300,
      idToken: 'current-id',
      issuedAt: 1_700_000_100,
      refreshToken: 'current-refresh',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    expect(
      toAppAuthSession({
        accessToken: 'persisted-access',
        expiresIn: 60,
        idToken: 'persisted-id',
        issuedAt: 1_700_000_000,
        refreshToken: 'persisted-refresh',
        tokenType: 'bearer',
      }),
    ).toEqual({
      accessToken: 'persisted-access',
      expiresAt: 1_700_000_060_000,
      idToken: 'persisted-id',
      refreshToken: 'persisted-refresh',
    })

    expect(
      toAppAuthSession({
        accessToken: 'persisted-access',
        issuedAt: 1_700_000_000,
        tokenType: 'bearer',
      }),
    ).toEqual({
      accessToken: 'persisted-access',
      expiresAt: null,
      idToken: undefined,
      refreshToken: undefined,
    })
  })

  it('checks stored session freshness from expiresIn when present', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_030_000)

    expect(
      isStoredAuthSessionFresh({
        expiresIn: 60,
        issuedAt: 1_700_000_000,
      }),
    ).toBe(true)

    expect(
      isStoredAuthSessionFresh({
        expiresIn: 10,
        issuedAt: 1_700_000_000,
      }),
    ).toBe(false)

    expect(
      isStoredAuthSessionFresh({
        issuedAt: 1_700_000_000,
      }),
    ).toBe(true)
  })
})
