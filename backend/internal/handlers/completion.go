package handlers

import (
	"encoding/json"
	"log"

	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
)

func ProcessAIResult(payload string) {
	var req struct {
		IntakeID          string               `json:"intake_id"`
		Summary           string               `json:"summary"`
		Goals             []map[string]string `json:"goals"`
		SuccessCriteria   []string             `json:"success_criteria"`
		Ambiguities       []map[string]string `json:"ambiguities"`
		FollowupQuestions []string             `json:"followup_questions"`
		ToneProfile       string               `json:"tone_profile"`
		ConfidenceScore   float32              `json:"confidence_score"`
	}

	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		log.Printf("Failed to unmarshal AI result: %v", err)
		return
	}

	id, err := uuid.Parse(req.IntakeID)
	if err != nil {
		log.Printf("Invalid Intake ID in result: %v", err)
		return
	}

	// 1. Update Intake status
	if err := db.DB.Model(&models.Intake{}).Where("id = ?", id).Update("status", models.IntakeStatusCompleted).Error; err != nil {
		log.Printf("Failed to update intake status: %v", err)
		return
	}

	// 2. Create Brief
	goalsJSON, _ := json.Marshal(req.Goals)
	ambiguitiesJSON, _ := json.Marshal(req.Ambiguities)
	successJSON, _ := json.Marshal(req.SuccessCriteria)
	followupJSON, _ := json.Marshal(req.FollowupQuestions)

	brief := models.Brief{
		IntakeID:          id,
		Summary:           req.Summary,
		Goals:             goalsJSON,
		SuccessCriteria:   successJSON,
		Ambiguities:       ambiguitiesJSON,
		FollowupQuestions: followupJSON,
		ToneProfile:       req.ToneProfile,
		ConfidenceScore:   req.ConfidenceScore,
		ShareToken:        uuid.New().String(),
	}

	if err := db.DB.Create(&brief).Error; err != nil {
		log.Printf("Failed to create brief from AI result: %v", err)
		return
	}

	log.Printf("Successfully processed AI result for intake %s", id)
	
	// 3. Notify frontend via Redis PubSub
	db.Redis.Publish(db.Ctx, "intake:events:"+id.String(), "COMPLETED")
}
