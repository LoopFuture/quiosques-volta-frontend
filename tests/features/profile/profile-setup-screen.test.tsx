import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native'
import { Fragment } from 'react'
import { http, HttpResponse } from 'msw'
import { Linking } from 'react-native'
import { Switch } from 'tamagui'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'
import { getStoredDevicePrivacySettings } from '@/features/app-data/storage/device/privacy'
import { mockApiServer } from '@/features/app-data/mock/server.node'
import { fetchProfileState } from '@/features/profile/api'
import BarcodeScreen from '@/app/(tabs)/barcode'
import { ProfileSetupScreen } from '@/features/profile/screens/ProfileSetupScreen'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider, resolveMockApi } from '../../support/test-utils'

const mockShowToast = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@tamagui/toast', () => {
  const { createTamaguiToastMock } = jest.requireActual(
    '../../support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getShowToast: () => mockShowToast,
  })
})

jest.mock('react-native-qrcode-svg', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')

  return function MockQRCode(props: { testID?: string }) {
    return <View testID={props.testID ?? 'mock-qr-code'} />
  }
})

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('@/features/auth/components/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: any) => children,
}))

const { __mockRouterReplace: mockRouterReplace } =
  jest.requireMock('expo-router')
const { __setIsDevice } = jest.requireMock('expo-device')
const {
  __setNextNotificationPermissionRequestResponse,
  requestPermissionsAsync,
} = jest.requireMock('expo-notifications')
const { __setBiometricHardware, authenticateAsync } = jest.requireMock(
  'expo-local-authentication',
)
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)
const openSettingsSpy = jest.spyOn(Linking, 'openSettings')

async function advanceToSecurityStep() {
  fireEvent.changeText(screen.getByLabelText('Nome completo'), 'Ana Silva')
  fireEvent.changeText(screen.getByLabelText('Telefone'), '+351 913 334 445')
  fireEvent.changeText(screen.getByLabelText('NIF'), '123 456 789')
  fireEvent.press(screen.getByTestId('profile-setup-next-button'))

  await waitFor(() => {
    expect(screen.getByTestId('profile-setup-step-payments')).toBeTruthy()
  })

  fireEvent.changeText(
    screen.getByLabelText('IBAN associado'),
    'PT50 0007 0000 1111 2222 3',
  )
  fireEvent.press(screen.getByTestId('profile-setup-next-button'))

  await waitFor(() => {
    expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
  })
}

async function readProfileState() {
  const profilePromise = fetchProfileState()

  await resolveMockApi()

  return profilePromise
}

