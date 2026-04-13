import { useWindowDimensions } from 'react-native'
import type { TFunction } from 'i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Paragraph, SizableText, Text, XStack, YStack, useTheme } from 'tamagui'
import AppLogo from '@/assets/images/logo.svg'
import { useAppPreferences } from '@/hooks/useAppPreferences'
import { brandBlack } from '@/themes'

export function getUnlockErrorMessage(
  reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled',
  t: TFunction<'app'>,
) {
  if (reason === 'not-available') {
    return t('auth.lock.notAvailableError')
  }

  if (reason === 'not-enrolled') {
    return t('auth.lock.notEnrolledError')
  }

  if (reason === 'cancelled') {
    return t('auth.lock.cancelledError')
  }

  return t('auth.lock.failedError')
}

export function getPinUnlockErrorMessage(
  reason: 'failed' | 'invalid-pin' | 'not-configured' | 'too-many-attempts',
  t: TFunction<'app'>,
) {
  if (reason === 'invalid-pin') {
    return t('auth.lock.invalidPinError')
  }

  if (reason === 'not-configured') {
    return t('auth.lock.pinNotConfiguredError')
  }

  if (reason === 'too-many-attempts') {
    return t('auth.lock.tooManyPinAttemptsError')
  }

  return t('auth.lock.pinFailedError')
}

export function useAuthSurfaceMetrics() {
  const theme = useTheme()
  const { resolvedTheme } = useAppPreferences()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const isCompactWidth = width < 360

  return {
    heroLogoColor: resolvedTheme === 'dark' ? theme.accent10.val : brandBlack,
    heroLogoSize: isCompactWidth ? 88 : 104,
    heroTitleFontSize: isCompactWidth ? 44 : 56,
    insets,
    subtitleMaxWidth: Math.max(Math.min(width - 32, 360), 240),
  }
}

export function AuthHeader({
  description,
  heroLogoColor,
  heroLogoSize,
  heroTitleFontSize,
  subtitleMaxWidth,
  titleLeading,
  titleTrailing,
}: {
  description: string
  heroLogoColor: string
  heroLogoSize: number
  heroTitleFontSize: number
  subtitleMaxWidth: number
  titleLeading: string
  titleTrailing: string
}) {
  return (
    <YStack gap="$6" items="center">
      <YStack items="center" justify="center" pt={8}>
        <AppLogo
          color={heroLogoColor}
          height={heroLogoSize}
          width={heroLogoSize}
        />
      </YStack>

      <YStack gap="$3" items="center">
        <XStack gap="$2" flexWrap="wrap" justify="center">
          <Text
            fontSize={heroTitleFontSize}
            fontWeight="900"
            letterSpacing={-2}
          >
            {titleLeading}
          </Text>
          <Text
            color="$accent10"
            fontSize={heroTitleFontSize}
            fontWeight="900"
            letterSpacing={-2}
          >
            {titleTrailing}
          </Text>
        </XStack>

        <Paragraph
          color="$color11"
          size="$8"
          style={{ maxWidth: subtitleMaxWidth, textAlign: 'center' }}
        >
          {description}
        </Paragraph>
      </YStack>
    </YStack>
  )
}

export function AuthActionDivider({ label }: { label: string }) {
  return (
    <XStack gap="$3" items="center">
      <YStack bg="$borderColor" flex={1} height={1} />
      <SizableText
        color="$color10"
        fontSize={12}
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </SizableText>
      <YStack bg="$borderColor" flex={1} height={1} />
    </XStack>
  )
}
