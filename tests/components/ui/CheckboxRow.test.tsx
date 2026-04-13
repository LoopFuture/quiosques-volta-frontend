import { fireEvent } from '@testing-library/react-native'
import { CheckboxRow } from '@/components/ui/CheckboxRow'
import { renderWithProvider } from '@tests/support/test-utils'

describe('CheckboxRow', () => {
  it('renders copy and toggles on press', () => {
    const onCheckedChange = jest.fn()
    const view = renderWithProvider(
      <CheckboxRow
        checked={false}
        description="Confirma os termos do registo."
        label="Aceito os termos."
        onCheckedChange={onCheckedChange}
      />,
    )

    fireEvent.press(view.getByText('Aceito os termos.'))

    expect(view.getByText('Aceito os termos.')).toBeTruthy()
    expect(view.getByText('Confirma os termos do registo.')).toBeTruthy()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('renders rows without descriptions', () => {
    const view = renderWithProvider(
      <CheckboxRow checked label="Aceito os termos." />,
    )

    expect(view.getByText('Aceito os termos.')).toBeTruthy()
    expect(view.queryByText('Confirma os termos do registo.')).toBeNull()
  })
})
