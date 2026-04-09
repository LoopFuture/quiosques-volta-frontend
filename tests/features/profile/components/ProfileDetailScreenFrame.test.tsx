import { Text } from 'react-native'
import { ProfileDetailScreenFrame } from '@/features/profile/components/ProfileDetailScreenFrame'
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

describe('ProfileDetailScreenFrame', () => {
  beforeEach(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('passes the translated back label and keyboard-aware mode into the detail frame', () => {
    renderWithProvider(
      <ProfileDetailScreenFrame
        description="Descrição"
        testID="profile-detail-frame"
        title="Perfil"
      >
        <Text>content</Text>
      </ProfileDetailScreenFrame>,
    )

    expect(mockDetailScreenFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        backLabel: i18n.t('tabScreens.profile.common.backLabel'),
        keyboardAware: true,
      }),
      undefined,
    )
  })
})
