import { render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'

import TabTwoScreen from '@/app/(tabs)/two'
import { config } from '@/tamagui.config'

describe('TabTwoScreen', () => {
  it('renders the tab label', () => {
    render(
      <TamaguiProvider config={config} defaultTheme="light">
        <TabTwoScreen />
      </TamaguiProvider>,
    )

    expect(screen.getByText('Tab Two')).toBeTruthy()
  })
})
