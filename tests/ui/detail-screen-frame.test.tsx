import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { DetailScreenFrame } from '@/components/ui/DetailScreenFrame'
import { renderWithProvider } from '../support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

const { __mockRouterBack: mockRouterBack } = jest.requireMock('expo-router')

describe('DetailScreenFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the screen content and routes the back action', () => {
    renderWithProvider(
      <DetailScreenFrame
        backLabel="Voltar"
        description="Descrição detalhada"
        testID="detail-screen-frame"
        title="Detalhe"
      >
        <Text>Conteúdo principal</Text>
      </DetailScreenFrame>,
    )

    expect(screen.getByTestId('detail-screen-frame')).toBeTruthy()
    expect(screen.getByText('Descrição detalhada')).toBeTruthy()
    expect(screen.getByText('Conteúdo principal')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Voltar'))

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })

  it('renders an optional footer without the description copy', () => {
    renderWithProvider(
      <DetailScreenFrame
        backLabel="Voltar"
        description=""
        footer={<Text>Footer content</Text>}
        testID="detail-screen-frame-footer"
        title="Outro detalhe"
      >
        <Text>Corpo</Text>
      </DetailScreenFrame>,
    )

    expect(screen.getByTestId('detail-screen-frame-footer')).toBeTruthy()
    expect(screen.getByText('Corpo')).toBeTruthy()
    expect(screen.getByText('Footer content')).toBeTruthy()
    expect(screen.queryByText('Descrição detalhada')).toBeNull()
  })
})
