import { create } from 'zustand'

type IntakeStatus = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'

interface IntakeState {
  rawText: string
  hasAudio: boolean
  hasImage: boolean
  status: IntakeStatus
  currentIntakeId: string | null

  setRawText: (text: string) => void
  submitIntake: (audioBlob: Blob | null, imageFile: File | null) => Promise<void>
  subscribeToEvents: (id: string) => void
  reset: () => void
}

export const useIntakeStore = create<IntakeState>((set, get) => ({
  rawText: '',
  hasAudio: false,
  hasImage: false,
  status: 'IDLE',
  currentIntakeId: null,

  setRawText: (text: string) => set({ rawText: text }),

  submitIntake: async (audioBlob: Blob | null, imageFile: File | null) => {
    const { rawText, hasAudio, hasImage } = get()

    set({ status: 'UPLOADING' })

    try {
      // Build multipart form data
      const formData = new FormData()
      formData.append('raw_text', rawText)

      // Determine type
      let type = 'TEXT'
      if (hasAudio && hasImage) type = 'MULTI'
      else if (hasAudio) type = 'VOICE'
      else if (hasImage) type = 'IMAGE'
      formData.append('type', type)

      if (hasAudio && audioBlob) {
        formData.append('has_audio', 'true')
        formData.append('audio_file', audioBlob, 'recording.webm')
      }

      if (hasImage && imageFile) {
        formData.append('has_image', 'true')
        formData.append('image_file', imageFile)
      }

      // POST to API
      const response = await fetch('/api/v1/intake', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`)
      }

      const data = await response.json()
      const intakeId = data.intake_id

      set({
        status: 'PROCESSING',
        currentIntakeId: intakeId,
      })

      // Subscribe to SSE events
      get().subscribeToEvents(intakeId)

    } catch (error) {
      console.error('Submit error:', error)
      set({ status: 'ERROR' })
    }
  },

  subscribeToEvents: (id: string) => {
    const eventSource = new EventSource(`/api/v1/events/${id}`)

    eventSource.onmessage = (event) => {
      const data = event.data

      if (data === 'COMPLETED') {
        set({ status: 'COMPLETED' })
        eventSource.close()
      } else if (data === 'FAILED') {
        set({ status: 'ERROR' })
        eventSource.close()
      }
      // PROCESSING events keep the current state
    }

    eventSource.onerror = () => {
      // SSE connection error — could be timeout or server disconnect
      console.warn('SSE connection error for intake:', id)
      eventSource.close()
    }
  },

  reset: () => {
    set({
      rawText: '',
      hasAudio: false,
      hasImage: false,
      status: 'IDLE',
      currentIntakeId: null,
    })
  },
}))
