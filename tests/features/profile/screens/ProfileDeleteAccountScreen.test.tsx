import {
  mockDeleteProfileAccountMutate,
  mockShowError,
  mockSignOut,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfileDeleteAccountScreen } from '@/features/profile/screens/ProfileDeleteAccountScreen'
import { authRoutes } from '@/features/auth/routes'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

const { __mockRouterReplace: mockRouterReplace } =
  jest.requireMock('expo-router')

describe('ProfileDeleteAccountScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
  })

  it('keeps the delete action disabled until the user confirms', () => {
    renderWithProvider(<ProfileDeleteAccountScreen />)

    expect(
      screen.getByTestId('profile-delete-account-button').props
        .accessibilityState.disabled,
    ).toBe(true)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.deleteAccount.confirmationLabel'),
      ),
    )

    expect(
      screen.getByTestId('profile-delete-account-button').props
        .accessibilityState.disabled,
    ).toBe(false)
  })

  it('deletes the account, signs out, and returns to auth after confirmation', async () => {
    mockDeleteProfileAccountMutate.mockImplementation((_value, options) => {
      options?.onSuccess?.()
    })

    renderWithProvider(<ProfileDeleteAccountScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.deleteAccount.confirmationLabel'),
      ),
    )
    fireEvent.press(screen.getByTestId('profile-delete-account-button'))

    await waitFor(() => {
      expect(mockDeleteProfileAccountMutate).toHaveBeenCalledTimes(1)
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockRouterReplace).toHaveBeenCalledWith(authRoutes.index)
    })
  })

  it('shows an error toast and stays on the screen when deletion fails', async () => {
    mockDeleteProfileAccountMutate.mockImplementation((_value, options) => {
      options?.onError?.(new Error('delete failed'))
    })

    renderWithProvider(<ProfileDeleteAccountScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.deleteAccount.confirmationLabel'),
      ),
    )
    fireEvent.press(screen.getByTestId('profile-delete-account-button'))

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.deleteAccount.buttonLabel'),
        i18n.t('tabScreens.profile.deleteAccount.errorToast'),
      )
    })

    expect(mockSignOut).not.toHaveBeenCalled()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
})
