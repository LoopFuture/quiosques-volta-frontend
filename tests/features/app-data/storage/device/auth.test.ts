import {
  authDeviceStorage,
  clearStoredInitialBiometricLockBypass,
  consumeStoredInitialBiometricLockBypass,
  markNextInitialBiometricLockToBeSkipped,
  SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY,
} from '@/features/app-data/storage/device/auth'

describe('auth device storage', () => {
  beforeEach(() => {
    clearStoredInitialBiometricLockBypass()
  })

  it('stores and consumes the biometric lock grace period', () => {
    markNextInitialBiometricLockToBeSkipped(1_000)

    expect(
      authDeviceStorage.getString(SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY),
    ).toBe(String(1_000 + 2 * 60 * 1_000))
    expect(consumeStoredInitialBiometricLockBypass(1_000)).toBe(true)
    expect(
      authDeviceStorage.getString(SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY),
    ).toBeUndefined()
  })

  it('returns false for expired or invalid stored bypass values', () => {
    authDeviceStorage.set(SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY, '900')
    expect(consumeStoredInitialBiometricLockBypass(1_000)).toBe(false)

    authDeviceStorage.set(SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY, 'invalid')
    expect(consumeStoredInitialBiometricLockBypass(1_000)).toBe(false)
  })
})
