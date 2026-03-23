import { Progress, Text, XStack, YStack } from 'tamagui'

export type StepProgressProps = {
  currentStep: number
  label: string
  totalSteps: number
  valueLabel?: string
}

export function StepProgress({
  currentStep,
  label,
  totalSteps,
  valueLabel,
}: StepProgressProps) {
  const clampedStep = Math.max(0, Math.min(currentStep, totalSteps))
  const fallbackValueLabel = `Passo ${clampedStep} de ${totalSteps}`
  const progressMax = Math.max(totalSteps, 1)

  return (
    <YStack gap="$2">
      <XStack items="center" justify="space-between" gap="$3">
        <Text fontSize={14} fontWeight="700">
          {label}
        </Text>
        <Text color="$color11" fontSize={14}>
          {valueLabel ?? fallbackValueLabel}
        </Text>
      </XStack>
      <Progress
        bg="$borderColor"
        getValueLabel={() => valueLabel ?? fallbackValueLabel}
        height={6}
        max={progressMax}
        overflow="hidden"
        rounded={999}
        unstyled
        value={totalSteps === 0 ? 0 : clampedStep}
      >
        <Progress.Indicator
          bg="$accent9"
          height="100%"
          rounded={999}
          unstyled
        />
      </Progress>
    </YStack>
  )
}
