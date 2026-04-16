import {
  getSentryRuntimeConfig,
  resetSentryRuntimeConfigForTests,
} from '@/features/app-data/monitoring/runtime'

const { __setExpoConfig } = jest.requireMock('expo-constants')

describe('monitoring runtime config', () => {
  const originalNodeEnv = process.env.NODE_ENV

  function setNodeEnv(value: string | undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      value,
    })
  }

  beforeEach(() => {
    resetSentryRuntimeConfigForTests()
  })

  afterAll(() => {
    setNodeEnv(originalNodeEnv)
  })

  it('normalizes blank string values and falls back to development when node env is missing', () => {
    __setExpoConfig({
      extra: {
        sentry: {
          dsn: '   ',
          environment: '   ',
          release: '   ',
          tracesSampleRate: Number.NaN,
        },
      },
    })
    setNodeEnv(undefined)

    expect(getSentryRuntimeConfig()).toEqual({
      enabled: false,
      environment: 'development',
      tracesSampleRate: 1,
    })
  })

  it('uses object-shaped sentry config values and caches the result', () => {
    __setExpoConfig({
      extra: {
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'production',
          release: '1.2.3',
          tracesSampleRate: 0.25,
        },
      },
    })
    setNodeEnv('test')

    const firstConfig = getSentryRuntimeConfig()

    __setExpoConfig({
      extra: {
        sentry: 'disabled',
      },
    })

    expect(firstConfig).toEqual({
      dsn: 'https://public@example.ingest.sentry.io/1',
      enabled: true,
      environment: 'production',
      release: '1.2.3',
      tracesSampleRate: 0.25,
    })
    expect(getSentryRuntimeConfig()).toBe(firstConfig)
  })

  it('ignores non-object sentry config payloads and falls back to node env defaults', () => {
    __setExpoConfig({
      extra: {
        sentry: 'disabled',
      },
    })
    setNodeEnv('test')

    expect(getSentryRuntimeConfig()).toEqual({
      enabled: false,
      environment: 'test',
      tracesSampleRate: 0,
    })
  })
})
