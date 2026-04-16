import { screen } from '@testing-library/react-native'
import { ProfileSummaryTotalsCard } from '@/features/profile/components/ProfileSummaryTotalsCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileSummaryTotalsCard', () => {
  it('renders totals content and helper copy', () => {
    renderWithProvider(
      <ProfileSummaryTotalsCard
        description="Totais acumulados da tua conta."
        stats={[
          {
            label: 'Embalagens devolvidas',
            value: '30',
          },
          {
            helper: 'Há uma transferência a caminho para o teu IBAN',
            label: 'Transferências concluídas',
            value: '5',
          },
        ]}
        title="Totais"
      />,
    )

    expect(screen.getByText('Totais')).toBeTruthy()
    expect(screen.getByText('30')).toBeTruthy()
    expect(
      screen.getByText('Há uma transferência a caminho para o teu IBAN'),
    ).toBeTruthy()
  })

  it('prefers stacked rows when larger text is enabled', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })

    renderWithProvider(
      <ProfileSummaryTotalsCard
        description="Totais acumulados da tua conta."
        stats={[
          {
            label: 'Transferências em processamento',
            value: '123',
          },
        ]}
        title="Totais"
      />,
    )

    expect(screen.getByText('Transferências em processamento')).toBeTruthy()

    windowSpy.mockRestore()
  })
})
