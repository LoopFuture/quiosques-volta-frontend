import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

export type MockToastProviderProps = {
  children?: ReactNode
  duration?: number
  native?: unknown[]
  swipeDirection?: string
}

export type MockToastViewportProps = Record<string, unknown>

type CreateTamaguiToastMockOptions = {
  getHideToast?: () => jest.Mock
  getShowToast?: () => jest.Mock
  hideToast?: jest.Mock
  renderToastProvider?: (props: MockToastProviderProps) => ReactNode
  renderToastViewport?: (props: MockToastViewportProps) => ReactNode
  showToast?: jest.Mock
  toastTestID?: string
  useToastState?: () => unknown
}

function resolveMock(
  getter: (() => jest.Mock) | undefined,
  fallback: jest.Mock | undefined,
) {
  return getter?.() ?? fallback ?? jest.fn()
}

export function createTamaguiToastMock({
  getHideToast,
  getShowToast,
  hideToast = jest.fn(),
  renderToastProvider,
  renderToastViewport,
  showToast = jest.fn(),
  toastTestID,
  useToastState = () => null,
}: CreateTamaguiToastMockOptions = {}) {
  const Toast = Object.assign(
    ({ children }: { children?: ReactNode }) => (
      <View testID={toastTestID}>{children}</View>
    ),
    {
      Close: ({ children }: { children?: ReactNode }) => (
        <View>{children}</View>
      ),
      Description: ({ children }: { children?: ReactNode }) => (
        <Text>{children}</Text>
      ),
      Title: ({ children }: { children?: ReactNode }) => (
        <Text>{children}</Text>
      ),
    },
  )

  return {
    Toast,
    ToastProvider:
      renderToastProvider ??
      (({ children }: MockToastProviderProps) => <View>{children}</View>),
    ToastViewport: renderToastViewport ?? (() => null),
    useToastController: () => ({
      hide: resolveMock(getHideToast, hideToast),
      show: resolveMock(getShowToast, showToast),
    }),
    useToastState,
  }
}
