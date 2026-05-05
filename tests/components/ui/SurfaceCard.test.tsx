import { Text } from 'react-native'
import { Card } from 'tamagui'
import { getPlatformShadowProps } from '@/components/ui/platformShadows'
import { SurfaceCard } from '@/components/ui/SurfaceCard'
import { renderWithProvider, renderWithTheme } from '@tests/support/test-utils'
import { restorePlatformOS, setPlatformOS } from '@tests/support/react-native'

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

  it('uses the lighter light-theme card shadow preset', () => {
    setPlatformOS('ios')

    expect(getPlatformShadowProps('card', false)).toEqual({
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
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

  it('uses the lighter dark-theme card shadow preset', () => {
    setPlatformOS('ios')

    expect(getPlatformShadowProps('card', true)).toEqual({
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
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

    expect(getPlatformShadowProps('card', false)).toEqual({
      elevation: 1,
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

  it('applies min and max height constraints to the wrapper and card', () => {
    const view = renderWithProvider(
      <SurfaceCard maxHeight={240} minHeight={120} testID="constrained-card">
        <Text>Constrained surface</Text>
      </SurfaceCard>,
    )

    const wrapper = view.getByTestId('constrained-card')
    const card = view.UNSAFE_getByType(Card)

    expect(wrapper).toBeTruthy()
    expect(card.props.style).toEqual({
      maxHeight: 240,
      minHeight: 120,
    })
  })

  it('renders the decorative accent background for toned cards only', () => {
    const tonedView = renderWithProvider(
      <SurfaceCard decorativeAccent testID="accent-surface-card" tone="accent">
        <Text>Accent with decoration</Text>
      </SurfaceCard>,
    )

    expect(tonedView.getByTestId('accent-surface-card')).toBeTruthy()
    expect(tonedView.UNSAFE_getAllByType(Card.Background)).toHaveLength(1)

    const neutralView = renderWithProvider(
      <SurfaceCard decorativeAccent testID="neutral-surface-card">
        <Text>Neutral without decoration</Text>
      </SurfaceCard>,
    )

    expect(neutralView.getByTestId('neutral-surface-card')).toBeTruthy()
    expect(neutralView.UNSAFE_queryAllByType(Card.Background)).toHaveLength(0)
  })
})
