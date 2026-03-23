import Constants from 'expo-constants'
import type { Href } from 'expo-router'
import type { NotificationPermissionsStatus } from 'expo-notifications'
import { z } from 'zod/v4'

export const PUSH_NOTIFICATIONS_DEFAULT_CHANNEL_ID = 'default'

export type PushNotificationsPermissionStatus =
  NotificationPermissionsStatus['status']

export type PushNotificationsRegistrationErrorCode =
  | 'device-required'
  | 'missing-project-id'
  | 'token-registration-failed'

export type PushNotificationsState = {
  canAskAgain: boolean
  expoPushToken: string | null
  isPhysicalDevice: boolean
  permissionStatus: PushNotificationsPermissionStatus
  registrationErrorCode: PushNotificationsRegistrationErrorCode | null
}

type PushNotificationsRuntimeConfig = {
  projectId: string
}

const pushNotificationsRuntimeConfigSchema = z.object({
  projectId: z.string().min(1),
})

let cachedPushNotificationsRuntimeConfig: PushNotificationsRuntimeConfig | null =
  null

export function getPushNotificationsRuntimeConfig() {
  if (cachedPushNotificationsRuntimeConfig) {
    return cachedPushNotificationsRuntimeConfig
  }

  const result = pushNotificationsRuntimeConfigSchema.safeParse(
    Constants.expoConfig?.extra?.eas,
  )

  if (!result.success) {
    throw new Error(
      'Missing or invalid Expo notifications runtime config. Define extra.eas.projectId in app config.',
    )
  }

  cachedPushNotificationsRuntimeConfig = result.data

  return cachedPushNotificationsRuntimeConfig
}

export function resetPushNotificationsRuntimeConfigForTests() {
  cachedPushNotificationsRuntimeConfig = null
}

export function parseNotificationRouteUrl(value: unknown): Href | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  if (
    normalizedValue.length === 0 ||
    !normalizedValue.startsWith('/') ||
    normalizedValue.startsWith('//') ||
    normalizedValue.includes('://')
  ) {
    return null
  }

  return normalizedValue as Href
}
