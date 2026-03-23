import { http, HttpResponse } from 'msw'
import { request, ApiError, MOCK_API_ORIGIN } from '@/features/app-data/api'
import { mockApiServer } from '@/features/app-data/mock/server.node'
import { createMockExpoConfig } from '../../support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')
const { addBreadcrumb, captureException } = jest.requireMock(
  '@sentry/react-native',
)

describe('app api client', () => {
  beforeEach(() => {
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )
  })

  it('logs successful requests with redacted request and response payloads', async () => {
    const response = await request<
      {
        onboarding: {
          status: string
        }
        payoutAccount: {
          ibanMasked: string
          spinEnabled: boolean
        }
        personal: {
          email: string
          name: string
          nif: string
          phoneNumber: string
        }
        preferences: {
          alertsEmail: string
          alertsEnabled: boolean
        }
      },
      {
        personal: {
          email: string
          name: string
          nif: string
          phoneNumber: string
        }
      }
    >({
      body: {
        personal: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          nif: '123456789',
          phoneNumber: '+351911223344',
        },
      },
      meta: {
        feature: 'profile',
        operation: 'update-personal',
        redactKeys: ['alertsEmail', 'email', 'name', 'nif', 'phoneNumber'],
      },
      method: 'PATCH',
      path: '/profile',
    })

    expect(response.personal.name).toBe('Ana Silva')
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'app.api',
        data: expect.objectContaining({
          details: expect.objectContaining({
            requestBody: expect.objectContaining({
              personal: expect.objectContaining({
                email: '[REDACTED]',
                name: '[REDACTED]',
                nif: '[REDACTED]',
                phoneNumber: '[REDACTED]',
              }),
            }),
            responseBody: expect.objectContaining({
              personal: expect.objectContaining({
                email: '[REDACTED]',
                name: '[REDACTED]',
                nif: '[REDACTED]',
                phoneNumber: '[REDACTED]',
              }),
              preferences: expect.objectContaining({
                alertsEmail: '[REDACTED]',
              }),
            }),
          }),
        }),
        message: 'update-personal.request.success',
      }),
    )
  })

  it('wraps non-2xx responses in ApiError and captures them in Sentry', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/home`, () =>
        HttpResponse.json(
          {
            token: 'secret-token',
          },
          {
            status: 500,
          },
        ),
      ),
    )

    await expect(
      request({
        meta: {
          feature: 'home',
          operation: 'screen-state',
          redactKeys: ['token'],
        },
        method: 'GET',
        path: '/home',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(ApiError))
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({
            responseBody: expect.objectContaining({
              token: '[REDACTED]',
            }),
          }),
        }),
        message: 'screen-state.request.error',
      }),
    )
  })

  it('marks aborted requests as cancelled without capturing them as errors', async () => {
    const controller = new AbortController()
    controller.abort()

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

    expect(captureException).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'screen-state.request.cancelled',
      }),
    )
  })

  it('normalizes Expo-style aborted fetch errors as cancelled requests', async () => {
    const controller = new AbortController()
    const originalFetch = global.fetch

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

    try {
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
    } finally {
      global.fetch = originalFetch
    }

    expect(captureException).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'screen-state.request.cancelled',
      }),
    )
  })

  it('wraps malformed json responses in ApiError with the response status', async () => {
    mockApiServer.use(
      http.get(
        `${MOCK_API_ORIGIN}/v1/locations/collection-points`,
        () =>
          new HttpResponse('{invalid-json', {
            headers: {
              'Content-Type': 'application/json',
            },
            status: 200,
          }),
      ),
    )

    await expect(
      request({
        meta: {
          feature: 'map',
          operation: 'screen-state',
        },
        method: 'GET',
        path: '/v1/locations/collection-points',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(ApiError))
  })
})
