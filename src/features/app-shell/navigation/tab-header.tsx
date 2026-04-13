import { ArrowLeft } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import {
  TopBar,
  type TopBarAction,
  type TopBarProps,
} from '@/components/ui/TopBar'

export type AppTabRouteName = 'index' | 'map' | 'barcode' | 'wallet' | 'profile'

function buildTabTopBarProps(
  routeName: AppTabRouteName,
  t: ReturnType<typeof useTranslation>['t'],
  options: { homeTitle?: string } = {},
): TopBarProps {
  if (routeName === 'index') {
    return {
      eyebrow: t('tabs.home.header.eyebrow'),
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
  homeTitle,
}: {
  routeName: AppTabRouteName
  homeTitle?: string
}) {
  const { t } = useTranslation()

  return (
    <TopBar
      {...buildTabTopBarProps(routeName, t, {
        homeTitle,
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
