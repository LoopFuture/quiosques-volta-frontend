import { Text } from 'react-native'
import { WalletDetailScreenFrame } from '@/features/wallet/components/WalletDetailScreenFrame'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('@/components/ui', () => {
  const actual = jest.requireActual('@/components/ui')

  return {
    ...actual,
    DetailScreenFrame: jest.fn(() => null),
  }
})

const { DetailScreenFrame: mockDetailScreenFrame } =
  jest.requireMock('@/components/ui')

describe('WalletDetailScreenFrame', () => {
  beforeEach(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('passes the translated back label into the wallet detail frame', () => {
    renderWithProvider(
      <WalletDetailScreenFrame
        description="Descrição"
        testID="wallet-detail-frame"
        title="Carteira"
      >
        <Text>content</Text>
      </WalletDetailScreenFrame>,
    )

    expect(mockDetailScreenFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        backLabel: i18n.t('tabScreens.wallet.common.backLabel'),
      }),
      undefined,
    )
  })
})
