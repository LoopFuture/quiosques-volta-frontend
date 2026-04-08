import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import { BackHandler } from 'react-native'
import { Provider } from '@/components/Provider'
import BarcodeScreen from '@/features/barcode/screens/BarcodeScreen'
import { barcodeResponseSchema } from '@/features/barcode/models'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { restorePlatformOS, setPlatformOS } from '../../support/react-native'

const mockGetBrightnessAsync = jest.fn()
const mockIsAvailableAsync = jest.fn()
const mockIsUsingSystemBrightnessAsync = jest.fn()
const mockRestoreSystemBrightnessAsync = jest.fn()
const mockSetBrightnessAsync = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('expo-brightness', () => ({
  getBrightnessAsync: mockGetBrightnessAsync,
  isAvailableAsync: mockIsAvailableAsync,
  isUsingSystemBrightnessAsync: mockIsUsingSystemBrightnessAsync,
  restoreSystemBrightnessAsync: mockRestoreSystemBrightnessAsync,
  setBrightnessAsync: mockSetBrightnessAsync,
}))

jest.mock('react-native-qrcode-svg', () => {
  const { View } = jest.requireActual('react-native')

  return function MockQrCode(props: { testID?: string }) {
    return <View testID={props.testID ?? 'mock-qr-code'} />
  }
})

jest.mock('@/features/barcode/hooks', () => {
  const actual = jest.requireActual('@/features/barcode/hooks')

  return {
    ...actual,
    useBarcodeScreenQuery: jest.fn(),
  }
})

const { useBarcodeScreenQuery: mockUseBarcodeScreenQuery } = jest.requireMock(
  '@/features/barcode/hooks',
)

const activeBarcode = barcodeResponseSchema.parse({
  code: 'VF-0001-RTM-2026',
  expiresAt: '2026-04-08T12:00:45.000Z',
})
const expiredBarcode = barcodeResponseSchema.parse({
  code: 'VF-0001-RTM-2026',
  expiresAt: '2026-04-08T11:59:59.000Z',
})

let currentBarcodeQueryState: {
  data: typeof activeBarcode | typeof expiredBarcode | undefined
  isError: boolean
  isPending: boolean
  isRefetching: boolean
  refetch: jest.Mock
}

function renderBarcodeScreen() {
  return render(
    <Provider>
      <BarcodeScreen />
    </Provider>,
  )
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('BarcodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-04-08T12:00:00.000Z'))
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    setPlatformOS('android')

    currentBarcodeQueryState = {
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    }

    mockUseBarcodeScreenQuery.mockImplementation(() => currentBarcodeQueryState)
    mockIsAvailableAsync.mockResolvedValue(true)
    mockGetBrightnessAsync.mockResolvedValue(0.42)
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(false)
    mockSetBrightnessAsync.mockResolvedValue(undefined)
    mockRestoreSystemBrightnessAsync.mockResolvedValue(undefined)
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    restorePlatformOS()
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('renders the loading skeleton while the query is pending', () => {
    renderBarcodeScreen()

    expect(screen.getByTestId('barcode-screen-skeleton')).toBeTruthy()
  })

  it('renders the error state and retries the query', () => {
    const refetch = jest.fn()

    currentBarcodeQueryState = {
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    }

    renderBarcodeScreen()

    expect(screen.getByTestId('barcode-screen-error-state')).toBeTruthy()

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('opens the QR modal, updates the countdown, and restores system brightness when closed', async () => {
    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    }
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(true)

    renderBarcodeScreen()

    expect(screen.getByText('00:45')).toBeTruthy()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })

    expect(screen.getAllByText('00:45')).toHaveLength(2)

    await act(async () => {
      jest.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    expect(screen.getAllByText('00:44')).toHaveLength(2)

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })
  })

  it('restores the captured brightness value when Android is not using system brightness', async () => {
    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    }
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(false)

    renderBarcodeScreen()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })
    await flushAsync()

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })

    expect(screen.getByTestId('barcode-screen')).toBeTruthy()
  })

  it('skips brightness adjustments when the API is unavailable', async () => {
    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    }
    mockIsAvailableAsync.mockResolvedValue(false)

    renderBarcodeScreen()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })
    await flushAsync()

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })

    expect(screen.getByTestId('barcode-screen')).toBeTruthy()
  })

  it('falls back to restoring the captured brightness when Android system-brightness lookup fails', async () => {
    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    }
    mockIsUsingSystemBrightnessAsync.mockRejectedValueOnce(
      new Error('system brightness unavailable'),
    )

    renderBarcodeScreen()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })
    await flushAsync()

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })

    expect(screen.getByTestId('barcode-screen')).toBeTruthy()
  })

  it('restores the captured brightness value on iOS', async () => {
    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    }
    setPlatformOS('ios')

    renderBarcodeScreen()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })
    await flushAsync()

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })

    expect(screen.getByTestId('barcode-screen')).toBeTruthy()
  })

  it('shows refreshing and expired states for an expired barcode while keeping the modal open', async () => {
    const refetch = jest.fn()

    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch,
    }

    const view = renderBarcodeScreen()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })

    currentBarcodeQueryState = {
      data: expiredBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch,
    }

    view.rerender(
      <Provider>
        <BarcodeScreen />
      </Provider>,
    )
    await flushAsync()

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('barcode-inline-refreshing-state')).toBeTruthy()
    expect(screen.getByTestId('barcode-modal-refreshing-state')).toBeTruthy()
    expect(screen.getByTestId('barcode-inline-action-spacer')).toBeTruthy()
    expect(screen.getByTestId('barcode-inline-status-label')).toBeTruthy()
    expect(screen.getByTestId('barcode-modal-status-label')).toBeTruthy()

    view.rerender(
      <Provider>
        <BarcodeScreen />
      </Provider>,
    )
    await flushAsync()

    expect(refetch).toHaveBeenCalledTimes(1)

    currentBarcodeQueryState = {
      data: expiredBarcode,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    }

    view.rerender(
      <Provider>
        <BarcodeScreen />
      </Provider>,
    )
    await flushAsync()

    expect(screen.getByTestId('barcode-inline-expired-state')).toBeTruthy()
    expect(screen.getByTestId('barcode-modal-expired-state')).toBeTruthy()

    fireEvent.press(
      screen.getAllByText(i18n.t('tabScreens.barcode.card.retryLabel'))[0]!,
    )

    expect(refetch).toHaveBeenCalledTimes(2)
  })

  it('closes the modal when Android back is pressed', async () => {
    const removeBackHandlerListener = jest.fn()
    let hardwareBackPressListener:
      | (() => boolean | null | undefined)
      | undefined

    currentBarcodeQueryState = {
      data: activeBarcode,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    }

    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((eventName, listener) => {
        if (eventName === 'hardwareBackPress') {
          hardwareBackPressListener = listener
        }

        return {
          remove: removeBackHandlerListener,
        }
      })

    renderBarcodeScreen()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })

    expect(hardwareBackPressListener?.()).toBe(true)

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })
    expect(removeBackHandlerListener).toHaveBeenCalled()
  })
})
