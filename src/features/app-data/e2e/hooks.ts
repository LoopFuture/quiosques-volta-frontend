import {
  useGlobalSearchParams,
  useLocalSearchParams,
  usePathname,
  useRouter,
  type Href,
} from 'expo-router'
import {
  E2E_ROOT_STATE_PARAM,
  E2E_ROUTE_QUERY_STATE_ERROR,
  getSearchParamValue,
} from './search-params'
import { getE2ERuntimeConfig } from './runtime'

export function useE2EForcedQueryError() {
  const pathname = usePathname()
  const router = useRouter()
  const { __e2eQueryState } = useLocalSearchParams<{
    __e2eQueryState?: string | string[]
  }>()
  const isForcedQueryError =
    getE2ERuntimeConfig().enabled &&
    getSearchParamValue(__e2eQueryState) === E2E_ROUTE_QUERY_STATE_ERROR

  return {
    clearForcedQueryError: () => router.replace(pathname as Href),
    isForcedQueryError,
  }
}

export function useE2EForcedRootState(targetState: string) {
  const pathname = usePathname()
  const router = useRouter()
  const globalSearchParams = useGlobalSearchParams<{
    __e2eRootState?: string | string[]
  }>()
  const isForcedRootState =
    getE2ERuntimeConfig().enabled &&
    getSearchParamValue(globalSearchParams[E2E_ROOT_STATE_PARAM]) ===
      targetState

  return {
    clearForcedRootState: () => router.replace(pathname as Href),
    isForcedRootState,
  }
}
