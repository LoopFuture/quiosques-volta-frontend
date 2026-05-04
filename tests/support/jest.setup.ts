import { cleanup } from '@testing-library/react-native'
import { resetE2ERuntimeConfigForTests } from '@/features/app-data/e2e/runtime'
import { resetApiRuntimeConfigForTests } from '@/features/app-data/api'
import { resetMonitoringForTests } from '@/features/app-data/monitoring'
import { resetKeycloakRuntimeConfigForTests } from '@/features/auth/models/config'
import { resetProfileWebAppRuntimeConfigForTests } from '@/features/profile/runtime'
import { resetPushNotificationsRuntimeConfigForTests } from '@/features/notifications/models/runtime'

jest.mock('expo-constants', () => {
  const defaultExpoConfig = {
    extra: {
      eas: {
        projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
      },
      keycloak: {
        clientId: 'volta-mobile',
        issuerUrl: 'https://keycloak.example.com/realms/volta',
        scopes: ['openid', 'profile', 'email'],
      },
      api: {
        baseUrl: 'https://volta.be.dev.theloop.tech',
      },
      webApp: {
        baseUrl: 'https://volta.example.com',
      },
      sentry: {},
    },
  }
  let expoConfig = defaultExpoConfig
  const Constants = {
    get expoConfig() {
      return expoConfig
    },
  }

  return {
    __esModule: true,
    __resetExpoConstantsMock: () => {
      expoConfig = defaultExpoConfig
    },
    __setExpoConfig: (nextExpoConfig: typeof defaultExpoConfig) => {
      expoConfig = nextExpoConfig
    },
    default: Constants,
  }
})

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>()

  return {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
    __getSecureStoreItem: (key: string) => store.get(key) ?? null,
    __resetSecureStoreMock: () => {
      store.clear()
    },
    __setSecureStoreItem: (key: string, value: string) => {
      store.set(key, value)
    },
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key)
    }),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    isAvailableAsync: jest.fn(async () => true),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
  }
})

jest.mock('expo-crypto', () => {
  const { createHash } = jest.requireActual('node:crypto') as {
    createHash: (algorithm: string) => {
      digest: (encoding: 'hex') => string
      update: (value: string) => { digest: (encoding: 'hex') => string }
    }
  }
  let randomUuidCounter = 0

  const digestStringAsync = jest.fn(async (_algorithm: string, value: string) =>
    createHash('sha256').update(value).digest('hex'),
  )
  const randomUUID = jest.fn(() => {
    randomUuidCounter += 1

    return `00000000-0000-4000-8000-${String(randomUuidCounter).padStart(12, '0')}`
  })

  return {
    __esModule: true,
    __resetExpoCryptoMock: () => {
      randomUuidCounter = 0
      digestStringAsync.mockClear()
      randomUUID.mockClear()
    },
    CryptoDigestAlgorithm: {
      SHA256: 'SHA-256',
    },
    digestStringAsync,
    randomUUID,
  }
})

jest.mock('expo-web-browser', () => {
  const openBrowserAsync = jest.fn(async () => ({
    type: 'opened',
  }))
  const dismissBrowser = jest.fn(async () => {})

  return {
    __esModule: true,
    __resetExpoWebBrowserMock: () => {
      dismissBrowser.mockClear()
      openBrowserAsync.mockClear()
    },
    dismissBrowser,
    openBrowserAsync,
  }
})