describe('profile setup screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    mockUseAuthSession.mockReturnValue({
      identity: {
        email: 'ana.jwt@sdr.pt',
        name: 'Ana JWT',
        userKey: 'user-123',
      },
      isAuthenticated: true,
      session: { accessToken: 'token', expiresAt: null },
      signOut: jest.fn(),
      status: 'authenticated',
    })
    openSettingsSpy.mockResolvedValue()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('shows the authenticated email as a confirmed account detail on the first step', () => {
    renderWithProvider(<ProfileSetupScreen />)

    expect(screen.getByTestId('profile-setup-step-personal')).toBeTruthy()
    expect(screen.getByText('E-mail da conta')).toBeTruthy()
    expect(screen.getByText('Confirmado')).toBeTruthy()
    expect(screen.getByText('ana.jwt@sdr.pt')).toBeTruthy()
    expect(screen.queryByLabelText('E-mail')).toBeNull()
  })

  it('validates each step before allowing the user to continue', async () => {
    renderWithProvider(<ProfileSetupScreen />)

    fireEvent.changeText(screen.getByLabelText('Nome completo'), '')
    fireEvent.changeText(screen.getByLabelText('Telefone'), '123')
    fireEvent.changeText(screen.getByLabelText('NIF'), '123')
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByText('O nome e obrigatorio.')).toBeTruthy()
      expect(
        screen.getByText(
          'Insere um telefone valido com indicativo internacional.',
        ),
      ).toBeTruthy()
      expect(screen.getByText('O NIF tem de ter 9 digitos.')).toBeTruthy()
    })
  })

  it('submits setup through PATCH /profile, routes home, and keeps the barcode screen available', async () => {
    __setNextNotificationPermissionRequestResponse({
      canAskAgain: true,
      granted: true,
      ios: {
        allowsAlert: true,
        allowsBadge: false,
        allowsSound: false,
        status: 2,
      },
      status: 'granted',
    })

    renderWithProvider(
      <Fragment>
        <ProfileSetupScreen />
        <BarcodeScreen />
      </Fragment>,
    )

    await resolveMockApi()

    expect(
      within(screen.getByTestId('barcode-screen')).getByTestId(
        'barcode-qr-trigger',
      ),
    ).toBeTruthy()

    await advanceToSecurityStep()

    fireEvent.press(screen.getByLabelText('Ativar notificações push'))

    await waitFor(() => {
      expect(requestPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(
        screen.getByText(
          'Este dispositivo está pronto para receber notificações push.',
        ),
      ).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await resolveMockApi(2)

    const updatedProfile = await readProfileState()

    expect(updatedProfile).toMatchObject({
      onboarding: {
        status: 'completed',
      },
      personal: {
        email: 'ana.jwt@sdr.pt',
        name: 'Ana Silva',
        nif: '123456789',
        phoneNumber: '+351913334445',
      },
      preferences: {
        alertsEmail: 'ana.jwt@sdr.pt',
        alertsEnabled: true,
      },
    })
    expect(updatedProfile.payoutAccount.spinEnabled).toBe(false)
    expect(updatedProfile.payoutAccount.ibanMasked).toContain('PT50')
    expect(mockShowToast).toHaveBeenCalledWith(
      'Finalizar registo',
      expect.objectContaining({
        duration: 3500,
        message: 'O teu registo está concluído.',
        variant: 'success',
      }),
    )
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('does not update backend setup state when the patch request fails', async () => {
    mockApiServer.use(
      http.patch(`${MOCK_API_ORIGIN}/profile`, () =>
        HttpResponse.json(
          {
            message: 'setup failed',
          },
          {
            status: 500,
          },
        ),
      ),
    )

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()
    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await resolveMockApi(2)

    const profile = await readProfileState()

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-error')).toBeTruthy()
      expect(mockRouterReplace).not.toHaveBeenCalled()
    })

    expect(mockShowToast).toHaveBeenCalledWith(
      'Finalizar registo',
      expect.objectContaining({
        duration: 5000,
        message: 'Não foi possível guardar esta configuração agora.',
        variant: 'error',
      }),
    )
    expect(profile.personal.name).toBe('Joao Ferreira')
    expect(profile.onboarding.status).toBe('completed')
  })

  it('turns the push switch off and disables it on setup when permission is blocked', async () => {
    __setNextNotificationPermissionRequestResponse({
      canAskAgain: false,
      granted: false,
      status: 'denied',
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()
    const pushNotificationsCard = within(
      screen.getByTestId('profile-setup-push-notifications-card'),
    )

    fireEvent.press(screen.getByLabelText('Ativar notificações push'))

    await waitFor(() => {
      const pushNotificationsToggle =
        pushNotificationsCard.UNSAFE_getByType(Switch)

      expect(pushNotificationsToggle.props.checked).toBe(false)
      expect(pushNotificationsToggle.props.disabled).toBe(true)
      expect(screen.getByText('Abrir definições')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Abrir definições'))

    expect(openSettingsSpy).toHaveBeenCalledTimes(1)

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await resolveMockApi(2)

    expect(getStoredDevicePrivacySettings().pushNotificationsEnabled).toBe(
      false,
    )
  })

  it('shows the physical-device guidance when push registration is unavailable', async () => {
    __setIsDevice(false)

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(screen.getByLabelText('Ativar notificações push'))

    await waitFor(() => {
      expect(requestPermissionsAsync).not.toHaveBeenCalled()
      expect(
        screen.getByText(
          'As notificações push precisam de um dispositivo físico.',
        ),
      ).toBeTruthy()
    })
  })

  it('verifies biometrics once before saving the setup device preference', async () => {
    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(screen.getByLabelText('Biometria'))

    await waitFor(() => {
      expect(authenticateAsync).toHaveBeenCalledTimes(1)
      expect(getStoredDevicePrivacySettings().biometricsEnabled).toBe(true)
      expect(mockShowToast).toHaveBeenCalledWith(
        'Biometria',
        expect.objectContaining({
          duration: 3500,
          message: 'Esta alteração foi guardada neste dispositivo.',
          variant: 'success',
        }),
      )
    })

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await resolveMockApi(2)
    const updatedProfile = await readProfileState()

    expect(updatedProfile.onboarding.status).toBe('completed')

    expect(authenticateAsync).toHaveBeenCalledTimes(1)
    expect(getStoredDevicePrivacySettings().biometricsEnabled).toBe(true)
  })

  it('hides the biometrics toggle on the security step when the device has no biometric hardware', async () => {
    __setBiometricHardware(false)

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    await waitFor(() => {
      expect(screen.queryByLabelText('Biometria')).toBeNull()
    })
  })
})
