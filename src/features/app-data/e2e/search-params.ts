type SearchParamValue = string | string[] | undefined

export const E2E_ROUTE_QUERY_STATE_PARAM = '__e2eQueryState'
export const E2E_ROUTE_QUERY_STATE_ERROR = 'error'
export const E2E_ROUTE_OFFLINE_PARAM = '__e2eOffline'
export const E2E_ROOT_STATE_PARAM = '__e2eRootState'
export const E2E_ROOT_STATE_PROFILE_BOOTSTRAP_ERROR = 'profile-bootstrap-error'
export const E2E_WALLET_MOVEMENT_STATE_PARAM = '__e2eMovementState'
export const E2E_WALLET_MOVEMENT_STATE_NOT_FOUND = 'not-found'

export function getSearchParamValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

export function hasTruthySearchFlag(value: SearchParamValue) {
  const resolvedValue = getSearchParamValue(value)

  return resolvedValue === '1' || resolvedValue === 'true'
}
