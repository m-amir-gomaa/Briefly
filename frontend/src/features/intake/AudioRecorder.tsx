import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Pause, Play } from 'lucide-react'
import Button from '../../components/ui/Button'

interface AudioRecorderProps {
  disabled?: boolean
  onRecordComplete: (blob: Blob) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioRecorder({ disabled, onRecordComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timeIntervalRef = useRef<number | null>(null)
  const historyRef = useRef<number[]>([])

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
  }

  const togglePause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause()
      setIsPaused(true)
      if (audioCtxRef.current?.state === 'running') {
        audioCtxRef.current.suspend().catch(() => {})
      }
    } else if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume()
      setIsPaused(false)
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
    }
  }

  const startRecording = async () => {
    setError(null)
    setRecordingTime(0)
    setIsPaused(false)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is unavailable in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      historyRef.current = new Array(30).fill(2)

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecordComplete(blob)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)

      const startTime = Date.now()
      let totalPausedTime = 0
      let lastPauseStart = 0

      timeIntervalRef.current = window.setInterval(() => {
        if (recorderRef.current?.state === 'paused') {
          if (lastPauseStart === 0) lastPauseStart = Date.now()
          return
        }
        if (lastPauseStart > 0) {
          totalPausedTime += Date.now() - lastPauseStart
          lastPauseStart = 0
        }
        setRecordingTime(Math.floor((Date.now() - startTime - totalPausedTime) / 1000))
      }, 1000)

      // Set up visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyzer = audioCtx.createAnalyser()
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyzer)
      analyzer.fftSize = 256
      
      audioCtxRef.current = audioCtx
      analyzerRef.current = analyzer
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount)
      
      const updateVisualizer = () => {
        if (!analyzerRef.current) return

        if (recorderRef.current?.state === 'recording') {
          analyzerRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          
          historyRef.current.push(Math.max(2, (avg / 255) * 100))
          if (historyRef.current.length > 30) {
            historyRef.current.shift()
          }
        }

        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = '#ef4444'
            
            const barWidth = 3
            const gap = 2
            const totalWidth = 30 * (barWidth + gap)
            
            let x = canvas.width - totalWidth
            for (let i = 0; i < historyRef.current.length; i++) {
              let h = historyRef.current[i]
              // prevent overflowing the canvas height
              h = Math.min(h, canvas.height)
              const y = (canvas.height - h) / 2
              
              ctx.fillRect(x, y, barWidth, h)
              
              x += barWidth + gap
            }
          }
        }
        
        animationRef.current = requestAnimationFrame(updateVisualizer)
      }
      
      updateVisualizer()
    } catch {
      setError('Microphone permission was not granted.')
    }
  }

  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="flex items-center">
      {isRecording ? (
        <div className="flex items-center gap-3 rounded-full bg-red-50 pl-4 pr-1.5 py-1.5 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50">
          {isPaused ? (
            <div className="h-2.5 w-2.5 rounded-full bg-red-400 dark:bg-red-600" />
          ) : (
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600 dark:bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
          )}
          <span className="text-sm font-medium tabular-nums w-9">{formatTime(recordingTime)}</span>
          
          <div className="relative h-6 w-[150px] overflow-hidden">
            <canvas ref={canvasRef} width={150} height={24} className="absolute inset-0 h-full w-full opacity-80" />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={togglePause}
              className="rounded-full p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors bg-white/50 dark:bg-black/20 active:scale-95"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-full p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors bg-white/50 dark:bg-black/20 active:scale-95"
              title="Stop recording"
            >
              <MicOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={() => void startRecording()}
          disabled={disabled}
          className="rounded-full !px-4"
          icon={<Mic className="h-4 w-4" />}
        >
          Record Voice
        </Button>
      )}
      {error && <span className="ml-3 text-xs text-red-600">{error}</span>}
    </div>
  )
}
