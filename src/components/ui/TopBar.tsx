import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import AppLogo from '@/assets/images/logo.svg'
import { Button, Text, XStack, YStack, useTheme, useThemeName } from 'tamagui'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import { getPlatformShadowProps } from './platformShadows'
import { ToneScope } from './tone'

export type TopBarAction = {
  badgeValue?: string
  hint?: string
  icon: ReactNode
  label: string
  onPress?: () => void
}

type BaseTopBarProps = {
  title: string
  subtitle?: string
  leftAction?: TopBarAction
  rightAction?: TopBarAction
}

type HomeTopBarProps = BaseTopBarProps & {
  eyebrow?: string
  variant: 'home'
}

type TitleTopBarProps = BaseTopBarProps & {
  eyebrow?: string
  variant: 'title'
}

export type TopBarProps = HomeTopBarProps | TitleTopBarProps

const ACTION_WIDTH = 52
const ACTION_BADGE_SIZE = 24

function OfflineIndicator({ label }: { label: string }) {
  return (
    <ToneScope tone="error">
      <XStack
        accessibilityLiveRegion="polite"
        bg="$accent9"
        px="$3"
        py="$2"
        rounded="$12"
        style={{ alignSelf: 'flex-start' }}
        testID="top-bar-offline-indicator"
      >
        <Text color="$accent1" fontSize={12} fontWeight="800">
          {label}
        </Text>
      </XStack>
    </ToneScope>
  )
}

function HeaderActionButton({
  action,
  align,
  isDarkTheme,
}: {
  action?: TopBarAction
  align: 'flex-start' | 'flex-end'
  isDarkTheme: boolean
}) {
  const isLongBadgeValue = (action?.badgeValue?.length ?? 0) > 2

  return (
    <XStack items="center" justify={align} style={{ width: ACTION_WIDTH }}>
      {action ? (
        <YStack
          items="center"
          justify="center"
          style={{ width: 44, height: 44, overflow: 'visible' }}
        >
          <Button
            accessibilityHint={action.hint}
            accessibilityLabel={action.label}
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            height={44}
            items="center"
            justify="center"
            onPress={action.onPress}
            p={0}
            pressStyle={{ opacity: 0.88 }}
            rounded={22}
            {...getPlatformShadowProps('iconButton', isDarkTheme)}
            unstyled
            width={44}
          >
            {action.icon}
          </Button>
          {action.badgeValue ? (
            <XStack
              bg="$accent10"
              borderColor="$background"
              borderWidth={2}
              height={ACTION_BADGE_SIZE}
              items="center"
              justify="center"
              pointerEvents="none"
              position="absolute"
              rounded={999}
              style={{
                top: -4,
                right: -4,
                width: ACTION_BADGE_SIZE,
              }}
              testID="top-bar-action-badge"
            >
              <Text
                color="$accent1"
                fontSize={isLongBadgeValue ? 8 : 10}
                fontWeight="900"
                letterSpacing={isLongBadgeValue ? -0.2 : 0}
              >
                {action.badgeValue}
              </Text>
            </XStack>
          ) : null}
        </YStack>
      ) : null}
    </XStack>
  )
}

export function TopBar(props: TopBarProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const themeName = useThemeName()
  const { fontScale, width } = useWindowDimensions()
  const isOffline = useOfflineStatus()
  const prefersExpandedTextLayout = fontScale > 1.15
  const isCompactWidth = width < 360 || prefersExpandedTextLayout
  const isDarkTheme = themeName.startsWith('dark')
  const homeLogoColor = isDarkTheme ? theme.accent10.val : theme.color12.val
  const offlineLabel = t('topBar.offline')

  if (props.variant === 'home') {
    return (
      <XStack items="flex-start" gap="$3">
        <XStack flex={1} gap="$3" items="flex-start" style={{ minWidth: 0 }}>
          <AppLogo
            color={homeLogoColor}
            height={isCompactWidth ? 48 : 56}
            testID="top-bar-home-logo"
            width={isCompactWidth ? 48 : 56}
          />

          <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
            {props.eyebrow ? (
              <Text
                color="$color10"
                fontSize={13}
                fontWeight="700"
                letterSpacing={0.2}
              >
                {props.eyebrow}
              </Text>
            ) : null}
            <Text
              accessibilityRole="header"
              fontSize={isCompactWidth ? 24 : 28}
              fontWeight="900"
              lineHeight={isCompactWidth ? 30 : 34}
              numberOfLines={2}
              style={{ flexShrink: 1 }}
            >
              {props.title}
            </Text>
            {props.subtitle ? (
              <Text
                color="$color11"
                fontSize={15}
                lineHeight={21}
                style={{ flexShrink: 1 }}
              >
                {props.subtitle}
              </Text>
            ) : null}
            {isOffline ? <OfflineIndicator label={offlineLabel} /> : null}
          </YStack>
        </XStack>

        <HeaderActionButton
          action={props.rightAction}
          align="flex-end"
          isDarkTheme={isDarkTheme}
        />
      </XStack>
    )
  }

  return (
    <XStack items="center" gap="$3">
      <HeaderActionButton
        action={props.leftAction}
        align="flex-start"
        isDarkTheme={isDarkTheme}
      />

      <YStack flex={1} items="center" gap="$1" style={{ minWidth: 0 }}>
        {props.eyebrow ? (
          <Text
            color="$color10"
            fontSize={12}
            fontWeight="700"
            letterSpacing={0.2}
          >
            {props.eyebrow}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          fontSize={isCompactWidth ? 22 : 24}
          fontWeight="800"
          lineHeight={isCompactWidth ? 28 : 30}
          numberOfLines={prefersExpandedTextLayout ? 2 : undefined}
          style={{ flexShrink: 1, textAlign: 'center' }}
        >
          {props.title}
        </Text>
        {props.subtitle ? (
          <Text
            color="$color11"
            fontSize={15}
            lineHeight={21}
            style={{ flexShrink: 1, textAlign: 'center' }}
          >
            {props.subtitle}
          </Text>
        ) : null}
        {isOffline ? <OfflineIndicator label={offlineLabel} /> : null}
      </YStack>

      <HeaderActionButton
        action={props.rightAction}
        align="flex-end"
        isDarkTheme={isDarkTheme}
      />
    </XStack>
  )
}
