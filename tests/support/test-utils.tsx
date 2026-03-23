import type { ReactElement } from 'react'
import { act, render, screen } from '@testing-library/react-native'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { Provider } from '@/components/Provider'
import { MOCK_API_DELAY_MS } from '@/features/app-data/mock'
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

export async function resolveMockApi(cycles = 4) {
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    await act(async () => {
      jest.advanceTimersByTime(MOCK_API_DELAY_MS)
      await Promise.resolve()
      await Promise.resolve()
    })
  }
}

export async function refreshScrollScreen(screenTestId: string, cycles = 2) {
  const scrollView = screen.getByTestId(`${screenTestId}-scroll-view`)

  await act(async () => {
    scrollView.props.refreshControl.props.onRefresh()
    await Promise.resolve()
  })

  await resolveMockApi(cycles)
}

export async function refreshList(listTestId: string, cycles = 2) {
  const list = screen.getByTestId(listTestId)

  await act(async () => {
    list.props.onRefresh()
    await Promise.resolve()
  })

  await resolveMockApi(cycles)
}
