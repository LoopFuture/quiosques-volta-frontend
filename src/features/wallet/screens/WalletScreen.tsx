import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Text, XStack, YStack } from 'tamagui'
import {
  PrimaryButton,
  QueryErrorState,
  ScreenContainer,
  SectionBlock,
  SkeletonBlock,
  SurfaceCard,
  TransactionListItem,
} from '@/components/ui'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { WalletMovementIcon } from '../components/WalletMovementIcon'
import { useWalletOverviewQuery } from '../hooks'
import {
  formatWalletAmount,
  getWalletTransactionAmountTone,
  getWalletTransactionBadgeTone,
} from '../models'
import {
  getWalletMovementAccessibilityHint,
  getWalletMovementAccessibilityLabel,
  getWalletMovementBadgeLabel,
  getWalletMovementSubtitle,
  getWalletMovementTitle,
} from '../presentation'
import { walletRoutes } from '../routes'

function WalletBalanceHero({
  amount,
  canTransfer,
  caption,
  onTransferPress,
  t,
}: {
  amount: string
  canTransfer: boolean
  caption: string
  onTransferPress: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <SurfaceCard gap="$4.5" p="$5" tone="accent">
      <YStack gap="$2" style={{ minWidth: 0 }}>
        <Text
          color="$color10"
          fontSize={13}
          fontWeight="800"
          textTransform="uppercase"
        >
          {t('tabScreens.wallet.overview.balanceCard.availableBalanceLabel')}
        </Text>
        <Text color="$color" fontSize={24} fontWeight="800" lineHeight={30}>
          {t('tabScreens.wallet.overview.balanceCard.title')}
        </Text>
      </YStack>

      <YStack gap="$2">
        <Text
          adjustsFontSizeToFit
          color="$color"
          fontSize={48}
          fontWeight="900"
          minimumFontScale={0.82}
          numberOfLines={1}
        >
          {amount}
        </Text>
        <Text color="$color11" fontSize={15} lineHeight={22}>
          {caption}
        </Text>
      </YStack>

      <PrimaryButton onPress={onTransferPress}>
        {t('tabScreens.wallet.overview.balanceCard.actionLabel')}
      </PrimaryButton>
    </SurfaceCard>
  )
}

function WalletOverviewSummary({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <SurfaceCard gap="$3.5" p="$4.5">
      <YStack gap="$1.5">
        <Text fontSize={20} fontWeight="800">
          {title}
        </Text>
        <Text color="$color11" fontSize={14} lineHeight={21}>
          {description}
        </Text>
      </YStack>
    </SurfaceCard>
  )
}

function WalletScreenSkeleton() {
  return (
    <>
      <SurfaceCard gap="$4" p="$5" testID="wallet-screen-skeleton">
        <YStack gap="$2">
          <SkeletonBlock height={12} width="36%" />
          <SkeletonBlock height={24} width="52%" />
          <SkeletonBlock height={14} width="70%" />
        </YStack>
        <SkeletonBlock height={48} width="54%" />
        <SkeletonBlock height={50} rounded={999} width="100%" />
      </SurfaceCard>

      <SurfaceCard gap="$4">
        <YStack gap="$2">
          <SkeletonBlock height={22} width="44%" />
          <SkeletonBlock height={14} width="48%" />
        </YStack>
        <SurfaceCard gap="$0" p="$0">
          <YStack gap="$0">
            {Array.from({ length: 3 }).map((_, index) => (
              <XStack
                key={`wallet-overview-skeleton-${index}`}
                gap="$3"
                items="center"
                px="$3.5"
                py="$3"
              >
                <SkeletonBlock height={48} rounded={24} width={48} />
                <YStack flex={1} gap="$2">
                  <SkeletonBlock height={16} width="54%" />
                  <SkeletonBlock height={12} width="72%" />
                </YStack>
                <YStack items="flex-end" gap="$2">
                  <SkeletonBlock height={18} width={60} />
                  <SkeletonBlock height={24} rounded={999} width={78} />
                </YStack>
              </XStack>
            ))}
          </YStack>
        </SurfaceCard>
      </SurfaceCard>
    </>
  )
}

export default function WalletScreen() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const {
    data: walletOverviewState,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useWalletOverviewQuery()

  const handleRefresh = () => {
    void refetch()
  }

  return (
    <ScreenContainer
      decorativeBackground={false}
      header={<TabTopBar routeName="wallet" />}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      scrollable
      testID="wallet-screen"
    >
      {isError && !walletOverviewState ? (
        <QueryErrorState
          onRetry={handleRefresh}
          testID="wallet-screen-error-state"
        />
      ) : !walletOverviewState || isPending ? (
        <WalletScreenSkeleton />
      ) : (
        <>
          <WalletBalanceHero
            amount={formatWalletAmount(
              walletOverviewState.balance.amountMinor,
              i18n.language,
            )}
            caption={t(
              walletOverviewState.transferEligibility.canTransfer
                ? 'tabScreens.wallet.overview.balanceCard.caption'
                : 'tabScreens.wallet.overview.balanceCard.noBalanceCaption',
            )}
            canTransfer={walletOverviewState.transferEligibility.canTransfer}
            onTransferPress={() => router.push(walletRoutes.transfer)}
            t={t}
          />

          <SectionBlock
            action={
              walletOverviewState.recentTransactions.length > 0 ? (
                <PrimaryButton
                  emphasis="outline"
                  fullWidth={false}
                  tone="neutral"
                  onPress={() => router.push(walletRoutes.movements)}
                >
                  {t('tabScreens.wallet.overview.latestMovements.actionLabel')}
                </PrimaryButton>
              ) : null
            }
            title={t('tabScreens.wallet.overview.latestMovements.title')}
          >
            {walletOverviewState.recentTransactions.length > 0 ? (
              <YStack gap={10}>
                {walletOverviewState.recentTransactions.map((movement) => (
                  <TransactionListItem
                    key={movement.id}
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
                    badgeLabel={
                      movement.status === 'pending' ||
                      movement.status === 'processing'
                        ? getWalletMovementBadgeLabel(t, movement)
                        : undefined
                    }
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
                    title={getWalletMovementTitle(t, movement)}
                  />
                ))}
              </YStack>
            ) : (
              <WalletOverviewSummary
                description={t(
                  walletOverviewState.transferEligibility.canTransfer
                    ? 'tabScreens.wallet.overview.latestMovements.emptyDescription'
                    : 'tabScreens.wallet.overview.latestMovements.emptyNoBalanceDescription',
                )}
                title={t(
                  'tabScreens.wallet.overview.latestMovements.emptyTitle',
                )}
              />
            )}
          </SectionBlock>
        </>
      )}
    </ScreenContainer>
  )
}