jest.mock('react-native-mmkv', () => {
  const React = jest.requireActual('react')
  const instances: Map<string, any> = new Map()

  function getInstance(id = 'mmkv.default') {
    const existing = instances.get(id)

    if (existing) {
      return existing
    }

    const storage: Map<string, string | number | boolean | ArrayBuffer> =
      new Map()
    const listeners: Set<any> = new Set()

    const instance = {
      addOnValueChangedListener: (listener: any) => {
        listeners.add(listener)

        return {
          remove: () => {
            listeners.delete(listener)
          },
        }
      },
      clearAll: () => {
        const keys = [...storage.keys()]

        storage.clear()
        keys.forEach((key) => {
          listeners.forEach((listener) => {
            listener(key)
          })
        })
      },
      contains: (key: string) => storage.has(key),
      decrypt: () => {},
      encrypt: () => {},
      getAllKeys: () => [...storage.keys()],
      getBoolean: (key: string) => {
        const value = storage.get(key)

        return typeof value === 'boolean' ? value : undefined
      },
      getBuffer: (key: string) => {
        const value = storage.get(key)

        return value instanceof ArrayBuffer ? value : undefined
      },
      get byteSize() {
        return JSON.stringify([...storage]).length
      },
      id,
      importAllFrom: () => 0,
      isEncrypted: false,
      isReadOnly: false,
      get length() {
        return storage.size
      },
      remove: (key: string) => {
        const deleted = storage.delete(key)

        if (deleted) {
          listeners.forEach((listener) => {
            listener(key)
          })
        }

        return deleted
      },
      recrypt: () => {},
      set: (key: string, value: string | number | boolean | ArrayBuffer) => {
        storage.set(key, value)
        listeners.forEach((listener) => {
          listener(key)
        })
      },
      get size() {
        return storage.size
      },
      getString: (key: string) => {
        const value = storage.get(key)

        return typeof value === 'string' ? value : undefined
      },
      getNumber: (key: string) => {
        const value = storage.get(key)

        return typeof value === 'number' ? value : undefined
      },
      trim: () => {},
    }

    instances.set(id, instance)

    return instance
  }

  return {
    __resetMMKVMock: () => {
      instances.forEach((instance) => {
        instance.clearAll()
      })
    },
    createMMKV: (config?: { id?: string }) => getInstance(config?.id),
    useMMKVString: (key: string, instance?: any) => {
      const mmkv = instance ?? getInstance()
      const subscribe = React.useCallback(
        (onStoreChange: () => void) => {
          const listener = mmkv.addOnValueChangedListener(
            (changedKey: string) => {
              if (changedKey === key) {
                onStoreChange()
              }
            },
          )

          return () => listener.remove()
        },
        [key, mmkv],
      )
      const getSnapshot = React.useCallback(
        () => mmkv.getString(key),
        [key, mmkv],
      )
      const value = React.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getSnapshot,
      )
      const setValue = React.useCallback(
        (
          nextValue:
            | string
            | undefined
            | ((value: string | undefined) => string | undefined),
        ) => {
          const resolvedValue =
            typeof nextValue === 'function'
              ? nextValue(mmkv.getString(key))
              : nextValue

          if (typeof resolvedValue === 'string') {
            mmkv.set(key, resolvedValue)
            return
          }

          if (typeof resolvedValue === 'undefined') {
            mmkv.remove(key)
            return
          }

          throw new Error(
            `MMKV mock only supports string values. Received ${typeof resolvedValue}.`,
          )
        },
        [key, mmkv],
      )

      return [value, setValue]
    },
  }
})

jest.mock('expo-device', () => {
  const state = {
    isDevice: true,
  }

  return {
    __esModule: true,
    __resetExpoDeviceMock: () => {
      state.isDevice = true
    },
    __setIsDevice: (nextValue: boolean) => {
      state.isDevice = nextValue
    },
    get isDevice() {
      return state.isDevice
    },
  }
})

jest.mock('expo-network', () => {
  const defaultNetworkState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'WIFI',
  }
  let networkState = { ...defaultNetworkState }
  const listeners: Set<(state: typeof defaultNetworkState) => void> = new Set()

  return {
    __esModule: true,
    __emitNetworkState: (nextState: Record<string, unknown>) => {
      networkState = {
        ...networkState,
        ...nextState,
      }
      listeners.forEach((listener) => {
        listener(networkState)
      })
    },
    __resetExpoNetworkMock: () => {
      networkState = { ...defaultNetworkState }
      listeners.clear()
    },
    __setNetworkState: (nextState: Record<string, unknown>) => {
      networkState = {
        ...networkState,
        ...nextState,
      }
    },
    addNetworkStateListener: jest.fn((listener) => {
      listeners.add(listener)

      return {
        remove: jest.fn(() => {
          listeners.delete(listener)
        }),
      }
    }),
    getNetworkStateAsync: jest.fn(async () => networkState),
  }
})

