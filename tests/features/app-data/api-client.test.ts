import { ApiError, request } from '@/features/app-data/api'
import { setCurrentAuthAccessToken } from '@/features/auth/runtime'
import { createMockExpoConfig } from '../../support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')
const { addBreadcrumb, captureException } = jest.requireMock(
  '@sentry/react-native',
)

describe('app api client', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )
    setCurrentAuthAccessToken(null)
  })

  afterEach(() => {
    global.fetch = originalFetch
    setCurrentAuthAccessToken(null)
  })

  it('builds authenticated json requests and redacts diagnostic payloads', async () => {
    setCurrentAuthAccessToken('access-token')
    global.fetch = jest.fn(async () => {
      return new Response(
        JSON.stringify({
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          token: 'secret-token',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        },
      )
    }) as typeof fetch

    const response = await request<
      {
        email: string
        name: string
        token: string
      },
      {
        email: string
      }
    >({
      body: {
        email: 'ana.silva@sdr.pt',
      },
      headers: {
        'X-Trace-ID': 'trace-123',
      },
      meta: {
        feature: 'profile',
        operation: 'load-profile',
        redactKeys: ['name'],
        tags: {
          scope: 'full',
        },
      },
      method: 'POST',
      path: '/profile',
      query: {
        active: true,
        page: 2,
        skip: undefined,
      },
    })

    expect(response).toEqual({
      email: 'ana.silva@sdr.pt',
      name: 'Ana Silva',
      token: 'secret-token',
    })

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const headers = init.headers as Headers

    expect(url.toString()).toBe(
      'https://volta.be.dev.theloop.tech/profile?active=true&page=2',
    )
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ email: 'ana.silva@sdr.pt' }))
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Authorization')).toBe('Bearer access-token')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-Trace-ID')).toBe('trace-123')

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({
            requestBody: {
              email: '[REDACTED]',
            },
            responseBody: {
              email: '[REDACTED]',
              name: '[REDACTED]',
              token: '[REDACTED]',
            },
          }),
        }),
        message: 'load-profile.request.success',
      }),
    )
  })

  it('returns plain text responses and preserves caller-provided authorization headers', async () => {
    global.fetch = jest.fn(async () => {
      return new Response('Accepted', {
        headers: {
          'Content-Type': 'text/plain',
        },
        status: 202,
      })
    }) as typeof fetch

    const response = await request<string>({
      headers: {
        Authorization: 'Bearer caller-token',
      },
      meta: {
        feature: 'wallet',
        operation: 'export',
      },
      method: 'PUT',
      path: '/wallet/export',
    })

    expect(response).toBe('Accepted')

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const headers = init.headers as Headers

    expect(headers.get('Authorization')).toBe('Bearer caller-token')
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('returns undefined for empty successful responses', async () => {
    global.fetch = jest.fn(
      async () => new Response(null, { status: 204 }),
    ) as typeof fetch

    await expect(
      request({
        meta: {
          feature: 'profile',
          operation: 'delete-avatar',
        },
        method: 'DELETE',
        path: '/profile/avatar',
      }),
    ).resolves.toBeUndefined()
  })

  it('wraps non-ok responses in ApiError and captures them', async () => {
    global.fetch = jest.fn(async () => {
      return new Response(JSON.stringify({ secret: 'very-secret' }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 500,
      })
    }) as typeof fetch

    await expect(
      request({
        meta: {
          feature: 'home',
          operation: 'screen-state',
        },
        method: 'GET',
        path: '/home',
      }),
    ).rejects.toMatchObject({
      method: 'GET',
      name: 'ApiError',
      responsePayload: {
        secret: '[REDACTED]',
      },
      status: 500,
      url: 'https://volta.be.dev.theloop.tech/home',
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(ApiError))
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'screen-state.request.error',
      }),
    )
  })

  it('wraps malformed json responses in ApiError with the response status', async () => {
    global.fetch = jest.fn(async () => {
      return new Response('{invalid-json', {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      })
    }) as typeof fetch

    await expect(
      request({
        meta: {
          feature: 'map',
          operation: 'screen-state',
        },
        method: 'GET',
        path: '/locations',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(ApiError))
  })

  it('marks requests aborted before fetch as cancelled without capturing errors', async () => {
    const controller = new AbortController()
    controller.abort()
    global.fetch = jest.fn() as typeof fetch

    await expect(
      request({
        meta: {
          feature: 'home',
          operation: 'screen-state',
        },
        method: 'GET',
        path: '/home',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'screen-state.request.cancelled',
      }),
    )
  })

  it('normalizes fetch abort failures as cancelled requests', async () => {
    const controller = new AbortController()
    global.fetch = jest.fn((_input, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => {
            reject(new Error('fetch failed: The operation was aborted.'))
          },
          { once: true },
        )
      })
    }) as typeof fetch

    const requestPromise = request({
      meta: {
        feature: 'home',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/home',
      signal: controller.signal,
    })

    controller.abort()

    await expect(requestPromise).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(captureException).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'screen-state.request.cancelled',
      }),
    )
  })

  it('wraps unknown thrown values in ApiError', async () => {
    global.fetch = jest.fn(async () => {
      throw 'network exploded'
    }) as typeof fetch

    await expect(
      request({
        meta: {
          feature: 'wallet',
          operation: 'sync',
        },
        method: 'GET',
        path: '/wallet',
      }),
    ).rejects.toMatchObject({
      message: 'API request failed.',
      name: 'ApiError',
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(ApiError))
  })
})
