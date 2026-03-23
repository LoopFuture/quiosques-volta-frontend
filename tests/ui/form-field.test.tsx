import { StyleSheet, Text } from 'react-native'
import { Label, XStack } from 'tamagui'
import { FormField } from '@/components/ui/FormField'
import { renderWithProvider } from '../support/test-utils'
import { restorePlatformOS, setPlatformOS } from '../support/react-native'

describe('FormField', () => {
  beforeEach(() => {
    restorePlatformOS()
  })

  afterAll(() => {
    restorePlatformOS()
  })

  it('renders helper and error states with trailing content', () => {
    const trailingAction = <Text>Mostrar</Text>

    const firstView = renderWithProvider(
      <FormField
        helperText="Usa o teu e-mail SDR."
        label="E-mail"
        placeholder="joao@example.com"
        trailing={trailingAction}
      />,
    )

    expect(firstView.getByText('E-mail')).toBeTruthy()
    expect(firstView.getByText('Usa o teu e-mail SDR.')).toBeTruthy()
    expect(firstView.getByText('Mostrar')).toBeTruthy()
    expect(firstView.getByLabelText('E-mail').props.accessibilityLabel).toBe(
      'E-mail',
    )
    expect(firstView.getByPlaceholderText('joao@example.com')).toBeTruthy()

    firstView.unmount()

    const secondView = renderWithProvider(
      <FormField
        errorText="A palavra-passe e obrigatoria."
        label="Palavra-passe"
        placeholder="********"
        secureTextEntry
        trailing={trailingAction}
      />,
    )

    expect(secondView.getByText('Palavra-passe')).toBeTruthy()
    expect(secondView.getByText('A palavra-passe e obrigatoria.')).toBeTruthy()
    expect(
      secondView.getByLabelText('Palavra-passe').props.accessibilityLabel,
    ).toBe('Palavra-passe')
  })

  it('shows an asterisk for required fields', () => {
    const view = renderWithProvider(
      <FormField label="Nome" placeholder="Joao" required />,
    )

    expect(view.getByText('Nome *')).toBeTruthy()
    expect(view.getByLabelText('Nome').props.accessibilityLabel).toBe('Nome')
  })

  it('normalizes Android field density inside a fixed-height frame', () => {
    setPlatformOS('android')

    const view = renderWithProvider(
      <FormField
        helperText="Introduce o numero principal."
        label="Telefone"
        placeholder="912345678"
        trailing={<Text>Limpar</Text>}
      />,
    )

    const fieldFrame = view.UNSAFE_getAllByType(XStack)[0]
    const input = view.getByLabelText('Telefone')

    expect(fieldFrame.props.height).toBe(58)
    expect(fieldFrame.props.rounded).toBe(29)
    expect(input.props.textAlignVertical).toBe('center')
    expect(StyleSheet.flatten(input.props.style).paddingVertical).toBe(0)
    expect(view.getByText('Limpar')).toBeTruthy()
  })

  it('makes disabled and error states explicit', () => {
    const view = renderWithProvider(
      <FormField
        disabled
        errorText="Campo indisponivel."
        helperText="Nao editavel."
        label="E-mail"
        placeholder="joao@example.com"
      />,
    )

    const label = view.UNSAFE_getByType(Label)
    const fieldFrame = view.UNSAFE_getAllByType(XStack)[0]
    expect(label.props.color).toBe('$color10')
    expect(fieldFrame.props.bg).toBe('$color1')
    expect(fieldFrame.props.borderColor).toBe('$color8')
    expect(fieldFrame.props.borderWidth).toBe(2)
  })

  it('uses the error tone across label, border, and background', () => {
    const view = renderWithProvider(
      <FormField
        errorText="Nome obrigatorio."
        label="Nome"
        placeholder="Joao"
        required
      />,
    )

    const label = view.UNSAFE_getByType(Label)
    const fieldFrame = view.UNSAFE_getAllByType(XStack)[0]

    expect(view.getByText('Nome *')).toBeTruthy()
    expect(view.getByText('Nome obrigatorio.')).toBeTruthy()
    expect(label.props.color).toBe('$color11')
    expect(fieldFrame.props.bg).toBe('$color2')
    expect(fieldFrame.props.borderColor).toBe('$color8')
  })
})
