import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ProfileSectionCard } from '@/features/profile/components/ProfileSectionCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileSectionCard', () => {
  it('renders section cards in regular and compact layouts and forwards press events', () => {
    const onPress = jest.fn()
    const widthSpy = mockWindowDimensions({ width: 390 })
    const view = renderWithProvider(
      <ProfileSectionCard
        leading={<Text>lead</Text>}
        onPress={onPress}
        previewRows={[
          {
            label: 'Nome',
            value: 'Joao Ferreira',
          },
          {
            label: 'Email',
            value: 'joao@volta.pt',
          },
        ]}
        title="Dados pessoais"
      />,
    )

    expect(screen.getByText('Dados pessoais')).toBeTruthy()
    expect(screen.getByText('lead')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Dados pessoais'))
    expect(onPress).toHaveBeenCalled()

    widthSpy.mockRestore()
    const compactSpy = mockWindowDimensions({ width: 320 })

    view.unmount()

    renderWithProvider(
      <ProfileSectionCard
        onPress={onPress}
        previewRows={[
          {
            label: 'Nome',
            value: 'Joao Ferreira',
          },
        ]}
        title="Compact card"
      />,
    )

    expect(screen.getByText('Compact card')).toBeTruthy()

    compactSpy.mockRestore()
  })
})
