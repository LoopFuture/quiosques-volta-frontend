import * as Sentry from '@sentry/react-native'
import {
  getSentryRuntimeConfig,
  resetSentryRuntimeConfigForTests,
} from './runtime'

type DiagnosticTagValue = boolean | number | string

export type DiagnosticDomain =
  | 'api'
  | 'auth'
  | 'push'
  | 'react-query'
  | 'router'
export type DiagnosticStatus =
  | 'cancelled'
  | 'error'
  | 'info'
  | 'start'
  | 'success'

export type DiagnosticTags = Record<string, DiagnosticTagValue | undefined>

export type DiagnosticEvent = {
  captureError?: boolean
  context?: Record<string, unknown>
  details?: Record<string, unknown>
  domain: DiagnosticDomain
  durationMs?: number
  error?: unknown
  operation: string
  phase: string
  redactKeys?: readonly string[]
  status: DiagnosticStatus
  tags?: DiagnosticTags
}

const DEFAULT_REDACTED_KEYS = [
  'accessToken',
  'alertsEmail',
  'authHeader',
  'authorization',
  'clientSecret',
  'cookie',
  'email',
  'iban',
  'idToken',
  'name',
  'nif',
  'password',
  'phone',
  'pin',
  'refreshToken',
  'secret',
  'token',
] as const

const MAX_ARRAY_ITEMS = 10
const MAX_OBJECT_ENTRIES = 20
const MAX_STRING_LENGTH = 300
const MAX_SANITIZE_DEPTH = 4

let monitoringInitialized = false
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
})

function normalizeSensitiveKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function buildRedactedKeySet(redactKeys: readonly string[] = []) {
  return new Set(
    [...DEFAULT_REDACTED_KEYS, ...redactKeys].map((key) =>
      normalizeSensitiveKey(key),
    ),
  )
}

function truncateString(value: string) {
  if (value.length <= MAX_STRING_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...`
}

function toError(value: unknown) {
  if (value instanceof Error) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return new Error(value)
  }

  return new Error('Unknown diagnostic error')
}

function sanitizeValue(
  value: unknown,
  redactedKeySet: Set<string>,
  depth = 0,
): unknown {
  if (depth >= MAX_SANITIZE_DEPTH) {
    return '[Truncated]'
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'undefined'
  ) {
    return value
  }

  if (typeof value === 'string') {
    return truncateString(value)
  }

  if (value instanceof Error) {
    return {
      message: truncateString(value.message),
      name: value.name,
      ...(value.stack ? { stack: truncateString(value.stack) } : {}),
    }
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, redactedKeySet, depth + 1))

    return {
      items: sanitizedItems,
      totalCount: value.length,
    }
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).slice(0, MAX_OBJECT_ENTRIES)

    return Object.fromEntries(
      entries.map(([key, nestedValue]) => {
        if (redactedKeySet.has(normalizeSensitiveKey(key))) {
          return [key, '[REDACTED]']
        }

        return [key, sanitizeValue(nestedValue, redactedKeySet, depth + 1)]
      }),
    )
  }

  return String(value)
}

function sanitizeDiagnosticPayload(event: DiagnosticEvent) {
  const redactedKeySet = buildRedactedKeySet(event.redactKeys)

  return {
    context: event.context
      ? sanitizeValue(event.context, redactedKeySet)
      : undefined,
    details: event.details
      ? sanitizeValue(event.details, redactedKeySet)
      : undefined,
    domain: event.domain,
    durationMs: event.durationMs,
    error:
      typeof event.error !== 'undefined'
        ? sanitizeValue(event.error, redactedKeySet)
        : undefined,
    operation: event.operation,
    phase: event.phase,
    status: event.status,
    tags: event.tags
      ? (sanitizeValue(event.tags, redactedKeySet) as Record<string, unknown>)
      : undefined,
  }
}

function buildBreadcrumbLevel(status: DiagnosticStatus) {
  return status === 'error' ? 'error' : 'info'
}

function isConsoleDiagnosticsEnabled() {
  return process.env.NODE_ENV === 'development'
}

function isTracingEnabled() {
  const sentryConfig = getSentryRuntimeConfig()

  return (
    sentryConfig.enabled &&
    typeof sentryConfig.tracesSampleRate === 'number' &&
    sentryConfig.tracesSampleRate > 0
  )
}

export function initializeMonitoring() {
  if (monitoringInitialized) {
    return
  }

  monitoringInitialized = true

  const sentryConfig = getSentryRuntimeConfig()

  if (!sentryConfig.enabled || !sentryConfig.dsn) {
    return
  }

  Sentry.init({
    debug: false,
    dsn: sentryConfig.dsn,
    enabled: true,
    environment: sentryConfig.environment,
    integrations: (defaultIntegrations) =>
      isTracingEnabled()
        ? [...defaultIntegrations, navigationIntegration]
        : defaultIntegrations,
    ...(sentryConfig.release ? { release: sentryConfig.release } : {}),
    sendDefaultPii: false,
    tracesSampleRate: sentryConfig.tracesSampleRate,
  })
}

export function registerNavigationContainer(navigationContainerRef: unknown) {
  if (!isTracingEnabled()) {
    return
  }

  navigationIntegration.registerNavigationContainer(navigationContainerRef)
}

export function createDiagnosticTimer() {
  const startedAt = Date.now()

  return () => Date.now() - startedAt
}

export function recordDiagnosticEvent(event: DiagnosticEvent) {
  initializeMonitoring()

  const sentryConfig = getSentryRuntimeConfig()
  const sanitizedPayload = sanitizeDiagnosticPayload(event)
  const breadcrumbMessage = `${event.operation}.${event.phase}.${event.status}`

  if (isConsoleDiagnosticsEnabled()) {
    const logArgs = ['[diagnostics]', sanitizedPayload] as const

    if (event.status === 'error') {
      console.error(...logArgs)
    } else {
      console.info(...logArgs)
    }
  }

  if (sentryConfig.enabled) {
    Sentry.addBreadcrumb({
      category: `app.${event.domain}`,
      data: sanitizedPayload,
      level: buildBreadcrumbLevel(event.status),
      message: breadcrumbMessage,
      timestamp: Date.now() / 1000,
      type: 'default',
    })
  }

  if (!sentryConfig.enabled || !event.captureError || !event.error) {
    return
  }

  Sentry.withScope((scope) => {
    Object.entries(event.tags ?? {}).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        scope.setTag(key, String(value))
      }
    })

    scope.setTag('diagnostic.domain', event.domain)
    scope.setTag('diagnostic.operation', event.operation)
    scope.setTag('diagnostic.phase', event.phase)
    scope.setTag('diagnostic.status', event.status)
    scope.setContext('diagnostic', sanitizedPayload)
    Sentry.captureException(toError(event.error))
  })
}

export function resetMonitoringForTests() {
  monitoringInitialized = false
  resetSentryRuntimeConfigForTests()
}

export function sanitizeDiagnosticsValue(
  value: unknown,
  redactKeys?: readonly string[],
) {
  return sanitizeValue(value, buildRedactedKeySet(redactKeys))
}
