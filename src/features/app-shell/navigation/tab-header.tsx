import { ArrowLeft, Bell } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import {
  TopBar,
  type TopBarAction,
  type TopBarProps,
} from '@/components/ui/TopBar'

export type AppTabRouteName = 'index' | 'map' | 'barcode' | 'wallet' | 'profile'

type TabTopBarOptions = {
  homeNotificationAccessibilityHint?: string
  homeNotificationBadgeValue?: string
  onHomeNotificationPress?: () => void
  homeTitle?: string
}

function buildTabTopBarProps(
  routeName: AppTabRouteName,
  t: ReturnType<typeof useTranslation>['t'],
  options: TabTopBarOptions = {},
): TopBarProps {
  if (routeName === 'index') {
    return {
      eyebrow: t('tabs.home.header.eyebrow'),
      rightAction: options.onHomeNotificationPress
        ? {
            badgeValue: options.homeNotificationBadgeValue,
            hint: options.homeNotificationAccessibilityHint,
            icon: <Bell color="$accent11" size={18} />,
            label: t('tabs.home.header.notificationLabel'),
            onPress: options.onHomeNotificationPress,
          }
        : undefined,
      title: options.homeTitle ?? t('tabs.home.header.title'),
      variant: 'home',
    }
  }

  return {
    title: t(`tabs.${routeName}.title`),
    variant: 'title',
  }
}

export function TabTopBar({
  routeName,
  homeNotificationAccessibilityHint,
  homeNotificationBadgeValue,
  onHomeNotificationPress,
  homeTitle,
}: {
  routeName: AppTabRouteName
  homeNotificationAccessibilityHint?: string
  homeNotificationBadgeValue?: string
  onHomeNotificationPress?: () => void
  homeTitle?: string
}) {
  const { t } = useTranslation()

  return (
    <TopBar
      {...buildTabTopBarProps(routeName, t, {
        homeNotificationAccessibilityHint,
        homeNotificationBadgeValue,
        homeTitle,
        onHomeNotificationPress,
      })}
    />
  )
}

type StackTopBarProps = {
  backLabel: string
  onBackPress: () => void
  title: string
  subtitle?: string
  eyebrow?: string
  rightAction?: TopBarAction
}

export function StackTopBar({
  backLabel,
  onBackPress,
  title,
  subtitle,
  eyebrow,
  rightAction,
}: StackTopBarProps) {
  return (
    <TopBar
      variant="title"
      eyebrow={eyebrow}
      leftAction={{
        icon: <ArrowLeft color="$accent11" size={18} />,
        label: backLabel,
        onPress: onBackPress,
      }}
      rightAction={rightAction}
      subtitle={subtitle}
      title={title}
    />
  )
}
