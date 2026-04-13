import { StyleSheet, Text } from 'react-native'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { themes } from '@/themes'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider, renderWithTheme } from '@tests/support/test-utils'

describe('SectionBlock', () => {
  it('renders heading content and children', () => {
    const view = renderWithProvider(
      <SectionBlock
        title="Pagamentos"
        description="Resumo do estado atual."
        action={<Text>Ver tudo</Text>}
      >
        <Text>Conteudo interno</Text>
      </SectionBlock>,
    )

    expect(view.getByText('Pagamentos')).toBeTruthy()
    expect(view.getByText('Resumo do estado atual.')).toBeTruthy()
    expect(view.getByText('Ver tudo')).toBeTruthy()
    expect(view.getByText('Conteudo interno')).toBeTruthy()
  })

  it('uses semantic supporting text colors without opacity dimming', () => {
    const view = renderWithTheme(
      <SectionBlock title="Pagamentos" description="Resumo do estado atual.">
        <Text>Conteudo interno</Text>
      </SectionBlock>,
      { defaultTheme: 'dark' },
    )
    const description = view.getByText('Resumo do estado atual.')
    const style = StyleSheet.flatten(description.props.style)

    expect(style?.color).toBe(themes.dark.color11)
    expect(style?.opacity).toBeUndefined()
  })

  it('stacks the header on compact layouts when an action is present', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithProvider(
      <SectionBlock
        action={<Text>Editar</Text>}
        description="Resumo do estado atual."
        title="Pagamentos"
      >
        <Text>Conteudo interno</Text>
      </SectionBlock>,
    )

    expect(view.getByText('Pagamentos')).toBeTruthy()
    expect(view.getByText('Resumo do estado atual.')).toBeTruthy()
    expect(view.getByText('Editar')).toBeTruthy()

    windowSpy.mockRestore()
  })

  it('keeps the regular header layout when no action or description is provided', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithProvider(
      <SectionBlock title="Pagamentos">
        <Text>Conteudo simples</Text>
      </SectionBlock>,
    )

    expect(view.getByText('Pagamentos')).toBeTruthy()
    expect(view.getByText('Conteudo simples')).toBeTruthy()
    expect(view.queryByText('Resumo do estado atual.')).toBeNull()
    expect(view.queryByText('Editar')).toBeNull()

    windowSpy.mockRestore()
  })
})
