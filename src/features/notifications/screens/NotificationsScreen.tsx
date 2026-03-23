import { useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useRouter, type Href } from 'expo-router'
import { RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Spinner, Text, XStack, YStack, useTheme } from 'tamagui'
import {
  PrimaryButton,
  ScreenContainer,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { StackTopBar } from '@/features/app-shell/navigation/tab-header'
import { NotificationListItem } from '../components/NotificationListItem'
import {
  useClearNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../hooks'
import {
  getNotificationDestination,
  getNotificationDisplayCopy,
} from '../presentation'

function NotificationSeparator() {
  return <YStack height={12} />
}

function NotificationListFooter({
  color,
  visible,
}: {
  color: string
  visible: boolean
}) {
  if (!visible) {
    return null
  }

  return (
    <YStack items="center" py="$3">
      <Spinner color={color} size="small" />
    </YStack>
  )
}

function NotificationsScreenSkeleton() {
  return (
    <YStack gap="$3" testID="notifications-screen-skeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <SurfaceCard key={`notification-skeleton-${index}`} p="$4">
          <YStack gap="$2">
            <SkeletonBlock height={18} width="44%" />
            <SkeletonBlock height={14} width="86%" />
            <SkeletonBlock height={12} width="24%" />
          </YStack>
        </SurfaceCard>
      ))}
    </YStack>
  )
}

