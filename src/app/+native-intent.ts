import { KEYCLOAK_REDIRECT_PATH } from '@/features/auth/constants'
import { authRoutes } from '@/features/auth/routes'

type RedirectSystemPathEvent = {
  initial: boolean
  path: string | null
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+/g, '/').replace(/^\/|\/$/g, '')
}

function parseIncomingPath(path: string) {
  if (path.includes('://')) {
    const url = new URL(path)

    return {
      hash: url.hash,
      pathname: `${url.host}${url.pathname}`,
      search: url.search,
    }
  }

  const url = new URL(path.startsWith('/') ? path : `/${path}`, 'https://volta')

  return {
    hash: url.hash,
    pathname: url.pathname,
    search: url.search,
  }
}

export function redirectSystemPath({ path }: RedirectSystemPathEvent) {
  if (!path) {
    return path
  }

  try {
    const incomingPath = parseIncomingPath(path)

    if (
      normalizePathname(incomingPath.pathname) !==
      normalizePathname(KEYCLOAK_REDIRECT_PATH)
    ) {
      return path
    }

    // Keep the auth screen mounted when the native callback returns on Android.
    return `${authRoutes.index}${incomingPath.search}${incomingPath.hash}`
  } catch {
    return path
  }
}
