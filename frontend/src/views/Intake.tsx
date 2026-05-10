import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  FileAudio,
  FilePlus2,
  FileText,
  Image,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Upload,
  X,
} from 'lucide-react'
import { useIntakeStore } from '../store/useIntakeStore'

interface IntakeViewProps {
  onNavigate: (path: string) => void
}

function formatBytes(size: number) {
  if (!size) return '0 KB'
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function IntakeView({ onNavigate }: IntakeViewProps) {
  const {
    rawText,
    hasAudio,
    hasImage,
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

  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const canSubmit = useMemo(
    () => Boolean((rawText.trim() || audioBlob || imageFile) && status === 'IDLE'),
    [audioBlob, imageFile, rawText, status],
  )

  const isBusy = status === 'UPLOADING' || status === 'PROCESSING'

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const startRecording = async () => {
    setRecordingError(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Audio recording is not available in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setHasAudio(true)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      setRecordingError('Microphone permission was not granted.')
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
      return
    }

    void startRecording()
  }

  const selectAudioFile = (file: File) => {
    setAudioBlob(file)
    setHasAudio(true)
    setRecordingError(null)
  }

  const removeAudio = () => {
    if (isRecording) stopRecording()
    setAudioBlob(null)
    setHasAudio(false)
  }

  const selectImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setHasImage(true)
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setHasImage(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) selectImageFile(file)
  }

  const handleSubmit = async () => {
    await submitIntake(audioBlob, imageFile)
  }

  const handleReset = () => {
    reset()
    removeAudio()
    removeImage()
    setRecordingError(null)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
              New intake
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 sm:text-4xl">
              Capture the raw client signal
            </h1>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-400 hover:text-ink-950"
          >
            <RefreshCw className="h-4 w-4" />
            Dashboard
          </button>
        </div>

        <AnimatePresence>
          {status !== 'IDLE' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-lg border p-4 shadow-sm ${
                status === 'ERROR'
                  ? 'border-red-100 bg-red-100 text-red-600'
                  : status === 'COMPLETED'
                    ? 'border-teal-100 bg-teal-100 text-teal-600'
                    : 'border-brand-100 bg-brand-100 text-brand-700'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  {isBusy && <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />}
                  {status === 'COMPLETED' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                  {status === 'ERROR' && <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold">
                      {status === 'UPLOADING' && 'Submitting intake'}
                      {status === 'PROCESSING' && 'Processing intake'}
                      {status === 'COMPLETED' && 'Brief generated'}
                      {status === 'ERROR' && 'Intake failed'}
                    </p>
                    <p className="mt-1 text-sm opacity-80">
                      {status === 'ERROR'
                        ? errorMessage || 'The backend returned an error.'
                        : eventMessage || 'Waiting for the worker event stream.'}
                    </p>
                    {currentIntakeId && (
                      <p className="mt-2 font-mono text-xs opacity-70">{currentIntakeId}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentIntakeId && (
                    <button
                      type="button"
                      onClick={() => onNavigate(`/intake/${currentIntakeId}`)}
                      className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-ink-950 shadow-sm"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Open Intake
                    </button>
                  )}
                  {(status === 'COMPLETED' || status === 'ERROR') && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                      New Intake
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="intake-text-input" className="flex items-center gap-2 text-sm font-semibold text-ink-950">
              <FileText className="h-4 w-4 text-brand-700" />
              Text notes
            </label>
            <span className="font-mono text-xs text-ink-500">{rawText.length} chars</span>
          </div>

          <textarea
            id="intake-text-input"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Paste client notes, transcripts, emails, or requirements..."
            rows={13}
            disabled={status !== 'IDLE'}
            className="min-h-[300px] w-full resize-y rounded-lg border border-line bg-canvas px-4 py-3 text-sm leading-6 text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand-600 focus:bg-surface focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-950">Attachments</h2>
          <p className="mt-1 text-sm text-ink-500">Voice memo and whiteboard capture are optional.</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-line bg-canvas p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4 text-ink-700" />
                  <span className="text-sm font-semibold text-ink-950">Audio</span>
                </div>
                {hasAudio && (
                  <button
                    type="button"
                    onClick={removeAudio}
                    className="rounded-lg p-1.5 text-ink-500 transition hover:bg-surface hover:text-ink-950"
                    aria-label="Remove audio"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {audioBlob ? (
                <div className="mt-3 rounded-lg bg-surface px-3 py-2 text-sm text-ink-600">
                  <span className="font-semibold text-ink-950">Attached</span>
                  <span className="ml-2 text-xs text-ink-500">{formatBytes(audioBlob.size)}</span>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={status !== 'IDLE'}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      isRecording
                        ? 'bg-red-100 text-red-600'
                        : 'border border-line bg-surface text-ink-700 hover:border-ink-400'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Stop' : 'Record'}
                  </button>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={status !== 'IDLE'}
                    className="flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-400"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                </div>
              )}

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) selectAudioFile(file)
                }}
              />

              {recordingError && (
                <p className="mt-2 text-xs font-medium text-red-600">{recordingError}</p>
              )}
            </div>

            <div className="rounded-lg border border-line bg-canvas p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-ink-700" />
                  <span className="text-sm font-semibold text-ink-950">Image</span>
                </div>
                {hasImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded-lg p-1.5 text-ink-500 transition hover:bg-surface hover:text-ink-950"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {imagePreview && imageFile ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
                  <img src={imagePreview} alt="" className="h-36 w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-ink-500">
                    <span className="truncate">{imageFile.name}</span>
                    <span className="shrink-0">{formatBytes(imageFile.size)}</span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => imageInputRef.current?.click()}
                  className={`mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition ${
                    dragOver
                      ? 'border-brand-600 bg-brand-100 text-brand-700'
                      : 'border-line bg-surface text-ink-500 hover:border-ink-400 hover:text-ink-800'
                  }`}
                >
                  <Upload className="h-5 w-5" />
                  <p className="mt-2 text-sm font-semibold">Drop image</p>
                  <p className="mt-1 text-xs">PNG, JPG, or WebP</p>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) selectImageFile(file)
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-950">Submission</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-500">Text</span>
              <span className="font-semibold text-ink-950">{rawText.trim() ? 'Ready' : 'Empty'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-500">Audio</span>
              <span className="font-semibold text-ink-950">{audioBlob ? 'Attached' : 'None'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-500">Image</span>
              <span className="font-semibold text-ink-950">{imageFile ? 'Attached' : 'None'}</span>
            </div>
          </div>

          {isBusy && (
            <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-brand-100 progress-stripe" />
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              canSubmit
                ? 'bg-ink-950 text-white shadow-sm hover:bg-ink-800'
                : 'bg-surface-muted text-ink-400'
            }`}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Generate Brief
          </button>

          {currentIntake?.brief?.share_token && (
            <button
              type="button"
              onClick={() => onNavigate(`/public/brief/${currentIntake.brief?.share_token}`)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink-700 transition hover:border-ink-400"
            >
              <CheckCircle2 className="h-4 w-4" />
              Public Brief
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
