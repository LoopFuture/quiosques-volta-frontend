import {
  MutationCache,
  QueryCache,
  QueryClient,
  type Mutation,
  type Query,
} from '@tanstack/react-query'
import { recordDiagnosticEvent } from '@/features/app-data/monitoring'

export const RUNTIME_CACHE_GC_TIME_MS = 5 * 60_000

const CACHE_GC_TIME_MS =
  process.env.NODE_ENV === 'test' ? Infinity : RUNTIME_CACHE_GC_TIME_MS

function getReactQueryDiagnosticFields(
  queryLike: Pick<Query, 'meta'> | Pick<Mutation, 'meta'>,
  fallbackFeature: string,
) {
  const feature = queryLike.meta?.feature ?? fallbackFeature
  const operation = queryLike.meta?.operation ?? 'unknown'
  const redactKeys = queryLike.meta?.redactKeys
  const tags = queryLike.meta?.tags

  return {
    feature,
    operation,
    redactKeys,
    tags,
  }
}

function createReactQueryCaches() {
  const queryStartTimes = new Map<string, number>()
  const mutationStartTimes = new Map<number, number>()
  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()

  queryCache.subscribe((event) => {
    if (event.type !== 'updated') {
      return
    }

    const { action, query } = event

    if (
      action.type !== 'error' &&
      action.type !== 'fetch' &&
      action.type !== 'invalidate' &&
      action.type !== 'success'
    ) {
      return
    }

    const { feature, operation, redactKeys, tags } =
      getReactQueryDiagnosticFields(
        query,
        String(query.queryKey[0] ?? 'react-query'),
      )
    const durationMs = queryStartTimes.has(query.queryHash)
      ? Date.now() - (queryStartTimes.get(query.queryHash) ?? Date.now())
      : undefined

    if (action.type === 'fetch') {
      queryStartTimes.set(query.queryHash, Date.now())
    }

    if (action.type === 'success' || action.type === 'error') {
      queryStartTimes.delete(query.queryHash)
    }

    recordDiagnosticEvent({
      captureError: action.type === 'error',
      context: {
        feature,
        kind: 'query',
        queryHash: query.queryHash,
        queryKey: query.queryKey,
      },
      details:
        action.type === 'fetch'
          ? {
              fetchStatus: query.state.fetchStatus,
              status: query.state.status,
            }
          : action.type === 'invalidate'
            ? {
                fetchStatus: query.state.fetchStatus,
                isInvalidated: query.state.isInvalidated,
                status: query.state.status,
              }
            : action.type === 'success'
              ? {
                  data: query.state.data,
                  dataUpdateCount: query.state.dataUpdateCount,
                  fetchStatus: query.state.fetchStatus,
                }
              : {
                  error: query.state.error,
                  failureCount: query.state.fetchFailureCount,
                  failureReason: query.state.fetchFailureReason,
                },
      domain: 'react-query',
      durationMs,
      error: action.type === 'error' ? query.state.error : undefined,
      operation,
      phase: action.type === 'invalidate' ? 'invalidate' : 'fetch',
      redactKeys,
      status:
        action.type === 'fetch'
          ? 'start'
          : action.type === 'invalidate'
            ? 'info'
            : action.type === 'success'
              ? 'success'
              : 'error',
      tags: {
        ...tags,
        feature,
        kind: 'query',
      },
    })
  })

  mutationCache.subscribe((event) => {
    if (event.type !== 'updated') {
      return
    }

    const { action, mutation } = event

    if (
      action.type !== 'error' &&
      action.type !== 'pending' &&
      action.type !== 'success'
    ) {
      return
    }

    const { feature, operation, redactKeys, tags } =
      getReactQueryDiagnosticFields(mutation, 'react-query')
    const durationMs = mutationStartTimes.has(mutation.mutationId)
      ? Date.now() - (mutationStartTimes.get(mutation.mutationId) ?? Date.now())
      : undefined

    if (action.type === 'pending') {
      mutationStartTimes.set(mutation.mutationId, Date.now())
    }

    if (action.type === 'success' || action.type === 'error') {
      mutationStartTimes.delete(mutation.mutationId)
    }

    recordDiagnosticEvent({
      captureError: action.type === 'error',
      context: {
        feature,
        kind: 'mutation',
        mutationId: mutation.mutationId,
        mutationKey: mutation.options.mutationKey,
      },
      details:
        action.type === 'pending'
          ? {
              failureCount: mutation.state.failureCount,
              variables: mutation.state.variables,
            }
          : action.type === 'success'
            ? {
                data: mutation.state.data,
                variables: mutation.state.variables,
              }
            : {
                error: mutation.state.error,
                failureCount: mutation.state.failureCount,
                variables: mutation.state.variables,
              },
      domain: 'react-query',
      durationMs,
      error: action.type === 'error' ? mutation.state.error : undefined,
      operation,
      phase: 'execute',
      redactKeys,
      status:
        action.type === 'pending'
          ? 'start'
          : action.type === 'success'
            ? 'success'
            : 'error',
      tags: {
        ...tags,
        feature,
        kind: 'mutation',
      },
    })
  })

  return {
    mutationCache,
    queryCache,
  }
}

export function createAppQueryClient() {
  const { mutationCache, queryCache } = createReactQueryCaches()

  return new QueryClient({
    defaultOptions: {
      mutations: {
        gcTime: CACHE_GC_TIME_MS,
        retry: false,
      },
      queries: {
        gcTime: CACHE_GC_TIME_MS,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 30_000,
      },
    },
    mutationCache,
    queryCache,
  })
}
