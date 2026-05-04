import { useEffect, useRef } from 'react'
import { BackHandler, Platform, useWindowDimensions } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Clock3 } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { Text, XStack, YStack } from 'tamagui'
import {
  BalanceCard,
  PrimaryButton,
  QueryErrorState,
  ScreenContainer,
  SectionBlock,
  SkeletonBlock,
  StatusBadge,
  StatTileGrid,
  SurfaceCard,
  SurfaceSeparator,
  TransactionListItem,
} from '@/components/ui'
import { useE2EForcedQueryError } from '@/features/app-data/e2e/hooks'
import { getAppToastDuration } from '@/features/app-shell/toast'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { profileRoutes } from '@/features/profile/routes'
import { WalletMovementIcon } from '@/features/wallet/components/WalletMovementIcon'
import { walletRoutes } from '@/features/wallet/routes'
import {
  formatWalletAmount,
  formatWalletCount,
  getWalletTransactionAmountTone,
  getWalletTransactionBadgeTone,
} from '@/features/wallet/models'
import {
  getWalletMovementBadgeLabel,
  getWalletMovementSubtitle,
  getWalletMovementTitle,
} from '@/features/wallet/presentation'
import { homeRoutes } from '../routes'
import { useHomeScreenQuery } from '../hooks'

const APP_EXIT_BACK_PRESS_WINDOW_MS = 2000
const APP_EXIT_BACK_PRESS_TOAST_DURATION_MS = 2500

function HomeSummaryRow({
  helper,
  label,
  value,
}: {
  helper: string
  label: string
  value: string
}) {
  const { fontScale, width } = useWindowDimensions()
  const shouldStack = width < 380 || fontScale > 1.1

  return (
    <XStack
      items={shouldStack ? 'flex-start' : 'center'}
      flexWrap={shouldStack ? 'wrap' : 'nowrap'}
      justify="space-between"
      gap="$4"
    >
      <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
        <Text color="$color" fontSize={16} fontWeight="800" lineHeight={21}>
          {label}
        </Text>
        <Text color="$color11" fontSize={15} lineHeight={20}>
          {helper}
        </Text>
      </YStack>
      <Text
        adjustsFontSizeToFit={!shouldStack}
        color="$color"
        fontSize={26}
        fontWeight="900"
        lineHeight={30}
        minimumFontScale={shouldStack ? undefined : 0.9}
        numberOfLines={shouldStack ? undefined : 1}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </XStack>
  )
}

function buildMovementAccessibilityLabel({
  amount,
  badgeLabel,
  subtitle,
  title,
}: {
  amount: string
  badgeLabel?: string
  subtitle?: string
  title: string
}) {
  return [title, subtitle, amount, badgeLabel].filter(Boolean).join('. ')
}

function HomeScreenSkeleton() {
  return (
    <>
      <SurfaceCard gap="$4" p="$5" testID="home-dashboard-screen-skeleton">
        <YStack gap="$2">
          <SkeletonBlock height={12} width="32%" />
          <SkeletonBlock height={26} width="48%" />
          <SkeletonBlock height={14} width="72%" />
        </YStack>
        <SkeletonBlock height={48} width={56} />
        <SkeletonBlock height={50} rounded={999} width="100%" />
      </SurfaceCard>

      <SurfaceCard gap="$4">
        <YStack gap="$2">
          <SkeletonBlock height={22} width="42%" />
          <SkeletonBlock height={14} width="74%" />
        </YStack>
        <StatTileGrid>
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock
              key={`home-stat-skeleton-${index}`}
              flex={1}
              height={96}
            />
          ))}
        </StatTileGrid>
      </SurfaceCard>

      <YStack gap="$3">
        <SkeletonBlock height={22} width="38%" />
        {Array.from({ length: 2 }).map((_, index) => (
          <SurfaceCard key={`home-activity-skeleton-${index}`} p="$3.5">
            <XStack gap="$3" items="center">
              <SkeletonBlock height={48} rounded={24} width={48} />
              <YStack flex={1} gap="$2">
                <SkeletonBlock height={16} width="62%" />
                <SkeletonBlock height={12} width="78%" />
              </YStack>
              <YStack items="flex-end" gap="$2">
                <SkeletonBlock height={18} width={58} />
                <SkeletonBlock height={24} rounded={999} width={90} />
              </YStack>
            </XStack>
          </SurfaceCard>
        ))}
      </YStack>
    </>
  )
}

function HomeRecentActivityEmptyState({
  description,
  label,
  title,
}: {
  description: string
  label: string
  title: string
}) {
  return (
    <SurfaceCard
      gap="$4"
      p="$4.5"
      testID="home-recent-activity-empty-state"
      tone="accent"
    >
      <XStack items="center" justify="space-between" gap="$3">
        <StatusBadge tone="accent">{label}</StatusBadge>
        <YStack
          bg="$background"
          borderColor="$borderColor"
          borderWidth={1}
          items="center"
          justify="center"
          rounded={999}
          width={40}
          height={40}
        >
          <Clock3 color="$accent11" size={18} />
        </YStack>
      </XStack>

      <YStack gap="$1.5">
        <Text fontSize={20} fontWeight="900" lineHeight={26}>
          {title}
        </Text>
        <Text color="$color11" fontSize={15} lineHeight={22}>
          {description}
        </Text>
      </YStack>
    </SurfaceCard>
  )
}

