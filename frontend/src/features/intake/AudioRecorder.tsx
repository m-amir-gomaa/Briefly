import { useRef, useState } from 'react'
import { Mic, MicOff, Upload, X } from 'lucide-react'
import Button from '../../components/ui/Button'

interface AudioRecorderProps {
  audioBlob: Blob | null
  disabled?: boolean
  onChange: (blob: Blob | null) => void
}

function formatBytes(size: number) {
  if (!size) return '0 KB'
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function AudioRecorder({ audioBlob, disabled, onChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const stopRecording = () => {
    recorderRef.current?.stop()
    setIsRecording(false)
  }

  const startRecording = async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is unavailable in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onChange(blob)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setError('Microphone permission was not granted.')
    }
  }

  return (
    <div className="space-y-2">
      {audioBlob ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-950 dark:text-zinc-100">Audio attached</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatBytes(audioBlob.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md p-2 text-zinc-500 transition-all duration-200 ease-in-out hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            aria-label="Remove audio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={isRecording ? 'danger' : 'secondary'}
            onClick={() => (isRecording ? stopRecording() : void startRecording())}
            disabled={disabled}
            icon={isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          >
            {isRecording ? 'Stop' : 'Record'}
          </Button>
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            Upload
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChange(file)
        }}
      />

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
