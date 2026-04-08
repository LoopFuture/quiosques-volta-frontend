import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ProfileDetailScreenFrame } from '@/features/profile/components/ProfileDetailScreenFrame'
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard'
import {
  PreferenceCard,
  SettingsSectionHeader,
  SettingsToggleRow,
} from '@/features/profile/components/ProfilePreferenceControls'
import { ProfileReadinessCard } from '@/features/profile/components/ProfileReadinessCard'
import { ProfileSectionCard } from '@/features/profile/components/ProfileSectionCard'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { mockWindowDimensions } from '../../support/react-native'
import { renderWithProvider } from '../../support/test-utils'

jest.mock('@/components/ui', () => {
  const actual = jest.requireActual('@/components/ui')

  return {
    ...actual,
    DetailScreenFrame: jest.fn(() => null),
  }
})

const { DetailScreenFrame: mockDetailScreenFrame } =
  jest.requireMock('@/components/ui')

describe('profile components', () => {
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

  it('renders setting controls and forwards interaction callbacks', () => {
    const onCheckedChange = jest.fn()
    const onValueChange = jest.fn()

    renderWithProvider(
      <>
        <SettingsSectionHeader
          eyebrow="Eyebrow"
          helperText="Helper"
          title="Security"
        />
        <SettingsToggleRow
          checked={false}
          helperText="Use biometrics"
          label="Biometria"
          onCheckedChange={onCheckedChange}
        />
        <PreferenceCard
          description="Escolhe um tema"
          label="Tema"
          onValueChange={onValueChange}
          options={[
            { label: 'Sistema', value: 'system' },
            { label: 'Escuro', value: 'dark' },
          ]}
          supportingLabel="Atual"
          supportingValue="Sistema"
          value="system"
        />
      </>,
    )

    expect(screen.getByText('Security')).toBeTruthy()
    expect(screen.getByText('Helper')).toBeTruthy()
    expect(screen.getAllByText('Sistema').length).toBeGreaterThan(0)
    expect(screen.getByText('Atual')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Biometria'))
    fireEvent.press(screen.getAllByText('Escuro')[0]!)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(onValueChange).toHaveBeenCalledWith('dark')
  })

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
