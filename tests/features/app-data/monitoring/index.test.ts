import {
  initializeMonitoring,
  recordDiagnosticEvent,
  registerNavigationContainer,
  resetMonitoringForTests,
} from '@/features/app-data/monitoring'
import { ApiError } from '@/features/app-data/api'
import { createMockExpoConfig } from '@tests/support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')
const { __getNavigationIntegration, addBreadcrumb, captureException, init } =
  jest.requireMock('@sentry/react-native')

describe('app-data/monitoring index', () => {
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
    const error = new Error('refresh failed')

    recordDiagnosticEvent({
      captureError: true,
      domain: 'auth',
      error,
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
      error,
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
            items: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
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

  it('preserves sanitized ApiError response payload details in Sentry diagnostic context', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )

    recordDiagnosticEvent({
      captureError: true,
      domain: 'react-query',
      error: new ApiError({
        message: 'API request failed with status 422.',
        method: 'PATCH',
        responsePayload: {
          error: {
            code: 'validation_error',
            message: 'One or more fields are invalid.',
            requestId: '3934d456e06953300fd7efd001d2eb2a',
          },
          issues: [
            {
              code: 'invalid_format',
              field: 'payoutAccount.iban',
              message: 'iban must be an IBAN',
            },
          ],
        },
        status: 422,
        url: 'https://volta.example/api/v1/profile',
      }),
      operation: 'complete-setup',
      phase: 'execute',
      status: 'error',
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          error: expect.objectContaining({
            method: 'PATCH',
            responsePayload: expect.objectContaining({
              error: expect.objectContaining({
                code: 'validation_error',
                message: 'One or more fields are invalid.',
                requestId: '3934d456e06953300fd7efd001d2eb2a',
              }),
              issues: [
                expect.objectContaining({
                  code: 'invalid_format',
                  field: 'payoutAccount.iban',
                  message: 'iban must be an IBAN',
                }),
              ],
            }),
            status: 422,
            url: 'https://volta.example/api/v1/profile',
          }),
        }),
      }),
    )
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

  it('includes the Sentry release when provided in runtime config', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'production',
          release: 'volta-mobile@1.2.3',
          tracesSampleRate: 0,
        },
      }),
    )

    initializeMonitoring()

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        release: 'volta-mobile@1.2.3',
      }),
    )
  })

  it('does not register the navigation container when tracing is disabled', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
          tracesSampleRate: 0,
        },
      }),
    )

    registerNavigationContainer({ current: null })

    expect(
      __getNavigationIntegration().registerNavigationContainer,
    ).not.toHaveBeenCalled()
  })

  it('skips undefined tags and coerces unknown capture values into diagnostic errors', () => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )

    recordDiagnosticEvent({
      captureError: true,
      domain: 'auth',
      error: { reason: 'opaque failure' },
      operation: 'coerce-error',
      phase: 'write',
      status: 'error',
      tags: {
        ignored: undefined,
        source: 'test-suite',
      },
    })

    const latestScope = captureException.mock.calls[0]?.[0]

    expect(latestScope).toEqual(
      expect.objectContaining({
        message: 'Unknown diagnostic error',
        name: 'Error',
      }),
    )
  })
})