jest.mock('expo-notifications', () => {
  const permissionResponse = {
    canAskAgain: true,
    expires: 'never',
    granted: false,
    ios: {
      allowsAlert: false,
      allowsBadge: false,
      allowsSound: false,
      status: 0,
    },
    status: 'undetermined' as 'denied' | 'granted' | 'undetermined',
  }
  let nextPermissionRequestResponse = permissionResponse
  let nextExpoPushToken = 'ExponentPushToken[mock-token]'
  let nextExpoPushTokenError: Error | null = null
  let lastNotificationResponse: any = null
  const receivedListeners = new Set<any>()
  const responseListeners = new Set<any>()
  const clearLastNotificationResponseAsync = jest.fn(async () => {
    lastNotificationResponse = null
  })
  const getExpoPushTokenAsync = jest.fn(async () => {
    if (nextExpoPushTokenError) {
      throw nextExpoPushTokenError
    }

    return {
      data: nextExpoPushToken,
      type: 'expo',
    }
  })
  const getLastNotificationResponseAsync = jest.fn(
    async () => lastNotificationResponse,
  )
  const getPermissionsAsync = jest.fn(async () => permissionResponse)
  const requestPermissionsAsync = jest.fn(async () => {
    Object.assign(permissionResponse, nextPermissionRequestResponse)

    return permissionResponse
  })
  const setNotificationChannelAsync = jest.fn(async () => undefined)
  const setNotificationHandler = jest.fn()

  function createSubscription<T>(listeners: Set<(value: T) => void>, value: T) {
    listeners.add(value as never)

    return {
      remove: jest.fn(() => {
        listeners.delete(value as never)
      }),
    }
  }

  return {
    AndroidImportance: {
      DEFAULT: 3,
    },
    DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
    __esModule: true,
    __emitNotificationReceived: (notification: any) => {
      receivedListeners.forEach((listener) => {
        listener(notification)
      })
    },
    __emitNotificationResponseReceived: (response: any) => {
      responseListeners.forEach((listener) => {
        listener(response)
      })
    },
    __resetExpoNotificationsMock: () => {
      permissionResponse.canAskAgain = true
      permissionResponse.granted = false
      permissionResponse.ios = {
        allowsAlert: false,
        allowsBadge: false,
        allowsSound: false,
        status: 0,
      }
      permissionResponse.status = 'undetermined'
      nextPermissionRequestResponse = { ...permissionResponse }
      nextExpoPushToken = 'ExponentPushToken[mock-token]'
      nextExpoPushTokenError = null
      lastNotificationResponse = null
      receivedListeners.clear()
      responseListeners.clear()
      clearLastNotificationResponseAsync.mockClear()
      getExpoPushTokenAsync.mockClear()
      getLastNotificationResponseAsync.mockClear()
      getPermissionsAsync.mockClear()
      requestPermissionsAsync.mockClear()
      setNotificationChannelAsync.mockClear()
      setNotificationHandler.mockClear()
    },
    __setExpoPushToken: (token: string) => {
      nextExpoPushToken = token
    },
    __setExpoPushTokenError: (error: Error | null) => {
      nextExpoPushTokenError = error
    },
    __setLastNotificationResponse: (response: any) => {
      lastNotificationResponse = response
    },
    __setNotificationPermissions: (
      nextPermissionState: Partial<typeof permissionResponse>,
    ) => {
      Object.assign(permissionResponse, nextPermissionState)
      nextPermissionRequestResponse = { ...permissionResponse }
    },
    __setNextNotificationPermissionRequestResponse: (
      nextPermissionState: Partial<typeof permissionResponse>,
    ) => {
      nextPermissionRequestResponse = {
        ...permissionResponse,
        ...nextPermissionState,
      }
    },
    addNotificationReceivedListener: jest.fn((listener: any) =>
      createSubscription(receivedListeners, listener),
    ),
    addNotificationResponseReceivedListener: jest.fn((listener: any) =>
      createSubscription(responseListeners, listener),
    ),
    clearLastNotificationResponseAsync,
    getExpoPushTokenAsync,
    getLastNotificationResponseAsync,
    getPermissionsAsync,
    requestPermissionsAsync,
    setNotificationChannelAsync,
    setNotificationHandler,
  }
})

