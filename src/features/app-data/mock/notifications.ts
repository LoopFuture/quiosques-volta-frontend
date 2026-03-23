import type {
  MarkNotificationsReadRequest,
  UpsertPushInstallationRequest,
} from '@/features/notifications/models'
import { waitForMockApi } from './delay'
import {
  clearNotifications,
  deletePushInstallation,
  markNotificationsRead,
  readNotifications,
  upsertPushInstallation,
} from './state'

type MockNotificationsOptions = {
  cursor?: string
  pageSize?: number
}

export async function getMockNotificationsState(
  options?: MockNotificationsOptions,
) {
  await waitForMockApi()

  return readNotifications(options)
}

export async function markMockNotificationsRead(
  request: MarkNotificationsReadRequest,
) {
  await waitForMockApi()

  return markNotificationsRead(request)
}

export async function clearMockNotifications() {
  await waitForMockApi()

  return clearNotifications()
}

export async function upsertMockPushInstallation({
  installationId,
  request,
}: {
  installationId: string
  request: UpsertPushInstallationRequest
}) {
  await waitForMockApi()

  return upsertPushInstallation({
    installationId,
    request,
  })
}

export async function deleteMockPushInstallation(installationId: string) {
  await waitForMockApi()

  deletePushInstallation(installationId)
}
