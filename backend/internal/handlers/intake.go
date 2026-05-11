package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
	"gorm.io/datatypes"
)

// uploadToS3 uploads a file from a multipart header to MinIO.
// Returns the public path/URL, or an error.
func uploadToS3(c *gin.Context, field string) (string, error) {
	if db.S3 == nil {
		return "", fmt.Errorf("S3 client not initialized")
	}

	header, err := c.FormFile(field)
	if err != nil {
		return "", err
	}

	f, err := header.Open()
	if err != nil {
		return "", fmt.Errorf("could not open file: %w", err)
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return "", fmt.Errorf("could not read file: %w", err)
	}

	bucket := os.Getenv("S3_BUCKET")
	if bucket == "" {
		bucket = "briefly-media"
	}

	objectName := uuid.New().String() + "_" + header.Filename
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = db.S3.PutObject(
		context.Background(),
		bucket,
		objectName,
		bytes.NewReader(data),
		int64(len(data)),
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return "", fmt.Errorf("could not upload to S3: %w", err)
	}

	// Return a URL that the AI worker can access via internal Docker network
	endpoint := os.Getenv("S3_ENDPOINT")
	return fmt.Sprintf("%s/%s/%s", endpoint, bucket, objectName), nil
}

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
	if _, _, err := c.Request.FormFile("audio"); err == nil {
		intakeType = models.IntakeTypeVoice
	} else if _, _, err := c.Request.FormFile("image"); err == nil {
		intakeType = models.IntakeTypeImage
	}

	intake := models.Intake{
		UserID:  user.ID,
		Type:    intakeType,
		RawText: rawText,
		Status:  models.IntakeStatusPending,
	}

	// 1. Upload files to MinIO (S3-compatible)
	if audioURL, err := uploadToS3(c, "audio"); err == nil {
		intake.AudioURL = audioURL
	}
	if imageURL, err := uploadToS3(c, "image"); err == nil {
		intake.ImageURL = imageURL
	}

	// 2. Save to Postgres
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
		"id":     intake.ID,
		"status": intake.Status,
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

	// The AI service sends raw JSON arrays for JSONB fields.
	var req struct {
		Summary           string              `json:"summary"`
		Goals             json.RawMessage     `json:"goals"`
		SuccessCriteria   json.RawMessage     `json:"success_criteria"`
		Ambiguities       json.RawMessage     `json:"ambiguities"`
		FollowupQuestions json.RawMessage     `json:"followup_questions"`
		ToneProfile       string              `json:"tone_profile"`
		ConfidenceScore   float32             `json:"confidence_score"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Helper to coerce RawMessage -> datatypes.JSON (defaults to empty array).
	toJSON := func(raw json.RawMessage) datatypes.JSON {
		if len(raw) == 0 {
			return datatypes.JSON([]byte("[]"))
		}
		return datatypes.JSON(raw)
	}

	// 1. Update Intake status
	if err := db.DB.Model(&models.Intake{}).Where("id = ?", id).Update("status", models.IntakeStatusCompleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update intake status"})
		return
	}

	// 2. Create Brief — all array fields stored as JSONB.
	brief := models.Brief{
		IntakeID:          id,
		Summary:           req.Summary,
		Goals:             toJSON(req.Goals),
		SuccessCriteria:   toJSON(req.SuccessCriteria),
		Ambiguities:       toJSON(req.Ambiguities),
		FollowupQuestions: toJSON(req.FollowupQuestions),
		ToneProfile:       req.ToneProfile,
		ConfidenceScore:   req.ConfidenceScore,
	}

	if err := db.DB.Create(&brief).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create brief"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Intake processed and brief created", "brief_id": brief.ID})
}
