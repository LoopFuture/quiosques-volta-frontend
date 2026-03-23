import { Text } from 'react-native'
import { Card } from 'tamagui'
import { getPlatformShadowProps } from '@/components/ui/platformShadows'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { renderWithProvider, renderWithTheme } from '../support/test-utils'
import { restorePlatformOS, setPlatformOS } from '../support/react-native'

describe('SurfaceCard', () => {
  beforeEach(() => {
    restorePlatformOS()
  })

  afterAll(() => {
    restorePlatformOS()
  })

  it('renders children for neutral and toned cards', () => {
    const view = renderWithProvider(
      <>
        <SurfaceCard>
          <Text>Neutral card</Text>
        </SurfaceCard>
        <SurfaceCard tone="accent">
          <Text>Accent card</Text>
        </SurfaceCard>
      </>,
    )

    expect(view.getByText('Neutral card')).toBeTruthy()
    expect(view.getByText('Accent card')).toBeTruthy()
  })

  it('uses the stronger light-theme shadow preset', () => {
    setPlatformOS('ios')

    expect(getPlatformShadowProps('surface', false)).toEqual({
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
    })

    const view = renderWithTheme(
      <SurfaceCard testID="light-surface-card">
        <Text>Light surface</Text>
      </SurfaceCard>,
      { defaultTheme: 'light' },
    )

    const card = view.UNSAFE_getByType(Card)

    expect(view.getByTestId('light-surface-card')).toBeTruthy()
    expect(card.props.overflow).toBe('hidden')
  })

  it('uses the stronger dark-theme shadow preset', () => {
    setPlatformOS('ios')

    expect(getPlatformShadowProps('surface', true)).toEqual({
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
    })

    const view = renderWithTheme(
      <SurfaceCard testID="dark-surface-card">
        <Text>Dark surface</Text>
      </SurfaceCard>,
      { defaultTheme: 'dark' },
    )

    const card = view.UNSAFE_getByType(Card)

    expect(view.getByTestId('dark-surface-card')).toBeTruthy()
    expect(card.props.overflow).toBe('hidden')
  })

  it('uses Android elevation without iOS shadow props', () => {
    setPlatformOS('android')

    expect(getPlatformShadowProps('surface', false)).toEqual({
      elevation: 2,
    })

    const view = renderWithTheme(
      <SurfaceCard testID="android-surface-card">
        <Text>Android surface</Text>
      </SurfaceCard>,
      { defaultTheme: 'light' },
    )

    const card = view.UNSAFE_getByType(Card)

    expect(view.getByTestId('android-surface-card')).toBeTruthy()
    expect(card.props.overflow).toBe('hidden')
  })
})
