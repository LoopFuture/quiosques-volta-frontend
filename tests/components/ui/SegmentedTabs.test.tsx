import { useState } from 'react'
import { fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import {
  ScrollView as TamaguiScrollView,
  Text as TamaguiText,
  ToggleGroup,
} from 'tamagui'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import type { SegmentOption } from '@/components/ui/types'
import { renderWithProvider, renderWithTheme } from '@tests/support/test-utils'

const options: SegmentOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagos' },
]

describe('SegmentedTabs', () => {
  function findTabText(
    view: ReturnType<typeof renderWithTheme>,
    label: string,
  ) {
    return view
      .UNSAFE_getAllByType(TamaguiText)
      .find((textNode) => textNode.props.children === label)
  }

  it('updates the selected value when pressed', () => {
    function Harness() {
      const [value, setValue] = useState('all')

      return (
        <>
          <SegmentedTabs
            options={options}
            value={value}
            onValueChange={setValue}
          />
          <Text>{`selected:${value}`}</Text>
        </>
      )
    }

    const view = renderWithProvider(<Harness />)

    fireEvent.press(view.getByText('Pagos'))

    expect(view.getByText('selected:paid')).toBeTruthy()
  })

  it('uses the light-theme active and inactive color pairs', () => {
    const view = renderWithTheme(
      <SegmentedTabs options={options} value="all" />,
      {
        defaultTheme: 'light',
      },
    )
    const [activeTab, inactiveTab] = view.UNSAFE_getAllByType(ToggleGroup.Item)
    const activeText = findTabText(view, 'Todos')
    const inactiveText = findTabText(view, 'Pagos')

    expect(activeTab).toBeTruthy()
    expect(inactiveTab).toBeTruthy()
    expect(activeText).toBeTruthy()
    expect(inactiveText).toBeTruthy()
    expect(activeTab?.props.bg).toBe('$accent9')
    expect(activeTab?.props.borderColor).toBe('$accent10')
    expect(inactiveTab?.props.bg).toBe('$background')
    expect(inactiveTab?.props.borderColor).toBe('$color8')
    expect(activeText?.props.color).toBe('$accent12')
    expect(inactiveText?.props.color).toBe('$color11')
    expect(activeTab?.props.items).toBe('center')
    expect(activeTab?.props.justify).toBe('center')
  })

  it('uses the dark-theme active and inactive color pairs', () => {
    const view = renderWithTheme(
      <SegmentedTabs options={options} value="all" />,
      {
        defaultTheme: 'dark',
      },
    )
    const [activeTab, inactiveTab] = view.UNSAFE_getAllByType(ToggleGroup.Item)
    const activeText = findTabText(view, 'Todos')
    const inactiveText = findTabText(view, 'Pagos')

    expect(activeTab).toBeTruthy()
    expect(inactiveTab).toBeTruthy()
    expect(activeText).toBeTruthy()
    expect(inactiveText).toBeTruthy()
    expect(activeTab?.props.bg).toBe('$accent10')
    expect(activeTab?.props.borderColor).toBe('$accent9')
    expect(inactiveTab?.props.bg).toBe('$background')
    expect(inactiveTab?.props.borderColor).toBe('$color8')
    expect(activeText?.props.color).toBe('$accent1')
    expect(inactiveText?.props.color).toBe('$color11')
    expect(activeTab?.props.items).toBe('center')
    expect(activeTab?.props.justify).toBe('center')
  })

  it('renders the tabs as a horizontal scrollable row', () => {
    const view = renderWithProvider(
      <SegmentedTabs options={options} value="all" />,
    )
    const scrollView = view.UNSAFE_getByType(TamaguiScrollView)

    expect(scrollView.props.horizontal).toBe(true)
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false)
    expect(scrollView.props.style).toEqual({
      flexGrow: 0,
      marginHorizontal: -16,
    })
    expect(scrollView.props.contentContainerStyle).toEqual({
      px: 16,
    })
  })
})