function NotificationsStatePanel({
  actionLabel,
  description,
  onAction,
  testID,
  title,
  tone = 'neutral',
}: {
  actionLabel?: string
  description: string
  onAction?: () => void
  testID?: string
  title: string
  tone?: 'error' | 'neutral'
}) {
  return (
    <YStack
      flex={1}
      items="center"
      justify="center"
      px="$4"
      py="$8"
      testID={testID}
    >
      <YStack gap="$3" items="center" style={{ maxWidth: 320, width: '100%' }}>
        <StatusBadge tone={tone}>{title}</StatusBadge>
        <Text fontSize={18} fontWeight="800" style={{ textAlign: 'center' }}>
          {description}
        </Text>
        {actionLabel && onAction ? (
          <PrimaryButton
            emphasis="outline"
            fullWidth={false}
            tone={tone}
            onPress={onAction}
          >
            {actionLabel}
          </PrimaryButton>
        ) : null}
      </YStack>
    </YStack>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const theme = useTheme()
  const { showError, showSuccess } = useActionToast()
  const {
    data: notificationsState,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
    isRefetching,
    refetch,
  } = useNotificationsQuery()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const clearNotificationsMutation = useClearNotificationsMutation()
  const markAllNotificationsReadMutation = useMarkAllNotificationsReadMutation()
  const markNotificationReadMutation = useMarkNotificationReadMutation()
  const visibleNotifications =
    notificationsState?.pages.flatMap((page) => page.items) ?? []
  const unreadCount = notificationsState?.pages[0]?.unreadCount ?? 0
  const hasItems = visibleNotifications.length > 0
  const hasUnread = unreadCount > 0
  const isListRefreshing = isRefreshing || (isRefetching && !isFetchingNextPage)
  const shouldShowErrorState = isError && !notificationsState

  const markAllAsRead = () => {
    markAllNotificationsReadMutation.mutate(undefined, {
      onError: () => {
        showError(
          t('routes.notifications.markAllReadLabel'),
          t('routes.notifications.markAllReadErrorToast'),
        )
      },
      onSuccess: () => {
        showSuccess(
          t('routes.notifications.markAllReadLabel'),
          t('routes.notifications.markAllReadSuccessToast'),
        )
      },
    })
  }

  const clearAll = () => {
    clearNotificationsMutation.mutate(undefined, {
      onError: () => {
        showError(
          t('routes.notifications.clearAllLabel'),
          t('routes.notifications.clearAllErrorToast'),
        )
      },
      onSuccess: () => {
        showSuccess(
          t('routes.notifications.clearAllLabel'),
          t('routes.notifications.clearAllSuccessToast'),
        )
      },
    })
  }

  const handleNotificationPress = (
    notificationId: string,
    destination?: Href,
  ) => {
    markNotificationReadMutation.mutate(notificationId)

    if (destination) {
      router.push(destination)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLoadMore = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return
    }

    void fetchNextPage()
  }

  return (
    <ScreenContainer
      bottomInset
      decorativeBackground={false}
      header={
        <StackTopBar
          backLabel={t('routes.notifications.backLabel')}
          onBackPress={() => router.back()}
          title={t('routes.notifications.title')}
        />
      }
      testID="notifications-screen"
    >
      <YStack flex={1} gap="$4">
        <Text color="$color11" fontSize={14}>
          {t('routes.notifications.description')}
        </Text>

        {shouldShowErrorState ? (
          <NotificationsStatePanel
            actionLabel={t('routes.queryError.retryLabel')}
            description={t('routes.notifications.errorDescription')}
            onAction={() => {
              void refetch()
            }}
            testID="notifications-screen-error-state"
            title={t('routes.notifications.errorTitle')}
            tone="error"
          />
        ) : (
          <>
            <YStack flex={1}>
              {isPending ? (
                <NotificationsScreenSkeleton />
              ) : (
                <YStack flex={1} gap="$3">
                  <YStack gap="$2">
                    <XStack gap="$3" items="center" justify="space-between">
                      <Text
                        color="$color"
                        flex={1}
                        fontSize={18}
                        fontWeight="800"
                      >
                        {t('routes.notifications.listTitle')}
                      </Text>
                      {hasUnread ? (
                        <StatusBadge tone="accent">
                          {t('routes.notifications.unreadCountBadge', {
                            count: unreadCount,
                          })}
                        </StatusBadge>
                      ) : null}
                    </XStack>
                    {!hasUnread ? (
                      <Text color="$color11" fontSize={15}>
                        {t('routes.notifications.listDescription')}
                      </Text>
                    ) : null}
                  </YStack>

                  <FlashList
                    contentContainerStyle={{ paddingBottom: 24 }}
                    data={visibleNotifications}
                    ItemSeparatorComponent={NotificationSeparator}
                    keyExtractor={(item) => item.id}
                    ListFooterComponent={
                      <NotificationListFooter
                        color={theme.accent10.val}
                        visible={isFetchingNextPage}
                      />
                    }
                    ListEmptyComponent={
                      <NotificationsStatePanel
                        description={t(
                          'routes.notifications.emptyStateDescription',
                        )}
                        title={t('routes.notifications.emptyStateTitle')}
                      />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    onRefresh={() => {
                      void handleRefresh()
                    }}
                    refreshControl={
                      <RefreshControl
                        onRefresh={() => {
                          void handleRefresh()
                        }}
                        refreshing={isListRefreshing}
                        tintColor={theme.accent10.val}
                      />
                    }
                    refreshing={isListRefreshing}
                    renderItem={({ item }) => {
                      const copy = getNotificationDisplayCopy(
                        t,
                        i18n.language,
                        item,
                      )

                      return (
                        <NotificationListItem
                          message={copy.message}
                          read={item.read}
                          readA11yLabel={t(
                            'routes.notifications.readA11yLabel',
                          )}
                          timeLabel={copy.timeLabel}
                          title={copy.title}
                          unreadA11yLabel={t(
                            'routes.notifications.unreadA11yLabel',
                          )}
                          unreadBadgeLabel={t(
                            'routes.notifications.unreadBadgeLabel',
                          )}
                          onPress={() =>
                            handleNotificationPress(
                              item.id,
                              getNotificationDestination(item),
                            )
                          }
                        />
                      )
                    }}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    testID="notifications-list"
                  />

                  {hasItems ? (
                    <YStack gap="$3">
                      <Text color="$color10" fontSize={14} fontWeight="700">
                        {t('routes.notifications.manageTitle')}
                      </Text>
                      <YStack gap="$2">
                        <XStack gap="$2">
                          <PrimaryButton
                            disabled={
                              !hasUnread ||
                              markAllNotificationsReadMutation.isPending
                            }
                            emphasis="outline"
                            flex={1}
                            isPending={
                              markAllNotificationsReadMutation.isPending
                            }
                            tone="neutral"
                            onPress={markAllAsRead}
                          >
                            {t('routes.notifications.markAllReadLabel')}
                          </PrimaryButton>
                          <PrimaryButton
                            disabled={
                              !hasItems || clearNotificationsMutation.isPending
                            }
                            emphasis="outline"
                            flex={1}
                            isPending={clearNotificationsMutation.isPending}
                            tone="neutral"
                            onPress={clearAll}
                          >
                            {t('routes.notifications.clearAllLabel')}
                          </PrimaryButton>
                        </XStack>
                      </YStack>
                    </YStack>
                  ) : null}
                </YStack>
              )}
            </YStack>
          </>
        )}
      </YStack>
    </ScreenContainer>
  )
}
