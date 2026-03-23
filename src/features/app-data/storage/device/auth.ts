import { clientStorage } from '../mmkv'

export const SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY =
  'auth.skipBiometricLockUntilMs'

const LOGIN_BIOMETRIC_LOCK_GRACE_PERIOD_MS = 2 * 60 * 1000

export const authDeviceStorage = clientStorage

export function markNextInitialBiometricLockToBeSkipped(
  nowMs: number = Date.now(),
) {
  authDeviceStorage.set(
    SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY,
    String(nowMs + LOGIN_BIOMETRIC_LOCK_GRACE_PERIOD_MS),
  )
}

export function clearStoredInitialBiometricLockBypass() {
  authDeviceStorage.remove(SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY)
}

export function consumeStoredInitialBiometricLockBypass(
  nowMs: number = Date.now(),
) {
  const storedValue = authDeviceStorage.getString(
    SKIP_BIOMETRIC_LOCK_UNTIL_STORAGE_KEY,
  )

  clearStoredInitialBiometricLockBypass()

  if (!storedValue) {
    return false
  }

  const expiresAtMs = Number(storedValue)

  if (!Number.isFinite(expiresAtMs)) {
    return false
  }

  return expiresAtMs >= nowMs
}
