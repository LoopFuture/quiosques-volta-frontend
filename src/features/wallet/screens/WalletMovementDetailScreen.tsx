import { useLocalSearchParams, useRouter } from 'expo-router'
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
import { useMockActionFeedback } from '@/features/app-shell/hooks/useMockActionFeedback'
import { WalletDetailScreenFrame } from '../components/WalletDetailScreenFrame'
import { WalletMovementSummaryCard } from '../components/WalletMovementSummaryCard'
import { WalletReceiptCard } from '../components/WalletReceiptCard'
import { useWalletMovementDetailQuery } from '../hooks'
import { formatWalletAmount, getWalletMovementStateTone } from '../models'
import {
  getWalletMovementSummaryItems,
  getWalletMovementStateCopy,
  getWalletMovementTitle,
  getWalletTransferTimelineItems,
} from '../presentation'
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

export default function WalletMovementDetailScreen() {
  const router = useRouter()
  const showMockAction = useMockActionFeedback()
  const { i18n, t } = useTranslation()
  const { movementId } = useLocalSearchParams<{
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

  const handleRefresh = () => {
    void refetch()
  }

  if (!resolvedMovementId) {
    return (
      <WalletDetailScreenFrame
        description={t('tabScreens.wallet.common.notFoundDescription')}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-not-found-screen"
        title={t('tabScreens.wallet.common.notFoundTitle')}
      >
        <Text color="$color11" fontSize={14}>
          {t('tabScreens.wallet.common.notFoundDescription')}
        </Text>
      </WalletDetailScreenFrame>
    )
  }

  if (isPending) {
    return (
      <WalletDetailScreenFrame
        description={t('tabScreens.wallet.movementsPage.emptyStateDescription')}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-detail-screen"
        title=""
      >
        <WalletMovementDetailSkeleton />
      </WalletDetailScreenFrame>
    )
  }

  if (isError && !movement) {
    return (
      <WalletDetailScreenFrame
        description={t('tabScreens.wallet.movementsPage.emptyStateDescription')}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-detail-screen"
        title={t('tabScreens.wallet.movementsPage.title')}
      >
        <QueryErrorState
          onRetry={handleRefresh}
          testID="wallet-movement-detail-screen-error-state"
        />
      </WalletDetailScreenFrame>
    )
  }

  if (!movement) {
    return (
      <WalletDetailScreenFrame
        description={t('tabScreens.wallet.common.notFoundDescription')}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
        testID="wallet-movement-not-found-screen"
        title={t('tabScreens.wallet.common.notFoundTitle')}
      >
        <Text color="$color11" fontSize={14}>
          {t('tabScreens.wallet.common.notFoundDescription')}
        </Text>
      </WalletDetailScreenFrame>
    )
  }

  const detailCopy = getWalletMovementStateCopy(t, movement)
  const summaryItems = getWalletMovementSummaryItems(t, i18n.language, movement)
  const isProcessingTransfer =
    movement.type === 'transfer_debit' &&
    (movement.status === 'pending' || movement.status === 'processing')
  const isRetryableTransfer =
    movement.type === 'transfer_debit' &&
    (movement.status === 'failed' || movement.status === 'cancelled')

  return (
    <WalletDetailScreenFrame
      description=""
      footer={
        movement.type === 'transfer_debit' &&
        movement.status === 'completed' ? (
          <PrimaryButton
            onPress={() =>
              showMockAction(
                t(
                  'tabScreens.wallet.movementDetail.transfer.completed.receiptActionLabel',
                ),
              )
            }
          >
            {t(
              'tabScreens.wallet.movementDetail.transfer.completed.receiptActionLabel',
            )}
          </PrimaryButton>
        ) : isRetryableTransfer ? (
          <PrimaryButton onPress={() => router.push(walletRoutes.transfer)}>
            {t('tabScreens.wallet.movementDetail.transfer.retryActionLabel')}
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
        stateLabel={detailCopy.stateLabel}
        status={movement.status}
        title={detailCopy.stateCardTitle}
        tone={getWalletMovementStateTone(movement)}
      />

      <WalletReceiptCard
        items={summaryItems}
        testID="wallet-movement-detail-receipt-card"
        title={t('tabScreens.wallet.movementDetail.detailSectionTitle')}
      />

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
