import { fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ProfileMenuCard } from '@/features/profile/components/ProfileMenuCard'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileMenuCard', () => {
  it('renders pressable profile rows and triggers navigation handlers', () => {
    const onPress = jest.fn()
    const view = renderWithProvider(
      <ProfileMenuCard
        rows={[
          {
            icon: <Text>Person</Text>,
            onPress,
            summary: 'Joao Ferreira',
            title: 'Nome',
          },
          {
            icon: <Text>Wallet</Text>,
            helper: 'Pagamentos instantaneos ativos',
            onPress,
            summary: 'Canal principal',
            title: 'SPIN',
          },
        ]}
      />,
    )

    expect(view.getByText('Person')).toBeTruthy()
    expect(view.getByText('Nome')).toBeTruthy()
    expect(view.getByText('Joao Ferreira')).toBeTruthy()
    expect(view.getByText('SPIN')).toBeTruthy()
    expect(view.getByText('Canal principal')).toBeTruthy()
    expect(view.getByText('Pagamentos instantaneos ativos')).toBeTruthy()

    fireEvent.press(view.getByLabelText('Nome'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders custom summary nodes without requiring helper text', () => {
    const onPress = jest.fn()
    const view = renderWithProvider(
      <ProfileMenuCard
        rows={[
          {
            icon: <Text>Bell</Text>,
            onPress,
            summary: <Text>Avisos por email</Text>,
            title: 'Alertas',
          },
        ]}
      />,
    )

    expect(view.getByText('Bell')).toBeTruthy()
    expect(view.getByText('Alertas')).toBeTruthy()
    expect(view.getByText('Avisos por email')).toBeTruthy()
    expect(view.queryByText('Pagamentos instantaneos ativos')).toBeNull()

    fireEvent.press(view.getByLabelText('Alertas'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
