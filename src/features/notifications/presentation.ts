import type { Href } from 'expo-router'
import type { TFunction } from 'i18next'
import { formatShortDateTime } from '@/i18n/format'
import { walletRoutes } from '@/features/wallet/routes'
import type { Notification } from './models'

export function getNotificationDisplayCopy(
  _t: TFunction,
  locale: string,
  notification: Notification,
) {
  return {
    message: notification.body,
    timeLabel: formatShortDateTime(notification.createdAt, locale),
    title: notification.title,
  }
}

export function getNotificationDestination(
  notification: Notification,
): Href | undefined {
  if (
    (notification.type === 'transfer' || notification.type === 'wallet') &&
    notification.relatedResourceId
  ) {
    return walletRoutes.movementDetail(notification.relatedResourceId)
  }

  if (notification.type === 'wallet') {
    return walletRoutes.movements
  }

  return undefined
}
