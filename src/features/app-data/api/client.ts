import {
  createDiagnosticTimer,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import { getCurrentAuthAccessToken } from '@/features/auth/runtime'
import { getApiRuntimeConfig } from './runtime'

type ApiMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

type ApiRequestMeta = {
  feature: string
  operation: string
  redactKeys?: readonly string[]
  tags?: Record<string, boolean | number | string>
}

type ApiQuery = Record<string, boolean | number | string | null | undefined>

type ApiRequestOptions<TBody = unknown> = {
  body?: TBody
  headers?: HeadersInit
  meta: ApiRequestMeta
  method: ApiMethod
  path: string
  query?: ApiQuery
  signal?: AbortSignal
}

type ParsedResponseBody = object | string | undefined

export class ApiError extends Error {
  cause?: unknown
  method: ApiMethod
  responsePayload?: ParsedResponseBody
  status?: number
  url: string

  constructor({
    cause,
    method,
    message,
    responsePayload,
    status,
    url,
  }: {
    cause?: unknown
    method: ApiMethod
    message: string
    responsePayload?: ParsedResponseBody
    status?: number
    url: string
  }) {
    super(message)
    this.name = 'ApiError'
    this.cause = cause
    this.method = method
    this.responsePayload = responsePayload
    this.status = status
    this.url = url
  }
}

function buildUrl(path: string, query: ApiQuery | undefined) {
  const runtimeConfig = getApiRuntimeConfig()
  const url = new URL(path, runtimeConfig.resolvedBaseUrl)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || typeof value === 'undefined') {
        return
      }

      url.searchParams.set(key, String(value))
    })
  }

  return url
}

