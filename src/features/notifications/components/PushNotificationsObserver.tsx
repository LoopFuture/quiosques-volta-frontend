import { useEffect, useEffectEvent, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { recordDiagnosticEvent } from '@/features/app-data/monitoring'
import { homeRoutes } from '@/features/home/routes'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { parseNotificationRouteUrl } from '../models/runtime'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function getResponseKey(response: Notifications.NotificationResponse) {
  return `${response.notification.request.identifier}:${response.actionIdentifier}`
}

export function PushNotificationsObserver() {
  const router = useRouter()
  const {
    syncExistingPushPermissionAndToken,
    updateLatestForegroundNotification,
  } = usePushNotifications()
  const lastHandledResponseKeyRef = useRef<string | null>(null)
  const handleNotificationResponse = useEffectEvent(
    (response: Notifications.NotificationResponse) => {
      if (
        response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      ) {
        recordDiagnosticEvent({
          details: {
            actionIdentifier: response.actionIdentifier,
            notificationId: response.notification.request.identifier,
            reason: 'non-default-action',
          },
          domain: 'push',
          operation: 'notification-response',
          phase: 'route',
          status: 'info',
        })
        return
      }

      const responseKey = getResponseKey(response)

      if (lastHandledResponseKeyRef.current === responseKey) {
        return
      }

      lastHandledResponseKeyRef.current = responseKey

      const rawRoute = response.notification.request.content.data?.url
      const parsedRoute = parseNotificationRouteUrl(rawRoute)
      const nextRoute = parsedRoute ?? homeRoutes.index

      recordDiagnosticEvent({
        details: {
          actionIdentifier: response.actionIdentifier,
          hasUrl: typeof rawRoute === 'string' && rawRoute.trim().length > 0,
          notificationId: response.notification.request.identifier,
          resolvedRoute: nextRoute,
          usedFallbackRoute: !parsedRoute,
        },
        domain: 'push',
        operation: 'notification-response',
        phase: 'route',
        status: parsedRoute ? 'success' : 'info',
      })

      router.push(nextRoute)
      Notifications.clearLastNotificationResponseAsync().catch((error) => {
        recordDiagnosticEvent({
          captureError: true,
          details: {
            notificationId: response.notification.request.identifier,
          },
          domain: 'push',
          error,
          operation: 'notification-response',
          phase: 'clear-last-response',
          status: 'error',
        })

        // Ignore cleanup failures so navigation still completes.
      })
    },
  )

  useEffect(() => {
    void syncExistingPushPermissionAndToken()
  }, [syncExistingPushPermissionAndToken])

  useEffect(() => {
    void (async () => {
      try {
        const lastNotificationResponse =
          await Notifications.getLastNotificationResponseAsync()

        if (lastNotificationResponse) {
          handleNotificationResponse(lastNotificationResponse)
        }
      } catch (error) {
        recordDiagnosticEvent({
          captureError: true,
          domain: 'push',
          error,
          operation: 'notification-response',
          phase: 'read-last-response',
          status: 'error',
        })
      }
    })()

    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        recordDiagnosticEvent({
          details: {
            hasUrl:
              typeof notification.request.content.data?.url === 'string' &&
              notification.request.content.data.url.trim().length > 0,
            notificationId: notification.request.identifier,
          },
          domain: 'push',
          operation: 'notification-received',
          phase: 'foreground',
          status: 'info',
        })
        updateLatestForegroundNotification(notification)
      })
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response)
      })

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }, [handleNotificationResponse, updateLatestForegroundNotification])

  return null
}
