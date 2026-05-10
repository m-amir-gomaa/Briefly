import { useMemo, useRef, useState } from 'react'
import { ArrowRight, FileText, Image, Mic, Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ProcessingChecklist from '../../components/shared/ProcessingChecklist'
import useAutosizeTextarea from '../../hooks/useAutosizeTextarea'
import { useIntakeStore } from '../../store/useIntakeStore'
import AudioRecorder from './AudioRecorder'
import ImageDropzone from './ImageDropzone'

interface IntakeComposerProps {
  onNavigate: (path: string) => void
}

export default function IntakeComposer({ onNavigate }: IntakeComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const {
    rawText,
    status,
    currentIntakeId,
    currentIntake,
    errorMessage,
    eventMessage,
    setRawText,
    setHasAudio,
    setHasImage,
    submitIntake,
    reset,
  } = useIntakeStore()

  useAutosizeTextarea(textareaRef, rawText)

  const isBusy = status === 'UPLOADING' || status === 'PROCESSING'
  const canSubmit = useMemo(
    () => Boolean((rawText.trim() || audioBlob || imageFile) && status === 'IDLE'),
    [audioBlob, imageFile, rawText, status],
  )

  const handleAudioChange = (blob: Blob | null) => {
    setAudioBlob(blob)
    setHasAudio(Boolean(blob))
  }

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    setHasImage(Boolean(file))
  }

  const handleNewDraft = () => {
    reset()
    setAudioBlob(null)
    setImageFile(null)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Creative workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
            Turn loose intake into a client-ready brief
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Capture notes, voice, and visual context in one place. Briefly will structure the messy parts after submission.
          </p>
        </div>

        <Card padded={false} className="overflow-hidden border-white/20 bg-white shadow-sm">
          <div className="px-5 pt-5">
            <label htmlFor="intake-composer" className="sr-only">
              Intake notes
            </label>
            <textarea
              ref={textareaRef}
              id="intake-composer"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste meeting notes, client messages, project context, or requirements..."
              disabled={status !== 'IDLE'}
              className="block min-h-[320px] w-full resize-none border-0 bg-transparent p-0 text-lg leading-8 text-zinc-950 outline-none placeholder:text-zinc-400 disabled:opacity-60"
            />
          </div>

          <div className="sticky bottom-0 border-t border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur-xl">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <Mic className="h-3.5 w-3.5" />
                  Audio
                </div>
                <AudioRecorder audioBlob={audioBlob} disabled={status !== 'IDLE'} onChange={handleAudioChange} />
              </div>

              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <Image className="h-3.5 w-3.5" />
                  Image
                </div>
                <ImageDropzone imageFile={imageFile} disabled={status !== 'IDLE'} onChange={handleImageChange} />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  disabled={!canSubmit}
                  onClick={() => void submitIntake(audioBlob, imageFile)}
                  icon={<Sparkles className="h-4 w-4" />}
                  className="w-full lg:w-44"
                >
                  Generate
                </Button>
                <p className="text-center text-xs text-zinc-500">{rawText.length} chars</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <aside className="space-y-4">
        {(status !== 'IDLE' || currentIntakeId) && (
          <ProcessingChecklist
            status={status}
            hasAudio={Boolean(audioBlob)}
            hasImage={Boolean(imageFile)}
          />
        )}

        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">Submission state</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {status === 'IDLE' && 'Add at least one input to generate a brief.'}
                {status === 'UPLOADING' && 'Uploading payload to the Go API.'}
                {status === 'PROCESSING' && (eventMessage || 'Waiting for worker completion through SSE.')}
                {status === 'COMPLETED' && 'The brief is ready for review.'}
                {status === 'ERROR' && (errorMessage || 'The intake could not be processed.')}
              </p>
              {currentIntakeId && (
                <p className="mt-3 break-all font-mono text-xs text-zinc-500">{currentIntakeId}</p>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {currentIntakeId && (
              <Button
                variant="secondary"
                onClick={() => onNavigate(`/intake/${currentIntakeId}`)}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Open review
              </Button>
            )}
            {currentIntake?.brief?.share_token && (
              <Button
                variant="secondary"
                onClick={() => onNavigate(`/public/${currentIntake.brief?.share_token}`)}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Open public brief
              </Button>
            )}
            {(status === 'COMPLETED' || status === 'ERROR') && (
              <Button variant="ghost" onClick={handleNewDraft}>
                Start another intake
              </Button>
            )}
          </div>
        </Card>
      </aside>
    </div>
  )
}
