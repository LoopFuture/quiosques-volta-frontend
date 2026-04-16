import { screen } from '@testing-library/react-native'
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileHeroCard', () => {
  it('renders the hero summary content', () => {
    renderWithProvider(
      <ProfileHeroCard
        headlineLabel="Créditos"
        headlineValue="1,50 €"
        supportingText="Desde abril de 2023"
        title="Resumo"
      />,
    )

    expect(screen.getByText('Resumo')).toBeTruthy()
    expect(screen.getByText('1,50 €')).toBeTruthy()
    expect(screen.getByText('Créditos')).toBeTruthy()
    expect(screen.getByText('Desde abril de 2023')).toBeTruthy()
  })

  it('lets the headline amount expand when larger text is enabled', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })

    renderWithProvider(
      <ProfileHeroCard
        headlineLabel="Créditos"
        headlineValue="12 345,67 €"
        supportingText="Desde abril de 2023"
        title="Resumo"
      />,
    )

    expect(screen.getByText('12 345,67 €').props.numberOfLines).toBeUndefined()

    windowSpy.mockRestore()
  })
})
