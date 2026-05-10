package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// ── User ────────────────────────────────────────────────────

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null"                           json:"email"`
	AgencyName   string         `                                                      json:"agency_name"`
	PasswordHash string         `gorm:"not null"                                       json:"-"`
	CreatedAt    time.Time      `                                                      json:"created_at"`
	UpdatedAt    time.Time      `                                                      json:"updated_at"`
	Intakes      []Intake       `gorm:"foreignKey:UserID"                              json:"intakes,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// ── Intake ──────────────────────────────────────────────────

type IntakeType string

const (
	IntakeTypeText  IntakeType = "TEXT"
	IntakeTypeVoice IntakeType = "VOICE"
	IntakeTypeImage IntakeType = "IMAGE"
	IntakeTypeMulti IntakeType = "MULTI"
)

type IntakeStatus string

const (
	IntakeStatusPending    IntakeStatus = "PENDING"
	IntakeStatusProcessing IntakeStatus = "PROCESSING"
	IntakeStatusCompleted  IntakeStatus = "COMPLETED"
	IntakeStatusFailed     IntakeStatus = "FAILED"
)

type Intake struct {
	ID         uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID     uuid.UUID    `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Type       IntakeType   `gorm:"type:varchar(10);default:'TEXT'"                json:"type"`
	RawText    string       `                                                      json:"raw_text"`
	AudioURL   string       `                                                      json:"audio_url,omitempty"`
	ImageURL   string       `                                                      json:"image_url,omitempty"`
	Status     IntakeStatus `gorm:"type:varchar(20);default:'PENDING';index"       json:"status"`
	RetryCount int          `gorm:"default:0"                                      json:"retry_count"`
	CreatedAt  time.Time    `                                                      json:"created_at"`
	UpdatedAt  time.Time    `                                                      json:"updated_at"`
	Brief      *Brief       `gorm:"foreignKey:IntakeID"                            json:"brief,omitempty"`
}

func (i *Intake) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// ── Brief ───────────────────────────────────────────────────

type Brief struct {
	ID                uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	IntakeID          uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null"                 json:"intake_id"`
	Summary           string         `                                                      json:"summary"`
	Goals             datatypes.JSON `gorm:"type:jsonb;default:'[]'"                        json:"goals"`
	SuccessCriteria   datatypes.JSON `gorm:"type:jsonb;default:'[]'"                        json:"success_criteria"`
	Ambiguities       datatypes.JSON `gorm:"type:jsonb;default:'[]'"                        json:"ambiguities"`
	FollowupQuestions datatypes.JSON `gorm:"type:jsonb;default:'[]'"                        json:"followup_questions"`
	EvidenceMap       datatypes.JSON `gorm:"type:jsonb;default:'{}'"                        json:"evidence_map"`
	CotLog            string         `                                                      json:"cot_log"`
	ConfidenceScore   float32        `gorm:"default:0.0"                                    json:"confidence_score"`
	ToneProfile       string         `gorm:"default:'startup_casual'"                       json:"tone_profile"`
	ShareToken        string         `gorm:"uniqueIndex"                                    json:"share_token"`
	IsConfirmed       bool           `gorm:"default:false"                                  json:"is_confirmed"`
	ConfirmedAt       *time.Time     `                                                      json:"confirmed_at,omitempty"`
	ClientName        string         `                                                      json:"client_name,omitempty"`
	CreatedAt         time.Time      `                                                      json:"created_at"`
	UpdatedAt         time.Time      `                                                      json:"updated_at"`
	Feedback          []Feedback     `gorm:"foreignKey:BriefID"                             json:"feedback,omitempty"`
}

func (b *Brief) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// ── Feedback ────────────────────────────────────────────────

type Feedback struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	BriefID   uuid.UUID  `gorm:"type:uuid;not null;index"                      json:"brief_id"`
	UserID    *uuid.UUID `gorm:"type:uuid"                                     json:"user_id,omitempty"`
	Comment   string     `gorm:"not null"                                      json:"comment"`
	CreatedAt time.Time  `                                                     json:"created_at"`
}

func (f *Feedback) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}
