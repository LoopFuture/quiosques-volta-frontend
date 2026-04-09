import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { renderWithProvider } from '@tests/support/test-utils'

const mockShowToast = jest.fn()

jest.mock('@tamagui/toast', () => {
  const { createTamaguiToastMock } = jest.requireActual(
    '@tests/support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getShowToast: () => mockShowToast,
  })
})

function ActionToastHarness() {
  const { showError, showSuccess } = useActionToast()

  return (
    <>
      <Text onPress={() => showSuccess('Saved', 'All changes were saved.')}>
        show-success
      </Text>
      <Text onPress={() => showError('Failed', 'Something went wrong.')}>
        show-error
      </Text>
    </>
  )
}

describe('useActionToast', () => {
  beforeEach(() => {
    mockShowToast.mockClear()
  })

  it('shows success and error toasts with the correct variants', () => {
    renderWithProvider(<ActionToastHarness />)

    fireEvent.press(screen.getByText('show-success'))
    fireEvent.press(screen.getByText('show-error'))

    expect(mockShowToast).toHaveBeenNthCalledWith(
      1,
      'Saved',
      expect.objectContaining({
        message: 'All changes were saved.',
        variant: 'success',
      }),
    )
    expect(mockShowToast).toHaveBeenNthCalledWith(
      2,
      'Failed',
      expect.objectContaining({
        message: 'Something went wrong.',
        variant: 'error',
      }),
    )
  })
})
