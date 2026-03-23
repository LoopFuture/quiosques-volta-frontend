import { screen } from '@testing-library/react-native'
import TabOneScreen from '@/app/(tabs)/index'
import TabTwoScreen from '@/app/(tabs)/two'
import NotFoundScreen from '@/app/+not-found'
import ModalScreen from '@/app/modal'
import { renderWithProvider } from './test-utils'

jest.mock('expo-router', () => {
  const mockStackScreen = jest.fn(() => null)
  const Stack = Object.assign(({ children }: any) => children, {
    Screen: mockStackScreen,
  })

  return {
    Link: ({ children }: any) => children,
    Stack,
    __mockStackScreen: mockStackScreen,
  }
})

const { __mockStackScreen: mockStackScreen } = jest.requireMock('expo-router')

describe('app screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the first tab content', () => {
    renderWithProvider(<TabOneScreen />)

    expect(screen.getByText('Tamagui + Expo')).toBeTruthy()
    expect(screen.getByText('Toast demo')).toBeTruthy()
    expect(screen.getByText('Configuration guide')).toBeTruthy()
    expect(screen.getByText('src/tamagui.config.ts')).toBeTruthy()
  })

  it('renders the second tab label', () => {
    renderWithProvider(<TabTwoScreen />)

    expect(screen.getByText('Tab Two')).toBeTruthy()
  })

  it('renders the modal credits', () => {
    renderWithProvider(<ModalScreen />)

    expect(screen.getByText('Made by')).toBeTruthy()
    expect(screen.getByText('@natebirdman,')).toBeTruthy()
    expect(screen.getByText('give it a ⭐️')).toBeTruthy()
  })

  it('renders the not found fallback route', () => {
    renderWithProvider(<NotFoundScreen />)

    expect(screen.getByText("This screen doesn't exist.")).toBeTruthy()
    expect(screen.getByText('Go to home screen!')).toBeTruthy()
    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { title: 'Oops!' },
      }),
      undefined,
    )
  })
})
