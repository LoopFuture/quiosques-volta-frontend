import { fireEvent, screen } from '@testing-library/react-native'
import {
  PreferenceCard,
  SettingsSectionHeader,
  SettingsToggleRow,
} from '@/features/profile/components/ProfilePreferenceControls'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfilePreferenceControls', () => {
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
})
