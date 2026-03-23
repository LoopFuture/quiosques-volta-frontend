import { fireEvent } from '@testing-library/react-native'
import { Button, Spinner } from 'tamagui'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { renderWithProvider, renderWithTheme } from '../support/test-utils'
import { restorePlatformOS, setPlatformOS } from '../support/react-native'

describe('PrimaryButton', () => {
  beforeEach(() => {
    restorePlatformOS()
  })

  afterAll(() => {
    restorePlatformOS()
  })

  it('renders and handles press events', () => {
    const onPress = jest.fn()
    const view = renderWithProvider(
      <PrimaryButton onPress={onPress}>Continuar</PrimaryButton>,
    )

    fireEvent.press(view.getByText('Continuar'))

    expect(view.getByText('Continuar')).toBeTruthy()
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('uses explicit accent colors for solid buttons in light and dark themes', () => {
    const lightView = renderWithTheme(
      <PrimaryButton>Continuar</PrimaryButton>,
      {
        defaultTheme: 'light',
      },
    )
    const lightButton = lightView.UNSAFE_getByType(Button)
    const lightText = lightView.UNSAFE_getByType(Button.Text)

    expect(lightButton.props.bg).toBe('$accent9')
    expect(lightText.props.color).toBe('$accent12')

    lightView.unmount()

    const darkView = renderWithTheme(<PrimaryButton>Continuar</PrimaryButton>, {
      defaultTheme: 'dark',
    })
    const darkButton = darkView.UNSAFE_getByType(Button)
    const darkText = darkView.UNSAFE_getByType(Button.Text)

    expect(darkButton.props.bg).toBe('$accent10')
    expect(darkText.props.color).toBe('$accent1')
  })

  it('uses explicit outline colors for neutral buttons in light and dark themes', () => {
    const lightView = renderWithTheme(
      <PrimaryButton tone="neutral" emphasis="outline">
        Cancelar
      </PrimaryButton>,
      { defaultTheme: 'light' },
    )
    const lightButton = lightView.UNSAFE_getByType(Button)
    const lightText = lightView.UNSAFE_getByType(Button.Text)

    expect(lightButton.props.bg).toBe('$color2')
    expect(lightButton.props.borderColor).toBe('$color8')
    expect(lightText.props.color).toBe('$color')

    lightView.unmount()

    const darkView = renderWithTheme(
      <PrimaryButton tone="neutral" emphasis="outline">
        Cancelar
      </PrimaryButton>,
      { defaultTheme: 'dark' },
    )
    const darkButton = darkView.UNSAFE_getByType(Button)
    const darkText = darkView.UNSAFE_getByType(Button.Text)

    expect(darkButton.props.bg).toBe('$color2')
    expect(darkButton.props.borderColor).toBe('$color8')
    expect(darkText.props.color).toBe('$color')
  })

  it('uses Android elevation for solid buttons', () => {
    setPlatformOS('android')

    const view = renderWithTheme(<PrimaryButton>Continuar</PrimaryButton>, {
      defaultTheme: 'light',
    })
    const button = view.UNSAFE_getByType(Button)

    expect(button.props.elevation).toBe(2)
    expect(button.props.shadowOffset).toBeUndefined()
    expect(button.props.shadowOpacity).toBeUndefined()
    expect(button.props.shadowRadius).toBeUndefined()
  })

  it('shows a spinner and exposes busy state while pending', () => {
    const view = renderWithProvider(
      <PrimaryButton isPending>Continuar</PrimaryButton>,
    )
    const button = view.UNSAFE_getByType(Button)

    expect(button.props.disabled).toBe(true)
    expect(button.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    })
    expect(view.UNSAFE_getByType(Spinner)).toBeTruthy()
  })

  it('supports explicit pending copy and stronger disabled styling', () => {
    const view = renderWithProvider(
      <PrimaryButton disabled isPending pendingLabel="A processar">
        Continuar
      </PrimaryButton>,
    )
    const button = view.UNSAFE_getByType(Button)
    const label = view.UNSAFE_getByType(Button.Text)

    expect(button.props.bg).toBe('$color4')
    expect(button.props.borderColor).toBe('$color6')
    expect(button.props.rounded).toBe(28)
    expect(label.props.children).toBe('A processar')
    expect(label.props.color).toBe('$color10')
  })
})
