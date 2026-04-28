import type { ReactNode } from 'react'
import { MapPinned, QrCode } from '@tamagui/lucide-icons'
import {
  PrimaryButton,
  QueryErrorState,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui'
import { Text, XStack, YStack } from 'tamagui'

type MapEmptyStateProps = {
  actionHint: string
  description: string
  fallbackActionLabel: string
  fallbackActionTitle: string
  fallbackDescription: string
  fallbackStatusLabel: string
  onActionPress: () => void
  statusLabel: string
  title: string
}

type MapScreenStateProps = MapEmptyStateProps & {
  errorDescription: string
  errorRecoveryHint: string
  errorTitle: string
  onRetry?: () => void
  state?: 'error' | 'loading' | 'ready'
}

function MapSectionIcon({ children }: { children: ReactNode }) {
  return (
    <YStack
      bg="$background"
      borderColor="$borderColor"
      borderWidth={1}
      items="center"
      justify="center"
      rounded={999}
      width={44}
      height={44}
    >
      {children}
    </YStack>
  )
}

export function MapEmptyState({
  actionHint,
  description,
  fallbackActionLabel,
  fallbackActionTitle,
  fallbackDescription,
  fallbackStatusLabel,
  onActionPress,
  statusLabel,
  title,
}: MapEmptyStateProps) {
  return (
    <YStack flex={1} bg="$background" gap="$4" testID="map-empty-state">
      <SurfaceCard gap="$4" p="$5" testID="map-coming-soon-card" tone="accent">
        <XStack items="center" justify="space-between" gap="$3">
          <StatusBadge tone="accent">{statusLabel}</StatusBadge>
          <MapSectionIcon>
            <MapPinned color="$accent11" size={20} />
          </MapSectionIcon>
        </XStack>

        <YStack gap="$2">
          <Text
            color="$accent11"
            fontSize={13}
            fontWeight="800"
            textTransform="uppercase"
          >
            {actionHint}
          </Text>
          <Text fontSize={28} fontWeight="900" lineHeight={34}>
            {title}
          </Text>
          <Text color="$color11" fontSize={15} lineHeight={22}>
            {description}
          </Text>
        </YStack>
      </SurfaceCard>

      <SurfaceCard gap="$3.5" p="$4.5" testID="map-code-card">
        <XStack gap="$3" items="center">
          <MapSectionIcon>
            <QrCode color="$accent11" size={18} />
          </MapSectionIcon>
          <YStack flex={1} gap="$1">
            <StatusBadge>{fallbackStatusLabel}</StatusBadge>
            <Text fontSize={18} fontWeight="800">
              {fallbackActionTitle}
            </Text>
            <Text color="$color11" fontSize={14} lineHeight={21}>
              {fallbackDescription}
            </Text>
          </YStack>
        </XStack>

        <PrimaryButton onPress={onActionPress} testID="map-open-barcode-button">
          {fallbackActionLabel}
        </PrimaryButton>
      </SurfaceCard>
    </YStack>
  )
}

export function MapScreenState({
  errorDescription,
  errorRecoveryHint,
  errorTitle,
  onRetry,
  state = 'ready',
  ...emptyStateProps
}: MapScreenStateProps) {
  if (state === 'loading') {
    return <MapScreenSkeleton />
  }

  if (state === 'error') {
    return (
      <QueryErrorState
        description={errorDescription}
        onRetry={onRetry ?? (() => undefined)}
        recoveryHint={errorRecoveryHint}
        testID="map-error-state"
        title={errorTitle}
      />
    )
  }

  return <MapEmptyState {...emptyStateProps} />
}

export function MapScreenSkeleton() {
  return (
    <YStack flex={1} gap="$4" testID="map-screen-skeleton">
      <SurfaceCard gap="$4" p="$5" tone="accent">
        <XStack items="center" justify="space-between">
          <SkeletonBlock height={30} rounded={999} width={132} />
          <SkeletonBlock height={44} rounded={22} width={44} />
        </XStack>
        <YStack gap="$2">
          <SkeletonBlock height={12} width="34%" />
          <SkeletonBlock height={28} width="72%" />
          <SkeletonBlock height={16} width="94%" />
          <SkeletonBlock height={16} width="82%" />
        </YStack>
      </SurfaceCard>

      <SurfaceCard gap="$3.5" p="$4.5">
        <XStack gap="$3" items="center">
          <SkeletonBlock height={44} rounded={22} width={44} />
          <YStack flex={1} gap="$2">
            <SkeletonBlock height={18} width="46%" />
            <SkeletonBlock height={14} width="80%" />
          </YStack>
        </XStack>
        <SkeletonBlock height={56} rounded={28} width="100%" />
      </SurfaceCard>
    </YStack>
  )
}
