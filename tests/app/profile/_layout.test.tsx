import { mockStack, resetAppLayoutMocks } from '@tests/support/app-layout-mocks'
import { render } from '@testing-library/react-native'
import ProfileLayout from '@/app/profile/_layout'

describe('app/profile/_layout', () => {
  beforeEach(() => {
    resetAppLayoutMocks()
  })

  it('configures the profile stack without headers', () => {
    render(<ProfileLayout />)

    expect(mockStack.mock.calls[0]?.[0].screenOptions).toEqual({
      headerShown: false,
    })
  })
})
