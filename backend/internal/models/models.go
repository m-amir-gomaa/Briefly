package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/security"
	"gorm.io/datatypes"
	"gorm.io/gorm"
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

type Goal struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type Ambiguity struct {
	FieldMissing      string `json:"field_missing"`
	Reason            string `json:"reason"`
	SuggestedQuestion string `json:"suggested_question"`
}

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	AgencyName   string    `json:"agency_name"`
	PasswordHash string    `json:"-"`
	GeminiAPIKey string    `json:"-"` // Hidden from JSON
	GoogleID     string    `gorm:"uniqueIndex" json:"-"`
	AvatarURL    string    `json:"avatar_url"`
	PlanTier     string    `gorm:"default:'free'" json:"plan_tier"`
	StripeCustomerID string `json:"-"`
	CreatedAt    time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:now()" json:"updated_at"`
}

func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	if u.GeminiAPIKey != "" {
		// Only encrypt if it's not already encrypted (simple check)
		if len(u.GeminiAPIKey) < 32 { // Encrypted strings are much longer
			encrypted, err := security.Encrypt(u.GeminiAPIKey)
			if err == nil {
				u.GeminiAPIKey = encrypted
			}
		}
	}
	return nil
}

func (u *User) AfterFind(tx *gorm.DB) (err error) {
	if u.GeminiAPIKey != "" {
		decrypted, err := security.Decrypt(u.GeminiAPIKey)
		if err == nil {
			u.GeminiAPIKey = decrypted
		}
	}
	return nil
}


type Intake struct {
	ID        uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID    `gorm:"type:uuid;not null;index" json:"user_id"`
	Type      IntakeType   `gorm:"type:text;default:'TEXT';not null" json:"type"`
	RawText   string       `json:"raw_text"`
	AudioURL  string       `json:"audio_url"`
	ImageURL  string       `json:"image_url"`
	Status    IntakeStatus `gorm:"type:text;default:'PENDING';not null;index" json:"status"`
	RetryCount int          `gorm:"default:0;not null" json:"retry_count"`
	CreatedAt time.Time    `gorm:"default:now()" json:"created_at"`
	UpdatedAt time.Time    `gorm:"default:now()" json:"updated_at"`

	User  User  `gorm:"foreignKey:UserID" json:"-"`
	Brief Brief `gorm:"foreignKey:IntakeID" json:"brief,omitempty"`
}

type Brief struct {
	ID                uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	IntakeID          uuid.UUID      `gorm:"type:uuid;index:idx_brief_intake,unique;not null" json:"intake_id"`
	Summary           string         `json:"summary"`
	Goals             datatypes.JSON `gorm:"type:jsonb;default:'[]';not null;index:,type:gin" json:"goals"`
	SuccessCriteria   datatypes.JSON `gorm:"type:jsonb;default:'[]';not null" json:"success_criteria"`
	Ambiguities       datatypes.JSON `gorm:"type:jsonb;default:'[]';not null" json:"ambiguities"`
	FollowupQuestions datatypes.JSON `gorm:"type:jsonb;default:'[]';not null" json:"followup_questions"`
	EvidenceMap       datatypes.JSON `gorm:"type:jsonb;default:'{}';not null" json:"evidence_map"`
	CotLog            string         `json:"cot_log"`
	ConfidenceScore   float32        `json:"confidence_score"`
	ToneProfile       string         `json:"tone_profile"`
	ShareToken        string         `gorm:"index:idx_brief_share,unique;not null" json:"share_token"`
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
