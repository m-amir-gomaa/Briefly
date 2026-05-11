package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type IntakeType string
type IntakeStatus string

const (
	IntakeTypeText  IntakeType = "TEXT"
	IntakeTypeVoice IntakeType = "VOICE"
	IntakeTypeImage IntakeType = "IMAGE"
	IntakeTypeMulti IntakeType = "MULTI"

	IntakeStatusPending    IntakeStatus = "PENDING"
	IntakeStatusProcessing IntakeStatus = "PROCESSING"
	IntakeStatusCompleted  IntakeStatus = "COMPLETED"
	IntakeStatusFailed     IntakeStatus = "FAILED"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	AgencyName   string    `json:"agency_name"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:now()" json:"updated_at"`
}

type Intake struct {
	ID        uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID    `gorm:"type:uuid;not null;index" json:"user_id"`
	Type      IntakeType   `gorm:"type:intake_type;default:'TEXT';not null" json:"type"`
	RawText   string       `json:"raw_text"`
	AudioURL  string       `json:"audio_url"`
	ImageURL  string       `json:"image_url"`
	Status    IntakeStatus `gorm:"type:intake_status;default:'PENDING';not null;index" json:"status"`
	RetryCount int          `gorm:"default:0;not null" json:"retry_count"`
	CreatedAt time.Time    `gorm:"default:now()" json:"created_at"`
	UpdatedAt time.Time    `gorm:"default:now()" json:"updated_at"`

	User  User  `gorm:"foreignKey:UserID" json:"-"`
	Brief Brief `gorm:"foreignKey:IntakeID" json:"brief,omitempty"`
}

type Brief struct {
	ID                uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	IntakeID          uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null" json:"intake_id"`
	Summary           string         `json:"summary"`
	Goals             datatypes.JSON `gorm:"type:jsonb;default:'[]';not null;index:,type:gin" json:"goals"`
	SuccessCriteria   datatypes.JSON `gorm:"type:jsonb;default:'[]';not null" json:"success_criteria"`
	Ambiguities       datatypes.JSON `gorm:"type:jsonb;default:'[]';not null" json:"ambiguities"`
	FollowupQuestions datatypes.JSON `gorm:"type:jsonb;default:'[]';not null" json:"followup_questions"`
	EvidenceMap       datatypes.JSON `gorm:"type:jsonb;default:'{}';not null" json:"evidence_map"`
	CotLog            string         `json:"cot_log"`
	ConfidenceScore   float32        `json:"confidence_score"`
	ToneProfile       string         `json:"tone_profile"`
	Embedding         datatypes.JSON `gorm:"type:jsonb" json:"embedding,omitempty"`
	ShareToken        string         `gorm:"uniqueIndex;not null" json:"share_token"`
	IsConfirmed       bool           `gorm:"default:false;not null" json:"is_confirmed"`
	ConfirmedAt       *time.Time     `json:"confirmed_at"`
	ClientName        string         `json:"client_name"`
	CreatedAt         time.Time      `gorm:"default:now()" json:"created_at"`
	UpdatedAt         time.Time      `gorm:"default:now()" json:"updated_at"`
}

type Feedback struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	BriefID   uuid.UUID `gorm:"type:uuid;not null" json:"brief_id"`
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	Comment   string    `gorm:"not null" json:"comment"`
	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`

	Brief Brief `gorm:"foreignKey:BriefID" json:"-"`
	User  *User `gorm:"foreignKey:UserID" json:"-"`
}