jest.mock('expo-auth-session', () => {
  const defaultDiscovery = {
    authorizationEndpoint:
      'https://keycloak.example.com/realms/volta/protocol/openid-connect/auth',
    endSessionEndpoint:
      'https://keycloak.example.com/realms/volta/protocol/openid-connect/logout',
    revocationEndpoint:
      'https://keycloak.example.com/realms/volta/protocol/openid-connect/revoke',
    tokenEndpoint:
      'https://keycloak.example.com/realms/volta/protocol/openid-connect/token',
  }
  const defaultTokenResponse = {
    accessToken: 'mock-access-token',
    expiresIn: 3600,
    idToken: 'mock-id-token',
    issuedAt: 1_710_000_000,
    refreshToken: 'mock-refresh-token',
    scope: 'openid profile email',
    tokenType: 'bearer',
  }
  let currentDiscovery = defaultDiscovery
  let nextExchangeResponse = defaultTokenResponse
  let nextPromptResults: any[] = []
  let nextRefreshResponse = defaultTokenResponse
  const recordedRequests: {
    config: Record<string, unknown>
    discovery: typeof defaultDiscovery | null
    promptAsync: jest.Mock
    request: { codeVerifier: string }
  }[] = []

  class TokenResponse {
    accessToken: string
    expiresIn?: number
    idToken?: string
    issuedAt: number
    refreshToken?: string
    scope?: string
    tokenType: string

    constructor(response: typeof defaultTokenResponse) {
      this.accessToken = response.accessToken
      this.expiresIn = response.expiresIn
      this.idToken = response.idToken
      this.issuedAt = response.issuedAt
      this.refreshToken = response.refreshToken
      this.scope = response.scope
      this.tokenType = response.tokenType
    }

    static isTokenFresh(
      token: { expiresIn?: number; issuedAt: number } | null | undefined,
      secondsMargin = 0,
    ) {
      if (!token) {
        return false
      }

      if (typeof token.expiresIn === 'number') {
        return (
          Math.floor(Date.now() / 1000) <
          token.issuedAt + token.expiresIn + secondsMargin
        )
      }

      return true
    }

    getRequestConfig() {
      return {
        accessToken: this.accessToken,
        expiresIn: this.expiresIn,
        idToken: this.idToken,
        issuedAt: this.issuedAt,
        refreshToken: this.refreshToken,
        scope: this.scope,
        tokenType: this.tokenType,
      }
    }
  }

  function toTokenResponse(
    response: typeof defaultTokenResponse | InstanceType<typeof TokenResponse>,
  ) {
    return response instanceof TokenResponse
      ? response
      : new TokenResponse(response)
  }

  const exchangeCodeAsync = jest.fn(async () =>
    toTokenResponse(nextExchangeResponse),
  )
  const fetchDiscoveryAsync = jest.fn(async () => currentDiscovery)
  const makeRedirectUri = jest.fn(
    (options?: { native?: string }) =>
      options?.native ?? 'voltafrontend://auth/callback',
  )
  const refreshAsync = jest.fn(async () => toTokenResponse(nextRefreshResponse))
  const revokeAsync = jest.fn(async () => true)
  const useAutoDiscovery = jest.fn(() => currentDiscovery)
  const useAuthRequest = jest.fn(
    (
      config: Record<string, unknown>,
      discovery: typeof defaultDiscovery | null,
    ) => {
      const request = {
        codeVerifier: `mock-code-verifier-${recordedRequests.length + 1}`,
      }
      const promptAsync = jest.fn(
        async () => nextPromptResults.shift() ?? { type: 'cancel' },
      )

      recordedRequests.push({
        config,
        discovery,
        promptAsync,
        request,
      })

      return [request, null, promptAsync]
    },
  )

  return {
    CodeChallengeMethod: {
      Plain: 'plain',
      S256: 'S256',
    },
    ResponseType: {
      Code: 'code',
      IdToken: 'id_token',
      Token: 'token',
    },
    TokenResponse,
    __getAuthRequests: () => recordedRequests,
    __resetAuthSessionMock: () => {
      currentDiscovery = defaultDiscovery
      nextExchangeResponse = defaultTokenResponse
      nextPromptResults = []
      nextRefreshResponse = defaultTokenResponse
      recordedRequests.length = 0
      exchangeCodeAsync.mockClear()
      fetchDiscoveryAsync.mockClear()
      makeRedirectUri.mockClear()
      refreshAsync.mockClear()
      revokeAsync.mockClear()
      useAutoDiscovery.mockClear()
      useAuthRequest.mockClear()
    },
    __setDiscovery: (discovery: typeof defaultDiscovery | null) => {
      currentDiscovery = discovery ?? defaultDiscovery
    },
    __setNextExchangeResponse: (response: typeof defaultTokenResponse) => {
      nextExchangeResponse = response
    },
    __setNextPromptResults: (results: any[]) => {
      nextPromptResults = [...results]
    },
    __setNextRefreshResponse: (response: typeof defaultTokenResponse) => {
      nextRefreshResponse = response
    },
    exchangeCodeAsync,
    fetchDiscoveryAsync,
    makeRedirectUri,
    refreshAsync,
    revokeAsync,
    useAuthRequest,
    useAutoDiscovery,
  }
})

