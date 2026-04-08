import { fireEvent, screen } from '@testing-library/react-native'
import NotFoundScreen from '@/features/app-shell/screens/NotFoundScreen'
import { renderWithProvider } from '../../support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

const {
  __mockRouterBack: mockRouterBack,
  __mockRouterCanGoBack: mockRouterCanGoBack,
  __mockRouterReplace: mockRouterReplace,
  __mockStackScreen: mockStackScreen,
} = jest.requireMock('expo-router')

describe('not found screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('routes users back to the home screen and sets the route title', () => {
    mockRouterCanGoBack.mockReturnValue(false)

    renderWithProvider(<NotFoundScreen />)

    expect(screen.getByTestId('not-found-screen')).toBeTruthy()
    expect(screen.getByText('Ecrã indisponível')).toBeTruthy()
    expect(screen.getByText('Este ecrã já não está disponível.')).toBeTruthy()
    expect(
      screen.getByText(
        'Volta ao início para continuar. Se abriste uma ligação antiga, este ecrã pode já não estar disponível.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Voltar')).toBeNull()
    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          title: 'Ecrã indisponível',
        },
      }),
      undefined,
    )

    fireEvent.press(screen.getByText('Ir para o início'))

    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('shows the back action when the router can go back', () => {
    mockRouterCanGoBack.mockReturnValue(true)

    renderWithProvider(<NotFoundScreen />)

    fireEvent.press(screen.getByText('Voltar'))

    expect(mockRouterBack).toHaveBeenCalled()
  })
})
