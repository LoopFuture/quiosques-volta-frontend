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
          {
            label: 'Telefone',
            value: '+351 912 345 678',
          },
        ]}
        title="Dados pessoais"
      />,
    )

    expect(screen.getByText('Dados pessoais')).toBeTruthy()
    expect(screen.getByText('lead')).toBeTruthy()

    expect(screen.getByLabelText('Dados pessoais. Joao Ferreira')).toBeTruthy()
    expect(
      screen.getByHintText(
        'Nome: Joao Ferreira. Email: joao@volta.pt. Telefone: +351 912 345 678',
      ),
    ).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Dados pessoais. Joao Ferreira'))
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

  it('renders preview rows on compact layouts with the leading icon omitted', () => {
    const compactSpy = mockWindowDimensions({ width: 320 })
    const onPress = jest.fn()
    const view = renderWithProvider(
      <ProfileSectionCard
        onPress={onPress}
        previewRows={[
          {
            label: 'Email',
            value: 'joao@volta.pt',
          },
          {
            label: 'Telefone',
            value: '+351 912 345 678',
          },
          {
            label: 'Morada',
            value: 'Rua da Volta, 1',
          },
        ]}
        title="Compact card"
      />,
    )

    expect(view.getByText('Compact card')).toBeTruthy()
    expect(view.getByText('Email')).toBeTruthy()
    expect(view.getByText('joao@volta.pt')).toBeTruthy()
    expect(view.getByText('Morada')).toBeTruthy()
    expect(view.getByText('Rua da Volta, 1')).toBeTruthy()
    expect(view.queryByText('lead')).toBeNull()

    compactSpy.mockRestore()
  })

  it('prefers stacked rows when larger text is enabled at regular width', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })
    const onPress = jest.fn()
    const view = renderWithProvider(
      <ProfileSectionCard
        onPress={onPress}
        previewRows={[
          {
            label: 'Email',
            value: 'joao@volta.pt',
          },
          {
            label: 'Telefone',
            value: '+351 912 345 678',
          },
        ]}
        title="Acessibilidade"
      />,
    )

    expect(view.getByText('Acessibilidade')).toBeTruthy()
    expect(view.getByText('Email')).toBeTruthy()
    expect(view.getByText('joao@volta.pt')).toBeTruthy()

    windowSpy.mockRestore()
  })
})
