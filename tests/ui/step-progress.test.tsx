import { StepProgress } from '@/components/ui/StepProgress'
import { renderWithProvider } from '../support/test-utils'

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
})
