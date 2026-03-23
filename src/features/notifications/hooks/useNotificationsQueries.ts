import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { appMutationKeys, appQueryKeys } from '@/features/app-data/query'
import type { NotificationListResponse } from '../models'
import {
  clearNotifications,
  fetchNotificationsState,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api'

type NotificationsInfiniteData = InfiniteData<NotificationListResponse>

type NotificationQuerySnapshot = [
  readonly unknown[],
  NotificationsInfiniteData | undefined,
]

function updateCachedNotifications(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (
    notifications: NotificationsInfiniteData,
  ) => NotificationsInfiniteData,
) {
  queryClient.setQueriesData<NotificationsInfiniteData>(
    {
      queryKey: appQueryKeys.notifications.all,
    },
    (notifications) => {
      if (!notifications) {
        return notifications
      }

      return updater(notifications)
    },
  )
}

async function captureNotificationsSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await queryClient.cancelQueries({
    queryKey: appQueryKeys.notifications.all,
  })

  return {
    previousNotifications:
      queryClient.getQueriesData<NotificationsInfiniteData>({
        queryKey: appQueryKeys.notifications.all,
      }) as NotificationQuerySnapshot[],
  }
}

function restoreNotificationsSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  previousNotifications: NotificationQuerySnapshot[],
) {
  previousNotifications.forEach(([queryKey, notifications]) => {
    queryClient.setQueryData(queryKey, notifications)
  })
}

export function useNotificationsQuery() {
  return useInfiniteQuery<
    NotificationListResponse,
    Error,
    NotificationsInfiniteData,
    ReturnType<typeof appQueryKeys.notifications.feed>,
    string | undefined
  >({
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    meta: {
      feature: 'notifications',
      operation: 'notifications-feed',
    },
    queryFn: ({ pageParam, signal }) =>
      fetchNotificationsState({
        cursor: pageParam,
        signal,
      }),
    queryKey: appQueryKeys.notifications.feed(),
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: {
      feature: 'notifications',
      operation: 'mark-read',
    },
    mutationFn: markNotificationRead,
    mutationKey: appMutationKeys.notifications.markRead(),
    onMutate: async (notificationId) => {
      const context = await captureNotificationsSnapshot(queryClient)
      const didUnreadNotificationExist = context.previousNotifications.some(
        ([, notifications]) =>
          notifications?.pages.some((page) =>
            page.items.some(
              (notification) =>
                notification.id === notificationId && !notification.read,
            ),
          ) ?? false,
      )

      updateCachedNotifications(queryClient, (notifications) => ({
        ...notifications,
        pages: notifications.pages.map((page) => ({
          ...page,
          items: page.items.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification,
          ),
          unreadCount: Math.max(
            0,
            page.unreadCount - (didUnreadNotificationExist ? 1 : 0),
          ),
        })),
      }))

      return context
    },
    onError: (_error, _notificationId, context) => {
      if (!context) {
        return
      }

      restoreNotificationsSnapshot(queryClient, context.previousNotifications)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: appQueryKeys.notifications.all,
      })
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: {
      feature: 'notifications',
      operation: 'mark-all-read',
    },
    mutationFn: markAllNotificationsRead,
    mutationKey: appMutationKeys.notifications.markAllRead(),
    onMutate: async () => {
      const context = await captureNotificationsSnapshot(queryClient)

      updateCachedNotifications(queryClient, (notifications) => ({
        ...notifications,
        pages: notifications.pages.map((page) => ({
          ...page,
          items: page.items.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        })),
      }))

      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return
      }

      restoreNotificationsSnapshot(queryClient, context.previousNotifications)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: appQueryKeys.notifications.all,
      })
    },
  })
}

export function useClearNotificationsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: {
      feature: 'notifications',
      operation: 'clear-all',
    },
    mutationFn: clearNotifications,
    mutationKey: appMutationKeys.notifications.clearAll(),
    onMutate: async () => {
      const context = await captureNotificationsSnapshot(queryClient)

      updateCachedNotifications(queryClient, (notifications) => ({
        ...notifications,
        pages: notifications.pages.map((page) => ({
          ...page,
          items: [],
          pageInfo: {
            hasNextPage: false,
            nextCursor: null,
          },
          unreadCount: 0,
        })),
      }))

      return context
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return
      }

      restoreNotificationsSnapshot(queryClient, context.previousNotifications)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: appQueryKeys.notifications.all,
      })
    },
  })
}
