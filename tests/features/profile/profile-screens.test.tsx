import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { Fragment } from 'react'
import { Linking } from 'react-native'
import { Spinner, Switch } from 'tamagui'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'
import { getStoredDevicePrivacySettings } from '@/features/app-data/storage/device/privacy'
import { mockApiServer } from '@/features/app-data/mock/server.node'
import ProfileHelpScreen from '@/features/profile/screens/ProfileHelpScreen'
import ProfileScreen from '@/features/profile/screens/ProfileScreen'
import {
  ProfileAppSettingsScreen,
  ProfilePaymentsScreen,
  ProfilePersonalScreen,
  ProfilePrivacyScreen,
} from '@/features/profile/screens/ProfileEditorScreens'
import ProfileSummaryScreen from '@/features/profile/screens/ProfileSummaryScreen'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider, resolveMockApi } from '../../support/test-utils'

const mockShowToast = jest.fn()
const mockSignOut = jest.fn()

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

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('@/features/auth/components/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: any) => children,
}))

const {
  __mockRouterBack: mockRouterBack,
  __mockRouterPush: mockRouterPush,
  __mockRouterReplace: mockRouterReplace,
} = jest.requireMock('expo-router')
const {
  __setNextNotificationPermissionRequestResponse,
  __setNotificationPermissions,
  requestPermissionsAsync,
} = jest.requireMock('expo-notifications')
const { __setBiometricEnrollment, __setBiometricHardware, authenticateAsync } =
  jest.requireMock('expo-local-authentication')
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)
const openSettingsSpy = jest.spyOn(Linking, 'openSettings')

function getButtonDisabledState(testID: string) {
  const button = screen.getByTestId(testID)

  return button.props['aria-disabled'] ?? false
}

