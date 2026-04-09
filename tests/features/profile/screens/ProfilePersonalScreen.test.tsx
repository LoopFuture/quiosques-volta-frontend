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
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfilePersonalScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
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
