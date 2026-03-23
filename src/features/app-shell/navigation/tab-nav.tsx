import type { ReactNode } from 'react'
import { Home, Map, QrCode, User, Wallet } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import type { NavItem } from '../components/BottomTabBar'
import type { AppTabRouteName } from './tab-header'

const ACTIVE_ICON_COLOR = '$accent10'
const CENTER_ICON_COLOR = '$color1'
const INACTIVE_ICON_COLOR = '$color9'

type AppTabHref = '/' | '/barcode' | '/map' | '/profile' | '/wallet'

const appTabRoutes = {
  barcode: '/barcode',
  index: '/',
  map: '/map',
  profile: '/profile',
  wallet: '/wallet',
} as const

type AppTabDefinition = {
  href: AppTabHref
  key: string
  label: string
  routeName: AppTabRouteName
  renderIcon: ({
    color,
    size,
  }: {
    color: '$accent10' | '$color1' | '$color9'
    size: number
  }) => ReactNode
  emphasis?: 'default' | 'center'
}

export function useAppTabDefinitions(): AppTabDefinition[] {
  const { t } = useTranslation()

  return [
    {
      href: appTabRoutes.index,
      key: 'home',
      label: t('tabs.home.label'),
      routeName: 'index',
      renderIcon: ({ color, size }) => <Home color={color} size={size} />,
    },
    {
      href: appTabRoutes.map,
      key: 'map',
      label: t('tabs.map.label'),
      routeName: 'map',
      renderIcon: ({ color, size }) => <Map color={color} size={size} />,
    },
    {
      href: appTabRoutes.barcode,
      key: 'barcode',
      label: t('tabs.barcode.label'),
      routeName: 'barcode',
      renderIcon: ({ color, size }) => <QrCode color={color} size={size} />,
      emphasis: 'center',
    },
    {
      href: appTabRoutes.wallet,
      key: 'wallet',
      label: t('tabs.wallet.label'),
      routeName: 'wallet',
      renderIcon: ({ color, size }) => <Wallet color={color} size={size} />,
    },
    {
      href: appTabRoutes.profile,
      key: 'profile',
      label: t('tabs.profile.label'),
      routeName: 'profile',
      renderIcon: ({ color, size }) => <User color={color} size={size} />,
    },
  ]
}

export function mapTabNavItems(
  appTabDefinitions: AppTabDefinition[],
  activeRouteName: string,
): NavItem[] {
  return appTabDefinitions.map((item) => {
    const emphasis = item.emphasis === 'center'
    const active = item.routeName === activeRouteName
    const color = emphasis
      ? CENTER_ICON_COLOR
      : active
        ? ACTIVE_ICON_COLOR
        : INACTIVE_ICON_COLOR

    return {
      active,
      emphasis: item.emphasis,
      icon: item.renderIcon({
        color,
        size: emphasis ? 28 : 24,
      }),
      key: item.key,
      label: item.label,
    }
  })
}