export default function HomeScreen() {
  const backPressTimestampRef = useRef(0)
  const { clearForcedQueryError, isForcedQueryError } = useE2EForcedQueryError()
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToastController()
  const { i18n, t } = useTranslation()
  const {
    data: homeScreenState,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useHomeScreenQuery()
  const recentActivityItems = homeScreenState?.recentActivity.map(
    (movement) => ({
      id: movement.id,
      amount: formatWalletAmount(movement.amount.amountMinor, i18n.language),
      amountTone: getWalletTransactionAmountTone(movement),
      badgeLabel: getWalletMovementBadgeLabel(t, movement),
      badgeTone: getWalletTransactionBadgeTone(movement),
      iconType: movement.type,
      subtitle: getWalletMovementSubtitle(i18n.language, movement),
      title: getWalletMovementTitle(t, movement),
    }),
  )
  const handleRefresh = () => {
    if (isForcedQueryError) {
      clearForcedQueryError()
      return
    }

    void refetch()
  }

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (pathname !== homeRoutes.index) {
          return false
        }

        const now = Date.now()

        if (
          now - backPressTimestampRef.current <=
          APP_EXIT_BACK_PRESS_WINDOW_MS
        ) {
          backPressTimestampRef.current = 0
          BackHandler.exitApp()
          return true
        }

        backPressTimestampRef.current = now
        toast.show(t('tabScreens.home.exitHint'), {
          duration: getAppToastDuration(
            'hint',
            APP_EXIT_BACK_PRESS_TOAST_DURATION_MS,
          ),
          variant: 'hint',
        })

        return true
      },
    )

    return () => {
      backPressTimestampRef.current = 0
      subscription.remove()
    }
  }, [pathname, t, toast])

  return (
    <ScreenContainer
      decorativeBackground={false}
      header={
        <TabTopBar
          homeTitle={homeScreenState?.greeting.displayName}
          routeName="index"
        />
      }
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      scrollable
      testID="home-dashboard-screen"
    >
      {isForcedQueryError || (isError && !homeScreenState) ? (
        <QueryErrorState
          description={t('tabScreens.home.errors.description')}
          onRetry={handleRefresh}
          testID="home-dashboard-screen-error-state"
          title={t('tabScreens.home.errors.title')}
        />
      ) : !homeScreenState || isPending ? (
        <HomeScreenSkeleton />
      ) : (
        <>
          <BalanceCard
            actionLabel={t('tabScreens.home.balanceCard.actionLabel')}
            actionTestID="home-balance-transfer-button"
            amount={formatWalletAmount(
              homeScreenState.walletBalance.amountMinor,
              i18n.language,
            )}
            caption={t('tabScreens.home.balanceCard.caption')}
            eyebrow={t('tabScreens.home.balanceCard.availableBalanceLabel')}
            onActionPress={() => router.push(walletRoutes.transfer)}
            tone="accent"
          />

          <SectionBlock
            action={
              <PrimaryButton
                emphasis="outline"
                fullWidth={false}
                tone="neutral"
                onPress={() => router.push(profileRoutes.summary)}
                testID="home-overview-account-button"
              >
                {t('tabScreens.home.overview.accountActionLabel')}
              </PrimaryButton>
            }
            title={t('tabScreens.home.overview.title')}
            description={t('tabScreens.home.overview.description')}
          >
            <SurfaceCard gap="$0" p="$4.5">
              <YStack gap="$4">
                <HomeSummaryRow
                  helper={t('tabScreens.home.overview.stats.todayHelper')}
                  label={t('tabScreens.home.overview.stats.todayLabel')}
                  value={formatWalletCount(
                    homeScreenState.stats.returnedPackagesCount,
                    i18n.language,
                  )}
                />
                <SurfaceSeparator />
                <HomeSummaryRow
                  helper={t('tabScreens.home.overview.stats.transfersHelper')}
                  label={t('tabScreens.home.overview.stats.transfersLabel')}
                  value={formatWalletCount(
                    homeScreenState.stats.processingTransfersCount,
                    i18n.language,
                  )}
                />
              </YStack>
            </SurfaceCard>
          </SectionBlock>

          <SectionBlock
            title={t('tabScreens.home.recentActivity.title')}
            description={t('tabScreens.home.recentActivity.description')}
          >
            {recentActivityItems && recentActivityItems.length > 0 ? (
              <YStack gap={10}>
                {recentActivityItems.map((movement, index) => (
                  <TransactionListItem
                    key={movement.id}
                    accessibilityHint={t(
                      'tabScreens.home.recentActivity.openMovementHint',
                    )}
                    accessibilityLabel={buildMovementAccessibilityLabel({
                      amount: movement.amount,
                      badgeLabel: movement.badgeLabel,
                      subtitle: movement.subtitle,
                      title: movement.title,
                    })}
                    amount={movement.amount}
                    amountTone={movement.amountTone}
                    badgeLabel={movement.badgeLabel}
                    badgeTone={movement.badgeTone}
                    framed={false}
                    icon={<WalletMovementIcon type={movement.iconType} />}
                    onPress={() =>
                      router.push(walletRoutes.movementDetail(movement.id))
                    }
                    subtitle={movement.subtitle}
                    testID={`home-recent-activity-item-${index}`}
                    title={movement.title}
                  />
                ))}
              </YStack>
            ) : (
              <HomeRecentActivityEmptyState
                description={t(
                  'tabScreens.home.recentActivity.emptyStateDescription',
                )}
                label={t('tabScreens.home.recentActivity.emptyStateLabel')}
                title={t('tabScreens.home.recentActivity.emptyStateTitle')}
              />
            )}
          </SectionBlock>
        </>
      )}
    </ScreenContainer>
  )
}
