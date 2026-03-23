import { useContext } from 'react'
import { PushNotificationsContext } from '../components/PushNotificationsProvider'

export function usePushNotifications() {
  const value = useContext(PushNotificationsContext)

  if (!value) {
    throw new Error(
      'usePushNotifications must be used within PushNotificationsProvider',
    )
  }

  return value
}
