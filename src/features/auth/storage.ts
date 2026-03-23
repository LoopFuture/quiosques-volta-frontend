import * as SecureStore from 'expo-secure-store'
import {
  createDiagnosticTimer,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import {
  storedAuthSessionMetaSchema,
  type StoredAuthSession,
} from './models/session'

const AUTH_STORAGE_KEY_PREFIX = 'auth.keycloak'
const ACCESS_TOKEN_KEY = `${AUTH_STORAGE_KEY_PREFIX}.access`
const ID_TOKEN_KEY = `${AUTH_STORAGE_KEY_PREFIX}.id`
const META_KEY = `${AUTH_STORAGE_KEY_PREFIX}.meta`
const REFRESH_TOKEN_KEY = `${AUTH_STORAGE_KEY_PREFIX}.refresh`

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  keychainService: 'volta-auth',
}

function describeStoredSession(session: StoredAuthSession) {
  return {
    expiresIn: session.expiresIn ?? null,
    hasAccessToken: Boolean(session.accessToken),
    hasIdToken: Boolean(session.idToken),
    hasRefreshToken: Boolean(session.refreshToken),
    issuedAt: session.issuedAt,
    scope: session.scope ?? null,
    tokenType: session.tokenType,
  }
}

export async function clearStoredAuthSession() {
  const getDurationMs = createDiagnosticTimer()

  recordDiagnosticEvent({
    details: {
      storage: 'secure-store',
    },
    domain: 'auth',
    operation: 'session-storage',
    phase: 'clear',
    status: 'start',
  })

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions),
      SecureStore.deleteItemAsync(ID_TOKEN_KEY, secureStoreOptions),
      SecureStore.deleteItemAsync(META_KEY, secureStoreOptions),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions),
    ])

    recordDiagnosticEvent({
      details: {
        storage: 'secure-store',
      },
      domain: 'auth',
      durationMs: getDurationMs(),
      operation: 'session-storage',
      phase: 'clear',
      status: 'success',
    })
  } catch (error) {
    recordDiagnosticEvent({
      captureError: true,
      details: {
        storage: 'secure-store',
      },
      domain: 'auth',
      durationMs: getDurationMs(),
      error,
      operation: 'session-storage',
      phase: 'clear',
      status: 'error',
    })

    throw error
  }
}

export async function readStoredAuthSession(): Promise<StoredAuthSession | null> {
  const [accessToken, idToken, metadata, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY, secureStoreOptions),
    SecureStore.getItemAsync(ID_TOKEN_KEY, secureStoreOptions),
    SecureStore.getItemAsync(META_KEY, secureStoreOptions),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions),
  ])

  if (!accessToken || !metadata) {
    return null
  }

  let parsedMetadata:
    | ReturnType<typeof storedAuthSessionMetaSchema.safeParse>
    | undefined

  try {
    parsedMetadata = storedAuthSessionMetaSchema.safeParse(JSON.parse(metadata))
  } catch (error) {
    recordDiagnosticEvent({
      captureError: true,
      details: {
        reason: 'metadata-json-invalid',
        storage: 'secure-store',
      },
      domain: 'auth',
      error,
      operation: 'session-storage',
      phase: 'read',
      status: 'error',
    })

    await clearStoredAuthSession()

    return null
  }

  if (!parsedMetadata.success) {
    recordDiagnosticEvent({
      captureError: true,
      details: {
        reason: 'metadata-schema-invalid',
        storage: 'secure-store',
      },
      domain: 'auth',
      error: new Error('Stored auth session metadata validation failed.'),
      operation: 'session-storage',
      phase: 'read',
      status: 'error',
    })

    await clearStoredAuthSession()

    return null
  }

  return {
    accessToken,
    idToken: idToken ?? undefined,
    issuedAt: parsedMetadata.data.issuedAt,
    refreshToken: refreshToken ?? undefined,
    scope: parsedMetadata.data.scope,
    tokenType: parsedMetadata.data.tokenType,
    ...(typeof parsedMetadata.data.expiresIn === 'number'
      ? { expiresIn: parsedMetadata.data.expiresIn }
      : {}),
  }
}

export async function saveStoredAuthSession(session: StoredAuthSession) {
  const getDurationMs = createDiagnosticTimer()

  recordDiagnosticEvent({
    details: describeStoredSession(session),
    domain: 'auth',
    operation: 'session-storage',
    phase: 'save',
    status: 'start',
  })

  try {
    await Promise.all([
      SecureStore.setItemAsync(
        ACCESS_TOKEN_KEY,
        session.accessToken,
        secureStoreOptions,
      ),
      session.idToken
        ? SecureStore.setItemAsync(
            ID_TOKEN_KEY,
            session.idToken,
            secureStoreOptions,
          )
        : SecureStore.deleteItemAsync(ID_TOKEN_KEY, secureStoreOptions),
      session.refreshToken
        ? SecureStore.setItemAsync(
            REFRESH_TOKEN_KEY,
            session.refreshToken,
            secureStoreOptions,
          )
        : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureStoreOptions),
      SecureStore.setItemAsync(
        META_KEY,
        JSON.stringify({
          expiresIn: session.expiresIn,
          issuedAt: session.issuedAt,
          scope: session.scope,
          tokenType: session.tokenType,
        }),
        secureStoreOptions,
      ),
    ])

    recordDiagnosticEvent({
      details: describeStoredSession(session),
      domain: 'auth',
      durationMs: getDurationMs(),
      operation: 'session-storage',
      phase: 'save',
      status: 'success',
    })
  } catch (error) {
    recordDiagnosticEvent({
      captureError: true,
      details: describeStoredSession(session),
      domain: 'auth',
      durationMs: getDurationMs(),
      error,
      operation: 'session-storage',
      phase: 'save',
      status: 'error',
    })

    throw error
  }
}
