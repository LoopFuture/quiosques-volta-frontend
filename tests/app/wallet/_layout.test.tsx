import { mockStack, resetAppLayoutMocks } from '@tests/support/app-layout-mocks'
import { render } from '@testing-library/react-native'
import WalletLayout from '@/app/wallet/_layout'

describe('app/wallet/_layout', () => {
  beforeEach(() => {
    resetAppLayoutMocks()
  })

  it('configures the wallet stack without headers', () => {
    render(<WalletLayout />)

    expect(mockStack.mock.calls[0]?.[0].screenOptions).toEqual({
      headerShown: false,
    })
  })
})
