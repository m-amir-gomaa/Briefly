import { create } from 'zustand';

interface IntakeState {
  rawText: string;
  hasAudio: boolean;
  hasImage: boolean;
  status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  currentIntakeId: string | null;
  setRawText: (text: string) => void;
  setMediaStatus: (audio: boolean, image: boolean) => void;
  setStatus: (status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR') => void;
  setIntakeId: (id: string | null) => void;
  submitIntake: () => Promise<void>;
  subscribeToEvents: (id: string) => void;
  reset: () => void;
}

const API_BASE = '/api/v1';

export const useIntakeStore = create<IntakeState>((set, get) => ({
  rawText: '',
  hasAudio: false,
  hasImage: false,
  status: 'IDLE',
  currentIntakeId: null,
  setRawText: (text) => set({ rawText: text }),
  setMediaStatus: (audio, image) => set({ hasAudio: audio, hasImage: image }),
  setStatus: (status) => set({ status }),
  setIntakeId: (id) => set({ currentIntakeId: id }),

  submitIntake: async () => {
    const { rawText, hasAudio, hasImage } = get();
    set({ status: 'UPLOADING' });

    try {
      const formData = new FormData();
      formData.append('type', (hasAudio || hasImage) ? 'MULTI' : 'TEXT');
      formData.append('raw_text', rawText);
      // In a real demo, these would be actual Blob objects from the UI
      if (hasAudio) formData.append('audio', new Blob(), 'memo.wav');
      if (hasImage) formData.append('image', new Blob(), 'screenshot.png');

      const response = await fetch(`${API_BASE}/intake`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      set({ currentIntakeId: data.id, status: 'PROCESSING' });
      
      // Start listening for the "COMPLETED" event
      get().subscribeToEvents(data.id);
    } catch (error) {
      console.error(error);
      set({ status: 'ERROR' });
    }
  },

  subscribeToEvents: (id) => {
    const eventSource = new EventSource(`${API_BASE}/events/${id}`);
    
    eventSource.onmessage = (event) => {
      console.log('SSE Event:', event.data);
      if (event.data === 'COMPLETED') {
        set({ status: 'COMPLETED' });
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
    };
  },

  reset: () => set({
    rawText: '',
    hasAudio: false,
    hasImage: false,
    status: 'IDLE',
    currentIntakeId: null
  })
}));
