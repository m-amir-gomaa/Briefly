package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
	"github.com/softworks/briefly-backend/internal/repository"
	"github.com/softworks/briefly-backend/internal/service"
)

type IntakeHandler struct {
	svc  service.IntakeService
	repo repository.IntakeRepository
}

func NewIntakeHandler(svc service.IntakeService, repo repository.IntakeRepository) *IntakeHandler {
	return &IntakeHandler{
		svc:  svc,
		repo: repo,
	}
}

// SubmitIntake handles POST /api/v1/intake
func (h *IntakeHandler) SubmitIntake(c *gin.Context) {
	// Parse multi-part form
	err := c.Request.ParseMultipartForm(25 << 20) // 25 MB max memory
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	rawText := c.PostForm("raw_text")

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userIDStr := userIDVal.(string)
	userID, _ := uuid.Parse(userIDStr)

	var user models.User
	if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user"})
		return
	}

	var audioKey, imageKey string

	// 1. Upload files to MinIO (This part could also be in service, but handlers often handle the multipart complexity)
	audioFile, audioHeader, err := c.Request.FormFile("audio_file")
	if err == nil {
		defer audioFile.Close()
		audioKey = uuid.New().String() + "-" + audioHeader.Filename
		_, err = db.S3.PutObject(c, db.GetBucketName(), audioKey, audioFile, audioHeader.Size, minio.PutObjectOptions{
			ContentType: audioHeader.Header.Get("Content-Type"),
		})
	}

	imageFile, imageHeader, err := c.Request.FormFile("image_file")
	if err == nil {
		defer imageFile.Close()
		imageKey = uuid.New().String() + "-" + imageHeader.Filename
		_, err = db.S3.PutObject(c, db.GetBucketName(), imageKey, imageFile, imageHeader.Size, minio.PutObjectOptions{
			ContentType: imageHeader.Header.Get("Content-Type"),
		})
	}

	// 2. Delegate business logic to service
	intake, err := h.svc.Submit(c, userID, rawText, audioKey, imageKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process intake"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"intake_id": intake.ID,
		"status":    intake.Status,
	})
}

// GetIntakeStatus handles GET /api/v1/intake/:id
func (h *IntakeHandler) GetIntakeStatus(c *gin.Context) {
	idStr := c.Param("id")
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userID := userIDVal.(string)

	intake, err := h.repo.GetByID(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Intake not found"})
		return
	}

	// Verify the intake belongs to the authenticated user
	if intake.UserID.String() != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden to access this intake"})
		return
	}

	c.JSON(http.StatusOK, intake)
}

// UpdateIntakeResults handles PATCH /api/v1/intake/:id/confirm
func (h *IntakeHandler) UpdateIntakeResults(c *gin.Context) {
	// Internal Service Authentication
	internalKey := c.GetHeader("Internal-Service-Key")
	expectedKey := os.Getenv("INTERNAL_SERVICE_KEY")
	if expectedKey == "" || internalKey != expectedKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized internal service call"})
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req struct {
		Summary           string             `json:"summary"`
		Goals             []models.Goal      `json:"goals"`
		SuccessCriteria   []string           `json:"success_criteria"`
		Ambiguities       []models.Ambiguity `json:"ambiguities"`
		FollowupQuestions []string           `json:"followup_questions"`
		ToneProfile       string             `json:"tone_profile"`
		ConfidenceScore   float32            `json:"confidence_score"`
		CotLog            string             `json:"cot_log"`
		IsConfirmed       bool               `json:"is_confirmed"`
		ProviderName      string             `json:"provider_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Update Intake status and provider via Repo
	updates := map[string]interface{}{
		"status":        models.IntakeStatusCompleted,
		"provider_name": req.ProviderName,
	}
	if err := h.repo.Update(idStr, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update intake"})
		return
	}

	goalsJSON, _ := json.Marshal(req.Goals)
	criteriaJSON, _ := json.Marshal(req.SuccessCriteria)
	ambiguitiesJSON, _ := json.Marshal(req.Ambiguities)
	questionsJSON, _ := json.Marshal(req.FollowupQuestions)

	// 2. Create Brief (Normally this would also be in a service/repo, but keeping it simplified for the intake demo)
	brief := models.Brief{
		IntakeID:          id,
		Summary:           req.Summary,
		Goals:             goalsJSON,
		SuccessCriteria:   criteriaJSON,
		Ambiguities:       ambiguitiesJSON,
		FollowupQuestions: questionsJSON,
		ToneProfile:       req.ToneProfile,
		ConfidenceScore:   req.ConfidenceScore,
		CotLog:            req.CotLog,
		IsConfirmed:       req.IsConfirmed,
		ShareToken:        uuid.New().String(),
	}

	if err := db.DB.Create(&brief).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create brief"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Intake processed and brief created", "brief_id": brief.ID})
}

// ListIntakes handles GET /api/v1/intakes
func (h *IntakeHandler) ListIntakes(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userID := userIDVal.(string)

	intakes, err := h.repo.ListByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch intakes"})
		return
	}

	c.JSON(http.StatusOK, intakes)
}
