import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, FileText, Image, Mic, Sparkles, Paperclip, X } from 'lucide-react'
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

function ImageThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState('')
  
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  
  if (!url) return <Image className="h-4 w-4 text-zinc-500" />
  return <img src={url} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
}

export default function IntakeComposer({ onNavigate }: IntakeComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([])
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
    () => Boolean((rawText.trim() || audioBlobs.length > 0 || audioFiles.length > 0 || imageFiles.length > 0) && status === 'IDLE'),
    [audioBlobs.length, audioFiles.length, imageFiles.length, rawText, status],
  )

  const handleRecordComplete = (blob: Blob) => {
    setAudioBlobs(prev => [...prev, blob])
    setHasAudio(true)
  }

  const handleRemoveAudio = (index: number) => {
    setAudioBlobs(prev => {
      const next = [...prev]
      next.splice(index, 1)
      if (next.length === 0 && audioFiles.length === 0) setHasAudio(false)
      return next
    })
  }

  const handleRemoveAudioFile = (index: number) => {
    setAudioFiles(prev => {
      const next = [...prev]
      next.splice(index, 1)
      if (next.length === 0 && audioBlobs.length === 0) setHasAudio(false)
      return next
    })
  }

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => {
      const next = [...prev]
      next.splice(index, 1)
      if (next.length === 0) setHasImage(false)
      return next
    })
  }

  const handleNewDraft = () => {
    reset()
    setAudioBlobs([])
    setAudioFiles([])
    setImageFiles([])
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Creative workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-zinc-50">
            Turn loose intake into a client-ready brief
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Capture notes, voice, and visual context in one place. Briefly will structure the messy parts after submission.
          </p>
        </div>

        <Card padded={false} className="overflow-hidden border-white/20 bg-white shadow-sm dark:bg-zinc-900">
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
              className="block min-h-[320px] w-full resize-none border-0 bg-transparent p-0 text-lg leading-8 text-zinc-950 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="sticky bottom-0 border-t border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
            {/* Previews Area */}
            {(imageFiles.length > 0 || audioFiles.length > 0 || audioBlobs.length > 0) && (
              <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                {imageFiles.map((file, idx) => (
                  <div key={`img-${idx}`} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 pl-1.5 pr-3 py-1.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800">
                    <ImageThumbnail file={file} />
                    <span className="max-w-[120px] truncate text-zinc-700 dark:text-zinc-300">{file.name}</span>
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="ml-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {audioFiles.map((file, idx) => (
                  <div key={`af-${idx}`} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 pl-2.5 pr-3 py-1.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800">
                    <Paperclip className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="max-w-[120px] truncate text-zinc-700 dark:text-zinc-300">{file.name}</span>
                    <button type="button" onClick={() => handleRemoveAudioFile(idx)} className="ml-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {audioBlobs.map((blob, idx) => (
                  <div key={`ab-${idx}`} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
                    <Mic className="h-3.5 w-3.5" />
                    <span>Voice memo {idx + 1}</span>
                    <button type="button" onClick={() => handleRemoveAudio(idx)} className="ml-1 text-red-400 hover:text-red-900 dark:hover:text-red-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  className="rounded-full !px-4"
                  onClick={() => document.getElementById('unified-file-input')?.click()}
                  disabled={status !== 'IDLE'}
                  icon={<Paperclip className="h-4 w-4" />}
                >
                  Attach media
                </Button>
                <input
                  type="file"
                  id="unified-file-input"
                  className="hidden"
                  accept="image/*,audio/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      const newImages = files.filter(f => f.type.startsWith('image/'));
                      const newAudio = files.filter(f => f.type.startsWith('audio/'));
                      
                      if (newImages.length > 0) {
                        setImageFiles(prev => [...prev, ...newImages]);
                        setHasImage(true);
                      }
                      if (newAudio.length > 0) {
                        setAudioFiles(prev => [...prev, ...newAudio]);
                        setHasAudio(true);
                      }
                    }
                    e.target.value = '';
                  }}
                />
                <AudioRecorder disabled={status !== 'IDLE'} onRecordComplete={handleRecordComplete} />
              </div>

              <div className="flex items-center gap-3">
                <p className="hidden text-xs text-zinc-500 sm:block">{rawText.length} chars</p>
                <Button
                  size="lg"
                  disabled={!canSubmit}
                  onClick={() => void submitIntake(audioBlobs, audioFiles, imageFiles)}
                  icon={<Sparkles className="h-4 w-4" />}
                  className="w-full rounded-full sm:w-44"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <aside className="space-y-4">
        {(status !== 'IDLE' || currentIntakeId) && (
          <ProcessingChecklist
            status={status}
            hasAudio={audioBlobs.length > 0 || audioFiles.length > 0}
            hasImage={imageFiles.length > 0}
          />
        )}

        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Submission state</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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
