import { fireEvent, screen } from '@testing-library/react-native'
import { ProfileReadinessCard } from '@/features/profile/components/ProfileReadinessCard'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileReadinessCard', () => {
  it('renders readiness actions and all readiness item icon branches', () => {
    const firstAction = jest.fn()
    const secondAction = jest.fn()

    renderWithProvider(
      <ProfileReadinessCard
        actions={[
          {
            label: 'Primary action',
            onPress: firstAction,
          },
          {
            label: 'Secondary action',
            onPress: secondAction,
          },
        ]}
        badgeLabel="Conta pronta"
        badgeTone="success"
        description="A tua conta está pronta."
        items={[
          {
            id: 'payments',
            label: 'Pagamentos',
            tone: 'success',
            value: 'SPIN ativo',
          },
          {
            id: 'security',
            label: 'Segurança',
            tone: 'warning',
            value: 'Ativa a biometria',
          },
          {
            id: 'alerts',
            label: 'Alertas',
            tone: 'success',
            value: 'E-mail + push ativos',
          },
        ]}
        title="Rever conta"
      />,
    )

    expect(screen.getByTestId('profile-readiness-card')).toBeTruthy()
    expect(screen.getByText('Pagamentos')).toBeTruthy()
    expect(screen.getByText('Segurança')).toBeTruthy()
    expect(screen.getByText('Alertas')).toBeTruthy()

    fireEvent.press(screen.getByText('Primary action'))
    fireEvent.press(screen.getByText('Secondary action'))

    expect(firstAction).toHaveBeenCalled()
    expect(secondAction).toHaveBeenCalled()
  })
})
