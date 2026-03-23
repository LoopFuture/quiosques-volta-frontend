import { useState } from 'react'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { Switch } from 'tamagui'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { renderWithProvider, renderWithTheme } from '../support/test-utils'

describe('ToggleSwitch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders with switch semantics and checked state', () => {
    renderWithProvider(
      <ToggleSwitch
        accessibilityLabel="SPIN"
        checked
        onCheckedChange={jest.fn()}
        testID="toggle-switch"
      />,
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const track = screen.UNSAFE_getByType(Switch)

    expect(screen.getByLabelText('SPIN')).toBeTruthy()
    expect(track.props.checked).toBe(true)
  })

  it('calls onCheckedChange when pressed', () => {
    const onCheckedChange = jest.fn()

    renderWithProvider(
      <ToggleSwitch
        accessibilityLabel="SPIN"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    )

    fireEvent.press(screen.getByLabelText('SPIN'))

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('updates its checked state when used as a controlled input', () => {
    function ControlledToggleSwitch() {
      const [checked, setChecked] = useState(false)

      return (
        <ToggleSwitch
          accessibilityLabel="SPIN"
          checked={checked}
          onCheckedChange={setChecked}
          testID="toggle-switch"
        />
      )
    }

    renderWithProvider(<ControlledToggleSwitch />)

    fireEvent.press(screen.getByLabelText('SPIN'))

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const track = screen.UNSAFE_getByType(Switch)

    expect(track.props.checked).toBe(true)
  })

  it('uses theme-aware track colors in light mode', () => {
    const view = renderWithTheme(
      <ToggleSwitch
        accessibilityLabel="SPIN"
        checked={false}
        onCheckedChange={jest.fn()}
      />,
      { defaultTheme: 'light' },
    )

    const track = view.UNSAFE_getByType(Switch)
    const thumb = view.UNSAFE_getByType(Switch.Thumb)

    expect(track.props.bg).toBe('$color4')
    expect(track.props.borderColor).toBe('$color8')
    expect(track.props.borderWidth).toBe(1.5)
    expect(track.props.activeStyle).toEqual({
      backgroundColor: '$accent9',
      borderColor: '$accent10',
    })
    expect(thumb.props.bg).toBe('$background')
  })

  it('uses theme-aware track colors in dark mode', () => {
    const view = renderWithTheme(
      <ToggleSwitch
        accessibilityLabel="SPIN"
        checked
        onCheckedChange={jest.fn()}
      />,
      { defaultTheme: 'dark' },
    )

    const track = view.UNSAFE_getByType(Switch)
    const thumb = view.UNSAFE_getByType(Switch.Thumb)

    expect(track.props.bg).toBe('$color5')
    expect(track.props.borderColor).toBe('$color8')
    expect(track.props.activeStyle).toEqual({
      backgroundColor: '$accent10',
      borderColor: '$accent9',
    })
    expect(thumb.props.bg).toBe('$color1')
  })

  it('uses explicit muted colors when disabled', () => {
    const view = renderWithTheme(
      <ToggleSwitch
        accessibilityLabel="SPIN"
        checked={false}
        disabled
        onCheckedChange={jest.fn()}
      />,
      { defaultTheme: 'light' },
    )

    const track = view.UNSAFE_getByType(Switch)
    const thumb = view.UNSAFE_getByType(Switch.Thumb)

    expect(track.props.bg).toBe('$color3')
    expect(track.props.borderColor).toBe('$color6')
    expect(track.props.opacity).toBe(1)
    expect(thumb.props.bg).toBe('$color9')
  })
})
