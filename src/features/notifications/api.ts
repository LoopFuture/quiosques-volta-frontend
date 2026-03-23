import { request } from '@/features/app-data/api'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import {
  clearNotificationsResponseSchema,
  markNotificationsReadResponseSchema,
  notificationListResponseSchema,
  pushInstallationResponseSchema,
  upsertPushInstallationRequestSchema,
  type ClearNotificationsResponse,
  type MarkNotificationsReadResponse,
  type NotificationListResponse,
  type PushInstallationResponse,
  type UpsertPushInstallationRequest,
} from './models'
import {
  readPushInstallationId,
  writePushInstallationId,
} from '@/features/app-data/storage/device/push'
import * as Crypto from 'expo-crypto'

const NOTIFICATIONS_PAGE_SIZE = 20

type FetchNotificationsStateOptions = {
  cursor?: string
  pageSize?: number
  signal?: AbortSignal
}

export async function fetchNotificationsState({
  cursor,
  pageSize = NOTIFICATIONS_PAGE_SIZE,
  signal,
}: FetchNotificationsStateOptions = {}) {
  return notificationListResponseSchema.parse(
    await request<NotificationListResponse>({
      meta: {
        feature: 'notifications',
        operation: 'notifications-feed',
      },
      method: 'GET',
      path: '/notifications',
      query: {
        cursor,
        pageSize,
        status: 'all',
      },
      signal,
    }),
  )
}

export async function markNotificationRead(notificationId: string) {
  return markNotificationsReadResponseSchema.parse(
    await request<MarkNotificationsReadResponse, { ids: string[] }>({
      body: {
        ids: [notificationId],
      },
      meta: {
        feature: 'notifications',
        operation: 'mark-read',
      },
      method: 'POST',
      path: '/notifications/read',
    }),
  )
}

export async function markAllNotificationsRead() {
  return markNotificationsReadResponseSchema.parse(
    await request<MarkNotificationsReadResponse, { markAll: true }>({
      body: {
        markAll: true,
      },
      meta: {
        feature: 'notifications',
        operation: 'mark-all-read',
      },
      method: 'POST',
      path: '/notifications/read',
    }),
  )
}

export async function clearNotifications() {
  return clearNotificationsResponseSchema.parse(
    await request<ClearNotificationsResponse>({
      meta: {
        feature: 'notifications',
        operation: 'clear-all',
      },
      method: 'DELETE',
      path: '/notifications',
    }),
  )
}

export function getOrCreatePushInstallationId() {
  const existingInstallationId = readPushInstallationId()

  if (existingInstallationId) {
    return existingInstallationId
  }

  const nextInstallationId = Crypto.randomUUID()
  writePushInstallationId(nextInstallationId)

  return nextInstallationId
}

export function createPushInstallationRequest(token: string) {
  return upsertPushInstallationRequestSchema.parse({
    appVersion: Constants.expoConfig?.version ?? null,
    buildNumber:
      Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode?.toString() ??
      null,
    deviceModel: Device.modelName ?? null,
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    provider: 'expo',
    token,
  } satisfies UpsertPushInstallationRequest)
}

export async function registerPushInstallation({
  installationId,
  requestBody,
}: {
  installationId: string
  requestBody: UpsertPushInstallationRequest
}) {
  return pushInstallationResponseSchema.parse(
    await request<PushInstallationResponse, UpsertPushInstallationRequest>({
      body: requestBody,
      meta: {
        feature: 'notifications',
        operation: 'register-push-installation',
        redactKeys: ['token'],
      },
      method: 'PUT',
      path: `/push/installations/${encodeURIComponent(installationId)}`,
    }),
  )
}

export async function unregisterPushInstallation(installationId: string) {
  await request<void>({
    meta: {
      feature: 'notifications',
      operation: 'delete-push-installation',
    },
    method: 'DELETE',
    path: `/push/installations/${encodeURIComponent(installationId)}`,
  })
}