function buildHeaders(
  headers: HeadersInit | undefined,
  body: unknown,
): Headers {
  const nextHeaders = new Headers(headers)
  const accessToken = getCurrentAuthAccessToken()

  nextHeaders.set('Accept', 'application/json')

  if (accessToken && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  if (typeof body !== 'undefined' && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }

  return nextHeaders
}

async function parseResponseBody(
  response: Response,
): Promise<ParsedResponseBody> {
  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()

  if (text.length === 0) {
    return undefined
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

  if (
    contentType.includes('application/json') ||
    contentType.includes('+json')
  ) {
    return JSON.parse(text) as object
  }

  return text
}

function hasKnownAbortMessage(error: Error) {
  return (
    error.message === 'The operation was aborted.' ||
    error.message === 'This operation was aborted.' ||
    error.message === 'fetch failed: The operation was aborted.'
  )
}

function isAbortError(error: unknown, signal?: AbortSignal) {
  if (signal?.aborted) {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.name === 'AbortError' ||
    hasKnownAbortMessage(error) ||
    (error.cause instanceof Error &&
      (error.cause.name === 'AbortError' || hasKnownAbortMessage(error.cause)))
  )
}

function createAbortError(cause?: unknown) {
  const abortError = new Error('This operation was aborted.')
  abortError.name = 'AbortError'

  if (typeof cause !== 'undefined') {
    Object.defineProperty(abortError, 'cause', {
      configurable: true,
      value: cause,
      writable: true,
    })
  }

  return abortError
}

function toApiError({
  cause,
  method,
  responsePayload,
  status,
  url,
}: {
  cause?: unknown
  method: ApiMethod
  responsePayload?: ParsedResponseBody
  status?: number
  url: string
}) {
  if (cause instanceof ApiError) {
    return cause
  }

  if (typeof status === 'number') {
    return new ApiError({
      cause,
      message: `API request failed with status ${status}.`,
      method,
      responsePayload,
      status,
      url,
    })
  }

  if (cause instanceof Error) {
    return new ApiError({
      cause,
      message: cause.message,
      method,
      responsePayload,
      url,
    })
  }

  return new ApiError({
    cause,
    message: 'API request failed.',
    method,
    responsePayload,
    url,
  })
}

export async function request<TResponse, TBody = unknown>({
  body,
  headers,
  meta,
  method,
  path,
  query,
  signal,
}: ApiRequestOptions<TBody>): Promise<TResponse> {
  const url = buildUrl(path, query)
  const requestHeaders = buildHeaders(headers, body)
  const requestBody =
    typeof body === 'undefined' ? undefined : JSON.stringify(body)
  const getDurationMs = createDiagnosticTimer()

  recordDiagnosticEvent({
    context: {
      feature: meta.feature,
      method,
      path,
      url: url.toString(),
    },
    details: {
      query,
      requestBody: body,
    },
    domain: 'api',
    operation: meta.operation,
    phase: 'request',
    redactKeys: meta.redactKeys,
    status: 'start',
    tags: {
      ...meta.tags,
      feature: meta.feature,
      method,
    },
  })

  if (signal?.aborted) {
    const abortError = createAbortError()

    recordDiagnosticEvent({
      context: {
        feature: meta.feature,
        method,
        path,
        url: url.toString(),
      },
      details: {
        query,
        requestBody: body,
      },
      domain: 'api',
      durationMs: getDurationMs(),
      operation: meta.operation,
      phase: 'request',
      redactKeys: meta.redactKeys,
      status: 'cancelled',
      tags: {
        ...meta.tags,
        feature: meta.feature,
        method,
      },
    })

    throw abortError
  }

  try {
    const response = await fetch(url, {
      body: requestBody,
      headers: requestHeaders,
      method,
      signal,
    })
    let parsedBody: ParsedResponseBody

    try {
      parsedBody = await parseResponseBody(response)
    } catch (error) {
      throw toApiError({
        cause: error,
        method,
        status: response.status,
        url: url.toString(),
      })
    }

    if (!response.ok) {
      throw toApiError({
        method,
        responsePayload: parsedBody,
        status: response.status,
        url: url.toString(),
      })
    }

    recordDiagnosticEvent({
      context: {
        feature: meta.feature,
        method,
        path,
        statusCode: response.status,
        url: url.toString(),
      },
      details: {
        query,
        requestBody: body,
        responseBody: parsedBody,
      },
      domain: 'api',
      durationMs: getDurationMs(),
      operation: meta.operation,
      phase: 'request',
      redactKeys: meta.redactKeys,
      status: 'success',
      tags: {
        ...meta.tags,
        feature: meta.feature,
        method,
      },
    })

    return parsedBody as TResponse
  } catch (error) {
    if (isAbortError(error, signal)) {
      const abortError = createAbortError(error)

      recordDiagnosticEvent({
        context: {
          feature: meta.feature,
          method,
          path,
          url: url.toString(),
        },
        details: {
          query,
          requestBody: body,
        },
        domain: 'api',
        durationMs: getDurationMs(),
        operation: meta.operation,
        phase: 'request',
        redactKeys: meta.redactKeys,
        status: 'cancelled',
        tags: {
          ...meta.tags,
          feature: meta.feature,
          method,
        },
      })

      throw abortError
    }

    const apiError = toApiError({
      cause: error,
      method,
      responsePayload:
        error instanceof ApiError ? error.responsePayload : undefined,
      status: error instanceof ApiError ? error.status : undefined,
      url: url.toString(),
    })

    recordDiagnosticEvent({
      captureError: true,
      context: {
        feature: meta.feature,
        method,
        path,
        statusCode: apiError.status,
        url: url.toString(),
      },
      details: {
        query,
        requestBody: body,
        responseBody: apiError.responsePayload,
      },
      domain: 'api',
      durationMs: getDurationMs(),
      error: apiError,
      operation: meta.operation,
      phase: 'request',
      redactKeys: meta.redactKeys,
      status: 'error',
      tags: {
        ...meta.tags,
        feature: meta.feature,
        method,
      },
    })

    throw apiError
  }
}
