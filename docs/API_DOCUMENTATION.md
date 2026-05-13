# Briefly API Documentation (v1)

The Briefly API is a high-performance RESTful interface designed for real-time project brief extraction. It handles multi-modal ingestion (voice, image, text), orchestrates AI processing, and provides live feedback via Server-Sent Events (SSE).

## 1. Authentication
Currently, the system uses a shared "Demo Account" model for the hackathon. All intakes are associated with a default professional profile. Custom API keys are managed server-side via environment variables.

---

## 2. Ingestion API

### `POST /api/v1/intake`
Uploads raw project context and initiates the AI processing pipeline.

**Content-Type**: `multipart/form-data`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `raw_text` | string | No | Plain text project description. |
| `audio_file` | file | No | Audio recording (WebM/WAV/MP3). |
| `image_file` | file | No | Image of sketches or notes (JPG/PNG). |
| `has_audio` | boolean | No | Set to `true` if uploading an audio file. |
| `has_image` | boolean | No | Set to `true` if uploading an image file. |

**Success Response (202 Accepted)**
```json
{
  "intake_id": "uuid-v4-string",
  "status": "PENDING"
}
```

---

## 3. Status & Results API

### `GET /api/v1/intake/:id`
Retrieves the current status of an intake and its associated brief (if completed).

**Success Response (200 OK)**
```json
{
  "id": "uuid",
  "type": "VOICE",
  "status": "COMPLETED",
  "brief": {
    "summary": "...",
    "goals": [{"title": "...", "detail": "..."}],
    "success_criteria": ["..."],
    "share_token": "..."
  },
  "created_at": "..."
}
```

### `GET /api/v1/events/:intake_id`
Establish a real-time event stream for a specific intake.

**Content-Type**: `text/event-stream`

| Event Data | Description |
| :--- | :--- |
| `PROCESSING` | The AI workers have started analyzing the data. |
| `COMPLETED` | The brief is ready. |
| `FAILED` | An error occurred during AI processing. |

---

## 4. Public Sharing API

### `GET /api/v1/public/brief/:token`
Retrieves a brief using a public share token. No authentication required.

**Success Response (200 OK)**
```json
{
  "summary": "...",
  "goals": [...],
  "is_confirmed": false
}
```

### `POST /api/v1/public/brief/:token/confirm`
Allows a client to confirm a brief and sign off on the project.

**Payload**:
```json
{
  "client_name": "John Doe"
}
```

**Success Response (200 OK)**
```json
{
  "message": "Brief confirmed successfully",
  "confirmed_at": "..."
}
```

---

## 5. Internal Webhooks (AI Service)

### `PATCH /api/v1/intake/:id/confirm`
Used by the AI Service to deliver the final extracted data.

**Payload**:
```json
{
  "summary": "string",
  "goals": [],
  "success_criteria": [],
  "ambiguities": [],
  "followup_questions": [],
  "tone_profile": "string",
  "confidence_score": 0.95
}
```
