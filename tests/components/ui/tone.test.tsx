import { screen } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { Text } from 'react-native'
import { getToneThemeName, ToneScope } from '@/components/ui/tone'
import { renderWithTheme } from '@tests/support/test-utils'

jest.mock('tamagui', () => {
  const actual = jest.requireActual('tamagui')
  const { View } = jest.requireActual('react-native')

  return {
    ...actual,
    Theme: ({ children, name }: { children?: ReactNode; name?: string }) => (
      <View testID="tone-theme" accessibilityLabel={name}>
        {children}
      </View>
    ),
  }
})

describe('tone helpers', () => {
  it('returns theme names for non-neutral tones and no theme for neutral', () => {
    expect(getToneThemeName()).toBeUndefined()
    expect(getToneThemeName('accent')).toBe('accent')
    expect(getToneThemeName('error')).toBe('error')
  })

  it('renders children without a Theme wrapper for the neutral tone', () => {
    renderWithTheme(
      <ToneScope>
        <Text>Neutral tone</Text>
      </ToneScope>,
    )

    expect(screen.getByText('Neutral tone')).toBeTruthy()
    expect(screen.queryByTestId('tone-theme')).toBeNull()
  })

  it('wraps children in a Theme when a non-neutral tone is provided', () => {
    renderWithTheme(
      <ToneScope tone="warning">
        <Text>Warning tone</Text>
      </ToneScope>,
    )

    expect(screen.getByText('Warning tone')).toBeTruthy()
    expect(screen.getByTestId('tone-theme').props.accessibilityLabel).toBe(
      'warning',
    )
  })
})
