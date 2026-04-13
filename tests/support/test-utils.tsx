import type { ReactElement } from 'react'
import { render } from '@testing-library/react-native'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { Provider } from '@/components/Provider'
import { config } from '@/tamagui.config'

const fallbackSafeAreaMetrics = {
  frame: { height: 0, width: 0, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
}

export function renderWithProvider(ui: ReactElement) {
  return render(<Provider>{ui}</Provider>)
}

export function renderWithTheme(
  ui: ReactElement,
  providerProps: Partial<Omit<TamaguiProviderProps, 'config'>> = {},
) {
  return render(
    <SafeAreaProvider
      initialMetrics={initialWindowMetrics ?? fallbackSafeAreaMetrics}
    >
      <TamaguiProvider config={config} defaultTheme="light" {...providerProps}>
        {ui}
      </TamaguiProvider>
    </SafeAreaProvider>,
  )
}
