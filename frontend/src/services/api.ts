export type IntakeType = 'TEXT' | 'VOICE' | 'IMAGE' | 'MULTI'
export type BackendIntakeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface BriefGoal {
  title: string
  detail: string
}

export interface BriefAmbiguity {
  field_missing: string
  reason: string
  suggested_question: string
}

export interface BriefRecord {
  id: string
  intake_id: string
  summary: string
  goals: BriefGoal[]
  success_criteria: string[]
  ambiguities: BriefAmbiguity[]
  followup_questions: string[]
  evidence_map: Record<string, string>
  confidence_score: number
  tone_profile: string
  share_token: string
  is_confirmed: boolean
  confirmed_at?: string | null
  client_name?: string
  created_at?: string
  updated_at?: string
}

export interface IntakeRecord {
  id: string
  user_id?: string
  type: IntakeType
  raw_text: string
  audio_url?: string
  image_url?: string
  status: BackendIntakeStatus
  retry_count?: number
  created_at: string
  updated_at: string
  brief?: BriefRecord | null
}

interface SubmitIntakeInput {
  rawText: string
  audioBlob: Blob | null
  imageFile: File | null
}

interface SubmitIntakeResponse {
  intake_id: string
  status: BackendIntakeStatus
}

interface ConfirmBriefResponse {
  status: string
  confirmed_at: string
  client_name: string
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    let message = response.statusText || 'Request failed'

    try {
      const body = await response.json()
      message = body.error || message
    } catch {
      // Keep the status text when the backend does not return JSON.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

function parseJSONValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback

  if (typeof value === 'string') {
    if (!value.trim()) return fallback

    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  return value as T
}

export function normalizeBrief(raw: unknown): BriefRecord | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>

  return {
    id: String(value.id ?? ''),
    intake_id: String(value.intake_id ?? ''),
    summary: String(value.summary ?? ''),
    goals: parseJSONValue<BriefGoal[]>(value.goals, []),
    success_criteria: parseJSONValue<string[]>(value.success_criteria, []),
    ambiguities: parseJSONValue<BriefAmbiguity[]>(value.ambiguities, []),
    followup_questions: parseJSONValue<string[]>(value.followup_questions, []),
    evidence_map: parseJSONValue<Record<string, string>>(value.evidence_map, {}),
    confidence_score: Number(value.confidence_score ?? 0),
    tone_profile: String(value.tone_profile ?? ''),
    share_token: String(value.share_token ?? ''),
    is_confirmed: Boolean(value.is_confirmed),
    confirmed_at: value.confirmed_at ? String(value.confirmed_at) : null,
    client_name: value.client_name ? String(value.client_name) : '',
    created_at: value.created_at ? String(value.created_at) : undefined,
    updated_at: value.updated_at ? String(value.updated_at) : undefined,
  }
}

export function normalizeIntake(raw: unknown): IntakeRecord {
  const value = raw as Record<string, unknown>

  return {
    id: String(value.id ?? ''),
    user_id: value.user_id ? String(value.user_id) : undefined,
    type: (value.type || 'TEXT') as IntakeType,
    raw_text: String(value.raw_text ?? ''),
    audio_url: value.audio_url ? String(value.audio_url) : undefined,
    image_url: value.image_url ? String(value.image_url) : undefined,
    status: (value.status || 'PENDING') as BackendIntakeStatus,
    retry_count: Number(value.retry_count ?? 0),
    created_at: String(value.created_at ?? ''),
    updated_at: String(value.updated_at ?? ''),
    brief: normalizeBrief(value.brief),
  }
}

export async function submitIntake({
  rawText,
  audioBlob,
  imageFile,
}: SubmitIntakeInput): Promise<SubmitIntakeResponse> {
  const formData = new FormData()
  formData.append('raw_text', rawText)

  if (audioBlob) {
    formData.append('has_audio', 'true')
    formData.append('audio_file', audioBlob, 'briefly-recording.webm')
  }

  if (imageFile) {
    formData.append('has_image', 'true')
    formData.append('image_file', imageFile)
  }

  return apiRequest<SubmitIntakeResponse>('/api/v1/intake', {
    method: 'POST',
    body: formData,
  })
}

export async function getIntake(id: string): Promise<IntakeRecord> {
  const raw = await apiRequest<unknown>(`/api/v1/intake/${id}`)
  return normalizeIntake(raw)
}

export async function getPublicBrief(token: string): Promise<BriefRecord> {
  const raw = await apiRequest<unknown>(`/api/v1/public/brief/${token}`)
  const brief = normalizeBrief(raw)

  if (!brief) {
    throw new Error('Brief not found')
  }

  return brief
}

export async function confirmPublicBrief(
  token: string,
  clientName: string,
): Promise<ConfirmBriefResponse> {
  return apiRequest<ConfirmBriefResponse>(`/api/v1/public/brief/${token}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: clientName }),
  })
}
