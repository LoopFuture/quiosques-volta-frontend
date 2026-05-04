type ExpoRouterMockOptions = {
  includeErrorBoundary?: boolean
  includeSplashScreen?: boolean
  includeTabs?: boolean
}

function MockErrorBoundary() {
  return null
}

export function createExpoRouterMock({
  includeErrorBoundary = false,
  includeSplashScreen = false,
  includeTabs = false,
}: ExpoRouterMockOptions = {}) {
  const mockHideAsync = jest.fn()
  const mockLink = jest.fn(({ children }: any) => children)
  const mockUseGlobalSearchParams = jest.fn(() => ({}))
  const mockUsePathname = jest.fn(() => '/')
  const mockUseLocalSearchParams = jest.fn(() => ({}))
  const mockPreventAutoHideAsync = jest.fn()
  const mockRouterBack = jest.fn()
  const mockRouterCanGoBack = jest.fn(() => false)
  const mockRouterNavigate = jest.fn()
  const mockRouterPush = jest.fn()
  const mockRouterReplace = jest.fn()
  const mockNavigationContainerRef = {
    current: null,
  }
  const mockStackProtected = jest.fn(({ children }: any) => children)
  const mockStackScreen = jest.fn(() => null)
  const Stack = Object.assign(
    jest.fn(({ children }: any) => children),
    { Protected: mockStackProtected, Screen: mockStackScreen },
  )
  const router = {
    back: mockRouterBack,
    canGoBack: mockRouterCanGoBack,
    navigate: mockRouterNavigate,
    push: mockRouterPush,
    replace: mockRouterReplace,
  }

  const mockModule: Record<string, unknown> = {
    Link: mockLink,
    Stack,
    router,
    __mockLink: mockLink,
    __mockRouterBack: mockRouterBack,
    __mockRouterCanGoBack: mockRouterCanGoBack,
    __mockRouterNavigate: mockRouterNavigate,
    __mockRouterPush: mockRouterPush,
    __mockRouterReplace: mockRouterReplace,
    __mockNavigationContainerRef: mockNavigationContainerRef,
    __mockStack: Stack,
    __mockStackProtected: mockStackProtected,
    __mockStackScreen: mockStackScreen,
    __mockUseGlobalSearchParams: mockUseGlobalSearchParams,
    __mockUsePathname: mockUsePathname,
    __mockUseLocalSearchParams: mockUseLocalSearchParams,
    useGlobalSearchParams: mockUseGlobalSearchParams,
    usePathname: mockUsePathname,
    useLocalSearchParams: mockUseLocalSearchParams,
    useNavigationContainerRef: jest.fn(() => mockNavigationContainerRef),
    useRouter: jest.fn(() => router),
  }

  if (includeTabs) {
    const mockTabsProtected = jest.fn(({ children }: any) => children)
    const mockTabsScreen = jest.fn(() => null)
    const Tabs = Object.assign(
      jest.fn(({ children }: any) => children),
      { Protected: mockTabsProtected, Screen: mockTabsScreen },
    )

    mockModule.Tabs = Tabs
    mockModule.__mockTabs = Tabs
    mockModule.__mockTabsProtected = mockTabsProtected
    mockModule.__mockTabsScreen = mockTabsScreen
  }

  if (includeSplashScreen) {
    mockModule.SplashScreen = {
      hideAsync: mockHideAsync,
      preventAutoHideAsync: mockPreventAutoHideAsync,
    }
    mockModule.__mockHideAsync = mockHideAsync
    mockModule.__mockPreventAutoHideAsync = mockPreventAutoHideAsync
  }

  if (includeErrorBoundary) {
    mockModule.ErrorBoundary = MockErrorBoundary
  }

  return mockModule
}
