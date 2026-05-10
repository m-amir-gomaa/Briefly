package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
)

// GetPublicBrief handles GET /api/v1/public/brief/:token
func GetPublicBrief(c *gin.Context) {
	token := c.Param("token")

	var brief models.Brief
	if err := db.DB.Where("share_token = ?", token).First(&brief).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Brief not found or invalid token"})
		return
	}

	c.JSON(http.StatusOK, brief)
}

// ConfirmBrief handles POST /api/v1/public/brief/:token/confirm
func ConfirmBrief(c *gin.Context) {
	token := c.Param("token")

	var req struct {
		ClientName string `json:"client_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		"client_name":  req.ClientName,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm brief"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Brief confirmed successfully",
		"confirmed_at": now,
	})
}
