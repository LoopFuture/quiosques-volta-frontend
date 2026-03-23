import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { BackHandler, Platform } from 'react-native'
import { http, HttpResponse } from 'msw'
import * as mockApi from '@/features/app-data/mock'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'
import { mockApiServer } from '@/features/app-data/mock/server.node'
import { renderWithProvider, resolveMockApi } from '../../support/test-utils'

let currentBrightness = 0.42
let pendingBrightnessWrites: (() => void)[] = []

const mockGetBrightnessAsync = jest.fn()
const mockIsAvailableAsync = jest.fn()
const mockIsUsingSystemBrightnessAsync = jest.fn()
const mockRestoreSystemBrightnessAsync = jest.fn()
const mockSetBrightnessAsync = jest.fn()

jest.mock('expo-brightness', () => ({
  getBrightnessAsync: mockGetBrightnessAsync,
  isAvailableAsync: mockIsAvailableAsync,
  isUsingSystemBrightnessAsync: mockIsUsingSystemBrightnessAsync,
  restoreSystemBrightnessAsync: mockRestoreSystemBrightnessAsync,
  setBrightnessAsync: mockSetBrightnessAsync,
}))

jest.mock('react-native-qrcode-svg', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')

  return function MockQRCode(props: { testID?: string }) {
    return <View testID={props.testID ?? 'mock-qr-code'} />
  }
})

const BarcodeScreen = jest.requireActual(
  '@/features/barcode/screens/BarcodeScreen',
).default

type MockBarcodeStep =
  | {
      reference: string
      ttlMs: number
    }
  | {
      message?: string
      status: number
    }

function createMockBarcodeResponse(reference: string, ttlMs: number) {
  return {
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    reference,
  }
}

function mockBarcodeSequence(steps: MockBarcodeStep[]) {
  let requestCount = 0

  mockApiServer.use(
    http.get(`${MOCK_API_ORIGIN}/barcode`, async () => {
      const step = steps[Math.min(requestCount, steps.length - 1)]
      requestCount += 1

      await mockApi.waitForMockApi()

      if ('status' in step) {
        return HttpResponse.json(
          {
            message: step.message ?? 'barcode failed',
          },
          {
            status: step.status,
          },
        )
      }

      return HttpResponse.json(
        createMockBarcodeResponse(step.reference, step.ttlMs),
      )
    }),
  )

  return {
    getRequestCount: () => requestCount,
  }
}