jest.mock('expo-local-authentication', () => {
  let hasHardware = true
  let isEnrolled = true
  let nextAuthenticationResult:
    | { success: true }
    | { error: string; success: false } = { success: true }

  const authenticateAsync = jest.fn(async () => nextAuthenticationResult)
  const cancelAuthenticate = jest.fn(async () => undefined)
  const hasHardwareAsync = jest.fn(async () => hasHardware)
  const isEnrolledAsync = jest.fn(async () => isEnrolled)

  return {
    __esModule: true,
    __resetLocalAuthenticationMock: () => {
      hasHardware = true
      isEnrolled = true
      nextAuthenticationResult = { success: true }
      authenticateAsync.mockClear()
      cancelAuthenticate.mockClear()
      hasHardwareAsync.mockClear()
      isEnrolledAsync.mockClear()
    },
    __setBiometricEnrollment: (nextValue: boolean) => {
      isEnrolled = nextValue
    },
    __setBiometricHardware: (nextValue: boolean) => {
      hasHardware = nextValue
    },
    __setNextLocalAuthenticationResult: (
      nextValue: { success: true } | { error: string; success: false },
    ) => {
      nextAuthenticationResult = nextValue
    },
    authenticateAsync,
    cancelAuthenticate,
    hasHardwareAsync,
    isEnrolledAsync,
  }
})

jest.mock('@sentry/react-native', () => {
  const capturedScopes: any[] = []
  const addBreadcrumb = jest.fn()
  const captureException = jest.fn()
  const captureMessage = jest.fn()
  const init = jest.fn()
  const navigationIntegration = {
    options: {
      enableTimeToInitialDisplay: true,
    },
    registerNavigationContainer: jest.fn(),
  }
  const reactNavigationIntegration = jest.fn(() => navigationIntegration)
  const wrap = jest.fn((Component: any) => Component)
  const withScope = jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setContext: jest.fn(),
      setExtra: jest.fn(),
      setExtras: jest.fn(),
      setTag: jest.fn(),
      setTags: jest.fn(),
    }

    capturedScopes.push(scope)
    callback(scope)
  })

  return {
    ErrorBoundary: ({ children }: any) => children ?? null,
    __esModule: true,
    __getCapturedScopes: () => capturedScopes,
    __getNavigationIntegration: () => navigationIntegration,
    __resetSentryMock: () => {
      capturedScopes.length = 0
      addBreadcrumb.mockClear()
      captureException.mockClear()
      captureMessage.mockClear()
      init.mockClear()
      navigationIntegration.registerNavigationContainer.mockClear()
      withScope.mockClear()
    },
    addBreadcrumb,
    captureException,
    captureMessage,
    init,
    reactNavigationIntegration,
    wrap,
    withScope,
  }
})

