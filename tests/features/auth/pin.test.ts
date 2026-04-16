import {
  clearStoredAppPin,
  hasStoredAppPin,
  saveStoredAppPin,
  verifyStoredAppPin,
} from '@/features/auth/pin'

const { __getSecureStoreItem, __setSecureStoreItem } =
  jest.requireMock('expo-secure-store')

describe('auth pin storage', () => {
  it('saves and verifies a 4-digit app pin', async () => {
    await saveStoredAppPin('1234')

    expect(__getSecureStoreItem('auth.pinCredential')).toContain('"version":1')
    await expect(hasStoredAppPin()).resolves.toBe(true)
    await expect(verifyStoredAppPin('1234')).resolves.toBe(true)
    await expect(verifyStoredAppPin('9999')).resolves.toBe(false)
  })

  it('clears the stored pin credential', async () => {
    await saveStoredAppPin('1234')

    await clearStoredAppPin()

    expect(__getSecureStoreItem('auth.pinCredential')).toBeNull()
    await expect(hasStoredAppPin()).resolves.toBe(false)
  })

  it('clears corrupted stored pin payloads safely', async () => {
    __setSecureStoreItem('auth.pinCredential', '{bad-json')

    await expect(hasStoredAppPin()).resolves.toBe(false)
    expect(__getSecureStoreItem('auth.pinCredential')).toBeNull()

    __setSecureStoreItem(
      'auth.pinCredential',
      JSON.stringify({
        salt: 'salt-only',
      }),
    )

    await expect(verifyStoredAppPin('1234')).resolves.toBe(false)
    expect(__getSecureStoreItem('auth.pinCredential')).toBeNull()
  })

  it('rejects invalid pin formats before saving or verifying', async () => {
    await expect(saveStoredAppPin('12ab')).rejects.toThrow(
      'App PIN must be exactly four digits.',
    )
    await expect(verifyStoredAppPin('12ab')).resolves.toBe(false)
    await expect(verifyStoredAppPin('12345')).resolves.toBe(false)
    expect(__getSecureStoreItem('auth.pinCredential')).toBeNull()
  })
})
