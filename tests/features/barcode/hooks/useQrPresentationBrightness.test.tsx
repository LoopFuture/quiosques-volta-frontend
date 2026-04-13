import { Text } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'
import { restorePlatformOS, setPlatformOS } from '@tests/support/react-native'

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

const { useQrPresentationBrightness } = jest.requireActual(
  '@/features/barcode/hooks/useQrPresentationBrightness',
)

function BrightnessHarness({ isOpen }: { isOpen: boolean }) {
  useQrPresentationBrightness(isOpen)

  return <Text>{String(isOpen)}</Text>
}

async function waitForMaxBrightness() {
  await waitFor(() => {
    expect(mockSetBrightnessAsync).toHaveBeenCalledWith(1)
  })
}

function createDeferredPromise() {
  let resolve: () => void
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve: resolve! }
}

describe('useQrPresentationBrightness', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setPlatformOS('android')
    mockGetBrightnessAsync.mockResolvedValue(0.42)
    mockIsAvailableAsync.mockResolvedValue(true)
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(false)
    mockRestoreSystemBrightnessAsync.mockResolvedValue(undefined)
    mockSetBrightnessAsync.mockResolvedValue(undefined)
  })

  afterEach(() => {
    restorePlatformOS()
  })

  it('restores system brightness on Android when the modal closes', async () => {
    mockIsUsingSystemBrightnessAsync.mockResolvedValue(true)

    const view = render(<BrightnessHarness isOpen={true} />)

    await waitForMaxBrightness()

    view.rerender(<BrightnessHarness isOpen={false} />)

    await waitFor(() => {
      expect(mockRestoreSystemBrightnessAsync).toHaveBeenCalledTimes(1)
    })
  })

  it('restores the captured brightness value when system brightness is not active', async () => {
    const view = render(<BrightnessHarness isOpen={true} />)

    await waitForMaxBrightness()

    view.rerender(<BrightnessHarness isOpen={false} />)

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenLastCalledWith(0.42)
    })
  })

  it('falls back to restoring the captured value when Android system-brightness lookup fails', async () => {
    mockIsUsingSystemBrightnessAsync.mockRejectedValueOnce(
      new Error('system brightness unavailable'),
    )

    const view = render(<BrightnessHarness isOpen={true} />)

    await waitForMaxBrightness()

    view.rerender(<BrightnessHarness isOpen={false} />)

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenLastCalledWith(0.42)
    })
  })

  it('skips setup when the brightness API is unavailable', async () => {
    mockIsAvailableAsync.mockResolvedValueOnce(false)

    const view = render(<BrightnessHarness isOpen={true} />)

    await waitFor(() => {
      expect(mockIsAvailableAsync).toHaveBeenCalledTimes(1)
    })

    view.rerender(<BrightnessHarness isOpen={false} />)

    expect(mockGetBrightnessAsync).not.toHaveBeenCalled()
    expect(mockSetBrightnessAsync).not.toHaveBeenCalled()
    expect(mockRestoreSystemBrightnessAsync).not.toHaveBeenCalled()
  })

  it('restores the previous brightness if the modal closes while max brightness is still pending', async () => {
    const deferredBrightness = createDeferredPromise()

    mockSetBrightnessAsync.mockImplementation((value: number) => {
      if (value === 1) {
        return deferredBrightness.promise
      }

      return Promise.resolve()
    })

    const view = render(<BrightnessHarness isOpen={true} />)

    await waitForMaxBrightness()

    view.unmount()
    deferredBrightness.resolve()

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenLastCalledWith(0.42)
    })
  })

  it('restores the previous brightness value on iOS', async () => {
    setPlatformOS('ios')

    const view = render(<BrightnessHarness isOpen={true} />)

    await waitForMaxBrightness()

    view.rerender(<BrightnessHarness isOpen={false} />)

    await waitFor(() => {
      expect(mockSetBrightnessAsync).toHaveBeenLastCalledWith(0.42)
    })
    expect(mockIsUsingSystemBrightnessAsync).not.toHaveBeenCalled()
  })
})