jest.mock('@shopify/flash-list', () => {
  const { createFlashListMock } = jest.requireActual('./flash-list-mock')

  return createFlashListMock()
})

const originalLog = console.log.bind(console)
const originalError = console.error.bind(console)
const originalInfo = console.info.bind(console)
const originalWarn = console.warn.bind(console)

beforeEach(() => {
  const { __resetAuthSessionMock } = jest.requireMock('expo-auth-session')
  const { __resetExpoDeviceMock } = jest.requireMock('expo-device')
  const expoCryptoMock = jest.requireMock('expo-crypto') as {
    __resetExpoCryptoMock?: () => void
  }
  const { __resetExpoConstantsMock } = jest.requireMock('expo-constants')
  const { __resetExpoNetworkMock } = jest.requireMock('expo-network')
  const { __resetExpoWebBrowserMock } = jest.requireMock('expo-web-browser')
  const { __resetFlashListMock } = jest.requireMock('@shopify/flash-list')
  const { __resetExpoNotificationsMock } =
    jest.requireMock('expo-notifications')
  const { __resetLocalAuthenticationMock } = jest.requireMock(
    'expo-local-authentication',
  )
  const { __resetSentryMock } = jest.requireMock('@sentry/react-native')
  const { __resetMMKVMock } = jest.requireMock('react-native-mmkv')
  const { __resetSecureStoreMock } = jest.requireMock('expo-secure-store')

  __resetAuthSessionMock()
  expoCryptoMock.__resetExpoCryptoMock?.()
  __resetExpoDeviceMock()
  __resetExpoConstantsMock()
  __resetExpoNetworkMock()
  __resetExpoWebBrowserMock()
  __resetFlashListMock()
  __resetExpoNotificationsMock()
  __resetLocalAuthenticationMock()
  __resetSentryMock()
  __resetMMKVMock()
  __resetSecureStoreMock()
  resetApiRuntimeConfigForTests()
  resetE2ERuntimeConfigForTests()
  resetMonitoringForTests()
  resetKeycloakRuntimeConfigForTests()
  resetProfileWebAppRuntimeConfigForTests()
  resetPushNotificationsRuntimeConfigForTests()
})

afterEach(() => {
  cleanup()
})

jest.mock('expo-localization', () => {
  const mockGetLocales = jest.fn(() => [
    {
      languageCode: 'pt',
      languageTag: 'pt-PT',
    },
  ])

  return {
    __setMockLocales: (
      locales: { languageCode: string; languageTag: string }[],
    ) => {
      mockGetLocales.mockReturnValue(locales)
    },
    getLocales: mockGetLocales,
  }
})

jest.spyOn(console, 'warn').mockImplementation((message, ...args) => {
  if (
    typeof message === 'string' &&
    message.includes("Must call import '@tamagui/native/setup-zeego'")
  ) {
    return
  }

  originalWarn(message, ...args)
})

jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
  if (
    typeof message === 'string' &&
    (message.includes('not wrapped in act(...)') || message === '[diagnostics]')
  ) {
    return
  }

  originalError(message, ...args)
})

jest.spyOn(console, 'info').mockImplementation((message, ...args) => {
  if (
    typeof message === 'string' &&
    (message.includes('https://locize.com') || message === '[diagnostics]')
  ) {
    return
  }

  originalInfo(message, ...args)
})

jest.spyOn(console, 'log').mockImplementation((message, ...args) => {
  if (typeof message === 'string' && message.startsWith('i18next:')) {
    return
  }

  originalLog(message, ...args)
})
