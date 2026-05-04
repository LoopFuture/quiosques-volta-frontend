import { useLocalSearchParams, useRouter } from 'expo-router'
import { Share } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Text, YStack } from 'tamagui'
import {
  PrimaryButton,
  QueryErrorState,
  SectionBlock,
  SkeletonBlock,
  StatusTimeline,
  SurfaceCard,
} from '@/components/ui'
import { useE2EForcedQueryError } from '@/features/app-data/e2e/hooks'
import {
  E2E_WALLET_MOVEMENT_STATE_NOT_FOUND,
  getSearchParamValue,
} from '@/features/app-data/e2e/search-params'
import { getE2ERuntimeConfig } from '@/features/app-data/e2e/runtime'
import { WalletDetailScreenFrame } from '../components/WalletDetailScreenFrame'
import { WalletMovementSummaryCard } from '../components/WalletMovementSummaryCard'
import { WalletReceiptCard } from '../components/WalletReceiptCard'
import { useWalletMovementDetailQuery } from '../hooks'
import { formatWalletAmount, getWalletMovementStateTone } from '../models'
import {
  getWalletMovementDetailItems,
  getWalletMovementReceiptShareMessage,
  getWalletMovementStateCopy,
  getWalletMovementTitle,
  getWalletTransferTimelineItems,
} from '../presentation'
import { profileRoutes } from '@/features/profile/routes'
import { walletRoutes } from '../routes'

function getMovementIdParam(
  movementIdParam: string | string[] | undefined,
): string | undefined {
  return Array.isArray(movementIdParam) ? movementIdParam[0] : movementIdParam
}

function WalletMovementDetailSkeleton() {
  return (
    <YStack gap="$4" testID="wallet-movement-detail-screen-skeleton">
      <SurfaceCard gap="$4" p="$4.5">
        <YStack gap="$2">
          <SkeletonBlock height={14} width="34%" />
          <SkeletonBlock height={28} width="42%" />
          <SkeletonBlock height={20} width="58%" />
          <SkeletonBlock height={14} width="76%" />
        </YStack>
        {Array.from({ length: 3 }).map((_, index) => (
          <YStack key={`wallet-detail-skeleton-${index}`} gap="$2">
            <SkeletonBlock height={12} width="34%" />
            <SkeletonBlock height={18} width="64%" />
          </YStack>
        ))}
      </SurfaceCard>
      <SurfaceCard gap="$3">
        <SkeletonBlock height={18} width="42%" />
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock
            key={`wallet-timeline-skeleton-${index}`}
            height={44}
            width="100%"
          />
        ))}
      </SurfaceCard>
    </YStack>
  )
}

function WalletMovementNotFoundState({
  description,
  onHistoryPress,
  t,
}: {
  description: string
  onHistoryPress: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <SurfaceCard items="center" p="$5">
      <YStack gap="$3" items="center">
        <Text color="$color11" fontSize={14} style={{ textAlign: 'center' }}>
          {description}
        </Text>
        <PrimaryButton
          emphasis="outline"
          fullWidth={false}
          tone="neutral"
          onPress={onHistoryPress}
          testID="wallet-movement-not-found-history-button"
        >
          {t('tabScreens.wallet.overview.latestMovements.actionLabel')}
        </PrimaryButton>
      </YStack>
    </SurfaceCard>
  )
}

