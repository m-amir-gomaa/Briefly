import IntakeComposer from '../features/intake/IntakeComposer'

interface IntakeViewProps {
  onNavigate: (path: string) => void
}

export default function IntakeView({ onNavigate }: IntakeViewProps) {
  return <IntakeComposer onNavigate={onNavigate} />
}
