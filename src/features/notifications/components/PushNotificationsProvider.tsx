import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useMMKVString } from 'react-native-mmkv'
import {
  createDiagnosticTimer,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import {
  parseStoredBoolean,
  privacyPreferenceStorage,
  PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
} from '@/features/app-data/storage/device/privacy'
import {
  getPushNotificationsRuntimeConfig,
  PUSH_NOTIFICATIONS_DEFAULT_CHANNEL_ID,
  type PushNotificationsRegistrationErrorCode,
  type PushNotificationsState,
} from '../models/runtime'
import { brandPrimary } from '@/themes'

type PushNotificationsSyncResult = PushNotificationsState & {
  isEnabled: boolean
}

export type PushNotificationsContextValue = PushNotificationsState & {
  isSyncing: boolean
  latestForegroundNotification: Notifications.Notification | null
  requestPushPermissionAndToken: () => Promise<PushNotificationsSyncResult>
  syncExistingPushPermissionAndToken: () => Promise<PushNotificationsSyncResult>
  updateLatestForegroundNotification: (
    notification: Notifications.Notification,
  ) => void
}

export const PushNotificationsContext =
  createContext<PushNotificationsContextValue | null>(null)

const defaultPushNotificationsState: PushNotificationsState = {
  canAskAgain: true,
  expoPushToken: null,
  isPhysicalDevice: Device.isDevice,
  permissionStatus:
    'undetermined' as PushNotificationsState['permissionStatus'],
  registrationErrorCode: null,
}

function toSyncResult(
  state: PushNotificationsState,
): PushNotificationsSyncResult {
  return {
    ...state,
    isEnabled:
      state.permissionStatus === 'granted' && !state.registrationErrorCode,
  }
}

function describePushState(
  state: Pick<
    PushNotificationsState,
    | 'canAskAgain'
    | 'expoPushToken'
    | 'isPhysicalDevice'
    | 'permissionStatus'
    | 'registrationErrorCode'
  >,
) {
  return {
    canAskAgain: state.canAskAgain,
    hasExpoPushToken: Boolean(state.expoPushToken),
    isPhysicalDevice: state.isPhysicalDevice,
    permissionStatus: state.permissionStatus,
    registrationErrorCode: state.registrationErrorCode,
  }
}

async function ensureDefaultNotificationChannelAsync() {
  if (Platform.OS !== 'android') {
    return
  }

  const getDurationMs = createDiagnosticTimer()

  recordDiagnosticEvent({
    details: {
      channelId: PUSH_NOTIFICATIONS_DEFAULT_CHANNEL_ID,
      platform: Platform.OS,
    },
    domain: 'push',
    operation: 'notification-channel',
    phase: 'configure',
    status: 'start',
  })

  try {
    await Notifications.setNotificationChannelAsync(
      PUSH_NOTIFICATIONS_DEFAULT_CHANNEL_ID,
      {
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: brandPrimary,
        name: 'default',
      },
    )

    recordDiagnosticEvent({
      details: {
        channelId: PUSH_NOTIFICATIONS_DEFAULT_CHANNEL_ID,
        platform: Platform.OS,
      },
      domain: 'push',
      durationMs: getDurationMs(),
      operation: 'notification-channel',
      phase: 'configure',
      status: 'success',
    })
  } catch (error) {
    recordDiagnosticEvent({
      captureError: true,
      details: {
        channelId: PUSH_NOTIFICATIONS_DEFAULT_CHANNEL_ID,
        platform: Platform.OS,
      },
      domain: 'push',
      durationMs: getDurationMs(),
      error,
      operation: 'notification-channel',
      phase: 'configure',
      status: 'error',
    })

    throw error
  }
}

export function PushNotificationsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [storedPushNotificationsEnabled] = useMMKVString(
    PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
    privacyPreferenceStorage,
  )
  const [state, setState] = useState<PushNotificationsState>(
    defaultPushNotificationsState,
  )
  const stateRef = useRef(state)
  const [isSyncing, setIsSyncing] = useState(false)
  const [latestForegroundNotification, setLatestForegroundNotification] =
    useState<Notifications.Notification | null>(null)
  const pushNotificationsEnabled = parseStoredBoolean(
    storedPushNotificationsEnabled,
  )

  const replaceState = useCallback((nextState: PushNotificationsState) => {
    stateRef.current = nextState
    setState(nextState)
  }, [])

  const syncFromPermissionStatus = useCallback(
    async ({
      permissionStatus,
      canAskAgain,
    }: Pick<PushNotificationsState, 'canAskAgain' | 'permissionStatus'>) => {
      if (permissionStatus !== 'granted') {
        const nextState: PushNotificationsState = {
          canAskAgain,
          expoPushToken: null,
          isPhysicalDevice: Device.isDevice,
          permissionStatus,
          registrationErrorCode: null,
        }

        replaceState(nextState)
        recordDiagnosticEvent({
          details: {
            ...describePushState(nextState),
            reason: 'permission-not-granted',
          },
          domain: 'push',
          operation: 'push-token',
          phase: 'register',
          status: 'info',
        })

        return toSyncResult(nextState)
      }

      if (!Device.isDevice) {
        const nextState: PushNotificationsState = {
          canAskAgain,
          expoPushToken: null,
          isPhysicalDevice: false,
          permissionStatus,
          registrationErrorCode: 'device-required',
        }

        replaceState(nextState)
        recordDiagnosticEvent({
          details: {
            ...describePushState(nextState),
            reason: 'device-required',
          },
          domain: 'push',
          operation: 'push-token',
          phase: 'register',
          status: 'info',
        })

        return toSyncResult(nextState)
      }

      const getDurationMs = createDiagnosticTimer()

      recordDiagnosticEvent({
        details: {
          canAskAgain,
          permissionStatus,
        },
        domain: 'push',
        operation: 'push-token',
        phase: 'register',
        status: 'start',
      })

      try {
        await ensureDefaultNotificationChannelAsync()

        const runtimeConfig = getPushNotificationsRuntimeConfig()
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: runtimeConfig.projectId,
        })
        const nextState: PushNotificationsState = {
          canAskAgain,
          expoPushToken: token.data,
          isPhysicalDevice: true,
          permissionStatus,
          registrationErrorCode: null,
        }

        replaceState(nextState)
        recordDiagnosticEvent({
          details: describePushState(nextState),
          domain: 'push',
          durationMs: getDurationMs(),
          operation: 'push-token',
          phase: 'register',
          status: 'success',
        })

        return toSyncResult(nextState)
      } catch (error) {
        const registrationErrorCode: PushNotificationsRegistrationErrorCode =
          error instanceof Error && error.message.includes('projectId')
            ? 'missing-project-id'
            : 'token-registration-failed'
        const nextState: PushNotificationsState = {
          canAskAgain,
          expoPushToken: null,
          isPhysicalDevice: true,
          permissionStatus,
          registrationErrorCode,
        }

        replaceState(nextState)
        recordDiagnosticEvent({
          captureError:
            registrationErrorCode === 'missing-project-id' ||
            registrationErrorCode === 'token-registration-failed',
          details: describePushState(nextState),
          domain: 'push',
          durationMs: getDurationMs(),
          error,
          operation: 'push-token',
          phase: 'register',
          status: 'error',
        })

        return toSyncResult(nextState)
      }
    },
    [replaceState],
  )

  const syncExistingPushPermissionAndToken = useCallback(async () => {
    const getDurationMs = createDiagnosticTimer()

    recordDiagnosticEvent({
      domain: 'push',
      operation: 'permissions-sync',
      phase: 'read-permissions',
      status: 'start',
    })

    setIsSyncing(true)

    try {
      const permissions = await Notifications.getPermissionsAsync()
      const result = await syncFromPermissionStatus({
        canAskAgain: permissions.canAskAgain,
        permissionStatus: permissions.status,
      })

      recordDiagnosticEvent({
        details: describePushState(result),
        domain: 'push',
        durationMs: getDurationMs(),
        operation: 'permissions-sync',
        phase: 'read-permissions',
        status: 'success',
      })

      return result
    } catch (error) {
      const fallbackState: PushNotificationsState = {
        ...stateRef.current,
        isPhysicalDevice: Device.isDevice,
      }

      replaceState(fallbackState)
      recordDiagnosticEvent({
        captureError: true,
        details: describePushState(fallbackState),
        domain: 'push',
        durationMs: getDurationMs(),
        error,
        operation: 'permissions-sync',
        phase: 'read-permissions',
        status: 'error',
      })

      return toSyncResult(fallbackState)
    } finally {
      setIsSyncing(false)
    }
  }, [replaceState, syncFromPermissionStatus])

  const requestPushPermissionAndToken = useCallback(async () => {
    const getDurationMs = createDiagnosticTimer()

    recordDiagnosticEvent({
      domain: 'push',
      operation: 'permissions-request',
      phase: 'request-permissions',
      status: 'start',
    })

    setIsSyncing(true)

    try {
      const existingPermissions = await Notifications.getPermissionsAsync()

      if (!Device.isDevice) {
        const nextState: PushNotificationsState = {
          canAskAgain: existingPermissions.canAskAgain,
          expoPushToken: null,
          isPhysicalDevice: false,
          permissionStatus: existingPermissions.status,
          registrationErrorCode: 'device-required',
        }

        replaceState(nextState)
        recordDiagnosticEvent({
          details: {
            ...describePushState(nextState),
            prompted: false,
            reason: 'device-required',
          },
          domain: 'push',
          durationMs: getDurationMs(),
          operation: 'permissions-request',
          phase: 'request-permissions',
          status: 'info',
        })

        return toSyncResult(nextState)
      }

      const shouldRequestPermissions =
        existingPermissions.status !== 'granted' &&
        existingPermissions.canAskAgain
      const permissions = shouldRequestPermissions
        ? await Notifications.requestPermissionsAsync()
        : existingPermissions

      const result = await syncFromPermissionStatus({
        canAskAgain: permissions.canAskAgain,
        permissionStatus: permissions.status,
      })

      recordDiagnosticEvent({
        details: {
          ...describePushState(result),
          prompted: shouldRequestPermissions,
        },
        domain: 'push',
        durationMs: getDurationMs(),
        operation: 'permissions-request',
        phase: 'request-permissions',
        status: 'success',
      })

      return result
    } catch (error) {
      const fallbackState: PushNotificationsState = {
        ...stateRef.current,
        isPhysicalDevice: Device.isDevice,
      }

      replaceState(fallbackState)
      recordDiagnosticEvent({
        captureError: true,
        details: describePushState(fallbackState),
        domain: 'push',
        durationMs: getDurationMs(),
        error,
        operation: 'permissions-request',
        phase: 'request-permissions',
        status: 'error',
      })

      return toSyncResult(fallbackState)
    } finally {
      setIsSyncing(false)
    }
  }, [replaceState, syncFromPermissionStatus])

  useEffect(() => {
    if (!pushNotificationsEnabled) {
      return
    }

    recordDiagnosticEvent({
      details: describePushState(state),
      domain: 'push',
      operation: 'push-state',
      phase: 'register',
      status: 'info',
    })
  }, [pushNotificationsEnabled, state])

  const value = useMemo<PushNotificationsContextValue>(
    () => ({
      ...state,
      isSyncing,
      latestForegroundNotification,
      requestPushPermissionAndToken,
      syncExistingPushPermissionAndToken,
      updateLatestForegroundNotification: setLatestForegroundNotification,
    }),
    [
      isSyncing,
      latestForegroundNotification,
      requestPushPermissionAndToken,
      state,
      syncExistingPushPermissionAndToken,
    ],
  )

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  )
}
