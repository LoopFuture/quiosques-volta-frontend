import {
  initializeMonitoring,
  recordDiagnosticEvent,
  registerNavigationContainer,
  resetMonitoringForTests,
} from '@/features/app-data/monitoring'
import { createMockExpoConfig } from '@tests/support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')
const { __getNavigationIntegration, addBreadcrumb, captureException, init } =
  jest.requireMock('@sentry/react-native')

describe('app diagnostics monitoring', () => {
  const originalNodeEnv = process.env.NODE_ENV

  function setNodeEnv(value: string | undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      value,
    })
  }

  beforeEach(() => {
    resetMonitoringForTests()
    __setExpoConfig(createMockExpoConfig())
    setNodeEnv('test')
  })

  afterAll(() => {
    setNodeEnv(originalNodeEnv)
  })

  it('writes structured console diagnostics only in development', () => {
    setNodeEnv('development')

    recordDiagnosticEvent({
      details: {
        email: 'ana.silva@sdr.pt',
      },
      domain: 'auth',
      operation: 'console-test',
      phase: 'write',
      status: 'success',
    })

    expect(console.info).toHaveBeenCalledWith(
      '[diagnostics]',
      expect.objectContaining({
        details: expect.objectContaining({
          email: '[REDACTED]',
        }),
      }),
    )
    ;(console.info as jest.Mock).mockClear()
    setNodeEnv('test')

    recordDiagnosticEvent({
      domain: 'auth',
      operation: 'console-test',
      phase: 'write',
      status: 'success',
    })

    expect(console.info).not.toHaveBeenCalled()
  })

  it('includes sanitized errors in development console diagnostics', () => {
    setNodeEnv('development')

    recordDiagnosticEvent({
      captureError: true,
      domain: 'auth',
      error: new Error('refresh failed'),
      operation: 'console-test',
      phase: 'write',
      status: 'error',
    })

    expect(console.error).toHaveBeenCalledWith(
      '[diagnostics]',
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'refresh failed',
          name: 'Error',
        }),
      }),
    )
  })

  it('no-ops Sentry when no DSN is configured', () => {
    recordDiagnosticEvent({
      captureError: true,
      domain: 'auth',
      error: new Error('no sentry'),
      operation: 'disabled-sentry',
      phase: 'write',
      status: 'error',
    })

    expect(init).not.toHaveBeenCalled()
    expect(addBreadcrumb).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('defaults tracing to disabled outside development when no sample rate is configured', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'preview',
        },
      }),
    )

    recordDiagnosticEvent({
      domain: 'react-query',
      operation: 'default-tracing',
      phase: 'fetch',
      status: 'success',
    })

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@example.ingest.sentry.io/1',
        tracesSampleRate: 0,
      }),
    )

    const initOptions = (init as jest.Mock).mock.calls[0]?.[0]
    const integrations = initOptions.integrations([{ name: 'default' }])

    expect(integrations).toEqual([{ name: 'default' }])
  })

  it('records breadcrumbs for non-error events and captures failures when Sentry is enabled', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )

    recordDiagnosticEvent({
      details: {
        items: Array.from({ length: 12 }, (_, index) => index),
        token: 'secret-token',
      },
      domain: 'react-query',
      operation: 'enabled-sentry',
      phase: 'fetch',
      status: 'success',
    })

    expect(init).toHaveBeenCalledTimes(1)
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'app.react-query',
        data: expect.objectContaining({
          details: expect.objectContaining({
            items: expect.objectContaining({
              totalCount: 12,
            }),
            token: '[REDACTED]',
          }),
        }),
        message: 'enabled-sentry.fetch.success',
      }),
    )
    expect(captureException).not.toHaveBeenCalled()

    recordDiagnosticEvent({
      captureError: true,
      domain: 'react-query',
      error: new Error('query failed'),
      operation: 'enabled-sentry',
      phase: 'fetch',
      status: 'error',
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })

  it('initializes Sentry tracing and registers the navigation container when enabled', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
          tracesSampleRate: 0.5,
        },
      }),
    )

    const navigationContainerRef = { current: null }

    initializeMonitoring()
    registerNavigationContainer(navigationContainerRef)

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@example.ingest.sentry.io/1',
        tracesSampleRate: 0.5,
      }),
    )

    const initOptions = (init as jest.Mock).mock.calls[0]?.[0]
    const integrations = initOptions.integrations([{ name: 'default' }])

    expect(integrations).toEqual([
      { name: 'default' },
      expect.objectContaining({
        registerNavigationContainer: expect.any(Function),
      }),
    ])
    expect(
      __getNavigationIntegration().registerNavigationContainer,
    ).toHaveBeenCalledWith(navigationContainerRef)
  })
})