async function advanceClockBy(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('BarcodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-23T12:00:00Z'))
    jest.replaceProperty(Platform, 'OS', 'android')
    currentBrightness = 0.42
    pendingBrightnessWrites = []
    mockApi.resetMockApiState()
    mockIsAvailableAsync.mockResolvedValue(true)
    mockGetBrightnessAsync.mockImplementation(async () => currentBrightness)
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(false)
    mockSetBrightnessAsync.mockImplementation(async (value: number) => {
      currentBrightness = value
    })
    mockRestoreSystemBrightnessAsync.mockImplementation(async () => {
      currentBrightness = 0.42
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('opens the QR modal at max brightness and restores brightness when closed', async () => {
    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenCalledWith(1)
    })

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
      expect(mockSetBrightnessAsync).toHaveBeenCalledWith(0.42)
    })
  })

  it('renders the same countdown in the card and modal and decrements it every second', async () => {
    mockBarcodeSequence([
      {
        reference: 'VF-1001-RTM-2026',
        ttlMs: 30_000,
      },
    ])

    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    expect(screen.getByTestId('barcode-inline-countdown')).toBeTruthy()
    expect(screen.getByText('00:30')).toBeTruthy()

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })

    expect(screen.getByTestId('barcode-modal-countdown')).toBeTruthy()
    expect(screen.getAllByText('00:30')).toHaveLength(2)

    await advanceClockBy(1000)

    await waitFor(() => {
      expect(screen.getAllByText('00:29')).toHaveLength(2)
    })
  })

  it('auto-refreshes once at expiry, hides the stale qr immediately, and shows the next reference', async () => {
    const barcodeSequence = mockBarcodeSequence([
      {
        reference: 'VF-1001-RTM-2026',
        ttlMs: 2_000,
      },
      {
        reference: 'VF-1002-RTM-2026',
        ttlMs: 45_000,
      },
    ])

    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })

    await advanceClockBy(2000)

    await waitFor(() => {
      expect(barcodeSequence.getRequestCount()).toBe(2)
    })

    expect(screen.queryByText('VF-1001-RTM-2026')).toBeNull()
    expect(screen.queryByTestId('barcode-inline-qr')).toBeNull()
    expect(screen.queryByTestId('barcode-modal-qr')).toBeNull()
    expect(screen.getByTestId('barcode-inline-refreshing-state')).toBeTruthy()
    expect(screen.getByTestId('barcode-inline-action-spacer')).toBeTruthy()
    expect(screen.getByTestId('barcode-inline-status-label')).toBeTruthy()
    expect(screen.getByTestId('barcode-modal-refreshing-state')).toBeTruthy()
    expect(screen.getByTestId('barcode-modal-status-label')).toBeTruthy()

    await resolveMockApi(4)

    await waitFor(() => {
      expect(screen.getByTestId('barcode-inline-qr')).toBeTruthy()
      expect(screen.getByTestId('barcode-modal-qr')).toBeTruthy()
    })

    expect(screen.queryByText('VF-1002-RTM-2026')).toBeNull()
  })

  it('keeps the qr hidden after an expired refresh fails and lets the user retry', async () => {
    const barcodeSequence = mockBarcodeSequence([
      {
        reference: 'VF-1001-RTM-2026',
        ttlMs: 1_000,
      },
      {
        message: 'barcode refresh failed',
        status: 500,
      },
      {
        reference: 'VF-1002-RTM-2026',
        ttlMs: 30_000,
      },
    ])

    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    })

    await advanceClockBy(1000)

    await waitFor(() => {
      expect(barcodeSequence.getRequestCount()).toBe(2)
    })

    await resolveMockApi(4)

    await waitFor(() => {
      expect(screen.getByTestId('barcode-inline-expired-state')).toBeTruthy()
      expect(screen.getByTestId('barcode-modal-expired-state')).toBeTruthy()
    })

    expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
    expect(screen.queryByText('VF-1001-RTM-2026')).toBeNull()
    expect(screen.queryByTestId('barcode-inline-qr')).toBeNull()
    expect(screen.queryByTestId('barcode-modal-qr')).toBeNull()

    fireEvent.press(screen.getAllByText('Gerar novo código')[0])

    await waitFor(() => {
      expect(barcodeSequence.getRequestCount()).toBe(3)
    })

    await resolveMockApi(4)

    await waitFor(() => {
      expect(screen.getByTestId('barcode-inline-qr')).toBeTruthy()
      expect(screen.getByTestId('barcode-modal-qr')).toBeTruthy()
    })

    expect(screen.queryByText('VF-1002-RTM-2026')).toBeNull()
  })

  it('closes the QR modal when the overlay is pressed', async () => {
    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()

    fireEvent.press(screen.UNSAFE_getByProps({ testID: 'barcode-qr-overlay' }))

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })
  })

  it('closes the QR modal when Android back is pressed', async () => {
    const removeBackHandlerListener = jest.fn()
    let hardwareBackPressListener:
      | (() => boolean | null | undefined)
      | undefined

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

    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()

    let handled: boolean | null | undefined
    await act(async () => {
      handled = hardwareBackPressListener?.()
      await Promise.resolve()
    })

    expect(handled).toBe(true)

    await waitFor(() => {
      expect(screen.queryByTestId('barcode-qr-modal')).toBeNull()
    })
    expect(removeBackHandlerListener).toHaveBeenCalled()
  })

  it('restores system brightness when the app was following it before opening', async () => {
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(true)

    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenCalledWith(1)
    })

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(mockRestoreSystemBrightnessAsync).toHaveBeenCalledTimes(1)
    })
  })

  it('restores brightness if the max-brightness request resolves after the modal closes', async () => {
    mockSetBrightnessAsync.mockImplementation(
      (value: number) =>
        new Promise<void>((resolve) => {
          pendingBrightnessWrites.push(() => {
            currentBrightness = value
            resolve()
          })
        }),
    )

    renderWithProvider(<BarcodeScreen />)

    await resolveMockApi(4)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenCalledWith(1)
    })

    fireEvent.press(screen.getByTestId('barcode-qr-close'))

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenCalledWith(0.42)
    })

    await waitFor(() => {
      expect(pendingBrightnessWrites).toHaveLength(2)
    })

    await resolveMockApiWrite(pendingBrightnessWrites[1])
    expect(currentBrightness).toBe(0.42)

    await resolveMockApiWrite(pendingBrightnessWrites[0])

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenCalledTimes(3)
      expect(pendingBrightnessWrites).toHaveLength(3)
    })

    await resolveMockApiWrite(pendingBrightnessWrites[2])
    expect(currentBrightness).toBe(0.42)
  })
})

async function resolveMockApiWrite(write?: () => void) {
  await waitFor(() => {
    expect(write).toBeDefined()
  })

  await act(async () => {
    write?.()
    await Promise.resolve()
  })
}
