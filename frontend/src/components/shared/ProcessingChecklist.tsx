import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

type FlowStatus = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'

interface ProcessingChecklistProps {
  status: FlowStatus
  hasAudio?: boolean
  hasImage?: boolean
}

interface Step {
  label: string
  activeWhen: FlowStatus[]
  completeWhen: FlowStatus[]
}

export default function ProcessingChecklist({
  status,
  hasAudio = false,
  hasImage = false,
}: ProcessingChecklistProps) {
  const mediaLabel = hasAudio && hasImage
    ? 'Transcribing audio and reading image'
    : hasAudio
      ? 'Transcribing audio'
      : hasImage
        ? 'Reading image'
        : 'Normalizing text'

  const steps: Step[] = [
    {
      label: 'Uploading payload',
      activeWhen: ['UPLOADING'],
      completeWhen: ['PROCESSING', 'COMPLETED'],
    },
    {
      label: mediaLabel,
      activeWhen: ['PROCESSING'],
      completeWhen: ['COMPLETED'],
    },
    {
      label: 'AI extracting goals',
      activeWhen: ['PROCESSING'],
      completeWhen: ['COMPLETED'],
    },
    {
      label: 'Preparing client brief',
      activeWhen: ['PROCESSING'],
      completeWhen: ['COMPLETED'],
    },
  ]

  return (
    <div className="rounded-xl border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-950">Processing pipeline</p>
        <span className="text-xs font-medium text-zinc-500">SSE connected</span>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isComplete = step.completeWhen.includes(status)
          const isActive = !isComplete && step.activeWhen.includes(status)

          return (
            <div key={step.label} className="flex items-center gap-3 rounded-md px-1 py-1.5">
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-700" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-zinc-300" />
              )}
              <span
                className={[
                  'text-sm',
                  isComplete ? 'font-semibold text-zinc-950' : '',
                  isActive ? 'font-semibold text-amber-800' : '',
                  !isComplete && !isActive ? 'text-zinc-500' : '',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
