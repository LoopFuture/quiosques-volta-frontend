import {
  clearStoredAuthSession,
  readStoredAuthSession,
  saveStoredAuthSession,
} from '@/features/auth/storage'

jest.mock('@/features/app-data/monitoring', () => ({
  createDiagnosticTimer: jest.fn(() => () => 123),
  recordDiagnosticEvent: jest.fn(),
}))

const {
  __getSecureStoreItem,
  __resetSecureStoreMock,
  __setSecureStoreItem,
  deleteItemAsync,
  setItemAsync,
} = jest.requireMock('expo-secure-store')
const { createDiagnosticTimer, recordDiagnosticEvent } = jest.requireMock(
  '@/features/app-data/monitoring',
)

describe('auth storage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetSecureStoreMock()
  })

  it('clears the stored auth session and records success diagnostics', async () => {
    __setSecureStoreItem('auth.keycloak.access', 'access')
    __setSecureStoreItem('auth.keycloak.id', 'id')
    __setSecureStoreItem(
      'auth.keycloak.meta',
      '{"issuedAt":1710000000,"tokenType":"bearer"}',
    )
    __setSecureStoreItem('auth.keycloak.refresh', 'refresh')

    await clearStoredAuthSession()

    expect(__getSecureStoreItem('auth.keycloak.access')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.id')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.meta')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.refresh')).toBeNull()
    expect(createDiagnosticTimer).toHaveBeenCalledTimes(1)
    expect(recordDiagnosticEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        operation: 'session-storage',
        phase: 'clear',
        status: 'start',
      }),
    )
    expect(recordDiagnosticEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        durationMs: 123,
        operation: 'session-storage',
        phase: 'clear',
        status: 'success',
      }),
    )
  })

  it('records and rethrows clear failures', async () => {
    deleteItemAsync.mockRejectedValueOnce(new Error('clear failed'))

    await expect(clearStoredAuthSession()).rejects.toThrow('clear failed')

    expect(recordDiagnosticEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        captureError: true,
        durationMs: 123,
        operation: 'session-storage',
        phase: 'clear',
        status: 'error',
      }),
    )
  })

  it('returns null when required stored session fields are missing', async () => {
    expect(await readStoredAuthSession()).toBeNull()

    __setSecureStoreItem('auth.keycloak.access', 'access')

    expect(await readStoredAuthSession()).toBeNull()
  })

  it('clears and reports invalid JSON metadata', async () => {
    __setSecureStoreItem('auth.keycloak.access', 'access')
    __setSecureStoreItem('auth.keycloak.meta', '{invalid-json')

    await expect(readStoredAuthSession()).resolves.toBeNull()

    expect(__getSecureStoreItem('auth.keycloak.access')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.meta')).toBeNull()
    expect(recordDiagnosticEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        captureError: true,
        details: expect.objectContaining({
          reason: 'metadata-json-invalid',
        }),
        operation: 'session-storage',
        phase: 'read',
        status: 'error',
      }),
    )
  })

  it('clears and reports schema-invalid metadata', async () => {
    __setSecureStoreItem('auth.keycloak.access', 'access')
    __setSecureStoreItem('auth.keycloak.meta', '{"issuedAt":"bad"}')

    await expect(readStoredAuthSession()).resolves.toBeNull()

    expect(__getSecureStoreItem('auth.keycloak.access')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.meta')).toBeNull()
    expect(recordDiagnosticEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        captureError: true,
        details: expect.objectContaining({
          reason: 'metadata-schema-invalid',
        }),
        operation: 'session-storage',
        phase: 'read',
        status: 'error',
      }),
    )
  })

  it('hydrates valid stored sessions and omits missing optional fields', async () => {
    __setSecureStoreItem('auth.keycloak.access', 'access')
    __setSecureStoreItem('auth.keycloak.id', 'id')
    __setSecureStoreItem(
      'auth.keycloak.meta',
      JSON.stringify({
        expiresIn: 3600,
        issuedAt: 1_710_000_000,
        scope: 'openid profile email',
        tokenType: 'bearer',
      }),
    )
    __setSecureStoreItem('auth.keycloak.refresh', 'refresh')

    await expect(readStoredAuthSession()).resolves.toEqual({
      accessToken: 'access',
      expiresIn: 3600,
      idToken: 'id',
      issuedAt: 1_710_000_000,
      refreshToken: 'refresh',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    __resetSecureStoreMock()
    __setSecureStoreItem('auth.keycloak.access', 'access')
    __setSecureStoreItem(
      'auth.keycloak.meta',
      JSON.stringify({
        issuedAt: 1_710_000_000,
      }),
    )

    await expect(readStoredAuthSession()).resolves.toEqual({
      accessToken: 'access',
      idToken: undefined,
      issuedAt: 1_710_000_000,
      refreshToken: undefined,
      scope: undefined,
      tokenType: 'bearer',
    })
  })

  it('saves sessions with and without optional tokens', async () => {
    await saveStoredAuthSession({
      accessToken: 'access',
      expiresIn: 3600,
      idToken: 'id',
      issuedAt: 1_710_000_000,
      refreshToken: 'refresh',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    expect(__getSecureStoreItem('auth.keycloak.access')).toBe('access')
    expect(__getSecureStoreItem('auth.keycloak.id')).toBe('id')
    expect(__getSecureStoreItem('auth.keycloak.refresh')).toBe('refresh')
    expect(__getSecureStoreItem('auth.keycloak.meta')).toBe(
      JSON.stringify({
        expiresIn: 3600,
        issuedAt: 1_710_000_000,
        scope: 'openid profile email',
        tokenType: 'bearer',
      }),
    )

    await saveStoredAuthSession({
      accessToken: 'access-2',
      issuedAt: 1_710_000_100,
      tokenType: 'bearer',
    })

    expect(__getSecureStoreItem('auth.keycloak.access')).toBe('access-2')
    expect(__getSecureStoreItem('auth.keycloak.id')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.refresh')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.meta')).toBe(
      JSON.stringify({
        expiresIn: undefined,
        issuedAt: 1_710_000_100,
        scope: undefined,
        tokenType: 'bearer',
      }),
    )
    expect(recordDiagnosticEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        durationMs: 123,
        operation: 'session-storage',
        phase: 'save',
        status: 'success',
      }),
    )
  })

  it('records and rethrows save failures', async () => {
    setItemAsync.mockRejectedValueOnce(new Error('save failed'))

    await expect(
      saveStoredAuthSession({
        accessToken: 'access',
        issuedAt: 1_710_000_000,
        tokenType: 'bearer',
      }),
    ).rejects.toThrow('save failed')

    expect(recordDiagnosticEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        captureError: true,
        durationMs: 123,
        operation: 'session-storage',
        phase: 'save',
        status: 'error',
      }),
    )
  })
})
