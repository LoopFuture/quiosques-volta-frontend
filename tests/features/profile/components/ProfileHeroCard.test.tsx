import { screen } from '@testing-library/react-native'
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileHeroCard', () => {
  it('renders hero stats and hides optional rows when they are absent', () => {
    const view = renderWithProvider(
      <ProfileHeroCard
        detailStats={[
          {
            helper: 'helper',
            label: 'Entregas',
            value: '4',
          },
        ]}
        headlineLabel="Créditos"
        headlineValue="1,50 €"
        supportingText="Desde abril de 2023"
        title="Resumo"
      />,
    )

    expect(screen.getByText('Resumo')).toBeTruthy()
    expect(screen.getByText('1,50 €')).toBeTruthy()
    expect(screen.getByText('Entregas')).toBeTruthy()
    expect(screen.getByText('helper')).toBeTruthy()

    view.unmount()

    renderWithProvider(
      <ProfileHeroCard
        headlineLabel="Créditos"
        headlineValue="1,50 €"
        supportingText="Desde abril de 2023"
        title="Resumo"
      />,
    )

    expect(screen.queryByText('Entregas')).toBeNull()
  })
})