describe('profile screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseAuthSession.mockReturnValue({
      identity: {
        email: 'joao.ferreira@sdr.pt',
        name: 'Joao Ferreira',
        userKey: 'user-123',
      },
      isAuthenticated: true,
      session: { accessToken: 'token', expiresAt: null },
      signOut: mockSignOut.mockResolvedValue(undefined),
      status: 'authenticated',
    })
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
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

  it('renders the profile hub with compact review content and routes each section card to its grouped screen', async () => {
    renderWithProvider(<ProfileScreen />)

    expect(screen.getByTestId('profile-screen-skeleton')).toBeTruthy()

    await resolveMockApi()

    expect(screen.getByTestId('profile-screen')).toBeTruthy()
    expect(screen.getByText('Rever conta')).toBeTruthy()
    expect(screen.getByText('Rever antes do reembolso')).toBeTruthy()
    expect(screen.getByText('O que rever agora')).toBeTruthy()
    expect(screen.getByLabelText('Pagamentos')).toBeTruthy()
    expect(screen.getAllByText('Perfil').length).toBeGreaterThan(0)
    expect(screen.getByText('Definições da app')).toBeTruthy()
    expect(screen.getByText('Terminar sessão')).toBeTruthy()
    expect(screen.getByLabelText('Dados do perfil')).toBeTruthy()
    expect(screen.getByLabelText('Privacidade e segurança')).toBeTruthy()
    expect(screen.getByLabelText('Pagamentos')).toBeTruthy()
    expect(screen.getByLabelText('Definições da app')).toBeTruthy()
    expect(screen.queryByLabelText('Resumo')).toBeNull()

    fireEvent.press(screen.getByLabelText('Dados do perfil'))
    fireEvent.press(screen.getByLabelText('Privacidade e segurança'))
    fireEvent.press(screen.getByLabelText('Pagamentos'))
    fireEvent.press(screen.getByLabelText('Definições da app'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, '/profile/personal')
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, '/profile/privacy')
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, '/profile/payments')
    expect(mockRouterPush).toHaveBeenNthCalledWith(4, '/profile/app-settings')
  })

  it('routes onboarding help and signs out from the hub', async () => {
    renderWithProvider(<ProfileScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByLabelText('Como funciona a Volta'))
    fireEvent.press(screen.getByText('Terminar sessão'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profile/help')
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockRouterReplace).toHaveBeenCalledWith('/auth')
    })
  })

  it('renders the help route with the onboarding content', () => {
    renderWithProvider(<ProfileHelpScreen />)

    expect(screen.getByTestId('onboarding-screen')).toBeTruthy()
    expect(screen.getByText('Devolve e recebe sem surpresas')).toBeTruthy()
  })

  it('saves the grouped section screens and updates the hub summaries', async () => {
    renderWithProvider(
      <Fragment>
        <ProfileScreen />
        <ProfilePersonalScreen />
        <ProfilePrivacyScreen />
        <ProfilePaymentsScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const personalScreen = within(screen.getByTestId('profile-personal-screen'))
    expect(personalScreen.queryByText('Foto de perfil')).toBeNull()
    expect(personalScreen.queryByText('Alterar foto')).toBeNull()
    expect(
      personalScreen.getByDisplayValue('joao.ferreira@sdr.pt').props.editable,
    ).toBe(false)
    expect(personalScreen.getByDisplayValue('+351912345678')).toBeTruthy()
    fireEvent.changeText(
      personalScreen.getByLabelText('Nome completo'),
      'Ana Silva',
    )
    fireEvent.changeText(
      personalScreen.getByLabelText('Telefone'),
      '+351 913 334 445',
    )
    fireEvent.changeText(personalScreen.getByLabelText('NIF'), '123 456 789')
    fireEvent.press(personalScreen.getByText('Guardar dados'))
    await resolveMockApi(2)

    const privacyScreen = within(screen.getByTestId('profile-privacy-screen'))
    fireEvent.press(
      privacyScreen.getByLabelText('E-mails de segurança dos pagamentos'),
    )
    fireEvent.press(privacyScreen.getByLabelText('Biometria'))
    await resolveMockApi()

    const paymentsScreen = within(screen.getByTestId('profile-payments-screen'))
    fireEvent.changeText(
      paymentsScreen.getByLabelText('IBAN associado'),
      'PT50 0007 0000 1111 2222 3',
    )
    fireEvent.press(paymentsScreen.getByLabelText('SPIN'))
    fireEvent.press(paymentsScreen.getByText('Guardar pagamentos'))
    await resolveMockApi(2)

    await waitFor(() => {
      expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0)
      expect(personalScreen.getByDisplayValue('+351913334445')).toBeTruthy()
      expect(personalScreen.getByDisplayValue('123456789')).toBeTruthy()
      expect(screen.getByText('joao.ferreira@sdr.pt')).toBeTruthy()
      expect(screen.getByText('Desativados')).toBeTruthy()
      expect(screen.getByText('PT50************22223')).toBeTruthy()
      expect(screen.getByText('Pagamentos instantâneos ativos')).toBeTruthy()
    })

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Guardar dados',
        expect.objectContaining({
          duration: 3500,
          message: 'Os teus dados foram atualizados.',
          variant: 'success',
        }),
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        'E-mails de segurança dos pagamentos',
        expect.objectContaining({
          duration: 3500,
          message: 'Os alertas por e-mail foram atualizados.',
          variant: 'success',
        }),
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        'Guardar pagamentos',
        expect.objectContaining({
          duration: 3500,
          message: 'Os teus pagamentos foram atualizados.',
          variant: 'success',
        }),
      )
    })
  })

  it('re-requests push permissions when the user denied them earlier but can still be prompted', async () => {
    __setNotificationPermissions({
      canAskAgain: true,
      granted: false,
      ios: {
        allowsAlert: false,
        allowsBadge: false,
        allowsSound: false,
        status: 0,
      },
      status: 'denied',
    })
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
        <ProfileScreen />
        <ProfilePrivacyScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const pushNotificationsCard = within(
      screen.getByTestId('profile-privacy-push-notifications-card'),
    )

    fireEvent.press(pushNotificationsCard.getByLabelText('Notificações push'))

    await resolveMockApi(2)

    await waitFor(() => {
      expect(requestPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(
        screen.getByText(
          'Este dispositivo está pronto para receber notificações push.',
        ),
      ).toBeTruthy()
      expect(screen.getByText('Notificações push ativas.')).toBeTruthy()
    })

    fireEvent.press(pushNotificationsCard.getByLabelText('Notificações push'))

    await resolveMockApi(2)

    await waitFor(() => {
      expect(screen.getByText('Notificações push desativadas.')).toBeTruthy()
    })
  })

  it('saves biometrics after one successful verification in privacy settings', async () => {
    renderWithProvider(<ProfilePrivacyScreen />)

    await resolveMockApi()

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

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(authenticateAsync).toHaveBeenCalledTimes(1)
    expect(getStoredDevicePrivacySettings().biometricsEnabled).toBe(true)
  })

  it('keeps biometrics off and shows guidance when no biometric enrollment is available', async () => {
    __setBiometricEnrollment(false)

    renderWithProvider(<ProfilePrivacyScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByLabelText('Biometria'))

    await waitFor(() => {
      expect(authenticateAsync).not.toHaveBeenCalled()
      expect(getStoredDevicePrivacySettings().biometricsEnabled).toBe(false)
      expect(mockShowToast).toHaveBeenCalledWith(
        'Biometria',
        expect.objectContaining({
          duration: 5000,
          message:
            'Configura Face ID ou impressão digital neste dispositivo primeiro.',
          variant: 'error',
        }),
      )
    })
  })

  it('hides the biometrics toggle when the device has no biometric hardware', async () => {
    __setBiometricHardware(false)

    renderWithProvider(<ProfilePrivacyScreen />)

    await resolveMockApi()

    await waitFor(() => {
      expect(screen.queryByLabelText('Biometria')).toBeNull()
    })
  })

  it('keeps privacy toggles while push notifications sync and preserves the merged state', async () => {
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
        <ProfileScreen />
        <ProfilePrivacyScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const privacyScreen = within(screen.getByTestId('profile-privacy-screen'))
    const pushNotificationsCard = within(
      screen.getByTestId('profile-privacy-push-notifications-card'),
    )

    fireEvent.press(
      privacyScreen.getByLabelText('E-mails de segurança dos pagamentos'),
    )
    fireEvent.press(pushNotificationsCard.getByLabelText('Notificações push'))

    await resolveMockApi(2)

    await waitFor(() => {
      expect(requestPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(
        privacyScreen.getByText(
          'Os e-mails de alertas de segurança serão enviados para o e-mail atual definido no teu perfil: joao.ferreira@sdr.pt.',
        ),
      ).toBeTruthy()
      expect(screen.getByText('Desativados')).toBeTruthy()
      expect(screen.getByText('Notificações push ativas.')).toBeTruthy()
    })

    await waitFor(() => {
      expect(screen.getByText('Dados do perfil')).toBeTruthy()
      expect(screen.getByText('Desativados')).toBeTruthy()
      expect(screen.getByText('Notificações push ativas.')).toBeTruthy()
    })
  })

  it('turns the push switch off and disables it when permission is blocked', async () => {
    __setNextNotificationPermissionRequestResponse({
      canAskAgain: false,
      granted: false,
      status: 'denied',
    })

    renderWithProvider(
      <Fragment>
        <ProfileScreen />
        <ProfilePrivacyScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const pushNotificationsCard = within(
      screen.getByTestId('profile-privacy-push-notifications-card'),
    )

    fireEvent.press(pushNotificationsCard.getByLabelText('Notificações push'))

    await resolveMockApi(2)

    await waitFor(() => {
      const pushNotificationsToggle =
        pushNotificationsCard.UNSAFE_getByType(Switch)

      expect(pushNotificationsToggle.props.checked).toBe(false)
      expect(pushNotificationsToggle.props.disabled).toBe(true)
      expect(screen.getByText('Abrir definições')).toBeTruthy()
      expect(getStoredDevicePrivacySettings().pushNotificationsEnabled).toBe(
        false,
      )
    })

    fireEvent.press(screen.getByText('Abrir definições'))

    expect(openSettingsSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps save actions clickable and surfaces validation errors on invalid submit', async () => {
    renderWithProvider(
      <Fragment>
        <ProfileScreen />
        <ProfilePersonalScreen />
        <ProfilePaymentsScreen />
        <ProfilePrivacyScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const personalScreen = within(screen.getByTestId('profile-personal-screen'))
    fireEvent.changeText(personalScreen.getByLabelText('Nome completo'), '')
    fireEvent.changeText(personalScreen.getByLabelText('Telefone'), '123')
    fireEvent.changeText(personalScreen.getByLabelText('NIF'), '123')

    expect(getButtonDisabledState('profile-personal-save-button')).toBe(false)
    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await waitFor(() => {
      expect(screen.getByText('O nome e obrigatorio.')).toBeTruthy()
      expect(
        screen.getByText(
          'Insere um telefone valido com indicativo internacional.',
        ),
      ).toBeTruthy()
      expect(screen.getByText('O NIF tem de ter 9 digitos.')).toBeTruthy()
    })

    const paymentsScreen = within(screen.getByTestId('profile-payments-screen'))
    fireEvent.changeText(
      paymentsScreen.getByLabelText('IBAN associado'),
      'PT50 1234',
    )

    expect(getButtonDisabledState('profile-payments-save-button')).toBe(false)
    fireEvent.press(screen.getByTestId('profile-payments-save-button'))

    await waitFor(() => {
      expect(screen.getByText('Insere um IBAN portugues valido.')).toBeTruthy()
    })

    expect(
      within(screen.getByTestId('profile-privacy-screen')).queryByTestId(
        'profile-privacy-save-button',
      ),
    ).toBeNull()
    expect(mockShowToast).not.toHaveBeenCalled()
    expect(screen.getAllByText('Joao Ferreira').length).toBeGreaterThan(0)
  })

  it('disables profile save actions while their mutations are pending', async () => {
    renderWithProvider(
      <Fragment>
        <ProfilePersonalScreen />
        <ProfilePaymentsScreen />
        <ProfilePrivacyScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const personalScreen = within(screen.getByTestId('profile-personal-screen'))
    fireEvent.changeText(
      personalScreen.getByLabelText('Nome completo'),
      'Ana Silva',
    )
    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await waitFor(() => {
      expect(getButtonDisabledState('profile-personal-save-button')).toBe(true)
    })
    expect(
      within(
        screen.getByTestId('profile-personal-save-button'),
      ).UNSAFE_getByType(Spinner),
    ).toBeTruthy()

    await resolveMockApi(2)

    await waitFor(() => {
      expect(getButtonDisabledState('profile-personal-save-button')).toBe(false)
    })

    const paymentsScreen = within(screen.getByTestId('profile-payments-screen'))
    fireEvent.changeText(
      paymentsScreen.getByLabelText('IBAN associado'),
      'PT50 0007 0000 1111 2222 3',
    )
    fireEvent.press(screen.getByTestId('profile-payments-save-button'))

    await waitFor(() => {
      expect(getButtonDisabledState('profile-payments-save-button')).toBe(true)
    })
    expect(
      within(
        screen.getByTestId('profile-payments-save-button'),
      ).UNSAFE_getByType(Spinner),
    ).toBeTruthy()

    await resolveMockApi(2)

    await waitFor(() => {
      expect(getButtonDisabledState('profile-payments-save-button')).toBe(false)
    })

    expect(
      within(screen.getByTestId('profile-privacy-screen')).queryByTestId(
        'profile-privacy-save-button',
      ),
    ).toBeNull()
  })

  it('shows an error toast when saving profile data fails', async () => {
    mockApiServer.use(
      http.patch(`${MOCK_API_ORIGIN}/profile`, () =>
        HttpResponse.json(
          {
            message: 'personal failed',
          },
          {
            status: 500,
          },
        ),
      ),
    )

    renderWithProvider(<ProfilePersonalScreen />)

    await resolveMockApi()

    fireEvent.changeText(screen.getByLabelText('Nome completo'), 'Ana Silva')
    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await resolveMockApi(2)

    expect(mockShowToast).toHaveBeenCalledWith(
      'Guardar dados',
      expect.objectContaining({
        duration: 5000,
        message: 'Não foi possível guardar os teus dados agora.',
        variant: 'error',
      }),
    )
  })

  it('applies app settings immediately without a save action', async () => {
    renderWithProvider(
      <Fragment>
        <ProfileScreen />
        <ProfileAppSettingsScreen />
      </Fragment>,
    )

    await resolveMockApi()

    const appSettingsScreen = within(
      screen.getByTestId('profile-app-settings-screen'),
    )

    expect(
      appSettingsScreen.queryByTestId('profile-app-settings-save-button'),
    ).toBeNull()
    const initialProfileScreen = within(screen.getByTestId('profile-screen'))

    expect(initialProfileScreen.getByText('Aspeto da app')).toBeTruthy()
    expect(initialProfileScreen.getByText('Idioma')).toBeTruthy()
    expect(initialProfileScreen.getAllByText('Sistema')).toHaveLength(2)

    act(() => {
      fireEvent.press(appSettingsScreen.getByLabelText('Escuro'))
      fireEvent.press(appSettingsScreen.getByLabelText('English'))
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => {
      const updatedProfileScreen = within(screen.getByTestId('profile-screen'))

      expect(updatedProfileScreen.getByText('App settings')).toBeTruthy()
      expect(updatedProfileScreen.getByText('App appearance')).toBeTruthy()
      expect(updatedProfileScreen.getByText('Language')).toBeTruthy()
      expect(updatedProfileScreen.getByText('Dark')).toBeTruthy()
      expect(updatedProfileScreen.getByText('English')).toBeTruthy()
    })

    expect(mockShowToast).toHaveBeenNthCalledWith(
      1,
      'Aspeto da app',
      expect.objectContaining({
        duration: 3500,
        message: 'Esta alteração foi guardada neste telemóvel.',
        variant: 'success',
      }),
    )
    expect(mockShowToast).toHaveBeenNthCalledWith(
      2,
      'Idioma',
      expect.objectContaining({
        duration: 3500,
        message: 'Esta alteração foi guardada neste telemóvel.',
        variant: 'success',
      }),
    )
  })

  it('renders the summary screen with personal activity totals and transfer status', async () => {
    renderWithProvider(<ProfileSummaryScreen />)

    expect(screen.getByTestId('profile-summary-screen-skeleton')).toBeTruthy()

    await resolveMockApi()

    expect(screen.getByTestId('profile-summary-screen')).toBeTruthy()
    expect(
      within(screen.getByTestId('profile-summary-screen')).queryByText('JF'),
    ).toBeNull()
    expect(
      within(screen.getByTestId('profile-summary-screen')).getAllByText(
        'A tua atividade',
      )[0],
    ).toBeTruthy()
    expect(screen.getByText(/Créditos recebidos/i)).toBeTruthy()
    expect(screen.getByText(/Transferências em processamento/i)).toBeTruthy()
    expect(screen.getByText('Embalagens devolvidas')).toBeTruthy()
    expect(screen.getByText('30')).toBeTruthy()
    expect(screen.getByText(/1,50/)).toBeTruthy()
    expect(screen.getByText('Transferências concluídas')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('renders each grouped section screen and handles back navigation', async () => {
    renderWithProvider(
      <Fragment>
        <ProfilePersonalScreen />
        <ProfilePaymentsScreen />
        <ProfileSummaryScreen />
      </Fragment>,
    )

    await resolveMockApi()

    expect(screen.getByTestId('profile-personal-screen')).toBeTruthy()
    expect(screen.getByTestId('profile-payments-screen')).toBeTruthy()
    expect(screen.getByTestId('profile-summary-screen')).toBeTruthy()

    fireEvent.press(screen.getAllByLabelText('Voltar')[0])

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })
})
