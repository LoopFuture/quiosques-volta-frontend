import {
  createAppQueryClient,
  RUNTIME_CACHE_GC_TIME_MS,
} from '@/features/app-data/query'
import { createMockExpoConfig } from '../../support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')
const { addBreadcrumb, captureException } = jest.requireMock(
  '@sentry/react-native',
)

describe('app query client', () => {
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

  it('uses bounded runtime cache lifetimes without leaving test timers behind', () => {
    const queryClient = createAppQueryClient()
    const defaultOptions = queryClient.getDefaultOptions()
    const expectedGcTime =
      process.env.NODE_ENV === 'test' ? Infinity : RUNTIME_CACHE_GC_TIME_MS

    expect(RUNTIME_CACHE_GC_TIME_MS).toBe(5 * 60_000)
    expect(defaultOptions.queries?.gcTime).toBe(expectedGcTime)
    expect(defaultOptions.mutations?.gcTime).toBe(expectedGcTime)
    expect(defaultOptions.queries?.staleTime).toBe(30_000)
    expect(defaultOptions.queries?.retry).toBe(false)
    expect(defaultOptions.mutations?.retry).toBe(false)
  })

  it('logs query fetch success with redacted payload summaries', async () => {
    const queryClient = createAppQueryClient()

    await queryClient.fetchQuery({
      meta: {
        feature: 'tests',
        operation: 'fetch-success',
      },
      queryFn: async () => ({
        email: 'ana.silva@sdr.pt',
        items: Array.from({ length: 15 }, (_, index) => ({ index })),
      }),
      queryKey: ['tests', 'fetch-success'],
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          context: expect.objectContaining({
            feature: 'tests',
            kind: 'query',
          }),
          details: expect.objectContaining({
            data: expect.objectContaining({
              email: '[REDACTED]',
              items: expect.objectContaining({
                totalCount: 15,
              }),
            }),
          }),
        }),
        message: 'fetch-success.fetch.success',
      }),
    )
  })

  it('logs query failures and captures them in Sentry', async () => {
    const queryClient = createAppQueryClient()

    await expect(
      queryClient.fetchQuery({
        meta: {
          feature: 'tests',
          operation: 'fetch-error',
        },
        queryFn: async () => {
          throw new Error('Query failed')
        },
        queryKey: ['tests', 'fetch-error'],
      }),
    ).rejects.toThrow('Query failed')

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'fetch-error.fetch.error',
      }),
    )
  })

  it('logs query invalidations', async () => {
    const queryClient = createAppQueryClient()

    await queryClient.fetchQuery({
      meta: {
        feature: 'tests',
        operation: 'fetch-invalidate',
      },
      queryFn: async () => ({ ok: true }),
      queryKey: ['tests', 'fetch-invalidate'],
    })

    await queryClient.invalidateQueries({
      queryKey: ['tests', 'fetch-invalidate'],
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'fetch-invalidate.invalidate.info',
      }),
    )
  })

  it('logs mutation success and redacts mutation variables', async () => {
    const queryClient = createAppQueryClient()
    const mutation = queryClient.getMutationCache().build(queryClient, {
      meta: {
        feature: 'tests',
        operation: 'mutation-success',
      },
      mutationFn: async (variables: {
        email: string
        amountCents: number
      }) => ({
        amountCents: variables.amountCents,
        email: variables.email,
      }),
      mutationKey: ['tests', 'mutation-success'],
    })

    await mutation.execute({
      amountCents: 500,
      email: 'ana.silva@sdr.pt',
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({
            data: expect.objectContaining({
              amountCents: 500,
              email: '[REDACTED]',
            }),
          }),
          durationMs: expect.any(Number),
        }),
        message: 'mutation-success.execute.success',
      }),
    )
  })

  it('logs mutation failures and captures them in Sentry', async () => {
    const queryClient = createAppQueryClient()
    const mutation = queryClient.getMutationCache().build(queryClient, {
      meta: {
        feature: 'tests',
        operation: 'mutation-error',
      },
      mutationFn: async () => {
        throw new Error('Mutation failed')
      },
      mutationKey: ['tests', 'mutation-error'],
    })

    await expect(mutation.execute(undefined)).rejects.toThrow('Mutation failed')

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'mutation-error.execute.error',
      }),
    )
  })
})
