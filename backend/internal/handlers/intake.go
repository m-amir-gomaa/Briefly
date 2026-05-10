package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"briefly/backend/internal/db"
	"briefly/backend/internal/models"
)

// ── Job payload pushed to Redis ─────────────────────────────

type IntakeJob struct {
	IntakeID string `json:"intake_id"`
	Type     string `json:"type"`
	RawText  string `json:"raw_text,omitempty"`
	AudioURL string `json:"audio_url,omitempty"`
	ImageURL string `json:"image_url,omitempty"`
}

// SubmitIntake handles POST /api/v1/intake
// Accepts multipart form data, creates an Intake record, and pushes a job to Redis.
func SubmitIntake(c *gin.Context) {
	// Parse multipart form (max 25 MB)
	if err := c.Request.ParseMultipartForm(25 << 20); err != nil {
		// Fall back to regular form parsing
		if err := c.Request.ParseForm(); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
			return
		}
	}

	rawText := c.PostForm("raw_text")
	hasAudio := strings.ToLower(c.PostForm("has_audio")) == "true"
	hasImage := strings.ToLower(c.PostForm("has_image")) == "true"

	// Load demo user (first user in DB)
	var user models.User
	if err := db.DB.First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No user found. Please seed the database."})
		return
	}

	// Detect intake type
	intakeType := models.IntakeTypeText
	if hasAudio && hasImage {
		intakeType = models.IntakeTypeMulti
	} else if hasAudio {
		intakeType = models.IntakeTypeVoice
	} else if hasImage {
		intakeType = models.IntakeTypeImage
	}

	// Handle file uploads
	var audioURL, imageURL string

	// Audio file upload
	if hasAudio {
		audioFile, audioHeader, err := c.Request.FormFile("audio_file")
		if err == nil {
			defer audioFile.Close()
			// In production, upload to Cloudflare R2 or S3
			// For now, store a reference path
			audioURL = "/uploads/audio/" + audioHeader.Filename
			log.Printf("📎 Audio file received: %s (%d bytes)", audioHeader.Filename, audioHeader.Size)
		}
	}

	// Image file upload
	if hasImage {
		imageFile, imageHeader, err := c.Request.FormFile("image_file")
		if err == nil {
			defer imageFile.Close()
			// In production, upload to Cloudflare R2 or S3
			// For now, store a reference path
			imageURL = "/uploads/images/" + imageHeader.Filename
			log.Printf("📎 Image file received: %s (%d bytes)", imageHeader.Filename, imageHeader.Size)
		}
	}

	// Create Intake record
	intake := models.Intake{
		UserID:   user.ID,
		Type:     intakeType,
		RawText:  rawText,
		AudioURL: audioURL,
		ImageURL: imageURL,
		Status:   models.IntakeStatusPending,
	}

	if err := db.DB.Create(&intake).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create intake"})
		return
	}

	// Push job to Redis queue
	job := IntakeJob{
		IntakeID: intake.ID.String(),
		Type:     string(intake.Type),
		RawText:  intake.RawText,
		AudioURL: intake.AudioURL,
		ImageURL: intake.ImageURL,
	}

	jobJSON, err := json.Marshal(job)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize job"})
		return
	}

	if err := db.Redis.LPush(context.Background(), "intake:queue", string(jobJSON)).Err(); err != nil {
		log.Printf("⚠️ Failed to enqueue job to Redis: %v", err)
		// Don't fail the request — the intake is saved, AI processing can be retried
	}

	log.Printf("✅ Intake %s created and enqueued (type=%s)", intake.ID, intake.Type)

	c.JSON(http.StatusAccepted, gin.H{
		"intake_id": intake.ID.String(),
		"status":    string(intake.Status),
	})
}

// GetIntakeStatus handles GET /api/v1/intake/:id
// Returns the intake record with its associated brief (if any).
func GetIntakeStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid intake ID"})
		return
	}

	var intake models.Intake
	if err := db.DB.Preload("Brief").First(&intake, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Intake not found"})
		return
	}

	c.JSON(http.StatusOK, intake)
}

// UpdateIntakeResults handles PATCH /api/v1/intake/:id/confirm
// Called by the AI Worker to set status=COMPLETED and create the Brief.
func UpdateIntakeResults(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid intake ID"})
		return
	}

	// Parse the brief data from request body
	var briefData struct {
		Summary           string          `json:"summary"`
		Goals             json.RawMessage `json:"goals"`
		SuccessCriteria   json.RawMessage `json:"success_criteria"`
		Ambiguities       json.RawMessage `json:"ambiguities"`
		FollowupQuestions json.RawMessage `json:"followup_questions"`
		EvidenceMap       json.RawMessage `json:"evidence_map"`
		CotLog            string          `json:"cot_log"`
		ConfidenceScore   float32         `json:"confidence_score"`
		ToneProfile       string          `json:"tone_profile"`
		ShareToken        string          `json:"share_token"`
	}

	if err := c.ShouldBindJSON(&briefData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Update intake status
	if err := db.DB.Model(&models.Intake{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status": models.IntakeStatusCompleted,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update intake"})
		return
	}

	// Create brief
	brief := models.Brief{
		IntakeID:          id,
		Summary:           briefData.Summary,
		Goals:             briefData.Goals,
		SuccessCriteria:   briefData.SuccessCriteria,
		Ambiguities:       briefData.Ambiguities,
		FollowupQuestions: briefData.FollowupQuestions,
		EvidenceMap:       briefData.EvidenceMap,
		CotLog:            briefData.CotLog,
		ConfidenceScore:   briefData.ConfidenceScore,
		ToneProfile:       briefData.ToneProfile,
		ShareToken:        briefData.ShareToken,
	}

	if err := db.DB.Create(&brief).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create brief"})
		return
	}

	log.Printf("✅ Brief created for intake %s (token=%s)", id, brief.ShareToken)

	c.JSON(http.StatusOK, gin.H{
		"status":   "COMPLETED",
		"brief_id": brief.ID.String(),
	})
}
