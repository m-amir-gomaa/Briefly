package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"briefly/backend/internal/db"
	"briefly/backend/internal/models"
)

// GetPublicBrief handles GET /api/v1/public/brief/:token
func GetPublicBrief(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing share token"})
		return
	}

	var brief models.Brief
	if err := db.DB.Where("share_token = ?", token).First(&brief).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Brief not found"})
		return
	}

	c.JSON(http.StatusOK, brief)
}

// ConfirmBrief handles POST /api/v1/public/brief/:token/confirm
func ConfirmBrief(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing share token"})
		return
	}

	var body struct {
		ClientName string `json:"client_name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var brief models.Brief
	if err := db.DB.Where("share_token = ?", token).First(&brief).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Brief not found"})
		return
	}

	now := time.Now()
	if err := db.DB.Model(&brief).Updates(map[string]interface{}{
		"is_confirmed": true,
		"confirmed_at": now,
		"client_name":  body.ClientName,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm brief"})
		return
	}

	log.Printf("✅ Brief %s confirmed by client: %s", brief.ID, body.ClientName)
	c.JSON(http.StatusOK, gin.H{
		"status":       "confirmed",
		"confirmed_at": now.Format(time.RFC3339),
		"client_name":  body.ClientName,
	})
}
