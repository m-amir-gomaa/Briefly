package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/softworks/briefly-backend/internal/db"
	"github.com/softworks/briefly-backend/internal/models"
)

func ListKeys(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userID := userIDVal.(string)

	var keys []models.UserAPIKey
	if err := db.DB.Where("user_id = ?", userID).Find(&keys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch keys"})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func AddKey(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Name string `json:"name" binding:"required"`
		Key  string `json:"key" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	masked := ""
	if len(req.Key) > 8 {
		masked = req.Key[:4] + "..." + req.Key[len(req.Key)-4:]
	} else {
		masked = "***"
	}

	key := models.UserAPIKey{
		UserID:       userID,
		Name:         req.Name,
		KeyEncrypted: req.Key, // BeforeSave will encrypt this
		KeyMasked:    masked,
		Provider:     "gemini",
		UsageCount:   0,
	}

	if err := db.DB.Create(&key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create key"})
		return
	}

	c.JSON(http.StatusCreated, key)
}

func DeleteKey(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	userID := userIDVal.(string)
	keyID := c.Param("id")

	if err := db.DB.Where("id = ? AND user_id = ?", keyID, userID).Delete(&models.UserAPIKey{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Key deleted"})
}
