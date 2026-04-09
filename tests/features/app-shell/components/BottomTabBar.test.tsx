import { Text } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import {
  BottomTabBar,
  type NavItem,
} from '@/features/app-shell/components/BottomTabBar'
import { renderWithProvider } from '@tests/support/test-utils'

describe('BottomTabBar', () => {
  it('renders each navigation item', () => {
    const items: NavItem[] = [
      { icon: <Text>H</Text>, key: 'home', label: 'Inicio' },
      { active: true, icon: <Text>M</Text>, key: 'map', label: 'Mapa' },
      {
        emphasis: 'center',
        icon: <Text>Q</Text>,
        key: 'barcode',
        label: 'Código',
      },
      { icon: <Text>P</Text>, key: 'profile', label: 'Perfil' },
    ]

    const view = renderWithProvider(<BottomTabBar items={items} />)

    expect(view.getByText('Inicio')).toBeTruthy()
    expect(view.getByText('Mapa')).toBeTruthy()
    expect(view.getByText('Perfil')).toBeTruthy()
    expect(view.getByText('H')).toBeTruthy()
    expect(view.getByText('M')).toBeTruthy()
    expect(view.getByText('Q')).toBeTruthy()
    expect(view.queryByText('Código')).toBeNull()
  })

  it('calls onPress for interactive items', () => {
    const onPress = jest.fn()
    const items: NavItem[] = [
      {
        accessibilityLabel: 'Mapa',
        accessibilityRole: 'button',
        icon: <Text>M</Text>,
        key: 'map',
        label: 'Mapa',
        onPress,
      },
    ]

    const view = renderWithProvider(<BottomTabBar items={items} />)

    fireEvent.press(view.getByLabelText('Mapa'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
