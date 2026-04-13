import {
  getPinUnlockErrorMessage,
  getUnlockErrorMessage,
} from '@/features/auth/screens/auth-screen-shared'
import { i18n } from '@/i18n'

describe('auth screen shared helpers', () => {
  it.each([
    ['not-available', 'auth.lock.notAvailableError'],
    ['not-enrolled', 'auth.lock.notEnrolledError'],
    ['cancelled', 'auth.lock.cancelledError'],
    ['failed', 'auth.lock.failedError'],
  ] as const)(
    'maps biometric reason %s to the correct translation',
    (reason, translationKey) => {
      expect(getUnlockErrorMessage(reason, i18n.t)).toBe(i18n.t(translationKey))
    },
  )

  it.each([
    ['invalid-pin', 'auth.lock.invalidPinError'],
    ['not-configured', 'auth.lock.pinNotConfiguredError'],
    ['too-many-attempts', 'auth.lock.tooManyPinAttemptsError'],
    ['failed', 'auth.lock.pinFailedError'],
  ] as const)(
    'maps PIN reason %s to the correct translation',
    (reason, translationKey) => {
      expect(getPinUnlockErrorMessage(reason, i18n.t)).toBe(
        i18n.t(translationKey),
      )
    },
  )
})
