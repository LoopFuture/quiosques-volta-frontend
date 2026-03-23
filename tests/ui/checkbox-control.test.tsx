import { act, fireEvent, screen } from '@testing-library/react-native'
import { Check } from '@tamagui/lucide-icons'
import { Checkbox } from 'tamagui'
import { CheckboxControl } from '@/components/ui/CheckboxControl'
import { renderWithProvider, renderWithTheme } from '../support/test-utils'

describe('CheckboxControl', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders with checkbox semantics and checked state', () => {
    renderWithProvider(
      <CheckboxControl checked onCheckedChange={jest.fn()} testID="checkbox" />,
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const checkbox = screen.UNSAFE_getByType(Checkbox)

    expect(screen.getByTestId('checkbox')).toBeTruthy()
    expect(checkbox.props.checked).toBe(true)
  })

  it('calls onCheckedChange when pressed', () => {
    const onCheckedChange = jest.fn()

    renderWithProvider(
      <CheckboxControl
        checked={false}
        onCheckedChange={onCheckedChange}
        testID="checkbox"
      />,
    )

    fireEvent.press(screen.getByTestId('checkbox'))

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('uses theme-aware colors in light mode', () => {
    const view = renderWithTheme(
      <CheckboxControl checked onCheckedChange={jest.fn()} />,
      { defaultTheme: 'light' },
    )

    const checkbox = view.UNSAFE_getByType(Checkbox)
    const icon = view.UNSAFE_getByType(Check)

    expect(checkbox.props.bg).toBe('$background')
    expect(checkbox.props.borderColor).toBe('$color7')
    expect(checkbox.props.activeStyle).toEqual({
      background: '$accent9',
      borderColor: '$accent10',
    })
    expect(icon.props.color).toBe('$accent12')
  })

  it('uses theme-aware colors in dark mode', () => {
    const view = renderWithTheme(
      <CheckboxControl checked onCheckedChange={jest.fn()} />,
      { defaultTheme: 'dark' },
    )

    const checkbox = view.UNSAFE_getByType(Checkbox)
    const icon = view.UNSAFE_getByType(Check)

    expect(checkbox.props.bg).toBe('$background')
    expect(checkbox.props.borderColor).toBe('$color8')
    expect(checkbox.props.activeStyle).toEqual({
      background: '$accent10',
      borderColor: '$accent9',
    })
    expect(icon.props.color).toBe('$accent1')
  })
})