export default function WalletMovementDetailScreen() {
  const router = useRouter()
  const { clearForcedQueryError, isForcedQueryError } = useE2EForcedQueryError()
  const { i18n, t } = useTranslation()
  const { __e2eMovementState, movementId } = useLocalSearchParams<{
    __e2eMovementState?: string | string[]
    movementId?: string | string[]
  }>()
  const resolvedMovementId = getMovementIdParam(movementId)
  const {
    data: walletMovementDetailState,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useWalletMovementDetailQuery(resolvedMovementId)
  const movement = walletMovementDetailState?.transaction ?? null
  const isForcedNotFound =
    getE2ERuntimeConfig().enabled &&
    getSearchParamValue(__e2eMovementState) ===
      E2E_WALLET_MOVEMENT_STATE_NOT_FOUND

  const handleRefresh = () => {
    if (isForcedQueryError) {
      clearForcedQueryError()
      return
    }

    void refetch()
  }

  const handleOpenHistory = () => {
    router.replace(walletRoutes.movements)
  }

  if (isForcedNotFound || !resolvedMovementId) {
    return (
      <WalletDetailScreenFrame
        description=""
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-not-found-screen"
        title={t('tabScreens.wallet.common.notFoundTitle')}
      >
        <WalletMovementNotFoundState
          description={t('tabScreens.wallet.common.notFoundDescription')}
          onHistoryPress={handleOpenHistory}
          t={t}
        />
      </WalletDetailScreenFrame>
    )
  }

  if (isPending) {
    return (
      <WalletDetailScreenFrame
        description={t('tabScreens.wallet.movementDetail.loadingDescription')}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-detail-screen"
        title={t('tabScreens.wallet.movementDetail.loadingTitle')}
      >
        <WalletMovementDetailSkeleton />
      </WalletDetailScreenFrame>
    )
  }

  if (isForcedQueryError || (isError && !movement)) {
    return (
      <WalletDetailScreenFrame
        description=""
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-detail-screen"
        title={t('tabScreens.wallet.movementDetail.errorTitle')}
      >
        <QueryErrorState
          description={t('tabScreens.wallet.movementDetail.errorDescription')}
          onRetry={handleRefresh}
          recoveryHint={t('tabScreens.wallet.movementDetail.errorRecoveryHint')}
          testID="wallet-movement-detail-screen-error-state"
          title={t('tabScreens.wallet.movementDetail.errorTitle')}
        />
      </WalletDetailScreenFrame>
    )
  }

  if (!movement) {
    return (
      <WalletDetailScreenFrame
        description=""
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-not-found-screen"
        title={t('tabScreens.wallet.common.notFoundTitle')}
      >
        <WalletMovementNotFoundState
          description={t('tabScreens.wallet.common.notFoundDescription')}
          onHistoryPress={handleOpenHistory}
          t={t}
        />
      </WalletDetailScreenFrame>
    )
  }

  const detailCopy = getWalletMovementStateCopy(t, movement)
  const detailItems = getWalletMovementDetailItems(t, i18n.language, movement)
  const isProcessingTransfer =
    movement.type === 'transfer_debit' &&
    (movement.status === 'pending' || movement.status === 'processing')
  const isFailedTransfer =
    movement.type === 'transfer_debit' && movement.status === 'failed'
  const isCancelledTransfer =
    movement.type === 'transfer_debit' && movement.status === 'cancelled'
  const isCompletedTransfer =
    movement.type === 'transfer_debit' && movement.status === 'completed'
  const failureReason = movement.transferDetails?.failureReason?.trim()

  const handleShareReceipt = async () => {
    await Share.share({
      message: getWalletMovementReceiptShareMessage(t, i18n.language, movement),
      title: t(
        'tabScreens.wallet.movementDetail.transfer.completed.receiptActionLabel',
      ),
    })
  }

  return (
    <WalletDetailScreenFrame
      description=""
      footer={
        isFailedTransfer ? (
          <PrimaryButton onPress={() => router.push(profileRoutes.payments)}>
            {t('tabScreens.wallet.transfer.reviewDestinationActionLabel')}
          </PrimaryButton>
        ) : isCancelledTransfer ? (
          <PrimaryButton onPress={() => router.push(walletRoutes.transfer)}>
            {t('tabScreens.wallet.transfer.newTransferActionLabel')}
          </PrimaryButton>
        ) : undefined
      }
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      testID="wallet-movement-detail-screen"
      title={getWalletMovementTitle(t, movement)}
    >
      <WalletMovementSummaryCard
        amount={formatWalletAmount(movement.amount.amountMinor, i18n.language)}
        description={detailCopy.description}
        status={movement.status}
        title={detailCopy.stateCardTitle}
        tone={getWalletMovementStateTone(movement)}
      />

      <WalletReceiptCard
        footer={
          isCompletedTransfer ? (
            <PrimaryButton
              emphasis="outline"
              fullWidth={false}
              tone="neutral"
              onPress={() => {
                void handleShareReceipt()
              }}
            >
              {t(
                'tabScreens.wallet.movementDetail.transfer.completed.receiptActionLabel',
              )}
            </PrimaryButton>
          ) : undefined
        }
        items={detailItems}
        testID="wallet-movement-detail-receipt-card"
        title={t('tabScreens.wallet.movementDetail.detailSectionTitle')}
      />

      {isFailedTransfer ? (
        <SurfaceCard gap="$2.5" p="$4.5" tone="error">
          <Text accessibilityRole="header" fontSize={18} fontWeight="800">
            {t('tabScreens.wallet.movementDetail.transfer.failed.reasonTitle')}
          </Text>
          <Text color="$color11" fontSize={15} lineHeight={22}>
            {failureReason ??
              t(
                'tabScreens.wallet.movementDetail.transfer.failed.reasonFallback',
              )}
          </Text>
        </SurfaceCard>
      ) : null}

      {isProcessingTransfer ? (
        <SectionBlock
          description={t(
            'tabScreens.wallet.movementDetail.transfer.processing.footer',
          )}
          title={t(
            'tabScreens.wallet.movementDetail.transfer.processing.timelineTitle',
          )}
        >
          <StatusTimeline items={getWalletTransferTimelineItems(t, movement)} />
        </SectionBlock>
      ) : null}
    </WalletDetailScreenFrame>
  )
}
