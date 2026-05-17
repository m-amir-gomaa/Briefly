package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
)

func GetQuota(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userID := userIDVal.(string)
	
	planVal, exists := c.Get("user_plan")
	plan := "free"
	if exists && planVal != nil {
		plan = planVal.(string)
	}

	var count int64
	if err := db.DB.Model(&models.Intake{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count intakes"})
		return
	}

	limit := 5 // Default for free
	if plan == "pro" {
		limit = 50
	} else if plan == "agency" {
		limit = -1 // Unlimited
	}

	c.JSON(http.StatusOK, gin.H{
		"plan":  plan,
		"limit": limit,
		"used":  count,
	})
}
