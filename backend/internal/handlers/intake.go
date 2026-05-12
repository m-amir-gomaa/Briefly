package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
)

// SubmitIntake handles POST /api/v1/intake
func SubmitIntake(c *gin.Context) {
	// Parse multi-part form
	err := c.Request.ParseMultipartForm(25 << 20) // 25 MB max memory
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	rawText := c.PostForm("raw_text")
	
	// Fetch demo user for hackathon
	var user models.User
	db.DB.First(&user) // Get first user (the one we created on startup)
	
	intakeType := models.IntakeTypeText
	if c.PostForm("has_audio") == "true" {
		intakeType = models.IntakeTypeVoice
	} else if c.PostForm("has_image") == "true" {
		intakeType = models.IntakeTypeImage
	}

	intake := models.Intake{
		UserID:  user.ID,
		Type:    intakeType,
		RawText: rawText,
		Status:  models.IntakeStatusPending,
	}

	// 1. Upload files to MinIO
	audioFile, audioHeader, err := c.Request.FormFile("audio_file")
	if err == nil {
		defer audioFile.Close()
		key := uuid.New().String() + "-" + audioHeader.Filename
		_, err = db.S3.PutObject(c, db.GetBucketName(), key, audioFile, audioHeader.Size, minio.PutObjectOptions{
			ContentType: audioHeader.Header.Get("Content-Type"),
		})
		if err == nil {
			intake.AudioURL = key
		}
	}

	imageFile, imageHeader, err := c.Request.FormFile("image_file")
	if err == nil {
		defer imageFile.Close()
		key := uuid.New().String() + "-" + imageHeader.Filename
		_, err = db.S3.PutObject(c, db.GetBucketName(), key, imageFile, imageHeader.Size, minio.PutObjectOptions{
			ContentType: imageHeader.Header.Get("Content-Type"),
		})
		if err == nil {
			intake.ImageURL = key
		}
	}

	// 2. Save to CockroachDB
	if err := db.DB.Create(&intake).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save intake"})
		return
	}

	// 3. Enqueue job to Redis
	jobPayload, _ := json.Marshal(map[string]interface{}{
		"intake_id":   intake.ID,
		"type":        intake.Type,
		"audio_url":   intake.AudioURL,
		"image_url":   intake.ImageURL,
		"raw_text":    intake.RawText,
		"enqueued_at": time.Now().Format(time.RFC3339),
	})
	
	db.Redis.LPush(db.Ctx, "intake:queue", jobPayload)

	c.JSON(http.StatusAccepted, gin.H{
		"intake_id": intake.ID,
		"status":    intake.Status,
	})
}

// GetIntakeStatus handles GET /api/v1/intake/:id
func GetIntakeStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
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
// This is called by the AI service to update the intake status and create the brief.
func UpdateIntakeResults(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req struct {
		Summary           string                 `json:"summary"`
		Goals             []models.Goal          `json:"goals"`
		SuccessCriteria   []string               `json:"success_criteria"`
		Ambiguities       []models.Ambiguity     `json:"ambiguities"`
		FollowupQuestions []string               `json:"followup_questions"`
		ToneProfile       string                 `json:"tone_profile"`
		ConfidenceScore   float32                `json:"confidence_score"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Update Intake status
	if err := db.DB.Model(&models.Intake{}).Where("id = ?", id).Update("status", models.IntakeStatusCompleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update intake status"})
		return
	}

	goalsJSON, _ := json.Marshal(req.Goals)
	criteriaJSON, _ := json.Marshal(req.SuccessCriteria)
	ambiguitiesJSON, _ := json.Marshal(req.Ambiguities)
	questionsJSON, _ := json.Marshal(req.FollowupQuestions)

	// 2. Create Brief
	brief := models.Brief{
		IntakeID:          id,
		Summary:           req.Summary,
		Goals:             goalsJSON,
		SuccessCriteria:   criteriaJSON,
		Ambiguities:       ambiguitiesJSON,
		FollowupQuestions: questionsJSON,
		ToneProfile:       req.ToneProfile,
		ConfidenceScore:   req.ConfidenceScore,
	}

	if err := db.DB.Create(&brief).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create brief"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Intake processed and brief created", "brief_id": brief.ID})
}
