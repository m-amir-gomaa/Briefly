import { create } from 'zustand'
import {
  getIntake,
  submitIntake as submitIntakeRequest,
  type IntakeRecord,
} from '../lib/api'

type IntakeFlowStatus = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
type DashboardStatus = 'IDLE' | 'LOADING' | 'READY' | 'ERROR'

const HISTORY_KEY = 'briefly:intake-history'
const HISTORY_LIMIT = 24

let activeEventSource: EventSource | null = null

function readHistory(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeHistory(ids: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(ids.slice(0, HISTORY_LIMIT)))
}

function upsertIntake(records: IntakeRecord[], next: IntakeRecord) {
  const existing = records.filter((record) => record.id !== next.id)
  return [next, ...existing].sort((a, b) => {
    const aTime = new Date(a.created_at || a.updated_at).getTime()
    const bTime = new Date(b.created_at || b.updated_at).getTime()
    return bTime - aTime
  })
}

interface IntakeState {
  rawText: string
  hasAudio: boolean
  hasImage: boolean
  status: IntakeFlowStatus
  dashboardStatus: DashboardStatus
  currentIntakeId: string | null
  currentIntake: IntakeRecord | null
  intakes: IntakeRecord[]
  trackedIds: string[]
  errorMessage: string | null
  eventMessage: string | null

  setRawText: (text: string) => void
  setHasAudio: (value: boolean) => void
  setHasImage: (value: boolean) => void
  submitIntake: (audioBlob: Blob | null, imageFile: File | null) => Promise<void>
  subscribeToEvents: (id: string) => void
  fetchIntake: (id: string) => Promise<IntakeRecord | null>
  refreshTrackedIntakes: () => Promise<void>
  trackIntake: (id: string) => void
  reset: () => void
}

export const useIntakeStore = create<IntakeState>((set, get) => ({
  rawText: '',
  hasAudio: false,
  hasImage: false,
  status: 'IDLE',
  dashboardStatus: 'IDLE',
  currentIntakeId: null,
  currentIntake: null,
  intakes: [],
  trackedIds: readHistory(),
  errorMessage: null,
  eventMessage: null,

  setRawText: (text: string) => set({ rawText: text }),
  setHasAudio: (value: boolean) => set({ hasAudio: value }),
  setHasImage: (value: boolean) => set({ hasImage: value }),

  trackIntake: (id: string) => {
    const ids = [id, ...get().trackedIds.filter((trackedId) => trackedId !== id)]
    const limited = ids.slice(0, HISTORY_LIMIT)
    writeHistory(limited)
    set({ trackedIds: limited })
  },

  fetchIntake: async (id: string) => {
    try {
      const intake = await getIntake(id)

      set((state) => ({
        intakes: upsertIntake(state.intakes, intake),
        currentIntake: intake,
        currentIntakeId: id,
      }))

      return intake
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : 'Unable to load intake',
      })
      return null
    }
  },

  refreshTrackedIntakes: async () => {
    const ids = get().trackedIds

    if (!ids.length) {
      set({ dashboardStatus: 'READY', intakes: [] })
      return
    }

    set({ dashboardStatus: 'LOADING', errorMessage: null })

    const results = await Promise.all(ids.map((id) => getIntake(id).catch(() => null)))
    const records = results.filter((record): record is IntakeRecord => Boolean(record))
    const validIds = records.map((record) => record.id)

    writeHistory(validIds)

    set({
      intakes: records.sort((a, b) => {
        const aTime = new Date(a.created_at || a.updated_at).getTime()
        const bTime = new Date(b.created_at || b.updated_at).getTime()
        return bTime - aTime
      }),
      trackedIds: validIds,
      dashboardStatus: 'READY',
    })
  },

  submitIntake: async (audioBlob: Blob | null, imageFile: File | null) => {
    const { rawText } = get()

    if (!rawText.trim() && !audioBlob && !imageFile) return

    set({
      status: 'UPLOADING',
      currentIntakeId: null,
      currentIntake: null,
      errorMessage: null,
      eventMessage: null,
    })

    try {
      const data = await submitIntakeRequest({ rawText, audioBlob, imageFile })
      const intakeId = data.intake_id

      get().trackIntake(intakeId)

      set({
        status: 'PROCESSING',
        currentIntakeId: intakeId,
        eventMessage: 'Connected to the processing stream.',
      })

      await get().fetchIntake(intakeId)
      get().subscribeToEvents(intakeId)
    } catch (error) {
      set({
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unable to submit intake',
      })
    }
  },

  subscribeToEvents: (id: string) => {
    activeEventSource?.close()

    const eventSource = new EventSource(`/api/v1/events/${id}`)
    activeEventSource = eventSource

    eventSource.onmessage = async (event) => {
      const message = String(event.data || '').trim().toUpperCase()

      if (message === 'COMPLETED') {
        const intake = await get().fetchIntake(id)
        set({
          status: 'COMPLETED',
          currentIntake: intake,
          eventMessage: 'Brief generated and ready for review.',
        })
        eventSource.close()
        activeEventSource = null
        return
      }

      if (message === 'FAILED') {
        await get().fetchIntake(id)
        set({
          status: 'ERROR',
          errorMessage: 'The AI worker could not complete this intake.',
        })
        eventSource.close()
        activeEventSource = null
      }
    }

    eventSource.onerror = async () => {
      const intake = await get().fetchIntake(id)

      if (intake?.status === 'COMPLETED') {
        set({
          status: 'COMPLETED',
          currentIntake: intake,
          eventMessage: 'Brief generated and ready for review.',
        })
      } else if (intake?.status === 'FAILED') {
        set({
          status: 'ERROR',
          errorMessage: 'The AI worker could not complete this intake.',
        })
      } else {
        set({
          eventMessage: 'Processing is still running. Refresh this intake if the stream times out.',
        })
      }

      eventSource.close()
      activeEventSource = null
    }
  },

  reset: () => {
    activeEventSource?.close()
    activeEventSource = null

    set({
      rawText: '',
      hasAudio: false,
      hasImage: false,
      status: 'IDLE',
      currentIntakeId: null,
      currentIntake: null,
      errorMessage: null,
      eventMessage: null,
    })
  },
}))
