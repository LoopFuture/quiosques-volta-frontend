type MockExpoConfigOverrides = {
  api?: {
    baseUrl?: string
    mockingEnabled?: boolean
  }
  keycloak?: {
    clientId?: string
    issuerUrl?: string
    scopes?: string[]
  }
  sentry?: {
    dsn?: string
    environment?: string
    release?: string
    tracesSampleRate?: number
  }
}

export function createMockExpoConfig(overrides: MockExpoConfigOverrides = {}) {
  return {
    extra: {
      eas: {
        projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
      },
      keycloak: {
        clientId: overrides.keycloak?.clientId ?? 'volta-mobile',
        issuerUrl:
          overrides.keycloak?.issuerUrl ??
          'https://keycloak.example.com/realms/volta',
        scopes: overrides.keycloak?.scopes ?? ['openid', 'profile', 'email'],
      },
      api: {
        ...(overrides.api?.baseUrl
          ? {
              baseUrl: overrides.api.baseUrl,
            }
          : {}),
        mockingEnabled: overrides.api?.mockingEnabled ?? true,
      },
      sentry: {
        ...(typeof overrides.sentry?.dsn === 'string'
          ? { dsn: overrides.sentry.dsn }
          : {}),
        ...(typeof overrides.sentry?.environment === 'string'
          ? { environment: overrides.sentry.environment }
          : {}),
        ...(typeof overrides.sentry?.release === 'string'
          ? { release: overrides.sentry.release }
          : {}),
        ...(typeof overrides.sentry?.tracesSampleRate === 'number'
          ? { tracesSampleRate: overrides.sentry.tracesSampleRate }
          : {}),
      },
    },
  }
}
