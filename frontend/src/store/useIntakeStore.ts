import { create } from 'zustand';
import { getIntake, submitIntake as apiSubmitIntake, type IntakeRecord } from '../services/api';

interface IntakeState {
  // --- UI State ---
  rawText: string;
  hasAudio: boolean;
  hasImage: boolean;
  status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  dashboardStatus: 'IDLE' | 'LOADING' | 'ERROR';
  errorMessage: string | null;
  eventMessage: string | null;
  
  // --- Data State ---
  intakes: IntakeRecord[];
  currentIntakeId: string | null;
  currentIntake: IntakeRecord | null;

  // --- Actions ---
  setRawText: (text: string) => void;
  setHasAudio: (val: boolean) => void;
  setHasImage: (val: boolean) => void;
  setMediaStatus: (audio: boolean, image: boolean) => void;
  setStatus: (status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR') => void;
  setIntakeId: (id: string | null) => void;
  
  refreshTrackedIntakes: () => Promise<void>;
  fetchIntake: (id: string) => Promise<IntakeRecord | null>;
  submitIntake: (audioBlobs: Blob[], audioFiles: File[], imageFiles: File[]) => Promise<void>;
  subscribeToEvents: (id: string) => void;
  reset: () => void;
}

const API_BASE = '/api/v1';

export const useIntakeStore = create<IntakeState>((set, get) => ({
  rawText: '',
  hasAudio: false,
  hasImage: false,
  status: 'IDLE',
  dashboardStatus: 'IDLE',
  errorMessage: null,
  eventMessage: null,
  
  intakes: [],
  currentIntakeId: null,
  currentIntake: null,

  setRawText: (text) => set({ rawText: text }),
  setHasAudio: (hasAudio) => set({ hasAudio }),
  setHasImage: (hasImage) => set({ hasImage }),
  setMediaStatus: (audio, image) => set({ hasAudio: audio, hasImage: image }),
  setStatus: (status) => set({ status }),
  setIntakeId: (id) => set({ currentIntakeId: id }),
  
  refreshTrackedIntakes: async () => {
    set({ dashboardStatus: 'LOADING' });
    try {
      const trackedIds = JSON.parse(localStorage.getItem('briefly_tracked_intakes') || '[]');
      if (trackedIds.length === 0) {
        set({ intakes: [], dashboardStatus: 'IDLE' });
        return;
      }

      const results = await Promise.allSettled(
        trackedIds.map((id: string) => getIntake(id))
      );

      const successfulIntakes = results
        .filter((r): r is PromiseFulfilledResult<IntakeRecord> => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      set({ intakes: successfulIntakes, dashboardStatus: 'IDLE' });
    } catch (error) {
      console.error('Failed to refresh intakes:', error);
      set({ dashboardStatus: 'ERROR' });
    }
  },

  fetchIntake: async (id) => {
    try {
      const intake = await getIntake(id);
      set({ currentIntake: intake });
      return intake;
    } catch (error) {
      console.error('Failed to fetch intake:', error);
      return null;
    }
  },

  submitIntake: async (audioBlobs, audioFiles, imageFiles) => {
    const { rawText } = get();
    set({ status: 'UPLOADING', errorMessage: null, eventMessage: null });

    try {
      const data = await apiSubmitIntake({
        rawText,
        audioBlobs,
        audioFiles,
        imageFiles,
      });

      set({ currentIntakeId: data.intake_id, status: 'PROCESSING' });
      
      const tracked = JSON.parse(localStorage.getItem('briefly_tracked_intakes') || '[]');
      localStorage.setItem('briefly_tracked_intakes', JSON.stringify([...new Set([data.intake_id, ...tracked])]));

      get().subscribeToEvents(data.intake_id);
    } catch (error) {
      console.error(error);
      set({ status: 'ERROR', errorMessage: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  subscribeToEvents: (id) => {
    const eventSource = new EventSource(`${API_BASE}/events/${id}`);
    
    eventSource.onmessage = (event) => {
      console.log('SSE Event:', event.data);
      if (event.data === 'COMPLETED' || event.data === 'FAILED') {
        set({ status: event.data === 'COMPLETED' ? 'COMPLETED' : 'ERROR' });
        if (event.data === 'FAILED') set({ errorMessage: 'AI processing failed' });
        void get().refreshTrackedIntakes(); 
        void get().fetchIntake(id); 
        eventSource.close();
      } else {
        set({ eventMessage: event.data });
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      set({ status: 'ERROR', errorMessage: 'Lost connection to update stream' });
      eventSource.close();
    };
  },

  reset: () => set({
    rawText: '',
    hasAudio: false,
    hasImage: false,
    status: 'IDLE',
    currentIntakeId: null,
    currentIntake: null,
    errorMessage: null,
    eventMessage: null
  })
}));
