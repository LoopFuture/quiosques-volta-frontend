import { useMemo, useRef, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import type { FlashListRef } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Spinner, Text, XStack, YStack, useTheme } from 'tamagui'
import {
  PrimaryButton,
  QueryErrorState,
  ScreenContainer,
  SegmentedTabs,
  SkeletonBlock,
  SurfaceCard,
  TransactionListItem,
} from '@/components/ui'
import { StackTopBar } from '@/features/app-shell/navigation/tab-header'
import { WalletMovementIcon } from '../components/WalletMovementIcon'
import { useWalletHistoryQuery } from '../hooks'
import {
  formatWalletAmount,
  getWalletTransactionAmountTone,
  getWalletTransactionBadgeTone,
  type WalletHistoryFilter,
  type WalletTransaction,
} from '../models'
import {
  getWalletHistoryFilterOptions,
  getWalletMovementAccessibilityHint,
  getWalletMovementAccessibilityLabel,
  getWalletMovementBadgeLabel,
  getWalletMovementDateHeading,
  getWalletMovementSubtitle,
  getWalletMovementTitle,
  matchesWalletHistoryFilter,
} from '../presentation'
import { walletRoutes } from '../routes'

function isSameMovementDay(left: WalletTransaction, right: WalletTransaction) {
  const leftDate = new Date(left.occurredAt)
  const rightDate = new Date(right.occurredAt)

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  )
}

function WalletMovementsFooter({
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

function WalletMovementsSkeleton() {
  return (
    <YStack gap="$3" testID="wallet-movements-screen-skeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <SurfaceCard key={`wallet-movement-skeleton-${index}`} p="$3.5">
          <XStack gap="$3" items="center">
            <SkeletonBlock height={48} rounded={24} width={48} />
            <YStack flex={1} gap="$2">
              <SkeletonBlock height={16} width="50%" />
              <SkeletonBlock height={12} width="70%" />
            </YStack>
            <YStack gap="$2" items="flex-end">
              <SkeletonBlock height={18} width={62} />
              <SkeletonBlock height={24} rounded={999} width={80} />
            </YStack>
          </XStack>
        </SurfaceCard>
      ))}
    </YStack>
  )
}

export default function WalletMovementsScreen() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const theme = useTheme()
  const movementListRef = useRef<FlashListRef<WalletTransaction>>(null)
  const walletHistoryFilters = getWalletHistoryFilterOptions(t)
  const {
    data: walletHistoryState,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
    isRefetching,
    refetch,
  } = useWalletHistoryQuery()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<WalletHistoryFilter>(
    walletHistoryFilters[0]?.value ?? 'all',
  )
  const allHistory = useMemo(
    () => walletHistoryState?.pages.flatMap((page) => page.items) ?? [],
    [walletHistoryState],
  )
  const visibleHistory = useMemo(
    () =>
      historyFilter === 'all'
        ? allHistory
        : allHistory.filter((movement) =>
            matchesWalletHistoryFilter(historyFilter, movement),
          ),
    [allHistory, historyFilter],
  )
  const hasAnyHistory = allHistory.length > 0
  const isListRefreshing = isRefreshing || (isRefetching && !isFetchingNextPage)

  const handleHistoryFilterChange = (nextFilter: string) => {
    if (nextFilter === historyFilter) {
      return
    }

    movementListRef.current?.scrollToOffset({ animated: true, offset: 0 })
    setHistoryFilter(nextFilter as WalletHistoryFilter)
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
          backLabel={t('tabScreens.wallet.common.backLabel')}
          onBackPress={() => router.back()}
          title={t('tabScreens.wallet.movementsPage.title')}
        />
      }
      testID="wallet-movements-screen"
    >
      <YStack flex={1} gap="$3">
        <SegmentedTabs
          scrollable={false}
          options={walletHistoryFilters}
          value={historyFilter}
          onValueChange={handleHistoryFilterChange}
        />

        {isError && !walletHistoryState ? (
          <QueryErrorState
            onRetry={() => {
              void refetch()
            }}
            testID="wallet-movements-screen-error-state"
          />
        ) : isPending || !walletHistoryState ? (
          <WalletMovementsSkeleton />
        ) : (
          <FlashList
            contentContainerStyle={{ paddingBottom: 24 }}
            data={visibleHistory}
            keyExtractor={(entry) => entry.id}
            ListEmptyComponent={
              <SurfaceCard items="center" justify="center" p="$5">
                <YStack gap="$3" items="center">
                  <Text
                    fontSize={18}
                    fontWeight="800"
                    style={{ textAlign: 'center' }}
                  >
                    {hasAnyHistory
                      ? t(
                          'tabScreens.wallet.movementsPage.filteredEmptyStateTitle',
                        )
                      : t('tabScreens.wallet.movementsPage.emptyStateTitle')}
                  </Text>
                  <Text
                    color="$color11"
                    fontSize={14}
                    style={{ textAlign: 'center' }}
                  >
                    {hasAnyHistory
                      ? t(
                          'tabScreens.wallet.movementsPage.filteredEmptyStateDescription',
                        )
                      : t(
                          'tabScreens.wallet.movementsPage.emptyStateDescription',
                        )}
                  </Text>
                  {hasAnyHistory ? (
                    <PrimaryButton
                      emphasis="outline"
                      fullWidth={false}
                      onPress={() => handleHistoryFilterChange('all')}
                      tone="neutral"
                    >
                      {t(
                        'tabScreens.wallet.movementsPage.filteredEmptyStateAction',
                      )}
                    </PrimaryButton>
                  ) : null}
                </YStack>
              </SurfaceCard>
            }
            ListFooterComponent={
              <WalletMovementsFooter
                color={theme.accent10.val}
                visible={isFetchingNextPage}
              />
            }
            ref={movementListRef}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
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
            renderItem={({ item: movement, index }) => {
              const previousMovement =
                index > 0 ? visibleHistory[index - 1] : null
              const showDateHeading =
                !previousMovement ||
                !isSameMovementDay(previousMovement, movement)

              return (
                <YStack
                  gap="$2.5"
                  pb="$2.5"
                  pt={showDateHeading && index > 0 ? '$3' : '$0'}
                >
                  {showDateHeading ? (
                    <Text
                      accessibilityRole="header"
                      color="$color10"
                      fontSize={13}
                      fontWeight="800"
                    >
                      {getWalletMovementDateHeading(i18n.language, movement)}
                    </Text>
                  ) : null}

                  <TransactionListItem
                    accessibilityHint={getWalletMovementAccessibilityHint(t)}
                    accessibilityLabel={getWalletMovementAccessibilityLabel(
                      t,
                      i18n.language,
                      movement,
                    )}
                    amount={formatWalletAmount(
                      movement.amount.amountMinor,
                      i18n.language,
                    )}
                    amountTone={getWalletTransactionAmountTone(movement)}
                    badgeLabel={getWalletMovementBadgeLabel(t, movement)}
                    badgeTone={getWalletTransactionBadgeTone(movement)}
                    framed={false}
                    icon={<WalletMovementIcon type={movement.type} />}
                    onPress={() =>
                      router.push(walletRoutes.movementDetail(movement.id))
                    }
                    subtitle={getWalletMovementSubtitle(
                      i18n.language,
                      movement,
                    )}
                    testID={`wallet-movements-item-${index}`}
                    title={getWalletMovementTitle(t, movement)}
                  />
                </YStack>
              )
            }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            testID="wallet-movements-list"
          />
        )}
      </YStack>
    </ScreenContainer>
  )
}
