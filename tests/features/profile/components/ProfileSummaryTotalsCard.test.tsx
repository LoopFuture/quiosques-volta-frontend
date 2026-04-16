import { screen } from '@testing-library/react-native'
import { ProfileSummaryTotalsCard } from '@/features/profile/components/ProfileSummaryTotalsCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileSummaryTotalsCard', () => {
  it('renders totals content and helper copy', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1, width: 390 })

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
    expect(
      screen.queryAllByText('Há uma transferência a caminho para o teu IBAN'),
    ).toHaveLength(1)

    windowSpy.mockRestore()
  })

  it('renders compact totals with helper text when width is narrow', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1, width: 320 })

    renderWithProvider(
      <ProfileSummaryTotalsCard
        description="Totais acumulados da tua conta."
        stats={[
          {
            helper: 'Há uma transferência a caminho para o teu IBAN',
            label: 'Transferências em processamento',
            value: '123',
          },
        ]}
        title="Totais"
      />,
    )

    expect(screen.getByText('Transferências em processamento')).toBeTruthy()
    expect(screen.getByText('123')).toBeTruthy()
    expect(
      screen.getByText('Há uma transferência a caminho para o teu IBAN'),
    ).toBeTruthy()

    windowSpy.mockRestore()
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
