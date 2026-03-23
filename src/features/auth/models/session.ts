import { TokenResponse, type TokenResponseConfig } from 'expo-auth-session'
import { z } from 'zod/v4'

export const AUTH_SESSION_STATUS = [
  'hydrating',
  'anonymous',
  'authenticated',
  'refreshing',
] as const

export type AuthSessionStatus = (typeof AUTH_SESSION_STATUS)[number]

export type AppAuthSession = {
  accessToken: string
  expiresAt: number | null
  idToken?: string
  refreshToken?: string
}

export type StoredAuthSession = {
  accessToken: string
  expiresIn?: number
  idToken?: string
  issuedAt: number
  refreshToken?: string
  scope?: string
  tokenType: string
}

export const storedAuthSessionMetaSchema = z.object({
  expiresIn: z.number().finite().positive().optional(),
  issuedAt: z.number().int().nonnegative(),
  scope: z.string().min(1).optional(),
  tokenType: z.string().min(1).default('bearer'),
})

export function createStoredAuthSession(
  tokenResponse: TokenResponse | TokenResponseConfig,
): StoredAuthSession {
  const config =
    tokenResponse instanceof TokenResponse
      ? tokenResponse.getRequestConfig()
      : tokenResponse

  return {
    accessToken: config.accessToken,
    expiresIn:
      typeof config.expiresIn === 'number'
        ? Number(config.expiresIn)
        : undefined,
    idToken: config.idToken,
    issuedAt: config.issuedAt ?? Math.floor(Date.now() / 1000),
    refreshToken: config.refreshToken,
    scope: config.scope,
    tokenType: config.tokenType ?? 'bearer',
  }
}

export function mergeStoredAuthSession(
  currentSession: StoredAuthSession,
  tokenResponse: TokenResponse | TokenResponseConfig,
) {
  const nextSession = createStoredAuthSession(tokenResponse)

  return {
    ...nextSession,
    idToken: nextSession.idToken ?? currentSession.idToken,
    refreshToken: nextSession.refreshToken ?? currentSession.refreshToken,
    scope: nextSession.scope ?? currentSession.scope,
  }
}

export function isStoredAuthSessionFresh(
  session: Pick<StoredAuthSession, 'expiresIn' | 'issuedAt'>,
) {
  return TokenResponse.isTokenFresh(
    {
      expiresIn: session.expiresIn,
      issuedAt: session.issuedAt,
    },
    0,
  )
}

export function toAppAuthSession(session: StoredAuthSession): AppAuthSession {
  return {
    accessToken: session.accessToken,
    expiresAt:
      typeof session.expiresIn === 'number'
        ? (session.issuedAt + session.expiresIn) * 1000
        : null,
    idToken: session.idToken,
    refreshToken: session.refreshToken,
  }
}
