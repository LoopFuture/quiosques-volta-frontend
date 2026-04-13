import { Text } from 'react-native'
import { render, screen, waitFor } from '@testing-library/react-native'
import {
  authenticateWithAvailableBiometrics,
  authenticateWithBiometrics,
  createBiometricPromptOptions,
  getBiometricAvailability,
  useBiometricHardwareAvailability,
} from '@/features/auth/biometrics'
import { restorePlatformOS, setPlatformOS } from '@tests/support/react-native'

const {
  __resetLocalAuthenticationMock,
  __setBiometricEnrollment,
  __setBiometricHardware,
  __setNextLocalAuthenticationResult,
  authenticateAsync,
  hasHardwareAsync,
} = jest.requireMock('expo-local-authentication')

function BiometricHardwareHarness() {
  const hasHardware = useBiometricHardwareAvailability()

  return <Text>{hasHardware === null ? 'unknown' : String(hasHardware)}</Text>
}

describe('auth biometrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetLocalAuthenticationMock()
  })

  afterEach(() => {
    restorePlatformOS()
  })

  it('builds prompt options for iOS and Android', () => {
    setPlatformOS('ios')

    expect(
      createBiometricPromptOptions({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
      fallbackLabel: '',
      promptMessage: 'Desbloquear',
    })

    setPlatformOS('android')

    expect(
      createBiometricPromptOptions({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
      fallbackLabel: undefined,
      promptMessage: 'Desbloquear',
    })
  })

  it('reports biometric availability across hardware and enrollment states', async () => {
    __setBiometricHardware(false)
    expect(await getBiometricAvailability()).toEqual({
      isAvailable: false,
      reason: 'not-available',
    })

    __setBiometricHardware(true)
    __setBiometricEnrollment(false)
    expect(await getBiometricAvailability()).toEqual({
      isAvailable: false,
      reason: 'not-enrolled',
    })

    __setBiometricEnrollment(true)
    expect(await getBiometricAvailability()).toEqual({
      isAvailable: true,
    })
  })

  it('forwards the prompt options to LocalAuthentication.authenticateAsync', async () => {
    setPlatformOS('ios')

    await authenticateWithBiometrics({
      cancelLabel: 'Cancelar',
      promptMessage: 'Desbloquear',
    })

    expect(authenticateAsync).toHaveBeenCalledWith({
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
      fallbackLabel: '',
      promptMessage: 'Desbloquear',
    })
  })

  it('maps available biometric authentication outcomes', async () => {
    __setNextLocalAuthenticationResult({ success: true })

    expect(
      await authenticateWithAvailableBiometrics({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({ success: true })

    __setNextLocalAuthenticationResult({
      error: 'system_cancel',
      success: false,
    })

    expect(
      await authenticateWithAvailableBiometrics({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({
      errorCode: 'system_cancel',
      reason: 'cancelled',
      success: false,
    })

    __setNextLocalAuthenticationResult({
      error: 'lockout',
      success: false,
    })

    expect(
      await authenticateWithAvailableBiometrics({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({
      errorCode: 'lockout',
      reason: 'failed',
      success: false,
    })
  })

  it('short-circuits authentication when biometrics are unavailable', async () => {
    __setBiometricHardware(false)

    expect(
      await authenticateWithAvailableBiometrics({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({
      reason: 'not-available',
      success: false,
    })

    __setBiometricHardware(true)
    __setBiometricEnrollment(false)

    expect(
      await authenticateWithAvailableBiometrics({
        cancelLabel: 'Cancelar',
        promptMessage: 'Desbloquear',
      }),
    ).toEqual({
      reason: 'not-enrolled',
      success: false,
    })

    expect(authenticateAsync).not.toHaveBeenCalled()
  })

  it('tracks biometric hardware availability in the hook and falls back to false on errors', async () => {
    const view = render(<BiometricHardwareHarness />)

    await waitFor(() => {
      expect(screen.getByText('true')).toBeTruthy()
    })

    hasHardwareAsync.mockRejectedValueOnce(new Error('hardware failure'))

    view.unmount()
    render(<BiometricHardwareHarness />)

    await waitFor(() => {
      expect(screen.getByText('false')).toBeTruthy()
    })
  })
})
