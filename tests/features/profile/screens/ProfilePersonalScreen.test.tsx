import {
  mockShowError,
  mockShowSuccess,
  mockUseProfileQuery,
  mockUseUpdateProfilePersonalMutation,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfilePersonalScreen } from '@/features/profile/screens/ProfilePersonalScreen'
import { profileRoutes } from '@/features/profile/routes'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

const {
  __mockRouterReplace: mockRouterReplace,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
  __mockUsePathname: mockUsePathname,
} = jest.requireMock('expo-router')

describe('ProfilePersonalScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
    mockUseLocalSearchParams.mockReturnValue({})
    mockUsePathname.mockReturnValue(profileRoutes.personal)
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
  })

  it('renders the personal details skeleton while the profile query is pending', () => {
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfilePersonalScreen />)

    expect(screen.getByTestId('profile-personal-screen-skeleton')).toBeTruthy()
  })

  it('renders the forced e2e error state and clears it on retry', () => {
    const { __setExpoConfig } = jest.requireMock('expo-constants') as {
      __setExpoConfig: jest.Mock
    }

    __setExpoConfig({
      extra: {
        api: {
          baseUrl: 'https://volta.be.dev.theloop.tech',
        },
        e2e: {
          enabled: true,
        },
        eas: {
          projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
        },
        keycloak: {
          clientId: 'volta-mobile',
          issuerUrl: 'https://keycloak.example.com/realms/volta',
          scopes: ['openid', 'profile', 'email'],
        },
        sentry: {},
        webApp: {
          baseUrl: 'https://volta.example.com',
        },
      },
    })
    mockUseLocalSearchParams.mockReturnValue({
      __e2eQueryState: 'error',
    })

    renderWithProvider(<ProfilePersonalScreen />)

    expect(
      screen.getByTestId('profile-personal-screen-error-state'),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByTestId('profile-personal-screen-error-state-retry-button'),
    )

    expect(mockRouterReplace).toHaveBeenCalledWith(profileRoutes.personal)
  })

  it('submits updated personal details and shows the success toast', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onSuccess?.()
      },
    )

    mockUseUpdateProfilePersonalMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePersonalScreen />)

    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
    })

    expect(mockShowSuccess).toHaveBeenCalledWith(
      i18n.t('tabScreens.profile.personal.saveLabel'),
      i18n.t('tabScreens.profile.personal.saveSuccessToast'),
    )
  })

  it('shows an error toast when saving personal details fails', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onError?.()
      },
    )

    mockUseUpdateProfilePersonalMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePersonalScreen />)

    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.personal.saveLabel'),
        i18n.t('tabScreens.profile.personal.saveErrorToast'),
      )
    })
  })
})
