import { StepProgress } from '@/components/ui/StepProgress'
import { Progress } from 'tamagui'
import { renderWithProvider } from '@tests/support/test-utils'

describe('StepProgress', () => {
  it('renders the current progress label', () => {
    const view = renderWithProvider(
      <StepProgress
        currentStep={2}
        label="Progresso do registo"
        totalSteps={5}
      />,
    )

    expect(view.getByText('Progresso do registo')).toBeTruthy()
    expect(view.getByText('Passo 2 de 5')).toBeTruthy()
  })

  it('clamps empty progress values to zero', () => {
    const view = renderWithProvider(
      <StepProgress
        currentStep={3}
        label="Progresso do registo"
        totalSteps={0}
      />,
    )

    const progress = view.UNSAFE_getByType(Progress)

    expect(view.getByText('Passo 0 de 0')).toBeTruthy()
    expect(progress.props.value).toBe(0)
  })
})
