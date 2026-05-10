import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Mic,
  MicOff,
  Image,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react'
import { useIntakeStore } from '../store/useIntakeStore'

interface IntakeViewProps {
  onNavigate: (path: string) => void
}

export default function IntakeView({ onNavigate }: IntakeViewProps) {
  const {
    rawText, setRawText,
    hasAudio, hasImage,
    status, currentIntakeId,
    submitIntake, reset,
  } = useIntakeStore()

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Audio Recording ──────────────────────────────────────
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        useIntakeStore.setState({ hasAudio: true })
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const removeAudio = () => {
    setAudioBlob(null)
    useIntakeStore.setState({ hasAudio: false })
  }

  // ── Image Handling ───────────────────────────────────────
  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    useIntakeStore.setState({ hasImage: true })
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    useIntakeStore.setState({ hasImage: false })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageSelect(file)
  }

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    await submitIntake(audioBlob, imageFile)
  }

  const handleReset = () => {
    reset()
    setAudioBlob(null)
    setImageFile(null)
    setImagePreview(null)
    setIsRecording(false)
  }

  const canSubmit = (rawText.trim() || hasAudio || hasImage) && status === 'IDLE'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-50">New Intake</h1>
        <p className="text-surface-400 mt-1">
          Paste text, record audio, or drop an image — we'll turn it into a structured brief.
        </p>
      </div>

      {/* Status Banner */}
      <AnimatePresence>
        {status !== 'IDLE' && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`rounded-2xl p-5 flex items-center gap-4 ${
              status === 'UPLOADING' || status === 'PROCESSING'
                ? 'glass border-brand-500/20'
                : status === 'COMPLETED'
                  ? 'glass border-success-400/20'
                  : 'glass border-danger-400/20'
            }`}>
              {(status === 'UPLOADING' || status === 'PROCESSING') && (
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin shrink-0" />
              )}
              {status === 'COMPLETED' && (
                <CheckCircle2 className="w-6 h-6 text-success-400 shrink-0" />
              )}
              {status === 'ERROR' && (
                <AlertCircle className="w-6 h-6 text-danger-400 shrink-0" />
              )}

              <div className="flex-1">
                <p className="font-semibold text-surface-100">
                  {status === 'UPLOADING' && 'Submitting intake...'}
                  {status === 'PROCESSING' && 'AI is analyzing your intake...'}
                  {status === 'COMPLETED' && 'Brief generated successfully!'}
                  {status === 'ERROR' && 'Something went wrong.'}
                </p>
                {currentIntakeId && (
                  <p className="text-xs text-surface-400 mt-1 font-mono">
                    ID: {currentIntakeId}
                  </p>
                )}
              </div>

              {status === 'COMPLETED' && (
                <button
                  onClick={() => onNavigate('/')}
                  className="px-4 py-2 rounded-xl bg-success-400/10 text-success-400 text-sm font-medium hover:bg-success-400/20 transition-colors cursor-pointer"
                >
                  View Dashboard
                </button>
              )}

              {(status === 'COMPLETED' || status === 'ERROR') && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-surface-800 text-surface-300 text-sm font-medium hover:bg-surface-700 transition-colors cursor-pointer"
                >
                  New Intake
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-surface-100">Text Input</h2>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste client notes, meeting transcripts, project requirements, or any freeform text here..."
          rows={8}
          className="w-full bg-surface-900/50 border border-surface-700/50 rounded-xl p-4 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 resize-none transition-all text-sm leading-relaxed"
          disabled={status !== 'IDLE'}
          id="intake-text-input"
        />

        <div className="flex items-center justify-between text-xs text-surface-500">
          <span>{rawText.length} characters</span>
          <span>Supports any format: notes, emails, chat logs, etc.</span>
        </div>
      </div>

      {/* Audio + Image Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audio Recorder */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-accent-400" />
            <h2 className="text-lg font-semibold text-surface-100">Audio</h2>
          </div>

          {!audioBlob ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleRecording}
              disabled={status !== 'IDLE'}
              className={`w-full py-12 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-3 cursor-pointer ${
                isRecording
                  ? 'border-danger-400/50 bg-danger-400/5'
                  : 'border-surface-700/50 hover:border-accent-400/30 hover:bg-accent-400/5'
              }`}
              id="audio-record-btn"
            >
              {isRecording ? (
                <>
                  <div className="relative">
                    <MicOff className="w-8 h-8 text-danger-400" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger-400 rounded-full animate-pulse-soft" />
                  </div>
                  <span className="text-sm text-danger-400 font-medium">Recording... Click to stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 text-surface-400" />
                  <span className="text-sm text-surface-400">Click to record audio</span>
                </>
              )}
            </motion.button>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-400/5 border border-accent-400/20">
              <Mic className="w-5 h-5 text-accent-400" />
              <span className="text-sm text-surface-200 flex-1">Audio recorded</span>
              <button
                onClick={removeAudio}
                className="p-1.5 rounded-lg hover:bg-surface-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-surface-400" />
              </button>
            </div>
          )}
        </div>

        {/* Image Drop Zone */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-success-400" />
            <h2 className="text-lg font-semibold text-surface-100">Image</h2>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageSelect(file)
            }}
          />

          {!imagePreview ? (
            <motion.div
              whileHover={{ scale: 1.01 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-12 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-3 cursor-pointer ${
                dragOver
                  ? 'border-success-400/50 bg-success-400/5'
                  : 'border-surface-700/50 hover:border-success-400/30 hover:bg-success-400/5'
              }`}
              id="image-drop-zone"
            >
              <Upload className="w-8 h-8 text-surface-400" />
              <span className="text-sm text-surface-400">Drop image or click to browse</span>
            </motion.div>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-900/80 hover:bg-surface-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-surface-300" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={canSubmit ? { scale: 1.01 } : {}}
        whileTap={canSubmit ? { scale: 0.99 } : {}}
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer ${
          canSubmit
            ? 'gradient-brand text-white shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30'
            : 'bg-surface-800 text-surface-500 cursor-not-allowed'
        }`}
        id="submit-intake-btn"
      >
        <Sparkles className="w-5 h-5" />
        Generate Brief
        <Send className="w-5 h-5" />
      </motion.button>
    </div>
  )
}
